"use client";

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
    pending: "border-zinc-200 dark:border-zinc-700",
    accepted: "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
    rejected: "border-red-300 bg-red-50 opacity-60 dark:border-red-800 dark:bg-red-950/30",
  };

  return (
    <div className={`rounded-lg border p-4 ${statusStyles[status]}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Patch {patch.id}
          </p>
          <p className="mt-1 text-sm font-medium">{patch.reason}</p>
        </div>
        {status === "pending" && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onAccept}
              className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={onReject}
              className="rounded-md bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
            >
              Reject
            </button>
          </div>
        )}
        {status === "accepted" && (
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            Accepted
          </span>
        )}
        {status === "rejected" && (
          <span className="text-xs font-medium text-red-700 dark:text-red-400">
            Rejected
          </span>
        )}
      </div>

      <div className="space-y-2 font-mono text-xs">
        <div className="rounded bg-red-100 p-2 text-red-900 dark:bg-red-950/50 dark:text-red-200">
          <span className="select-none text-red-500">− </span>
          {patch.search}
        </div>
        <div className="rounded bg-green-100 p-2 text-green-900 dark:bg-green-950/50 dark:text-green-200">
          <span className="select-none text-green-500">+ </span>
          {patch.replace}
        </div>
      </div>
    </div>
  );
}
