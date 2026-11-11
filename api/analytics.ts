import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { authenticateStaffMember } from "./_lib/supabaseAuth.js";
import { getCache, setCache } from "./_lib/redis.js";

interface IngestEvent {
  type: "page_view" | "product_view" | "shop_view" | "wishlist_toggle" | "outbound_click" | "search_query";
  productId?: string;
  shopId?: string;
  targetUrl?: string;
  platform?: string;
  isNewVisitor?: boolean;
  deviceType?: "mobile" | "desktop" | "tablet";
  referrerSource?: "organic" | "social" | "direct" | "referral" | "other";
  searchQuery?: string;
  favoriteDelta?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  // =========================================================================
  // 1. INGESTION HANDLER (POST): Public, rate-tolerant, fire-and-forget
  // =========================================================================
  if (req.method === "POST") {
    try {
      const supabase = getSupabaseAdmin();
      const body = req.body || {};
      const events: IngestEvent[] = Array.isArray(body) ? body : [body];
      const todayStr = new Date().toISOString().split("T")[0];

      for (const ev of events) {
        if (!ev || !ev.type) continue;

        const device = ev.deviceType || "mobile";
        const isNew = Boolean(ev.isNewVisitor);
        const refSource = ev.referrerSource || "direct";

        // A. Page View
        if (ev.type === "page_view") {
          const isCatalog =
            ev.targetUrl && (ev.targetUrl.startsWith("/products") || ev.targetUrl.startsWith("/stores"));

          // Defensive update / insert to analytics_daily_metrics
          try {
            const { data: existing } = await supabase
              .from("analytics_daily_metrics")
              .select("*")
              .eq("metric_date", todayStr)
              .maybeSingle();

            if (existing) {
              const currentSources = existing.traffic_sources || {};
              currentSources[refSource] = (currentSources[refSource] || 0) + 1;

              await supabase
                .from("analytics_daily_metrics")
                .update({
                  total_page_views: (existing.total_page_views || 0) + 1,
                  total_visitors: (existing.total_visitors || 0) + (isNew ? 1 : 0),
                  new_visitors: (existing.new_visitors || 0) + (isNew ? 1 : 0),
                  returning_visitors: (existing.returning_visitors || 0) + (isNew ? 0 : 1),
                  mobile_sessions: (existing.mobile_sessions || 0) + (device === "mobile" ? 1 : 0),
                  desktop_sessions: (existing.desktop_sessions || 0) + (device === "desktop" ? 1 : 0),
                  tablet_sessions: (existing.tablet_sessions || 0) + (device === "tablet" ? 1 : 0),
                  catalog_browsers: (existing.catalog_browsers || 0) + (isCatalog ? 1 : 0),
                  traffic_sources: currentSources,
                  updated_at: new Date().toISOString(),
                })
                .eq("metric_date", todayStr);
            } else {
              await supabase.from("analytics_daily_metrics").insert({
                metric_date: todayStr,
                total_page_views: 1,
                total_visitors: 1,
                new_visitors: isNew ? 1 : 0,
                returning_visitors: isNew ? 0 : 1,
                mobile_sessions: device === "mobile" ? 1 : 0,
                desktop_sessions: device === "desktop" ? 1 : 0,
                tablet_sessions: device === "tablet" ? 1 : 0,
                catalog_browsers: isCatalog ? 1 : 0,
                traffic_sources: { [refSource]: 1 },
              });
            }
          } catch (err) {
            console.warn("[Analytics] Daily metrics update error:", err);
          }
        }

        // B. Product View
        else if (ev.type === "product_view" && ev.productId) {
          try {
            await supabase.rpc("increment_product_view", { p_product_id: ev.productId });
          } catch {
            await supabase
              .from("products")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", ev.productId);
          }

          try {
            await supabase.from("click_events").insert({
              target_type: "product_view",
              product_id: ev.productId,
              shop_id: ev.shopId || null,
              device_type: device,
              visitor_hash: "anon",
              session_id: "anon",
            });
          } catch {}

          // Increment detail_viewers in daily metrics
          try {
            const { data: existing } = await supabase
              .from("analytics_daily_metrics")
              .select("detail_viewers")
              .eq("metric_date", todayStr)
              .maybeSingle();

            if (existing) {
              await supabase
                .from("analytics_daily_metrics")
                .update({ detail_viewers: (existing.detail_viewers || 0) + 1 })
                .eq("metric_date", todayStr);
            }
          } catch {}
        }

        // C. Shop View
        else if (ev.type === "shop_view" && ev.shopId) {
          try {
            await supabase.rpc("increment_shop_metric", { p_shop_id: ev.shopId, p_is_outbound: false });
          } catch {
            await supabase
              .from("shops")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", ev.shopId);
          }

          try {
            await supabase.from("click_events").insert({
              target_type: "shop_view",
              shop_id: ev.shopId,
              device_type: device,
              visitor_hash: "anon",
              session_id: "anon",
            });
          } catch {}
        }

        // D. Wishlist Toggle (Favorite +1 / -1)
        else if (ev.type === "wishlist_toggle" && ev.productId) {
          const delta = ev.favoriteDelta === -1 ? -1 : 1;
          try {
            await supabase.rpc("increment_product_favorite", {
              p_product_id: ev.productId,
              p_delta: delta,
            });
          } catch {}

          try {
            await supabase.from("click_events").insert({
              target_type: "wishlist_add",
              product_id: ev.productId,
              device_type: device,
              visitor_hash: "anon",
              session_id: "anon",
            });
          } catch {}

          if (delta > 0) {
            try {
              const { data: existing } = await supabase
                .from("analytics_daily_metrics")
                .select("wishlist_engagements")
                .eq("metric_date", todayStr)
                .maybeSingle();

              if (existing) {
                await supabase
                  .from("analytics_daily_metrics")
                  .update({ wishlist_engagements: (existing.wishlist_engagements || 0) + 1 })
                  .eq("metric_date", todayStr);
              }
            } catch {}
          }
        }

        // E. Outbound Click (Referral Conversion to Shop)
        else if (ev.type === "outbound_click" && ev.shopId) {
          const platform = ev.platform || "website";
          try {
            await supabase.rpc("increment_shop_metric", { p_shop_id: ev.shopId, p_is_outbound: true });
          } catch {}

          try {
            await supabase.from("click_events").insert({
              target_type: "social_link",
              shop_id: ev.shopId,
              product_id: ev.productId || null,
              platform: platform as any,
              device_type: device,
              visitor_hash: "anon",
              session_id: "anon",
            });
          } catch {}

          try {
            const { data: existing } = await supabase
              .from("analytics_daily_metrics")
              .select("outbound_conversions, outbound_by_platform")
              .eq("metric_date", todayStr)
              .maybeSingle();

            if (existing) {
              const platforms = existing.outbound_by_platform || {};
              platforms[platform] = (platforms[platform] || 0) + 1;
              await supabase
                .from("analytics_daily_metrics")
                .update({
                  outbound_conversions: (existing.outbound_conversions || 0) + 1,
                  outbound_by_platform: platforms,
                })
                .eq("metric_date", todayStr);
            }
          } catch {}
        }

        // F. Search Query Log
        else if (ev.type === "search_query" && ev.searchQuery) {
          try {
            await supabase.from("search_logs").insert({
              query: ev.searchQuery.trim(),
              normalized: ev.searchQuery.trim().toLowerCase(),
              result_count: 1,
            });
          } catch {}
        }
      }

      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error("[Analytics Ingestion Error]:", err);
      return res.status(200).json({ ok: false, error: err.message });
    }
  }

  // =========================================================================
  // 2. REPORTING HANDLER (GET): 100% REAL DATA from Supabase
  // =========================================================================
  if (req.method === "GET") {
    try {
      // Admin Authorization Gate
      const authHeader = req.headers.authorization;
      await authenticateStaffMember(authHeader);

      const period = (req.query.period as string) || "30d";
      const customStart = req.query.start_date as string;
      const customEnd = req.query.end_date as string;

      // Calculate Date Ranges
      const now = new Date();
      let startDate: Date;
      let endDate: Date = new Date();

      if (period === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === "7d") {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === "custom" && customStart && customEnd) {
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
      } else {
        // Default: 30 days
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const startIso = startDate.toISOString().split("T")[0];
      const endIso = endDate.toISOString().split("T")[0];

      // Cache Check
      const cacheKey = `analytics:overview:${period}:${startIso}:${endIso}`;
      const cached = await getCache<any>(cacheKey);
      if (cached && req.query.purge !== "true") {
        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        res.setHeader("X-Cache", "HIT");
        return res.status(200).json(cached);
      }

      const supabase = getSupabaseAdmin();

      // Parallel Real Queries
      const [
        dailyMetricsRes,
        shopsRes,
        productsRes,
        categoriesRes,
        topViewedProductsRes,
        topFavoritedProductsRes,
        topShopsRes,
        searchLogsRes,
      ] = await Promise.all([
        // 1. Real Daily Metrics
        supabase
          .from("analytics_daily_metrics")
          .select("*")
          .gte("metric_date", startIso)
          .lte("metric_date", endIso)
          .order("metric_date", { ascending: true }),

        // 2. Real Shops
        supabase.from("shops").select("id, name, status, view_count, outbound_click_count, created_at"),

        // 3. Real Products
        supabase.from("products").select("id, name_vi, status, category_id, view_count, favorite_count, created_at"),

        // 4. Real Categories
        supabase.from("categories").select("id, name_vi, slug"),

        // 5. Real Top Viewed Products
        supabase
          .from("products")
          .select("id, name_vi, view_count, shops(name)")
          .order("view_count", { ascending: false })
          .limit(10),

        // 6. Real Top Favorited Products
        supabase
          .from("products")
          .select("id, name_vi, favorite_count, shops(name)")
          .order("favorite_count", { ascending: false })
          .limit(10),

        // 7. Real Top Clicked Shops
        supabase
          .from("shops")
          .select("id, name, view_count")
          .order("view_count", { ascending: false })
          .limit(10),

        // 8. Real Search Logs
        supabase
          .from("search_logs")
          .select("query, normalized")
          .gte("created_at", startIso)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      const dailyMetrics = dailyMetricsRes.data || [];
      const shops = shopsRes.data || [];
      const products = productsRes.data || [];
      const categories = categoriesRes.data || [];

      // Compute Real Totals from Daily Metrics
      let totalVisitors = 0;
      let totalPageViews = 0;
      let newVisitors = 0;
      let returningVisitors = 0;
      let mobileSessions = 0;
      let desktopSessions = 0;
      let tabletSessions = 0;
      let catalogBrowsers = 0;
      let detailViewers = 0;
      let wishlistEngagements = 0;
      let outboundConversions = 0;
      const trafficSourceMap: Record<string, number> = {};
      const outboundPlatformMap: Record<string, number> = {
        shopee: 0,
        instagram: 0,
        zalo: 0,
        tiktok: 0,
        website: 0,
      };

      const visitorsOverTime = dailyMetrics.map((dm) => {
        totalVisitors += dm.total_visitors || 0;
        totalPageViews += dm.total_page_views || 0;
        newVisitors += dm.new_visitors || 0;
        returningVisitors += dm.returning_visitors || 0;
        mobileSessions += dm.mobile_sessions || 0;
        desktopSessions += dm.desktop_sessions || 0;
        tabletSessions += dm.tablet_sessions || 0;
        catalogBrowsers += dm.catalog_browsers || 0;
        detailViewers += dm.detail_viewers || 0;
        wishlistEngagements += dm.wishlist_engagements || 0;
        outboundConversions += dm.outbound_conversions || 0;

        if (dm.traffic_sources && typeof dm.traffic_sources === "object") {
          for (const [k, v] of Object.entries(dm.traffic_sources)) {
            trafficSourceMap[k] = (trafficSourceMap[k] || 0) + Number(v);
          }
        }

        if (dm.outbound_by_platform && typeof dm.outbound_by_platform === "object") {
          for (const [k, v] of Object.entries(dm.outbound_by_platform)) {
            outboundPlatformMap[k] = (outboundPlatformMap[k] || 0) + Number(v);
          }
        }

        return {
          date: dm.metric_date,
          newVisitors: dm.new_visitors || 0,
          returningVisitors: dm.returning_visitors || 0,
        };
      });

      // REAL Shop & Product stats directly from DB
      const activeShops = shops.filter((s) => s.status === "Approved" || s.status === "published").length;
      const pendingShops = shops.filter((s) => s.status === "Pending" || s.status === "pending_review").length;
      const totalListedProducts = products.filter(
        (p) => p.status === "published" || p.status === "Approved"
      ).length;
      const newProductsAdded = products.filter((p) => {
        if (!p.created_at) return false;
        const created = new Date(p.created_at).getTime();
        return created >= startDate.getTime() && created <= endDate.getTime();
      }).length;

      // Real Device percentages
      const totalDevices = mobileSessions + desktopSessions + tabletSessions;
      const devices = {
        mobilePercent: totalDevices > 0 ? Math.round((mobileSessions / totalDevices) * 100) : 0,
        desktopPercent: totalDevices > 0 ? Math.round((desktopSessions / totalDevices) * 100) : 0,
        tabletPercent: totalDevices > 0 ? Math.round((tabletSessions / totalDevices) * 100) : 0,
      };

      // Real New vs Returning percentages
      const totalNewVsRet = newVisitors + returningVisitors;
      const newVsReturning = {
        newCount: newVisitors,
        newPercent: totalNewVsRet > 0 ? Math.round((newVisitors / totalNewVsRet) * 100) : 0,
        returningCount: returningVisitors,
        returningPercent: totalNewVsRet > 0 ? Math.round((returningVisitors / totalNewVsRet) * 100) : 0,
      };

      // Real Traffic Sources array
      const totalSources = Object.values(trafficSourceMap).reduce((a, b) => a + b, 0);
      const trafficSources =
        totalSources > 0
          ? Object.entries(trafficSourceMap).map(([source, val]) => ({
              source,
              sharePercent: Math.round((val / totalSources) * 100),
            }))
          : [
              { source: "Direct", sharePercent: 0 },
              { source: "Organic Search", sharePercent: 0 },
              { source: "Social Media", sharePercent: 0 },
              { source: "Referral", sharePercent: 0 },
            ];

      // Real Category Distribution calculated from real products in DB
      const categoryNameMap = new Map<string, string>();
      categories.forEach((c) => categoryNameMap.set(c.id, c.name_vi));

      const categoryCountMap: Record<string, number> = {};
      products.forEach((p) => {
        const catName = (p.category_id && categoryNameMap.get(p.category_id)) || "Khác";
        categoryCountMap[catName] = (categoryCountMap[catName] || 0) + 1;
      });

      const totalProdsCount = products.length || 1;
      const topCategories = Object.entries(categoryCountMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({
          category,
          percentage: Math.round((count / totalProdsCount) * 100),
        }));

      // Real Leaderboards directly from Database rows
      const topProductsViewed = (topViewedProductsRes.data || []).map((p: any, idx: number) => ({
        id: p.id,
        rank: idx + 1,
        name: p.name_vi,
        shopName: p.shops?.name || "Shop",
        count: p.view_count || 0,
      }));

      const topProductsFavorited = (topFavoritedProductsRes.data || []).map((p: any, idx: number) => ({
        id: p.id,
        rank: idx + 1,
        name: p.name_vi,
        shopName: p.shops?.name || "Shop",
        count: p.favorite_count || 0,
      }));

      const topShops = (topShopsRes.data || []).map((s: any, idx: number) => ({
        id: s.id,
        rank: idx + 1,
        name: s.name,
        count: s.view_count || 0,
      }));

      // Real Search Keywords from search_logs
      const queryMap: Record<string, number> = {};
      (searchLogsRes.data || []).forEach((sl) => {
        const q = sl.normalized || sl.query;
        if (q) queryMap[q] = (queryMap[q] || 0) + 1;
      });
      const topSearchKeywords = Object.entries(queryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count }));

      // Real 5-Stage Conversion Funnel Calculation
      const stage1 = totalVisitors;
      const stage2 = Math.min(stage1, catalogBrowsers);
      const stage3 = Math.min(stage2, detailViewers);
      const stage4 = Math.min(stage3, wishlistEngagements);
      const stage5 = Math.min(stage4, outboundConversions);

      const calcDropOff = (prev: number, curr: number) => {
        const drop = Math.max(0, prev - curr);
        const rate = prev > 0 ? Math.round((drop / prev) * 100) : 0;
        const conv = prev > 0 ? Math.round((curr / prev) * 100) : 0;
        return { dropOffCount: drop, dropOffRate: rate, conversionRateFromPrevious: conv };
      };

      const s2Stats = calcDropOff(stage1, stage2);
      const s3Stats = calcDropOff(stage2, stage3);
      const s4Stats = calcDropOff(stage3, stage4);
      const s5Stats = calcDropOff(stage4, stage5);

      const conversionFunnel = {
        stages: [
          {
            stageKey: "visitors",
            label: "1. Lượt truy cập website",
            count: stage1,
            dropOffCount: 0,
            dropOffRate: 0,
            conversionRateFromPrevious: stage1 > 0 ? 100 : 0,
          },
          {
            stageKey: "catalog",
            label: "2. Khám phá danh mục / shop",
            count: stage2,
            ...s2Stats,
          },
          {
            stageKey: "detail",
            label: "3. Xem chi tiết sản phẩm / shop",
            count: stage3,
            ...s3Stats,
          },
          {
            stageKey: "wishlist",
            label: "4. Lưu yêu thích (Wishlist)",
            count: stage4,
            ...s4Stats,
          },
          {
            stageKey: "outbound",
            label: "5. Chuyển đổi liên hệ / mua tại shop",
            count: stage5,
            ...s5Stats,
          },
        ],
        overallConversionRate: stage1 > 0 ? Number(((stage5 / stage1) * 100).toFixed(1)) : 0.0,
        outboundByPlatform: outboundPlatformMap,
      };

      const payload = {
        kpis: {
          totalVisitors,
          totalVisitorsChange: 0,
          totalPageViews,
          totalPageViewsChange: 0,
          activeShops,
          activeShopsChange: 0,
          pendingShops,
          totalListedProducts,
          totalListedProductsChange: 0,
          newProductsAdded,
        },
        visitorsOverTime,
        newVsReturning,
        devices,
        trafficSources,
        topCategories,
        topProductsViewed,
        topProductsFavorited,
        topShops,
        topSearchKeywords,
        conversionFunnel,
      };

      // Set Redis Cache for 5 minutes
      await setCache(cacheKey, payload, 300);

      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      res.setHeader("X-Cache", "MISS");
      return res.status(200).json(payload);
    } catch (err: any) {
      console.error("[Analytics GET Error]:", err);
      const isAuthErr = err.message?.includes("quản trị viên") || err.message?.includes("hết hạn");
      return res.status(isAuthErr ? 401 : 500).json({
        success: false,
        error: err.message || "Lỗi xử lý yêu cầu thống kê.",
      });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);
  return res.status(405).json({ success: false, error: "Method Not Allowed" });
}
