"use client";

import { useEffect, useRef } from "react";
import { diffWords } from "diff";
import EmptyState from "./EmptyState";
import Panel from "./Panel";
import { cn, color, typography } from "@/lib/ui";
import type { Patch } from "@/lib/types";

interface DiffViewerProps {
  patch: Patch | null;
}

function DiffSide({
  label,
  tone,
  children,
  contentRef,
}: {
  label: string;
  tone: "before" | "after";
  children: React.ReactNode;
  contentRef?: React.RefObject<HTMLPreElement | null>;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5 border-b px-3 py-1.5",
          typography.micro,
          "font-semibold uppercase tracking-wide",
          color.border,
          color.inkMuted,
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "before" ? "bg-red-400" : "bg-emerald-400",
          )}
          aria-hidden
        />
        {label}
      </div>
      <pre
        ref={contentRef}
        className={cn(
          "min-h-0 flex-1 overflow-auto whitespace-pre-wrap wrap-break-word p-3",
          typography.mono,
          color.inkSoft,
        )}
      >
        {children}
      </pre>
    </div>
  );
}

function PatchDiffContent({ patch }: { patch: Patch }) {
  const beforeRef = useRef<HTMLPreElement>(null);
  const afterRef = useRef<HTMLPreElement>(null);
  const changes = diffWords(patch.search, patch.replace);

  const before = changes.map((part, i) => {
    if (part.added) return null;
    if (part.removed) {
      return (
        <mark
          key={i}
          data-diff-change=""
          className="rounded-sm bg-red-200 text-red-950 dark:bg-red-900/60 dark:text-red-100"
        >
          {part.value}
        </mark>
      );
    }
    return <span key={i}>{part.value}</span>;
  });

  const after = changes.map((part, i) => {
    if (part.removed) return null;
    if (part.added) {
      return (
        <mark
          key={i}
          data-diff-change=""
          className="rounded-sm bg-green-200 text-green-950 dark:bg-green-900/60 dark:text-green-100"
        >
          {part.value}
        </mark>
      );
    }
    return <span key={i}>{part.value}</span>;
  });

  useEffect(() => {
    const scrollToChange = (container: HTMLPreElement | null) => {
      const firstChange = container?.querySelector("[data-diff-change]");
      firstChange?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    scrollToChange(beforeRef.current);
    scrollToChange(afterRef.current);
  }, [patch.id]);

  return (
    <div className="flex h-full min-h-0 divide-x divide-line">
      <DiffSide label="Before" tone="before" contentRef={beforeRef}>
        {before}
      </DiffSide>
      <DiffSide label="After" tone="after" contentRef={afterRef}>
        {after}
      </DiffSide>
    </div>
  );
}

export default function DiffViewer({ patch }: DiffViewerProps) {
  return (
    <Panel title="Diff Viewer" className="h-full">
      {patch ? (
        <PatchDiffContent key={patch.id} patch={patch} />
      ) : (
        <EmptyState
          title="No patch selected"
          description="Select a suggestion to preview its changes before accepting or rejecting."
        />
      )}
    </Panel>
  );
}
