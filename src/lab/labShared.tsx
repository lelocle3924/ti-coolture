/* The project ships no @types/react, so the React namespace has to be pulled
   in explicitly before React.ReactNode resolves — same reason BrandShapes.tsx
   does it, and the same reason `key` is declared as an ordinary prop below. */
import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import { useMediaQuery } from "../lib/useAutoHideChrome";
import "./lab.css";

/**
 * Scaffolding for the studies. Exploration only — nothing in src/lab is
 * imported by src/views, and /lab is not linked from the site's nav.
 *
 * The lab was deleted on 26/08 once Direction C was folded into the homepage.
 * It is back because the 26/08 feedback asks for options rather than answers
 * in two places — two directions for Collections, three for the map — and
 * because motion proposals are worth looking at next to each other rather
 * than reading about.
 */

export function LabShell({
  eyebrow,
  title,
  children,
  notes,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  /** What the study is arguing, in the team's own terms. */
  notes?: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <div className="mx-auto max-w-[92rem] px-5 pb-6 pt-6 md:px-10">
        <Link
          to="/lab"
          className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-ink/50 transition-colors hover:text-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          LAB
        </Link>

        <p className="label mt-5 text-brand">{eyebrow}</p>
        <h1 className="display mt-1 text-[clamp(1.9rem,4.4vw,3.25rem)] normal-case leading-[1.25]">
          {title}
        </h1>
        {notes && (
          <div className="mt-4 max-w-[70ch] space-y-2 text-sm leading-relaxed text-ink/70">
            {notes}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

/** A labelled frame around a study, so two of them can be read side by side. */
export function LabFrame({
  label,
  meta,
  children,
}: {
  /* Declared, not inherited: without @types/react there is no
     JSX.IntrinsicAttributes to carry `key`, so a mapped <LabFrame key=…> is a
     type error until the prop exists. Same reason the file header gives for
     importing the React namespace. */
  key?: string;
  label: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink/10">
      <div className="mx-auto flex max-w-[92rem] flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 md:px-10">
        <span className="label text-ink/70">{label}</span>
        {meta && <span className="text-[11px] text-ink/45">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

/** Spec line for a motion proposal — the numbers, not the adjectives. */
export interface SpecProps {
  property: string;
  duration: string;
  easing: string;
  trigger: string;
}

export function Spec({ property, duration, easing, trigger }: SpecProps) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-4">
      {[
        ["Thuộc tính", property],
        ["Thời lượng", duration],
        ["Easing", easing],
        ["Kích hoạt", trigger],
      ].map(([k, v]) => (
        <div key={k}>
          <dt className="tracking-[0.12em] text-ink/40 uppercase">{k}</dt>
          <dd className="mt-0.5 font-medium text-ink/80">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ── switches on a real page ───────────────────────────────────────────────
   The panel a study floats over the real page it is changing, the way
   /lab/home-map does it — so every study that runs on a real page reads the
   same, and a new one does not grow its own copy. Folded on a phone, where
   an open panel would cover what it controls. */

export function LabPanel({
  label,
  actions,
  children,
}: {
  /** What the folded chip says, e.g. "Lab · tiêu đề". */
  label: string;
  /** Buttons beside the fold control. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const wide = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(true);
  useEffect(() => setOpen(wide), [wide]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[65] inline-flex items-center gap-2 rounded-full bg-ink/85 px-4 py-2.5 text-xs font-semibold text-paper shadow-[0_18px_40px_-18px_rgba(18,8,31,0.85)] ring-1 ring-white/10 backdrop-blur-md"
      >
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-wave" />
        {label}
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label={`Công tắc thử nghiệm · ${label}`}
      className="fixed bottom-4 left-4 z-[65] flex max-h-[calc(100dvh-2rem)] w-[min(22rem,calc(100vw-2rem))] flex-col rounded-[1.25rem] bg-ink/85 p-4 text-paper shadow-[0_24px_48px_-24px_rgba(18,8,31,0.9)] ring-1 ring-white/10 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/lab"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-white/55 transition-colors hover:text-wave"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          LAB
        </Link>
        <span className="flex items-center gap-1">
          {actions}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Thu gọn bảng công tắc"
            className="grid h-8 w-8 place-items-center rounded-full text-paper/70 transition-colors hover:bg-white/10"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </span>
      </div>
      <div className="mt-3 min-h-0 space-y-3 overflow-y-auto overscroll-contain">{children}</div>
    </div>
  );
}

/** One group of switches in a LabPanel. */
export function LabChoices<T extends string>({
  label,
  value,
  choices,
  onChange,
  disabled = false,
  columns = false,
}: {
  label: string;
  value: T;
  choices: ReadonlyArray<readonly [T, string]>;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Two columns of buttons, for a list too long for a row of chips. */
  columns?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className={disabled ? "opacity-40" : ""}>
      <legend className="text-[11px] tracking-[0.12em] text-white/55">{label}</legend>
      <div className={`mt-1.5 ${columns ? "grid grid-cols-2 gap-1.5" : "flex flex-wrap gap-1.5"}`}>
        {choices.map(([choice, text]) => {
          const on = choice === value;
          return (
            <button
              key={choice}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(choice)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                columns ? "text-left" : ""
              } ${on ? "bg-wave text-ink" : "bg-white/10 text-paper/85 hover:bg-white/20"}`}
            >
              {text}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
