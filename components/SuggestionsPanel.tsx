"use client";

import EmptyState from "./EmptyState";
import ErrorBanner from "./ErrorBanner";
import Panel from "./Panel";
import SuggestionCard from "./SuggestionCard";
import SuggestionSkeleton from "./SuggestionSkeleton";
import { cn, color, glassInset, typography } from "@/lib/ui";
import type { Patch } from "@/lib/types";

interface SuggestionsPanelProps {
  patches: Patch[];
  matchScore: number | null;
  missingKeywords: string[];
  loading: boolean;
  error: string | null;
  patchError: string | null;
  selectedPatchId: string | null;
  processing: boolean;
  onSelect: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onDismissError: () => void;
  onDismissPatchError: () => void;
  onRetry: () => void;
}

function SummarySkeleton() {
  return (
    <div className={cn("animate-pulse border-b px-[var(--space-panel-x)] py-[var(--space-panel-y)]", color.glassBorder)}>
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-surface-subtle" />
        <div className="h-3 w-8 rounded bg-surface-subtle" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <div className="h-4 w-14 rounded bg-surface-subtle" />
        <div className="h-4 w-16 rounded bg-surface-subtle" />
        <div className="h-4 w-12 rounded bg-surface-subtle" />
      </div>
    </div>
  );
}

export default function SuggestionsPanel({
  patches,
  matchScore,
  missingKeywords,
  loading,
  error,
  patchError,
  selectedPatchId,
  processing,
  onSelect,
  onAccept,
  onReject,
  onDismissError,
  onDismissPatchError,
  onRetry,
}: SuggestionsPanelProps) {
  const summary =
    matchScore !== null ? (
      <div className={cn("border-b px-[var(--space-panel-x)] py-[var(--space-panel-y)]", color.glassBorder)}>
        <div className={cn("flex items-center justify-between", typography.caption)}>
          <span className={color.inkMuted}>Match score</span>
          <span className={cn("font-semibold", color.inkBody)}>{matchScore}%</span>
        </div>
        {missingKeywords.length > 0 && (
          <div className="mt-2">
            <p
              className={cn(
                typography.micro,
                "font-medium uppercase tracking-wide",
                color.inkFaint,
              )}
            >
              Missing keywords
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {missingKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className={cn(
                    "rounded px-1.5 py-0.5",
                    glassInset,
                    typography.micro,
                    color.inkSoft,
                  )}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : null;

  const cardsDisabled = loading || processing;

  return (
    <Panel
      title="Suggestions"
      action={
        loading ? (
          <span className={cn(typography.micro, color.inkFaint)}>Analyzing…</span>
        ) : patches.length > 0 ? (
          <span className={cn(typography.micro, color.inkFaint)}>
            {patches.length} patches
          </span>
        ) : undefined
      }
      className="h-full"
    >
      <div className="flex h-full min-h-0 flex-col">
        {loading ? <SummarySkeleton /> : summary}
        <div className="min-h-0 flex-1 overflow-auto p-[var(--space-content)]">
          {loading && (
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <SuggestionSkeleton key={i} />
              ))}
            </div>
          )}
          {!loading && error && (
            <ErrorBanner
              message={error}
              onRetry={onRetry}
              onDismiss={onDismissError}
            />
          )}
          {!loading && !error && patches.length === 0 && (
            <EmptyState
              title="No suggestions yet"
              description="Paste a job description and generate AI-powered edits tailored to your resume."
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
                  <path d="M12 8.5 13.2 11l2.8 1-2.8 1L12 15.5 10.8 13 8 12l2.8-1L12 8.5Z" />
                </svg>
              }
            />
          )}
          {patchError && !loading && (
            <div className="mb-2">
              <ErrorBanner message={patchError} onDismiss={onDismissPatchError} />
            </div>
          )}
          {!loading && !error && patches.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {patches.map((patch) => (
                <SuggestionCard
                  key={patch.id}
                  patch={patch}
                  selected={patch.id === selectedPatchId}
                  disabled={cardsDisabled}
                  onSelect={() => onSelect(patch.id)}
                  onAccept={() => onAccept(patch.id)}
                  onReject={() => onReject(patch.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
