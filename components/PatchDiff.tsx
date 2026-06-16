"use client";

import { cn, button, color, diff, focusRing, glassInset, radius, typography } from "@/lib/ui";
import type { Patch, PatchStatus } from "@/lib/types";

interface PatchDiffProps {
  patch: Patch;
  status: PatchStatus;
  onAccept: () => void;
  onReject: () => void;
}

export default function PatchDiff({
  patch,
  status,
  onAccept,
  onReject,
}: PatchDiffProps) {
  const statusStyles: Record<PatchStatus, string> = {
    pending: cn(glassInset, color.glassBorder, "border"),
    accepted: cn("border border-primary/35 bg-accent-subtle/50"),
    rejected: cn("border border-destructive/30 bg-destructive-subtle opacity-70"),
  };

  return (
    <div className={cn("p-4", radius.lg, statusStyles[status])}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className={cn(typography.micro, "font-medium uppercase tracking-wide", color.inkMuted)}>
            Patch {patch.id}
          </p>
          <p className={cn("mt-1", typography.body, "font-medium", color.inkBody)}>
            {patch.reason}
          </p>
        </div>
        {status === "pending" && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onAccept}
              className={cn("px-3 py-1 text-xs font-medium", radius.md, focusRing, button.primary)}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={onReject}
              className={cn("px-3 py-1 text-xs font-medium", radius.md, focusRing, button.secondaryOutline)}
            >
              Reject
            </button>
          </div>
        )}
        {status === "accepted" && (
          <span className={cn(typography.caption, "font-medium text-primary")}>Accepted</span>
        )}
        {status === "rejected" && (
          <span className={cn(typography.caption, "font-medium", color.destructiveText)}>
            Rejected
          </span>
        )}
      </div>

      <div className={cn("space-y-2", typography.mono)}>
        <div className={cn("rounded p-2", diff.removeMark)}>
          <span className={cn("select-none", color.destructiveText)}>− </span>
          {patch.search}
        </div>
        <div className={cn("rounded p-2", diff.addMark)}>
          <span className="select-none text-primary">+ </span>
          {patch.replace}
        </div>
      </div>
    </div>
  );
}
