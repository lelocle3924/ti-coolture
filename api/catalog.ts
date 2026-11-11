import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { getCache, setCache, deleteCache } from "./_lib/redis.js";

const CACHE_KEY = "catalog:v1";
const CACHE_TTL_SECONDS = 300; // 5 minutes

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-purge-key");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  // Handle Cache Purge
  if (req.query.purge === "true" || req.headers["x-purge-key"] === process.env.ADMIN_SECRET) {
    await deleteCache(CACHE_KEY);
    return res.status(200).json({ success: true, message: "Catalog cache purged successfully." });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    // 1. Try to fetch from Upstash Redis Cache
    const cached = await getCache<{ shops: any[]; products: any[] }>(CACHE_KEY);
    if (cached) {
      res.setHeader("x-cache", "HIT-REDIS");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=3600");
      res.setHeader("Vercel-CDN-Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
      return res.status(200).json({
        success: true,
        source: "cache",
        data: cached,
      });
    }

    // 2. Cache miss: Fetch from Supabase via Service Role
    const supabase = getSupabaseAdmin();

    const [shopsRes, productsRes] = await Promise.all([
      supabase
        .from("shops")
        .select("*, shop_socials(*)")
        .eq("status", "published"),
      supabase
        .from("products")
        .select("*, shops!inner(*), categories(*), product_images(*)")
        .eq("status", "published")
        .eq("shops.status", "published")
        .eq("product_hidden", false)
        .eq("shop_hidden", false),
    ]);

    if (shopsRes.error) throw shopsRes.error;
    if (productsRes.error) throw productsRes.error;

    const catalogData = {
      shops: shopsRes.data || [],
      products: productsRes.data || [],
    };

    // 3. Save to Redis in background (non-blocking)
    setCache(CACHE_KEY, catalogData, CACHE_TTL_SECONDS).catch((err) =>
      console.warn("[Catalog] Failed to set Redis cache:", err)
    );

    // 4. Set Vercel Edge Cache headers and return
    res.setHeader("x-cache", "MISS");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=3600");
    res.setHeader("Vercel-CDN-Cache-Control", "s-maxage=300, stale-while-revalidate=86400");

    return res.status(200).json({
      success: true,
      source: "supabase",
      data: catalogData,
    });
  } catch (error: any) {
    console.error("[Catalog API] Error fetching catalog:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal Server Error",
    });
  }
}
