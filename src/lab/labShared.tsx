/* The project ships no @types/react, so the React namespace has to be pulled
   in explicitly before React.ReactNode resolves — same reason BrandShapes.tsx
   does it, and the same reason `key` is declared as an ordinary prop below. */
import type React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
  /* Declared, not inherited: without @types/react there is no JSX.IntrinsicAttributes
     to carry `key`, so a mapped <LabFrame key=…> is a type error until the prop
     exists. Same reason the file header gives for importing the React namespace. */
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
