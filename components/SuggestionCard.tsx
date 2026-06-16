"use client";

import { cn, color, elevation, focusRing, radius, typography } from "@/lib/ui";
import type { Impact, Patch } from "@/lib/types";

const impactStyles: Record<Impact, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  low: "bg-surface-subtle text-ink-soft",
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
        "border p-3.5 transition-all duration-150",
        radius.lg,
        focusRing,
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:shadow-card",
        selected
          ? cn("border-accent bg-accent-subtle ring-1 ring-accent", elevation.card)
          : cn(color.border, color.surface, "hover:border-line-strong"),
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
            "px-2.5 py-1 text-xs font-medium text-white transition-[background-color,transform] active:scale-95",
            radius.md,
            focusRing,
            "bg-emerald-600 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
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
            "border px-2.5 py-1 text-xs font-medium transition-[background-color,transform] active:scale-95",
            radius.md,
            focusRing,
            color.borderStrong,
            color.inkSoft,
            "hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
          )}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
