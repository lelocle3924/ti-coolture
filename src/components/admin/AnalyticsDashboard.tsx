import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Eye,
  Store,
  Package,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  Calendar,
  RefreshCw,
  Search,
  ExternalLink,
  Heart,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  X,
  Layers,
} from "lucide-react";
import {
  DashboardOverviewResponse,
  ProductLeaderboardItem,
  ShopLeaderboardItem,
} from "../../types";

interface AnalyticsDashboardProps {
  token?: string | null;
}

export default function AnalyticsDashboard({ token }: AnalyticsDashboardProps) {
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "month" | "custom">("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [viewAllModal, setViewAllModal] = useState<{
    title: string;
    type: "viewed" | "favorited" | "shops";
    items: Array<ProductLeaderboardItem | ShopLeaderboardItem>;
  } | null>(null);
  const [timeViewType, setTimeViewType] = useState<"day" | "week">("day");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken =
        token ||
        (typeof window !== "undefined"
          ? localStorage.getItem("ti_admin_token") || localStorage.getItem("staff_session_token")
          : null);

      let url = `/api/analytics?action=overview&period=${period}`;
      if (period === "custom" && customStart && customEnd) {
        url += `&start_date=${customStart}&end_date=${customEnd}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : "Bearer test_admin_token_local",
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Không thể tải dữ liệu thống kê.`);
      }

      const json: DashboardOverviewResponse = await res.json();
      setData(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải thống kê.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // Derived values for SVG line chart
  const timePoints = useMemo(() => {
    if (!data?.visitorsOverTime || data.visitorsOverTime.length === 0) return [];
    return data.visitorsOverTime;
  }, [data]);

  const maxVisitors = useMemo(() => {
    if (timePoints.length === 0) return 800;
    const maxVal = Math.max(
      ...timePoints.map((tp) => Math.max(tp.newVisitors, tp.returningVisitors))
    );
    return Math.max(maxVal * 1.2, 500);
  }, [timePoints]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] bg-stone-50/50 rounded-2xl border border-stone-200/80 p-8">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
        <p className="text-stone-600 font-medium text-sm">Đang tổng hợp dữ liệu hiệu năng website...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-800">
        <p className="font-semibold mb-2">Không thể tải dữ liệu thống kê</p>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const kpis = data?.kpis;
  const newVsRet = data?.newVsReturning;
  const devices = data?.devices;
  const funnel = data?.conversionFunnel;

  return (
    <div className="space-y-8 pb-12 font-sans text-stone-900">
      {/* 1. Header & Date Range Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <span>Tổng quan</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              Real-time Analytics
            </span>
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Tình hình hoạt động và hiệu quả quảng bá của Tí Coolture trong khoảng thời gian đã chọn
          </p>
        </div>

        {/* Date Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/80 text-xs font-medium">
            <button
              onClick={() => setPeriod("today")}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === "today" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setPeriod("7d")}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === "7d" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setPeriod("30d")}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === "30d" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              30 ngày qua
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === "month" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Tháng này
            </button>
          </div>

          <button
            onClick={fetchData}
            title="Làm mới dữ liệu"
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition border border-stone-200/80"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Row (4 cards matching Mockup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Visitors */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-3">
            <span>Lượt truy cập website</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {kpis?.totalVisitors.toLocaleString() ?? "0"}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {kpis?.totalVisitorsChange !== undefined ? `+${kpis.totalVisitorsChange}%` : "0%"}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">So với kỳ trước</p>
        </div>

        {/* Card 2: Page Views */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-3">
            <span>Lượt xem trang</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {kpis?.totalPageViews.toLocaleString() ?? "0"}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {kpis?.totalPageViewsChange !== undefined ? `+${kpis.totalPageViewsChange}%` : "0%"}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">So với kỳ trước</p>
        </div>

        {/* Card 3: Active Shops */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-3">
            <span>Thương hiệu tham gia</span>
            <Store className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {kpis?.activeShops.toLocaleString() ?? "0"}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {kpis?.activeShopsChange !== undefined ? `+${kpis.activeShopsChange}%` : "0%"}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            {kpis?.pendingShops ? `${kpis.pendingShops} shop đang chờ duyệt` : "Tất cả shop đã duyệt"}
          </p>
        </div>

        {/* Card 4: Listed Products */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-3">
            <span>Sản phẩm hiển thị</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {kpis?.totalListedProducts.toLocaleString() ?? "0"}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {kpis?.totalListedProductsChange !== undefined ? `+${kpis.totalListedProductsChange}%` : "0%"}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            +{kpis?.newProductsAdded ?? 0} sản phẩm mới trong kỳ
          </p>
        </div>
      </div>

      {/* 3. Middle Section: Time-series Line Chart + Donut + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line Chart: Visitors over time (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Lượt truy cập website theo thời gian</h2>
              <div className="flex items-center gap-4 text-xs text-stone-500 mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  Người dùng mới
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block" />
                  Người dùng quay lại
                </span>
              </div>
            </div>

            <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-[11px]">
              <button
                onClick={() => setTimeViewType("day")}
                className={`px-2 py-1 rounded-md transition ${
                  timeViewType === "day" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                }`}
              >
                Theo ngày
              </button>
              <button
                onClick={() => setTimeViewType("week")}
                className={`px-2 py-1 rounded-md transition ${
                  timeViewType === "week" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                }`}
              >
                Theo tuần
              </button>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full h-52 relative mt-4">
            {timePoints.length > 0 ? (
              <>
                <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f1ee" strokeDasharray="4 4" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f1ee" strokeDasharray="4 4" />
                  <line x1="0" y1="130" x2="500" y2="130" stroke="#f1f1ee" strokeDasharray="4 4" />

                  {/* Data Trendline: New Visitors (Emerald) */}
                  {timePoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={timePoints
                        .map((tp, idx) => {
                          const x = (idx / (timePoints.length - 1)) * 480 + 10;
                          const y = 140 - (tp.newVisitors / maxVisitors) * 120;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />
                  )}

                  {/* Data Trendline: Returning Visitors (Stone) */}
                  {timePoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#a8a29e"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="4 3"
                      points={timePoints
                        .map((tp, idx) => {
                          const x = (idx / (timePoints.length - 1)) * 480 + 10;
                          const y = 140 - (tp.returningVisitors / maxVisitors) * 120;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />
                  )}

                  {/* Points on trendline */}
                  {timePoints.map((tp, idx) => {
                    const x =
                      timePoints.length > 1
                        ? (idx / (timePoints.length - 1)) * 480 + 10
                        : 250;
                    const yNew = 140 - (tp.newVisitors / maxVisitors) * 120;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={yNew}
                        r="3.5"
                        fill="#059669"
                        className="hover:r-5 transition-all cursor-pointer"
                      >
                        <title>{`${tp.date}: ${tp.newVisitors} khách mới`}</title>
                      </circle>
                    );
                  })}
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between text-[11px] text-stone-400 mt-2 px-1">
                  {timePoints.map((tp, idx) => (
                    <span key={idx}>{tp.date}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center text-stone-400 border border-dashed border-stone-200 rounded-xl p-4">
                <p className="text-xs font-medium">Chưa phát sinh lượt truy cập trong kỳ này.</p>
                <p className="text-[11px] text-stone-400 mt-1">Dữ liệu thực tế sẽ tự động ghi nhận khi có khách ghé thăm website.</p>
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart: New vs Returning (3 cols) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <h2 className="text-sm font-bold text-stone-900 mb-2">Người dùng mới vs quay lại</h2>
          <div className="relative w-36 h-36 mx-auto my-auto flex items-center justify-center">
            {/* SVG Donut */}
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" stroke="#e7e5e4" strokeWidth="14" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#059669"
                strokeWidth="14"
                fill="none"
                strokeDasharray={`${(newVsRet?.newPercent ?? 0) * 2.51} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="block text-lg font-extrabold text-stone-900">
                {kpis?.totalVisitors.toLocaleString() || "0"}
              </span>
              <span className="text-[10px] text-stone-400 font-medium">Users</span>
            </div>
          </div>

          <div className="space-y-2 mt-4 text-xs">
            <div className="flex justify-between items-center text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Người dùng mới
              </span>
              <span className="font-semibold text-stone-900">
                {newVsRet?.newPercent ?? 0}% ({newVsRet?.newCount.toLocaleString() || "0"})
              </span>
            </div>
            <div className="flex justify-between items-center text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                Người dùng quay lại
              </span>
              <span className="font-semibold text-stone-900">
                {newVsRet?.returningPercent ?? 0}% ({newVsRet?.returningCount.toLocaleString() || "0"})
              </span>
            </div>
          </div>
        </div>

        {/* Device Breakdown (3 cols) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <h2 className="text-sm font-bold text-stone-900 mb-4">Thiết bị truy cập</h2>

          <div className="flex items-center justify-center my-auto">
            <div className="w-24 h-24 rounded-2xl bg-stone-100 flex items-center justify-center border border-stone-200/80">
              <Smartphone className="w-12 h-12 text-stone-700" />
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="flex items-center gap-1.5 text-stone-600">
                  <Smartphone className="w-3.5 h-3.5" /> Điện thoại
                </span>
                <span className="font-bold text-stone-900">{devices?.mobilePercent ?? 0}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full"
                  style={{ width: `${devices?.mobilePercent ?? 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="flex items-center gap-1.5 text-stone-600">
                  <Monitor className="w-3.5 h-3.5" /> Máy tính
                </span>
                <span className="font-bold text-stone-900">{devices?.desktopPercent ?? 0}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-stone-500 h-1.5 rounded-full"
                  style={{ width: `${devices?.desktopPercent ?? 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="flex items-center gap-1.5 text-stone-600">
                  <Tablet className="w-3.5 h-3.5" /> Tablet
                </span>
                <span className="font-bold text-stone-900">{devices?.tabletPercent ?? 0}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-stone-300 h-1.5 rounded-full"
                  style={{ width: `${devices?.tabletPercent ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 5-Stage Conversion Funnel Section */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Phễu chuyển đổi quảng bá (Conversion Funnel)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Đo lường tỷ lệ giữ chân từ lượt truy cập website đến khi kết nối chuyển đổi sang các shop
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-stone-500">Tỷ lệ chuyển đổi tổng thể:</span>
            <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              {funnel?.overallConversionRate ?? 0}%
            </span>
          </div>
        </div>

        {/* Funnel Stage Bars */}
        <div className="mt-6 space-y-4">
          {funnel?.stages.map((stage, idx) => {
            const maxCount = funnel.stages[0]?.count || 1;
            const barWidthPercent = Math.max(12, Math.round((stage.count / maxCount) * 100));

            return (
              <div key={stage.stageKey} className="relative">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-stone-900">{stage.label}</span>
                  <div className="flex items-center gap-3 text-stone-600">
                    <span className="font-bold text-stone-900 text-sm">{stage.count.toLocaleString()}</span>
                    {idx > 0 && (
                      <span className="text-[11px] text-stone-500">
                        (Giữ lại {stage.conversionRateFromPrevious}% / Rơi rụng: -{stage.dropOffRate}%)
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-stone-100 h-7 rounded-xl overflow-hidden flex items-center">
                  <div
                    className={`h-full rounded-xl transition-all duration-500 flex items-center px-3 ${
                      idx === 0
                        ? "bg-emerald-700 text-white"
                        : idx === 1
                        ? "bg-emerald-600 text-white"
                        : idx === 2
                        ? "bg-teal-600 text-white"
                        : idx === 3
                        ? "bg-amber-600 text-white"
                        : "bg-emerald-500 text-white"
                    }`}
                    style={{ width: `${barWidthPercent}%` }}
                  >
                    <span className="text-[11px] font-bold tracking-wide">
                      {Math.round((stage.count / maxCount) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Outbound Channel Distribution */}
        <div className="mt-6 pt-6 border-t border-stone-100">
          <h3 className="text-xs font-bold text-stone-700 mb-3 uppercase tracking-wider">
            Kênh chuyển đổi liên hệ & mua sắm tại shop
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Shopee", val: "shopee", color: "text-orange-600 bg-orange-50 border-orange-200" },
              { label: "Instagram", val: "instagram", color: "text-pink-600 bg-pink-50 border-pink-200" },
              { label: "Zalo", val: "zalo", color: "text-blue-600 bg-blue-50 border-blue-200" },
              { label: "TikTok", val: "tiktok", color: "text-stone-900 bg-stone-50 border-stone-200" },
              { label: "Website shop", val: "website", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
            ].map((ch) => (
              <div
                key={ch.val}
                className={`p-3 rounded-xl border text-center font-medium ${ch.color}`}
              >
                <div className="text-xs mb-1">{ch.label}</div>
                <div className="text-base font-extrabold">
                  {funnel?.outboundByPlatform?.[ch.val]?.toLocaleString() || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Product & Shop Leaderboards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Most Viewed Products */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-stone-900">Top 5 sản phẩm xem nhiều</h2>
              <button
                onClick={() =>
                  setViewAllModal({
                    title: "Top sản phẩm được xem nhiều nhất",
                    type: "viewed",
                    items: data?.topProductsViewed || [],
                  })
                }
                className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Xem tất cả</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {data?.topProductsViewed.slice(0, 5).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 font-bold text-stone-600 flex items-center justify-center text-[10px]">
                      {item.rank}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-stone-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-stone-400 truncate">{item.shopName}</p>
                    </div>
                  </div>
                  <span className="font-bold text-stone-700 shrink-0">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top 5 Most Favorited Products */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-stone-900">Top 5 sản phẩm yêu thích</h2>
              <button
                onClick={() =>
                  setViewAllModal({
                    title: "Top sản phẩm được yêu thích nhất",
                    type: "favorited",
                    items: data?.topProductsFavorited || [],
                  })
                }
                className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Xem tất cả</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {data?.topProductsFavorited.slice(0, 5).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 font-bold text-stone-600 flex items-center justify-center text-[10px]">
                      {item.rank}
                    </span>
                    <div className="truncate">
                      <p className="font-semibold text-stone-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-stone-400 truncate">{item.shopName}</p>
                    </div>
                  </div>
                  <span className="font-bold text-rose-600 flex items-center gap-1 shrink-0">
                    <Heart className="w-3 h-3 fill-rose-600" />
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top 5 Clicked Shops */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-stone-900">Top thương hiệu được xem</h2>
              <button
                onClick={() =>
                  setViewAllModal({
                    title: "Top thương hiệu / shop được click xem nhiều nhất",
                    type: "shops",
                    items: data?.topShops || [],
                  })
                }
                className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Xem tất cả</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {data?.topShops.slice(0, 5).map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 font-bold text-stone-600 flex items-center justify-center text-[10px]">
                      {s.rank}
                    </span>
                    <p className="font-semibold text-stone-900 truncate">{s.name}</p>
                  </div>
                  <span className="font-bold text-stone-700 shrink-0">{s.count.toLocaleString()} lượt</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Categories & Traffic Sources & Search Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <h2 className="text-sm font-bold text-stone-900 mb-4">Top ngành hàng được quan tâm</h2>
          <div className="space-y-3">
            {data?.topCategories.map((cat) => (
              <div key={cat.category}>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-stone-700">{cat.category}</span>
                  <span className="font-bold text-stone-900">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <h2 className="text-sm font-bold text-stone-900 mb-4">Nguồn traffic</h2>
          <div className="space-y-3">
            {data?.trafficSources.map((ts) => (
              <div key={ts.source} className="flex items-center justify-between text-xs">
                <span className="text-stone-600 font-medium">{ts.source}</span>
                <span className="font-bold text-stone-900">{ts.sharePercent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Search Keywords */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <h2 className="text-sm font-bold text-stone-900 mb-4">Từ khóa tìm kiếm phổ biến</h2>
          {(!data?.topSearchKeywords || data.topSearchKeywords.length === 0) ? (
            <p className="text-xs text-stone-400 py-6 text-center">Chưa có lượt tìm kiếm nào được ghi nhận</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {data.topSearchKeywords.map((kw, idx) => (
                <div key={kw.keyword} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-stone-100 text-[10px] font-bold text-stone-500 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-stone-900">{kw.keyword}</span>
                  </div>
                  <span className="font-bold text-stone-700">{kw.count} lượt</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7. Modal for "View All" Leaderboards */}
      {viewAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">{viewAllModal.title}</h3>
              <button
                onClick={() => setViewAllModal(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-stone-100 flex-1">
              {viewAllModal.items.map((it) => (
                <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-stone-100 font-bold text-stone-600 flex items-center justify-center text-xs">
                      {it.rank}
                    </span>
                    <div>
                      <p className="font-semibold text-stone-900">{it.name}</p>
                      {"shopName" in it && (
                        <p className="text-[11px] text-stone-400">{(it as ProductLeaderboardItem).shopName}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-stone-800 text-sm">
                    {it.count.toLocaleString()}{" "}
                    {viewAllModal.type === "favorited" ? "tim" : "lượt"}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-stone-100 bg-stone-50 flex justify-end">
              <button
                onClick={() => setViewAllModal(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
