"use client";

import { cn, button, color, focusRing, glassInset, impact, radius, transitionPolish, typography } from "@/lib/ui";
import type { Impact, Patch } from "@/lib/types";

const impactStyles: Record<Impact, string> = {
  high: impact.high,
  medium: impact.medium,
  low: impact.low,
};

interface SuggestionCardProps {
  patch: Patch;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export default function SuggestionCard({
  patch,
  selected,
  disabled = false,
  onSelect,
  onAccept,
  onReject,
}: SuggestionCardProps) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "p-3.5",
        transitionPolish,
        radius.lg,
        focusRing,
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
        selected
          ? "border border-accent/45 bg-accent-subtle/40 shadow-hover-glow"
          : glassInset,
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <p className={cn(typography.bodySnug, color.inkBody)}>{patch.reason}</p>
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 font-semibold uppercase tracking-wide",
            radius.full,
            typography.micro,
            impactStyles[patch.impact],
          )}
        >
          {patch.impact}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onAccept();
          }}
          className={cn(
            "px-2.5 py-1 text-xs font-medium",
            radius.md,
            focusRing,
            button.primary,
          )}
        >
          Accept
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onReject();
          }}
          className={cn(
            "px-2.5 py-1 text-xs font-medium",
            radius.md,
            focusRing,
            button.secondaryOutline,
          )}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
