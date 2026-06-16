"use client";

import { useState } from "react";
import DiffViewer from "./DiffViewer";
import JobDescriptionPanel from "./JobDescriptionPanel";
import LatexEditor from "./LatexEditor";
import PdfPreviewPanel from "./PdfPreviewPanel";
import SuggestionsPanel from "./SuggestionsPanel";
import { SAMPLE_LATEX } from "@/lib/constants";
import { applyPatch, toTextPatch } from "@/lib/patches";
import type { AnalyzeResponse, Patch } from "@/lib/types";

export default function ResumeTailor() {
  const [jobDescription, setJobDescription] = useState("");
  const [latexResume, setLatexResume] = useState(SAMPLE_LATEX);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);

  const canGenerate =
    !loading &&
    jobDescription.trim().length > 0 &&
    latexResume.trim().length > 0;

  const handleGenerate = async () => {
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to analyze resume");
      }

      const result = data as AnalyzeResponse;
      setPatches(result.patches);
      setMatchScore(result.matchScore);
      setMissingKeywords(result.missingKeywords ?? []);
      setSelectedPatchId(result.patches[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (id: string) => {
    const patch = patches.find((p) => p.id === id);
    if (!patch) return;

    const result = applyPatch(latexResume, toTextPatch(patch));
    if (!result.ok) {
      setPatchError(result.error);
      return;
    }

    setPatchError(null);
    setLatexResume(result.text);
    setPatches((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setSelectedPatchId((current) =>
        current === id ? (next[0]?.id ?? null) : current,
      );
      return next;
    });
  };

  const handleReject = (id: string) => {
    setPatchError(null);
    setPatches((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setSelectedPatchId((current) =>
        current === id ? (next[0]?.id ?? null) : current,
      );
      return next;
    });
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
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Generating…" : "Generate Suggestions"}
        </button>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <JobDescriptionPanel
          value={jobDescription}
          onChange={setJobDescription}
        />

        <div className="grid min-h-0 grid-rows-[minmax(220px,2fr)_minmax(160px,1fr)_minmax(200px,1.5fr)] gap-3">
          <LatexEditor value={latexResume} onChange={setLatexResume} />

          <div className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-2">
            <SuggestionsPanel
              patches={patches}
              matchScore={matchScore}
              missingKeywords={missingKeywords}
              loading={loading}
              error={error}
              patchError={patchError}
              selectedPatchId={selectedPatchId}
              onSelect={setSelectedPatchId}
              onAccept={handleAccept}
              onReject={handleReject}
            />
            <DiffViewer patch={selectedPatch} />
          </div>

          <PdfPreviewPanel latex={latexResume} />
        </div>
      </main>
    </div>
  );
}
