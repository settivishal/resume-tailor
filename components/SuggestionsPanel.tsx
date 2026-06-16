"use client";

import EmptyState from "./EmptyState";
import ErrorBanner from "./ErrorBanner";
import Panel from "./Panel";
import SuggestionCard from "./SuggestionCard";
import SuggestionSkeleton from "./SuggestionSkeleton";
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
    <div className="animate-pulse border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <div className="h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-700" />
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
      <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Match score</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">
            {matchScore}%
          </span>
        </div>
        {missingKeywords.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              Missing keywords
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {missingKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
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
          <span className="text-[10px] text-zinc-400">Analyzing…</span>
        ) : patches.length > 0 ? (
          <span className="text-[10px] text-zinc-400">{patches.length} patches</span>
        ) : undefined
      }
      className="h-full"
    >
      <div className="flex h-full min-h-0 flex-col">
        {loading ? <SummarySkeleton /> : summary}
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {loading && (
            <div className="flex flex-col gap-2">
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
              description='Click "Generate Suggestions" to get AI-powered edits for your resume.'
            />
          )}
          {patchError && !loading && (
            <div className="mb-2">
              <ErrorBanner message={patchError} onDismiss={onDismissPatchError} />
            </div>
          )}
          {!loading && !error && patches.length > 0 && (
            <div className="flex flex-col gap-2">
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
