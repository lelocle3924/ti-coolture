import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateShopMember } from "../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { notifyAdminProductSubmission } from "../_lib/telegram.js";
import { deleteCache, getPersistentSetting } from "../_lib/redis.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Sử dụng phương thức POST.",
    });
  }

  try {
    const authHeader = req.headers.authorization;
    const shopContext = await authenticateShopMember(authHeader);
    const supabase = getSupabaseAdmin();

    const { productId, productIds } = req.body || {};

    // 0. Đọc cấu hình kiểm duyệt từ site_settings (fallback Redis)
    let requireApproval = true;
    try {
      const { data: settingRow, error: setFetchErr } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "require_approval")
        .maybeSingle();

      if (!setFetchErr && settingRow?.value) {
        requireApproval = settingRow.value.enabled !== false;
      } else {
        const redisVal = await getPersistentSetting<{ enabled: boolean }>("require_approval");
        if (redisVal && typeof redisVal.enabled !== "undefined") {
          requireApproval = redisVal.enabled !== false;
        }
      }
    } catch {
      const redisVal = await getPersistentSetting<{ enabled: boolean }>("require_approval");
      if (redisVal && typeof redisVal.enabled !== "undefined") {
        requireApproval = redisVal.enabled !== false;
      }
    }

    const nowIso = new Date().toISOString();

    // ==========================================
    // CASE A: BATCH SUBMIT (GỬI DUYỆT HÀNG LOẠT)
    // ==========================================
    if (Array.isArray(productIds) && productIds.length > 0) {
      // 1. Lấy danh sách sản phẩm hợp lệ của shop
      const { data: validProducts, error: batchFetchErr } = await supabase
        .from("products")
        .select(`
          id,
          name_vi,
          price_vnd,
          shop_id,
          status,
          product_images ( id )
        `)
        .in("id", productIds)
        .eq("shop_id", shopContext.shopId);

      if (batchFetchErr) throw batchFetchErr;

      if (!validProducts || validProducts.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Không tìm thấy sản phẩm nào hợp lệ thuộc quyền quản lý của shop.",
        });
      }

      // 2. Lọc sản phẩm có ít nhất 1 ảnh và đang ở trạng thái draft/rejected
      const eligibleProducts = validProducts.filter((p) => {
        const imgCount = Array.isArray(p.product_images) ? p.product_images.length : 0;
        return imgCount > 0 && (p.status === "draft" || p.status === "rejected");
      });

      if (eligibleProducts.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Các sản phẩm đã chọn phải có ít nhất 1 hình ảnh và đang ở trạng thái nháp.",
        });
      }

      const eligibleIds = eligibleProducts.map((p) => p.id);

      if (!requireApproval) {
        // TỰ ĐỘNG DUYỆT: Chuyển thẳng sang published
        const { error: batchUpdateErr } = await supabase
          .from("products")
          .update({
            status: "published",
            product_hidden: false,
            published_at: nowIso,
            updated_at: nowIso,
          })
          .in("id", eligibleIds);

        if (batchUpdateErr) throw batchUpdateErr;

        // Kích hoạt shop nếu shop chưa xuất bản
        await supabase
          .from("shops")
          .update({ status: "published", updated_at: nowIso })
          .eq("id", shopContext.shopId)
          .eq("status", "draft");

        await deleteCache("catalog:v1").catch((err) =>
          console.warn("[submit-review] Redis cache purge warning:", err)
        );

        return res.status(200).json({
          success: true,
          autoPublished: true,
          submittedCount: eligibleIds.length,
          message: `Đã xuất bản thành công ${eligibleIds.length} sản phẩm lên website (chế độ tự động duyệt).`,
        });
      } else {
        // CHẾ ĐỘ CHỜ DUYỆT: Chuyển sang pending_review
        const { error: batchUpdateErr } = await supabase
          .from("products")
          .update({
            status: "pending_review",
            updated_at: nowIso,
          })
          .in("id", eligibleIds);

        if (batchUpdateErr) throw batchUpdateErr;

        notifyAdminProductSubmission({
          shopName: shopContext.shopName,
          shopEmail: shopContext.userEmail,
          productName: `${eligibleProducts[0].name_vi} (và ${eligibleIds.length - 1} sản phẩm khác)`,
          productId: eligibleIds[0],
          imageCount: 1,
          priceVnd: eligibleProducts[0].price_vnd,
        }).catch((err) => {
          console.warn("[submit-review] Failed to send Telegram alert:", err);
        });

        return res.status(200).json({
          success: true,
          submittedCount: eligibleIds.length,
          message: `Đã gửi duyệt thành công ${eligibleIds.length} sản phẩm! Ban quản trị sẽ thẩm định sớm nhất.`,
        });
      }
    }

    // ==========================================
    // CASE B: SINGLE PRODUCT SUBMISSION
    // ==========================================
    if (!productId || typeof productId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Thiếu mã định danh sản phẩm (productId hoặc productIds).",
      });
    }

    // 1. Lấy thông tin sản phẩm và danh sách ảnh
    const { data: product, error: fetchErr } = await supabase
      .from("products")
      .select(`
        id,
        name_vi,
        price_vnd,
        shop_id,
        status,
        product_images ( id )
      `)
      .eq("id", productId)
      .single();

    if (fetchErr || !product) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy sản phẩm cần gửi duyệt.",
      });
    }

    // 2. Kiểm tra quyền sở hữu
    if (product.shop_id !== shopContext.shopId) {
      return res.status(403).json({
        success: false,
        error: "Bạn không có quyền gửi duyệt sản phẩm này.",
      });
    }

    if (product.status === "published" || product.status === "hidden") {
      const { data: editRequest, error: editFetchErr } = await supabase
        .from("product_edit_requests")
        .select("id, status, proposed_data")
        .eq("product_id", productId)
        .eq("shop_id", shopContext.shopId)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (editFetchErr) throw editFetchErr;

      if (!editRequest) {
        const { data: pendingEdit, error: pendingFetchErr } = await supabase
          .from("product_edit_requests")
          .select("id")
          .eq("product_id", productId)
          .eq("status", "pending")
          .maybeSingle();
        if (pendingFetchErr) throw pendingFetchErr;
        if (pendingEdit) {
          return res.status(200).json({
            success: true,
            alreadySubmitted: true,
            message: "Yêu cầu chỉnh sửa sản phẩm đang chờ ban quản trị xử lý.",
            status: "pending_review",
          });
        }

        return res.status(400).json({
          success: false,
          error: "Vui lòng lưu thay đổi trước khi gửi yêu cầu chỉnh sửa.",
        });
      }

      const proposedImages = editRequest.proposed_data?.images;
      if (!Array.isArray(proposedImages) || proposedImages.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Sản phẩm phải có ít nhất 1 hình ảnh trước khi gửi yêu cầu chỉnh sửa.",
        });
      }

      if (typeof editRequest.proposed_data?.price_vnd === "number" && editRequest.proposed_data.price_vnd > 500_000_000) {
        return res.status(400).json({
          success: false,
          error: "Giá sản phẩm không được vượt quá 500.000.000 ₫.",
        });
      }

      // NẾU TỰ ĐỘNG DUYỆT: Áp dụng ngay thay đổi chỉnh sửa vào sản phẩm
      if (!requireApproval) {
        const prop = editRequest.proposed_data;
        const updatePayload: Record<string, any> = {
          updated_at: nowIso,
        };
        if (prop.name_vi) updatePayload.name_vi = prop.name_vi;
        if (typeof prop.name_en !== "undefined") updatePayload.name_en = prop.name_en;
        if (prop.category_id) updatePayload.category_id = prop.category_id;
        if (typeof prop.price_vnd !== "undefined") updatePayload.price_vnd = prop.price_vnd;
        if (typeof prop.dimensions !== "undefined") updatePayload.dimensions = prop.dimensions;
        if (typeof prop.short_desc_vi !== "undefined") updatePayload.short_desc_vi = prop.short_desc_vi;
        if (typeof prop.story_vi !== "undefined") updatePayload.story_vi = prop.story_vi;

        await supabase.from("products").update(updatePayload).eq("id", productId);

        if (Array.isArray(prop.images) && prop.images.length > 0) {
          await supabase.from("product_images").delete().eq("product_id", productId);
          const imageRows = prop.images.map((img: any, idx: number) => ({
            product_id: productId,
            url: String(img.url || ""),
            is_cover: idx === 0 || Boolean(img.isCover),
            sort_order: typeof img.sortOrder === "number" ? img.sortOrder : idx,
            alt_vi: img.altVi || prop.name_vi || product.name_vi,
          }));
          await supabase.from("product_images").insert(imageRows);
        }

        await supabase
          .from("product_edit_requests")
          .update({ status: "approved", updated_at: nowIso })
          .eq("id", editRequest.id);

        await deleteCache("catalog:v1").catch((err) =>
          console.warn("[submit-review] Redis cache purge warning:", err)
        );

        return res.status(200).json({
          success: true,
          autoPublished: true,
          message: "Thay đổi đã được cập nhật trực tiếp lên website (chế độ tự động duyệt).",
          status: "published",
          editRequest: true,
        });
      }

      // NẾU CẦN DUYỆT: Đánh dấu pending
      const { data: submittedEdit, error: submitEditErr } = await supabase
        .from("product_edit_requests")
        .update({ status: "pending", updated_at: nowIso })
        .eq("id", editRequest.id)
        .eq("status", "draft")
        .select("id")
        .maybeSingle();

      if (submitEditErr) throw submitEditErr;
      if (!submittedEdit) {
        return res.status(409).json({
          success: false,
          error: "Yêu cầu chỉnh sửa đã thay đổi. Vui lòng tải lại trang.",
        });
      }

      notifyAdminProductSubmission({
        shopName: shopContext.shopName,
        shopEmail: shopContext.userEmail,
        productName: editRequest.proposed_data.name_vi || product.name_vi,
        productId: product.id,
        imageCount: proposedImages.length,
        priceVnd: editRequest.proposed_data.price_vnd,
      }).catch((err) => {
        console.warn("[submit-review] Failed to send Telegram alert:", err);
      });

      return res.status(200).json({
        success: true,
        message: "Yêu cầu chỉnh sửa đã được gửi duyệt. Phiên bản đang xuất bản vẫn được giữ nguyên.",
        status: "pending_review",
        editRequest: true,
      });
    }

    // 3. Kiểm tra trạng thái hiện tại
    if (product.status === "pending_review") {
      return res.status(200).json({
        success: true,
        alreadySubmitted: true,
        message: "Sản phẩm đã được gửi duyệt và đang chờ ban quản trị xử lý.",
        status: "pending_review",
      });
    }

    if (product.status === "published") {
      return res.status(400).json({
        success: false,
        error: "Sản phẩm này đã được xuất bản chính thức trên website.",
      });
    }

    // 4. Kiểm tra điều kiện tối thiểu: Phải có ít nhất 1 hình ảnh
    const imageCount = Array.isArray(product.product_images) ? product.product_images.length : 0;
    if (imageCount === 0) {
      return res.status(400).json({
        success: false,
        error: "Sản phẩm phải có ít nhất 1 hình ảnh trước khi gửi duyệt.",
      });
    }

    if (typeof product.price_vnd === "number" && product.price_vnd > 500_000_000) {
      return res.status(400).json({
        success: false,
        error: "Giá sản phẩm không được vượt quá 500.000.000 ₫.",
      });
    }

    // NẾU TỰ ĐỘNG DUYỆT: Cho phép published luôn
    if (!requireApproval) {
      const { error: pubErr } = await supabase
        .from("products")
        .update({
          status: "published",
          product_hidden: false,
          published_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", productId);

      if (pubErr) throw pubErr;

      // Kích hoạt shop nếu shop đang là draft
      await supabase
        .from("shops")
        .update({ status: "published", updated_at: nowIso })
        .eq("id", product.shop_id)
        .eq("status", "draft");

      await deleteCache("catalog:v1").catch((err) =>
        console.warn("[submit-review] Redis cache purge warning:", err)
      );

      return res.status(200).json({
        success: true,
        autoPublished: true,
        message: "Sản phẩm đã được duyệt và xuất bản trực tiếp lên website (chế độ tự động duyệt).",
        status: "published",
      });
    }

    // 5. Cập nhật trạng thái sang pending_review khi cần duyệt
    const { data: updatedProduct, error: updateErr } = await supabase
      .from("products")
      .update({
        status: "pending_review",
        updated_at: nowIso,
      })
      .eq("id", productId)
      .eq("status", product.status)
      .select("id")
      .maybeSingle();

    if (updateErr) {
      throw new Error("Lỗi khi cập nhật trạng thái sản phẩm: " + updateErr.message);
    }

    if (!updatedProduct) {
      const { data: latestProduct, error: latestErr } = await supabase
        .from("products")
        .select("status")
        .eq("id", productId)
        .single();

      if (latestErr) throw latestErr;
      if (latestProduct.status === "pending_review") {
        return res.status(200).json({
          success: true,
          alreadySubmitted: true,
          message: "Sản phẩm đã được gửi duyệt và đang chờ ban quản trị xử lý.",
          status: "pending_review",
        });
      }

      return res.status(409).json({
        success: false,
        error: "Trạng thái sản phẩm đã thay đổi. Vui lòng tải lại danh sách.",
      });
    }

    // 6. Gửi thông báo Telegram cho Admin
    notifyAdminProductSubmission({
      shopName: shopContext.shopName,
      shopEmail: shopContext.userEmail,
      productName: product.name_vi,
      productId: product.id,
      imageCount,
      priceVnd: product.price_vnd,
    }).catch((err) => {
      console.warn("[submit-review] Failed to send Telegram alert:", err);
    });

    return res.status(200).json({
      success: true,
      message: "Sản phẩm đã được gửi duyệt thành công! Đội ngũ Tí Coolture sẽ thẩm định sớm nhất.",
      status: "pending_review",
    });
  } catch (err: any) {
    console.error("[submit-review] Error:", err.message);

    const isClientError =
      err.message.includes("không tìm thấy") ||
      err.message.includes("ít nhất 1 hình ảnh") ||
      err.message.includes("đã được gửi duyệt");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: err.message || "Không thể gửi duyệt sản phẩm.",
    });
  }
}
