import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getCache, setCache } from "./_lib/redis.js";

function normalizeVi(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Sử dụng GET.",
    });
  }

  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : null;
    const shopId = typeof req.query.shop_id === "string" ? req.query.shop_id.trim() : null;
    const minPrice = req.query.min_price ? parseInt(req.query.min_price as string, 10) : null;
    const maxPrice = req.query.max_price ? parseInt(req.query.max_price as string, 10) : null;
    const sort = typeof req.query.sort === "string" ? req.query.sort.trim() : "relevance";
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 24));
    const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

    const cacheKey = `search:${normalizeVi(q)}:${category || ""}:${shopId || ""}:${minPrice ?? ""}:${maxPrice ?? ""}:${sort}:${limit}:${offset}`;

    // 1. Check Redis cache first
    const cachedData = await getCache<{
      total: number;
      limit: number;
      offset: number;
      data: any[];
    }>(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        cached: true,
        ...cachedData,
      });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc("search_products", {
      search_term: q || null,
      filter_category_slug: category || null,
      filter_shop_id: shopId || null,
      filter_min_price: isNaN(minPrice as number) ? null : minPrice,
      filter_max_price: isNaN(maxPrice as number) ? null : maxPrice,
      sort_by: sort,
      page_limit: limit,
      page_offset: offset,
    });

    if (error) {
      console.error("search_products RPC error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const totalCount = data && data.length > 0 ? Number(data[0].total_count) : 0;

    const responsePayload = {
      total: totalCount,
      limit,
      offset,
      data: data || [],
    };

    // 2. Save result to Redis (TTL 180s = 3 minutes)
    await setCache(cacheKey, responsePayload, 180);

    // 3. Fire-and-forget log search query for analytics & zero-result demand
    if (q) {
      Promise.resolve(
        supabase.from("search_logs").insert({
          query: q,
          normalized: normalizeVi(q),
          result_count: totalCount,
          locale: "vi",
        })
      ).catch((logErr) => console.warn("Failed to write search_logs:", logErr));
    }

    return res.status(200).json({
      success: true,
      cached: false,
      ...responsePayload,
    });
  } catch (err: any) {
    console.error("Search API error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Lỗi xử lý tìm kiếm.",
    });
  }
}

