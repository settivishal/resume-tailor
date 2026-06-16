"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
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

type ModuleKey = "job" | "latex" | "suggestions" | "diff" | "preview";

const DEFAULT_SLOTS: ModuleKey[] = ["job", "latex", "suggestions", "diff", "preview"];
const SLOT_AREAS = ["slotA", "slotB", "slotC", "slotD", "slotE"] as const;

type LayoutState = {
  slots: ModuleKey[];
  leftPx: number;
  rightPx: number;
};

const LAYOUT_STORAGE_KEY = "resumeTailor.layout.v1";
const DEFAULT_LEFT_PX = 300;
const DEFAULT_RIGHT_PX = 620;
const MIN_LEFT_PX = 260;
const MIN_RIGHT_PX = 420;

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
  const [slots, setSlots] = useState<ModuleKey[]>(DEFAULT_SLOTS);
  const [leftPx, setLeftPx] = useState(DEFAULT_LEFT_PX);
  const [rightPx, setRightPx] = useState(DEFAULT_RIGHT_PX);
  const resizingRef = useRef<null | { kind: "left" | "right"; startX: number; start: number }>(
    null,
  );

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

  // Restore persisted layout
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<LayoutState>;
      if (Array.isArray(parsed.slots) && parsed.slots.length === DEFAULT_SLOTS.length) {
        const normalized = parsed.slots.filter((x): x is ModuleKey =>
          DEFAULT_SLOTS.includes(x as ModuleKey),
        );
        if (normalized.length === DEFAULT_SLOTS.length) setSlots(normalized);
      }
      if (typeof parsed.leftPx === "number" && Number.isFinite(parsed.leftPx)) {
        setLeftPx(parsed.leftPx);
      }
      if (typeof parsed.rightPx === "number" && Number.isFinite(parsed.rightPx)) {
        setRightPx(parsed.rightPx);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist layout
  useEffect(() => {
    const state: LayoutState = { slots, leftPx, rightPx };
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [slots, leftPx, rightPx]);

  // Global mouse listeners for resizing columns
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const active = resizingRef.current;
      if (!active) return;
      const dx = e.clientX - active.startX;
      if (active.kind === "left") {
        setLeftPx(Math.max(MIN_LEFT_PX, active.start + dx));
      } else {
        setRightPx(Math.max(MIN_RIGHT_PX, active.start - dx));
      }
    };
    const onUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const swapModules = (from: ModuleKey, to: ModuleKey) => {
    if (from === to) return;
    setSlots((prev) => {
      const next = [...prev];
      const fromIndex = next.indexOf(from);
      const toIndex = next.indexOf(to);
      if (fromIndex === -1 || toIndex === -1) return prev;
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });
  };

  const renderModule = (module: ModuleKey) => {
    switch (module) {
      case "job":
        return (
          <JobDescriptionPanel
            value={jobDescription}
            onChange={setJobDescription}
            disabled={isBusy}
          />
        );
      case "latex":
        return (
          <LatexEditor
            value={latexResume}
            onChange={setLatexResume}
            disabled={isBusy}
          />
        );
      case "suggestions":
        return (
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
        );
      case "diff":
        return <DiffViewer patch={selectedPatch} />;
      case "preview":
        return <PdfPreviewPanel latex={debouncedLatex} />;
    }
  };

  const moduleLabels: Record<ModuleKey, string> = {
    job: "Job Description",
    latex: "LaTeX Resume",
    suggestions: "Suggestions",
    diff: "Diff Viewer",
    preview: "PDF Preview",
  };

  const desktopGridTemplateColumns = useMemo(() => {
    // Center column stays flexible; preview column is explicitly sizable.
    return `${leftPx}px minmax(340px, 1fr) ${rightPx}px`;
  }, [leftPx, rightPx]);

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

      <main className="min-h-0 flex-1 p-3">
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Drag panels by handle to rearrange. Drag dividers to resize columns.
        </p>

        <div
          className="hidden h-full min-h-0 gap-3 lg:grid"
          style={{
            gridTemplateColumns: desktopGridTemplateColumns,
            gridTemplateRows: "minmax(180px, 1fr) minmax(180px, 1fr) minmax(180px, 1fr)",
            gridTemplateAreas: `"slotA slotB slotE" "slotA slotC slotE" "slotA slotD slotE"`,
          }}
        >
          <VerticalResizer
            title="Resize left column"
            style={{ gridArea: "slotA / slotA / slotD / slotA" }}
            className="pointer-events-none"
          />
          <VerticalResizer
            title="Resize between left and center"
            onMouseDown={(e) => {
              resizingRef.current = { kind: "left", startX: e.clientX, start: leftPx };
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            className="col-resize cursor-col-resize"
            // place it visually between col 1 and 2
            style={{ gridColumn: 2, gridRow: "1 / span 3", justifySelf: "start", marginLeft: -8 }}
          />
          <VerticalResizer
            title="Resize preview column"
            onMouseDown={(e) => {
              resizingRef.current = { kind: "right", startX: e.clientX, start: rightPx };
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            className="col-resize cursor-col-resize"
            // place it visually between col 2 and 3
            style={{ gridColumn: 3, gridRow: "1 / span 3", justifySelf: "start", marginLeft: -8 }}
          />
          {slots.map((module, index) => (
            <ModuleContainer
              key={`${SLOT_AREAS[index]}-${module}`}
              label={moduleLabels[module]}
              module={module}
              area={SLOT_AREAS[index]}
              onDropModule={swapModules}
            >
              {renderModule(module)}
            </ModuleContainer>
          ))}
        </div>

        <div className="grid h-full min-h-0 grid-cols-1 gap-3 lg:hidden">
          {slots.map((module) => (
            <div key={module} className="min-h-[220px]">
              {renderModule(module)}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function ModuleContainer({
  module,
  area,
  label,
  onDropModule,
  children,
}: {
  module: ModuleKey;
  area: string;
  label: string;
  onDropModule: (from: ModuleKey, to: ModuleKey) => void;
  children: React.ReactNode;
}) {
  const [dragOver, setDragOver] = useState(false);

  const onDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData("text/module", module);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const dragged = event.dataTransfer.getData("text/module") as ModuleKey;
    if (dragged) onDropModule(dragged, module);
  };

  return (
    <div
      style={{ gridArea: area }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`min-h-0 ${dragOver ? "rounded-lg ring-2 ring-blue-400/60" : ""}`}
    >
      <div className="mb-1 flex items-center justify-end">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          className="cursor-grab rounded-md border border-zinc-300 px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-200 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          title={`Drag to move ${label}`}
        >
          Drag {label}
        </button>
      </div>
      <div className="h-[calc(100%-1.5rem)] min-h-0">{children}</div>
    </div>
  );
}

function VerticalResizer({
  title,
  onMouseDown,
  className = "",
  style,
}: {
  title: string;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      title={title}
      onMouseDown={onMouseDown}
      style={style}
      className={`z-10 h-full w-4 ${className}`}
    >
      <div className="mx-auto h-full w-0.5 rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
