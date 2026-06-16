"use client";

import { useEffect, useRef } from "react";
import { diffWords } from "diff";
import EmptyState from "./EmptyState";
import Panel from "./Panel";
import type { Patch } from "@/lib/types";

interface DiffViewerProps {
  patch: Patch | null;
}

function DiffSide({
  label,
  children,
  contentRef,
}: {
  label: string;
  children: React.ReactNode;
  contentRef?: React.RefObject<HTMLPreElement | null>;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-zinc-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
        {label}
      </div>
      <pre
        ref={contentRef}
        className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap wrap-break-word p-2 font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-300"
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
    <div className="flex h-full min-h-0 divide-x divide-zinc-200 dark:divide-zinc-800">
      <DiffSide label="Before" contentRef={beforeRef}>
        {before}
      </DiffSide>
      <DiffSide label="After" contentRef={afterRef}>
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
