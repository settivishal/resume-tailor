"use client";

import type { Impact, Patch, PatchStatus } from "@/lib/types";

const impactStyles: Record<Impact, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

const statusStyles: Record<PatchStatus, string> = {
  pending: "border-zinc-200 dark:border-zinc-700",
  accepted: "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20",
  rejected: "border-red-200 opacity-60 dark:border-red-900",
};

interface SuggestionCardProps {
  patch: Patch;
  status: PatchStatus;
  onAccept: () => void;
  onReject: () => void;
}

export default function SuggestionCard({
  patch,
  status,
  onAccept,
  onReject,
}: SuggestionCardProps) {
  return (
    <div className={`rounded-lg border p-3 ${statusStyles[status]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-snug text-zinc-800 dark:text-zinc-100">
          {patch.reason}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${impactStyles[patch.impact]}`}
        >
          {patch.impact}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {status === "pending" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAccept}
              className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={onReject}
              className="rounded-md bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
            >
              Reject
            </button>
          </div>
        ) : (
          <span
            className={`text-xs font-medium ${
              status === "accepted"
                ? "text-green-700 dark:text-green-400"
                : "text-red-700 dark:text-red-400"
            }`}
          >
            {status === "accepted" ? "Accepted" : "Rejected"}
          </span>
        )}
      </div>
    </div>
  );
}
