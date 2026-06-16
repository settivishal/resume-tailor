import type { ReactNode } from "react";
import { cn, color, radius, typography } from "@/lib/ui";

interface EmptyStateProps {
  title: string;
  description: string;
  /** Optional contextual glyph; falls back to a generic document icon. */
  icon?: ReactNode;
  /** Optional call-to-action rendered below the description. */
  action?: ReactNode;
}

const defaultIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-3 p-7 text-center">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center",
          radius.xl,
          "bg-accent-subtle/50 text-accent/80",
        )}
        aria-hidden
      >
        {icon ?? defaultIcon}
      </div>
      <div className="space-y-1.5">
        <p className={cn(typography.body, "font-semibold", color.inkBody)}>
          {title}
        </p>
        <p className={cn(typography.caption, "mx-auto max-w-xs leading-relaxed", color.inkSoft)}>
          {description}
        </p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
