"use client";

import { useMemo, useState } from "react";
import PatchDiff from "./PatchDiff";
import PdfPreview from "./PdfPreview";
import { applyPatch } from "@/lib/patches";
import type { Patch, PatchStatus } from "@/lib/types";

const SAMPLE_LATEX = String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[margin=0.75in]{geometry}
\usepackage{enumitem}
\pagestyle{empty}
\begin{document}
\begin{center}
{\LARGE Jane Doe}\\[4pt]
jane@email.com \textbar{} github.com/janedoe
\end{center}

\section*{Experience}
\textbf{Software Engineer} \hfill 2021 -- Present\\
Acme Corp
\begin{itemize}[leftmargin=*, nosep]
  \item Built REST APIs with Node.js and PostgreSQL
  \item Improved deployment pipeline with GitHub Actions
\end{itemize}

\section*{Skills}
JavaScript, TypeScript, React, Node.js, SQL
\end{document}`;

export default function ResumeTailor() {
  const [jobDescription, setJobDescription] = useState("");
  const [latexResume, setLatexResume] = useState(SAMPLE_LATEX);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [patchStatus, setPatchStatus] = useState<Record<string, PatchStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setPatches([]);
    setPatchStatus({});

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, latexResume }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate suggestions");

      setPatches(data.patches);
      setPatchStatus(
        Object.fromEntries(
          data.patches.map((p: Patch) => [p.id, "pending" as PatchStatus]),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (patch: Patch) => {
    try {
      setLatexResume((current) => applyPatch(current, patch));
      setPatchStatus((prev) => ({ ...prev, [patch.id]: "accepted" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply patch");
    }
  };

  const handleReject = (patchId: string) => {
    setPatchStatus((prev) => ({ ...prev, [patchId]: "rejected" }));
  };

  const pendingCount = useMemo(
    () => Object.values(patchStatus).filter((s) => s === "pending").length,
    [patchStatus],
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Resume Tailor AI</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Paste a job description and LaTeX resume, generate AI patches, accept
          changes, and preview the PDF live.
        </p>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Job Description</span>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              placeholder="Paste the job posting here…"
              className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">LaTeX Resume</span>
            <textarea
              value={latexResume}
              onChange={(e) => setLatexResume(e.target.value)}
              rows={14}
              spellCheck={false}
              className="w-full rounded-lg border border-zinc-200 bg-white p-3 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !jobDescription.trim() || !latexResume.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Generating…" : "Generate Suggestions"}
          </button>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {patches.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">
                  Suggested Patches ({patches.length})
                </h2>
                {pendingCount > 0 && (
                  <span className="text-xs text-zinc-500">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              {patches.map((patch) => (
                <PatchDiff
                  key={patch.id}
                  patch={patch}
                  status={patchStatus[patch.id] ?? "pending"}
                  onAccept={() => handleAccept(patch)}
                  onReject={() => handleReject(patch.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="min-h-[600px]">
          <PdfPreview latex={latexResume} />
        </div>
      </div>
    </div>
  );
}
