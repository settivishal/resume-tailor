"use client";

import { useState } from "react";
import DiffViewer from "./DiffViewer";
import JobDescriptionPanel from "./JobDescriptionPanel";
import LatexEditor from "./LatexEditor";
import PdfPreviewPanel from "./PdfPreviewPanel";
import SuggestionsPanel from "./SuggestionsPanel";
import { SAMPLE_LATEX } from "@/lib/constants";

export default function ResumeTailor() {
  const [jobDescription, setJobDescription] = useState("");
  const [latexResume, setLatexResume] = useState(SAMPLE_LATEX);

  const canGenerate =
    jobDescription.trim().length > 0 && latexResume.trim().length > 0;

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
          disabled={!canGenerate}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Generate Suggestions
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
            <SuggestionsPanel />
            <DiffViewer />
          </div>

          <PdfPreviewPanel />
        </div>
      </main>
    </div>
  );
}
