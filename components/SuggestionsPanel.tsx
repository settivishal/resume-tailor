"use client";

import EmptyState from "./EmptyState";
import Panel from "./Panel";
import SuggestionCard from "./SuggestionCard";
import type { Patch } from "@/lib/types";

interface SuggestionsPanelProps {
  patches: Patch[];
  matchScore: number | null;
  missingKeywords: string[];
  loading: boolean;
  error: string | null;
  patchError: string | null;
  selectedPatchId: string | null;
  onSelect: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export default function SuggestionsPanel({
  patches,
  matchScore,
  missingKeywords,
  loading,
  error,
  patchError,
  selectedPatchId,
  onSelect,
  onAccept,
  onReject,
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

  return (
    <Panel
      title="Suggestions"
      action={
        patches.length > 0 ? (
          <span className="text-[10px] text-zinc-400">{patches.length} patches</span>
        ) : undefined
      }
      className="h-full"
    >
      <div className="flex h-full min-h-0 flex-col">
        {summary}
        <div className="min-h-0 flex-1 overflow-auto p-2">
        {loading && (
          <EmptyState
            title="Analyzing resume…"
            description="Generating tailored suggestions for your job description."
          />
        )}
        {!loading && error && (
          <EmptyState title="Analysis failed" description={error} />
        )}
        {!loading && !error && patches.length === 0 && (
          <EmptyState
            title="No suggestions yet"
            description='Click "Generate Suggestions" to get AI-powered edits for your resume.'
          />
        )}
        {patchError && (
          <p className="mb-2 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
            {patchError}
          </p>
        )}
        {!loading && !error && patches.length > 0 && (
          <div className="flex flex-col gap-2">
            {patches.map((patch) => (
              <SuggestionCard
                key={patch.id}
                patch={patch}
                selected={patch.id === selectedPatchId}
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
