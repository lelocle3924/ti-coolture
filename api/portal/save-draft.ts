import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateShopMember } from "../_lib/supabaseAuth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import crypto from "crypto";

/**
 * Generates a clean URL slug from Vietnamese string.
 */
function slugifyVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

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

    const {
      productId,
      nameVi,
      nameEn,
      categoryId,
      shortDescVi,
      shortDescEn,
      storyVi,
      storyEn,
      priceVnd,
      priceNoteVi,
      dimensions,
      variants,
      images,
    } = req.body || {};

    // 1. Validation cơ bản
    if (!nameVi || typeof nameVi !== "string" || nameVi.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Tên sản phẩm tiếng Việt là bắt buộc (tối thiểu 2 ký tự).",
      });
    }

    if (nameVi.trim().length > 120) {
      return res.status(400).json({
        success: false,
        error: "Tên sản phẩm tiếng Việt không được vượt quá 120 ký tự.",
      });
    }

    if (nameEn && typeof nameEn === "string" && nameEn.trim().length > 120) {
      return res.status(400).json({
        success: false,
        error: "Tên sản phẩm tiếng Anh không được vượt quá 120 ký tự.",
      });
    }

    if (typeof priceVnd === "number") {
      if (priceVnd < 0 || priceVnd > 500_000_000) {
        return res.status(400).json({
          success: false,
          error: "Giá sản phẩm phải nằm trong khoảng từ 0 ₫ đến 500.000.000 ₫.",
        });
      }
    }

    if (dimensions && typeof dimensions === "string" && dimensions.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: "Thông số kích thước không được vượt quá 100 ký tự.",
      });
    }

    if (shortDescVi && typeof shortDescVi === "string" && shortDescVi.trim().length > 300) {
      return res.status(400).json({
        success: false,
        error: "Mô tả ngắn không được vượt quá 300 ký tự.",
      });
    }

    if (storyVi && typeof storyVi === "string" && storyVi.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Câu chuyện sản phẩm không được vượt quá 2.000 ký tự.",
      });
    }

    if (Array.isArray(images) && images.length > 12) {
      return res.status(400).json({
        success: false,
        error: "Mỗi sản phẩm tối đa 12 hình ảnh.",
      });
    }

    if (!categoryId || typeof categoryId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Vui lòng chọn danh mục cho sản phẩm.",
      });
    }

    const supabase = getSupabaseAdmin();

    // Resolve categoryId to a valid UUID if a slug or identifier like "cat-nen-thom" or "nen-thom" or "Nến thơm" was sent
    let resolvedCategoryId = categoryId;
    const isCatUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId);
    if (!isCatUuid) {
      const cleanSlug = String(categoryId).replace(/^cat-/, "").trim().toLowerCase();
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .or(`slug.eq.${cleanSlug},slug.eq.${categoryId},name_vi.ilike.${categoryId}`)
        .limit(1)
        .maybeSingle();

      if (cat?.id) {
        resolvedCategoryId = cat.id;
      } else {
        const { data: searchCat } = await supabase
          .from("categories")
          .select("id")
          .ilike("name_vi", `%${cleanSlug}%`)
          .limit(1)
          .maybeSingle();
        if (searchCat?.id) {
          resolvedCategoryId = searchCat.id;
        } else {
          const { data: defaultCat } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", "do-gom")
            .maybeSingle();
          if (defaultCat?.id) resolvedCategoryId = defaultCat.id;
        }
      }
    }

    // 2. Kiểm tra nếu là cập nhật sản phẩm đã có
    let targetProductId = productId;
    let productSlug = "";

    if (targetProductId) {
      const { data: existingProd, error: fetchErr } = await supabase
        .from("products")
        .select("id, shop_id, status, slug")
        .eq("id", targetProductId)
        .single();

      if (fetchErr || !existingProd) {
        return res.status(404).json({
          success: false,
          error: "Không tìm thấy sản phẩm cần cập nhật.",
        });
      }

      if (existingProd.shop_id !== shopContext.shopId) {
        return res.status(403).json({
          success: false,
          error: "Bạn không có quyền chỉnh sửa sản phẩm của shop khác.",
        });
      }

      if (existingProd.status === "pending_review") {
        return res.status(400).json({
          success: false,
          error: "Sản phẩm đang được team Tí Coolture duyệt. Không thể chỉnh sửa trong lúc này.",
        });
      }

      productSlug = existingProd.slug;

      if (existingProd.status === "published" || existingProd.status === "hidden") {
        const proposedData = {
          name_vi: nameVi.trim(),
          name_en: nameEn?.trim() || null,
          category_id: resolvedCategoryId,
          short_desc_vi: shortDescVi?.trim() || null,
          short_desc_en: shortDescEn?.trim() || null,
          story_vi: storyVi?.trim() || null,
          story_en: storyEn?.trim() || null,
          price_vnd: typeof priceVnd === "number" ? priceVnd : null,
          price_note_vi: priceNoteVi || "Giá tham khảo, giá cuối do shop quyết định",
          dimensions: dimensions?.trim() || null,
          variants: Array.isArray(variants) ? variants : [],
          images: Array.isArray(images)
            ? images.map((img: any, idx: number) => ({
                url: String(img.url || ""),
                is_cover: idx === 0 || Boolean(img.isCover),
                sort_order: typeof img.sortOrder === "number" ? img.sortOrder : idx,
                alt_vi: img.altVi || nameVi,
                alt_en: img.altEn || nameEn || null,
                width: img.width ? Number(img.width) : null,
                height: img.height ? Number(img.height) : null,
              }))
            : [],
        };

        const { data: pendingEdit, error: pendingEditErr } = await supabase
          .from("product_edit_requests")
          .select("id")
          .eq("product_id", targetProductId)
          .eq("status", "pending")
          .maybeSingle();

        if (pendingEditErr) throw pendingEditErr;
        if (pendingEdit) {
          return res.status(409).json({
            success: false,
            error: "Sản phẩm đang có yêu cầu chỉnh sửa chờ duyệt.",
          });
        }

        const { data: draftEdit, error: draftEditErr } = await supabase
          .from("product_edit_requests")
          .select("id")
          .eq("product_id", targetProductId)
          .eq("shop_id", shopContext.shopId)
          .eq("status", "draft")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (draftEditErr) throw draftEditErr;

        if (draftEdit) {
          const { error: updateEditErr } = await supabase
            .from("product_edit_requests")
            .update({ proposed_data: proposedData, updated_at: new Date().toISOString() })
            .eq("id", draftEdit.id);
          if (updateEditErr) throw updateEditErr;
        } else {
          const { error: createEditErr } = await supabase
            .from("product_edit_requests")
            .insert({
              product_id: targetProductId,
              shop_id: shopContext.shopId,
              proposed_data: proposedData,
              status: "draft",
            });
          if (createEditErr) throw createEditErr;
        }

        return res.status(200).json({
          success: true,
          message: "Đã lưu bản nháp yêu cầu chỉnh sửa. Sản phẩm đang xuất bản chưa bị thay đổi.",
          product: {
            id: targetProductId,
            slug: productSlug,
            status: existingProd.status,
            editDraft: true,
          },
        });
      }

      // Cập nhật sản phẩm
      const { error: updateErr } = await supabase
        .from("products")
        .update({
          name_vi: nameVi.trim(),
          name_en: nameEn?.trim() || null,
          category_id: resolvedCategoryId,
          short_desc_vi: shortDescVi?.trim() || null,
          short_desc_en: shortDescEn?.trim() || null,
          story_vi: storyVi?.trim() || null,
          story_en: storyEn?.trim() || null,
          price_vnd: typeof priceVnd === "number" ? priceVnd : null,
          price_note_vi: priceNoteVi || "Giá tham khảo, giá cuối do shop quyết định",
          dimensions: dimensions?.trim() || null,
          variants: Array.isArray(variants) ? variants : [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetProductId);

      if (updateErr) {
        throw new Error("Lỗi khi cập nhật sản phẩm: " + updateErr.message);
      }
    } else {
      // 3. Tạo sản phẩm nháp mới
      const baseSlug = slugifyVietnamese(nameVi);
      const uniqueSuffix = crypto.randomBytes(3).toString("hex");
      productSlug = `${baseSlug}-${uniqueSuffix}`;

      const { data: newProd, error: insertErr } = await supabase
        .from("products")
        .insert({
          shop_id: shopContext.shopId,
          category_id: resolvedCategoryId,
          slug: productSlug,
          name_vi: nameVi.trim(),
          name_en: nameEn?.trim() || null,
          short_desc_vi: shortDescVi?.trim() || null,
          short_desc_en: shortDescEn?.trim() || null,
          story_vi: storyVi?.trim() || null,
          story_en: storyEn?.trim() || null,
          price_vnd: typeof priceVnd === "number" ? priceVnd : null,
          price_note_vi: priceNoteVi || "Giá tham khảo, giá cuối do shop quyết định",
          dimensions: dimensions?.trim() || null,
          variants: Array.isArray(variants) ? variants : [],
          status: "draft",
        })
        .select("id")
        .single();

      if (insertErr || !newProd) {
        throw new Error("Lỗi khi tạo sản phẩm: " + (insertErr?.message || ""));
      }

      targetProductId = newProd.id;
    }

    // 4. Đồng bộ danh sách hình ảnh (product_images)
    if (Array.isArray(images)) {
      const hasBlobUrl = images.some((img: any) => {
        const u = String(img.url || "").trim();
        return u.startsWith("blob:") || u.includes("blob:");
      });
      if (hasBlobUrl) {
        return res.status(400).json({
          success: false,
          error: "Có hình ảnh chưa được tải lên hệ thống lưu trữ (chứa đường dẫn tạm blob:). Vui lòng đợi ảnh tải xong 100% rồi lưu lại.",
        });
      }
      // Xóa ảnh cũ không còn trong danh sách
      await supabase.from("product_images").delete().eq("product_id", targetProductId);

      if (images.length > 0) {
        const imageRows = images.map((img: any, idx: number) => ({
          product_id: targetProductId,
          url: String(img.url || ""),
          is_cover: idx === 0 || Boolean(img.isCover),
          sort_order: typeof img.sortOrder === "number" ? img.sortOrder : idx,
          alt_vi: img.altVi || nameVi,
          alt_en: img.altEn || nameEn || null,
          width: img.width ? Number(img.width) : null,
          height: img.height ? Number(img.height) : null,
        }));

        const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
        if (imgErr) {
          console.error("[save-draft] Lỗi lưu ảnh:", imgErr.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lưu bản nháp thành công.",
      product: {
        id: targetProductId,
        slug: productSlug,
        status: "draft",
      },
    });
  } catch (err: any) {
    console.error("[save-draft] Error:", err.message);

    const isClientError =
      err.message.includes("bắt buộc") ||
      err.message.includes("chưa được cấp quyền") ||
      err.message.includes("đang được team");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: err.message || "Không thể lưu bản nháp.",
    });
  }
}
