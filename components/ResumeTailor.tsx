"use client";

import { useCallback, useState } from "react";
import DiffViewer from "./DiffViewer";
import JobDescriptionPanel from "./JobDescriptionPanel";
import LatexEditor from "./LatexEditor";
import PdfPreviewPanel from "./PdfPreviewPanel";
import SuggestionsPanel from "./SuggestionsPanel";
import { SAMPLE_LATEX } from "@/lib/constants";
import { getErrorMessage, parseApiError } from "@/lib/errors";
import { applyPatch, toTextPatch } from "@/lib/patches";
import { useDebounce } from "@/lib/use-debounce";
import type { AnalyzeResponse, Patch } from "@/lib/types";

export default function ResumeTailor() {
  const [jobDescription, setJobDescription] = useState("");
  const [latexResume, setLatexResume] = useState(SAMPLE_LATEX);
  const debouncedLatex = useDebounce(latexResume, 500);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);

  const isBusy = loading || processing;

  const canGenerate =
    !isBusy &&
    jobDescription.trim().length > 0 &&
    latexResume.trim().length > 0;

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPatches([]);
    setMatchScore(null);
    setMissingKeywords([]);
    setPatchError(null);
    setSelectedPatchId(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, latexResume }),
      });

      if (!res.ok) {
        throw new Error(await parseApiError(res, "Failed to analyze resume"));
      }

      const data = await res.json();
      const result = data as AnalyzeResponse;

      if (!Array.isArray(result.patches)) {
        throw new Error("Invalid response from AI. Please try again.");
      }

      setPatches(result.patches);
      setMatchScore(result.matchScore);
      setMissingKeywords(result.missingKeywords ?? []);
      setSelectedPatchId(result.patches[0]?.id ?? null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to analyze resume"));
    } finally {
      setLoading(false);
    }
  }, [jobDescription, latexResume]);

  const handleAccept = (id: string) => {
    const patch = patches.find((p) => p.id === id);
    if (!patch || isBusy) return;

    setProcessing(true);
    setPatchError(null);

    try {
      const result = applyPatch(latexResume, toTextPatch(patch));
      if (!result.ok) {
        setPatchError(result.error);
        return;
      }

      setLatexResume(result.text);
      setPatches((prev) => {
        const next = prev.filter((p) => p.id !== id);
        setSelectedPatchId((current) =>
          current === id ? (next[0]?.id ?? null) : current,
        );
        return next;
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = (id: string) => {
    if (isBusy) return;

    setProcessing(true);
    setPatchError(null);

    setPatches((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setSelectedPatchId((current) =>
        current === id ? (next[0]?.id ?? null) : current,
      );
      return next;
    });

    setProcessing(false);
  };

  const selectedPatch =
    patches.find((p) => p.id === selectedPatchId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-zinc-100 dark:bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Resume Tailor AI
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tailor your LaTeX resume to a job description
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading && (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
          )}
          {loading ? "Analyzing…" : "Generate Suggestions"}
        </button>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <JobDescriptionPanel
          value={jobDescription}
          onChange={setJobDescription}
          disabled={isBusy}
        />

        <div className="grid min-h-0 grid-rows-[minmax(220px,2fr)_minmax(160px,1fr)_minmax(200px,1.5fr)] gap-3">
          <LatexEditor
            value={latexResume}
            onChange={setLatexResume}
            disabled={isBusy}
          />

          <div className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-2">
            <SuggestionsPanel
              patches={patches}
              matchScore={matchScore}
              missingKeywords={missingKeywords}
              loading={loading}
              error={error}
              patchError={patchError}
              selectedPatchId={selectedPatchId}
              processing={processing}
              onSelect={setSelectedPatchId}
              onAccept={handleAccept}
              onReject={handleReject}
              onDismissError={() => setError(null)}
              onDismissPatchError={() => setPatchError(null)}
              onRetry={handleGenerate}
            />
            <DiffViewer patch={selectedPatch} />
          </div>

          <PdfPreviewPanel latex={debouncedLatex} />
        </div>
      </main>
    </div>
  );
}
