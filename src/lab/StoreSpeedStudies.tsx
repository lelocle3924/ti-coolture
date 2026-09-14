import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDown } from "lucide-react";
import Header from "../components/Header";
import Homepage, { LANE_SPEEDS, LaneTuningOverride, type LaneTuning } from "../views/Homepage";
import { LabChoices, LabPanel } from "./labShared";

/* ═══════════════════════════════════════════════════════════════════════════
   WHAT'S IN STORE — the lanes 1.5× faster, slowing under the cursor (14/09)

   "lab: tăng tốc độ của carousel ở what's in store lên 1.5 lần. khi hover
    chuột lên 1 dòng thì sẽ chậm lại như tốc độ hiện tại"

   This page IS the homepage — the real view, header and data — with the two
   desktop lanes tuned through LaneTuningOverride, which is null on the site.
   The page opens on what the note asks for, both lanes at 1.5× and a hovered
   lane easing back to the old speed instead of stopping — which the team
   chose on 14/09, and which the site now runs as SITE_LANES. The old
   behaviour is one switch away, with 1.25× and 2× either side of the step.

   Only the lane under the cursor slows — the other keeps its pace, which is
   what "1 dòng" says. The change of speed is not a cut: useMarqueeTrack eases
   the lane's velocity towards its drift with a ~0.28s time constant, the same
   easing a flick coasts back into the drift with. Focus inside a lane still
   holds it still, so a keyboard user reading a tile does not have it slide
   away.

   Phones are not part of this. Below 768px the section is the rail that
   pages one product at a time, and it does not drift.
   ═══════════════════════════════════════════════════════════════════════════ */

const SPEEDS = [
  ["1", "1× · trước khi chốt"],
  ["1.25", "1.25×"],
  ["1.5", "1.5×"],
  ["2", "2×"],
] as const;
type Speed = (typeof SPEEDS)[number][0];

const HOVERS = [
  ["slow", "Chậm lại về 1×"],
  ["hold", "Dừng hẳn · trước khi chốt"],
] as const;
type Hover = (typeof HOVERS)[number][0];

/** What the page opens on: the note, exactly. */
const DEFAULTS: { speed: Speed; hover: Hover } = { speed: "1.5", hover: "slow" };

function pick<T extends string>(
  value: string | null,
  allowed: ReadonlyArray<readonly [T, string]>,
  fallback: T
): T {
  return allowed.some(([choice]) => choice === value) ? (value as T) : fallback;
}

function scrollToLanes() {
  const section = document.getElementById("dong-store");
  if (!section) return false;
  window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - 72 });
  return true;
}

export default function StoreSpeedStudies() {
  const [params, setParams] = useSearchParams();
  const speed = pick(params.get("speed"), SPEEDS, DEFAULTS.speed);
  const hover = pick(params.get("hover"), HOVERS, DEFAULTS.hover);
  const scale = Number(speed);

  const tuning = useMemo<LaneTuning>(() => ({ scale, hover, hoverScale: 1 }), [scale, hover]);

  const change = (next: { speed?: Speed; hover?: Hover }) =>
    setParams({ speed: next.speed ?? speed, hover: next.hover ?? hover }, { replace: true });

  /* Open on the lanes rather than on the hero. Tried until the section
     exists, since the homepage fetches before it draws it. */
  useEffect(() => {
    let tries = 0;
    let timer = 0;
    const go = () => {
      if (scrollToLanes() || tries++ > 50) return;
      timer = window.setTimeout(go, 120);
    };
    timer = window.setTimeout(go, 400);
    return () => window.clearTimeout(timer);
  }, []);

  const px = (base: number) => Math.round(base * scale);

  return (
    <LaneTuningOverride.Provider value={tuning}>
      {/* /lab carries no site chrome, so the study brings the real header. */}
      <Header />
      <Homepage />
      <LabPanel
        label="Lab · What's in store"
        actions={
          <button
            type="button"
            onClick={scrollToLanes}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-paper/85 transition-colors hover:bg-white/10"
          >
            Tới hai dòng
            <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        }
      >
        <LabChoices
          label="Tốc độ hai dòng"
          value={speed}
          choices={SPEEDS}
          onChange={(value) => change({ speed: value })}
        />
        <LabChoices
          label="Khi rê chuột lên một dòng"
          value={hover}
          choices={HOVERS}
          onChange={(value) => change({ hover: value })}
        />
        <p className="text-[11px] leading-relaxed text-white/55">
          Dòng trên {px(LANE_SPEEDS.top)} px/s, dòng dưới {px(LANE_SPEEDS.bottom)} px/s.{" "}
          {hover === "slow"
            ? `Dòng đang rê chuột chậm về ${LANE_SPEEDS.top} hoặc ${LANE_SPEEDS.bottom} px/s, dòng kia vẫn chạy.`
            : "Dòng đang rê chuột đứng yên."}{" "}
          Chỉ từ 768px trở lên — điện thoại dùng dải vuốt từng sản phẩm, không tự chạy.
        </p>
      </LabPanel>
    </LaneTuningOverride.Provider>
  );
}
