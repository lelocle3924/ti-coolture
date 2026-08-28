import { Link } from "react-router-dom";

/**
 * One breadcrumb, one style, every subpage.
 *
 * Team feedback (26/08): "Synchronize breadcrumbs style across subpages."
 * /products and /stores had each grown their own copy of the same markup and
 * /discover had none at all — it opened with a "Quay lại Bản đồ chính" link
 * instead, which is a back button wearing a breadcrumb's job.
 *
 * The trail is always read on paper, never on the violet: the crumb sits under
 * the wave seam, separate from it, which is the second half of the same note.
 */
export interface Crumb {
  label: string;
  /** Omit on the current page — the last crumb never links anyway. */
  to?: string;
}

export default function Breadcrumbs({
  trail,
  className = "",
}: {
  trail: Crumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium text-ink/55 ${className}`}
    >
      {trail.map((crumb, i) => {
        const last = i === trail.length - 1;
        return (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" className="text-ink/30">
                ›
              </span>
            )}
            {crumb.to && !last ? (
              <Link to={crumb.to} viewTransition className="transition-colors hover:text-brand">
                {crumb.label}
              </Link>
            ) : (
              <span
                aria-current={last ? "page" : undefined}
                className={last ? "font-semibold text-ink" : undefined}
              >
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
