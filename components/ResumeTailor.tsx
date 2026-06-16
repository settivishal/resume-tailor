"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import DiffViewer from "./DiffViewer";
import JobDescriptionPanel from "./JobDescriptionPanel";
import LatexEditor from "./LatexEditor";
import PdfPreviewPanel from "./PdfPreviewPanel";
import SuggestionsPanel from "./SuggestionsPanel";
import Toaster from "./Toaster";
import { SAMPLE_LATEX } from "@/lib/constants";
import { getErrorMessage, parseApiError } from "@/lib/errors";
import { applyPatch, toTextPatch } from "@/lib/patches";
import { toast } from "@/lib/toast";
import { useDebounce } from "@/lib/use-debounce";
import { cn, color, elevation, focusRing, glassChrome, radius, typography } from "@/lib/ui";
import type { AnalyzeResponse, Patch } from "@/lib/types";

type ModuleKey = "job" | "latex" | "suggestions" | "diff" | "preview";

const DEFAULT_SLOTS: ModuleKey[] = ["job", "latex", "suggestions", "diff", "preview"];
const SLOT_AREAS = ["slotA", "slotB", "slotC", "slotD", "slotE"] as const;

const moduleLabels: Record<ModuleKey, string> = {
  job: "Job Description",
  latex: "LaTeX Resume",
  suggestions: "Suggestions",
  diff: "Diff Viewer",
  preview: "PDF Preview",
};

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
  const [draggingModule, setDraggingModule] = useState<ModuleKey | null>(null);
  const [maximizedModule, setMaximizedModule] = useState<ModuleKey | null>(null);
  const [leftPx, setLeftPx] = useState(DEFAULT_LEFT_PX);
  const [rightPx, setRightPx] = useState(DEFAULT_RIGHT_PX);
  const resizingRef = useRef<
    null | { kind: "left" | "right"; startX: number; start: number; moved?: boolean }
  >(null);
  const didRestoreRef = useRef(false);

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
    if (didRestoreRef.current) return; // run once (StrictMode double-invokes)
    didRestoreRef.current = true;
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<LayoutState>;
      let restored = false;
      if (Array.isArray(parsed.slots) && parsed.slots.length === DEFAULT_SLOTS.length) {
        const normalized = parsed.slots.filter((x): x is ModuleKey =>
          DEFAULT_SLOTS.includes(x as ModuleKey),
        );
        if (normalized.length === DEFAULT_SLOTS.length) {
          setSlots(normalized);
          restored = true;
        }
      }
      if (typeof parsed.leftPx === "number" && Number.isFinite(parsed.leftPx)) {
        setLeftPx(parsed.leftPx);
        restored = true;
      }
      if (typeof parsed.rightPx === "number" && Number.isFinite(parsed.rightPx)) {
        setRightPx(parsed.rightPx);
        restored = true;
      }
      if (restored) toast("Layout restored", { tone: "info" });
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
      if (Math.abs(dx) > 1) active.moved = true;
      if (active.kind === "left") {
        setLeftPx(Math.max(MIN_LEFT_PX, active.start + dx));
      } else {
        setRightPx(Math.max(MIN_RIGHT_PX, active.start - dx));
      }
    };
    const onUp = () => {
      const moved = resizingRef.current?.moved ?? false;
      resizingRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (moved) toast("Layout saved", { tone: "success" });
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
    let didSwap = false;
    setSlots((prev) => {
      const next = [...prev];
      const fromIndex = next.indexOf(from);
      const toIndex = next.indexOf(to);
      if (fromIndex === -1 || toIndex === -1) return prev;
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      didSwap = true;
      return next;
    });
    if (didSwap) toast("Layout saved", { tone: "success" });
  };

  const toggleMaximize = useCallback(
    (module: ModuleKey) => {
      // Compute next + toast in the event handler (not inside the state
      // updater, which StrictMode double-invokes) so feedback fires once.
      const next = maximizedModule === module ? null : module;
      setMaximizedModule(next);
      toast(next ? `Maximized ${moduleLabels[next]}` : "Restored layout", {
        tone: "info",
      });
    },
    [maximizedModule],
  );

  // Allow Escape to exit a maximized module.
  useEffect(() => {
    if (!maximizedModule) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMaximizedModule(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maximizedModule]);

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

  const desktopGridTemplateColumns = useMemo(() => {
    // Center column stays flexible; preview column is explicitly sizable.
    return `${leftPx}px minmax(340px, 1fr) ${rightPx}px`;
  }, [leftPx, rightPx]);

  return (
    <div className={cn("flex h-screen flex-col", color.canvas)}>
      <header
        className={cn(
          "sticky top-0 z-20 flex shrink-0 items-center justify-between gap-4 border-b px-5 py-3",
          glassChrome,
          color.border,
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center text-sm font-semibold text-white",
              "bg-linear-to-br from-indigo-500 to-violet-600 shadow-sm ring-1 ring-inset ring-white/15",
              radius.lg,
            )}
            aria-hidden
          >
            RT
          </div>
          <div className="leading-tight">
            <h1 className={cn(typography.h1, color.inkStrong)}>Resume Tailor AI</h1>
            <p className={cn(typography.caption, color.inkMuted)}>
              Tailor your LaTeX resume to a job description
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium ring-1 ring-inset ring-white/10 transition-all hover:-translate-y-px hover:shadow-pop active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:ring-0 disabled:hover:translate-y-0",
            radius.lg,
            color.primary,
            elevation.card,
            focusRing,
          )}
        >
          {loading && (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          )}
          {loading ? "Analyzing…" : "Generate Suggestions"}
        </button>
      </header>

      <main className="min-h-0 flex-1 p-5">
        <div
          className="relative hidden h-full min-h-0 gap-4 lg:grid"
          style={{
            gridTemplateColumns: desktopGridTemplateColumns,
            gridTemplateRows: "minmax(180px, 1fr) minmax(180px, 1fr) minmax(180px, 1fr)",
            gridTemplateAreas: `"slotA slotB slotE" "slotA slotC slotE" "slotA slotD slotE"`,
          }}
        >
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
          {/* Rendered in a FIXED DOM order; only the CSS grid-area changes on
              reorder, so stateful children (Monaco, PDF iframe) are never moved
              or remounted in the DOM. */}
          {DEFAULT_SLOTS.map((module) => (
            <ModuleContainer
              key={module}
              label={moduleLabels[module]}
              module={module}
              area={SLOT_AREAS[slots.indexOf(module)]}
              isDragActive={draggingModule !== null}
              isDragging={draggingModule === module}
              isMaximized={maximizedModule === module}
              anyMaximized={maximizedModule !== null}
              onToggleMaximize={() => toggleMaximize(module)}
              onDragStart={() => setDraggingModule(module)}
              onDragEnd={() => setDraggingModule(null)}
              onDropModule={swapModules}
            >
              {renderModule(module)}
            </ModuleContainer>
          ))}
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
          {DEFAULT_SLOTS.map((module) => (
            <div
              key={module}
              className="min-h-[240px]"
              style={{ order: slots.indexOf(module) }}
            >
              {renderModule(module)}
            </div>
          ))}
        </div>
      </main>

      <Toaster />
    </div>
  );
}

function ModuleContainer({
  module,
  area,
  label,
  isDragActive,
  isDragging,
  isMaximized,
  anyMaximized,
  onToggleMaximize,
  onDragStart,
  onDragEnd,
  onDropModule,
  children,
}: {
  module: ModuleKey;
  area: string;
  label: string;
  isDragActive: boolean;
  isDragging: boolean;
  isMaximized: boolean;
  anyMaximized: boolean;
  onToggleMaximize: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropModule: (from: ModuleKey, to: ModuleKey) => void;
  children: React.ReactNode;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData("text/module", module);
    event.dataTransfer.effectAllowed = "move";
    setDragImage(event, label);
    onDragStart();
  };

  const handleDragEnd = () => {
    setDragOver(false);
    onDragEnd();
  };

  // A drop onto the module currently being dragged is a no-op; don't light up.
  const isDropTarget = dragOver && !isDragging;

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const dragged = event.dataTransfer.getData("text/module") as ModuleKey;
    if (dragged) onDropModule(dragged, module);
  };

  return (
    <div
      style={isMaximized ? undefined : { gridArea: area }}
      className={cn(
        "group/module min-h-0 transition-[opacity,transform,box-shadow] duration-200 ease-in-out",
        radius.xl,
        // Maximized: lift out of the grid to cover the whole dashboard.
        isMaximized
          ? "absolute inset-0 z-40 animate-panel-zoom-in"
          : "relative",
        // Gentle elevation on hover — no motion, no ring; just soft depth.
        !isDragActive && !anyMaximized && "hover:shadow-pop",
        // Drop target gets a clear accent ring.
        isDropTarget && "ring-2 ring-accent ring-offset-2 ring-offset-canvas",
        // Source module fades to a ghost while it is being dragged.
        isDragging && "scale-[0.99] opacity-40",
      )}
    >
      <div
        className={cn(
          "absolute right-1.5 top-1.5 z-30 flex items-center gap-0.5 transition-opacity duration-150",
          isMaximized
            ? "opacity-100"
            : "opacity-0 group-hover/module:opacity-100 focus-within:opacity-100",
        )}
      >
        <button
          type="button"
          onClick={onToggleMaximize}
          title={isMaximized ? "Restore layout" : `Maximize ${label}`}
          aria-label={isMaximized ? "Restore layout" : `Maximize ${label}`}
          className={cn(
            "flex items-center justify-center bg-surface/70 p-1.5 backdrop-blur transition-colors active:scale-90",
            radius.md,
            color.inkFaint,
            "hover:bg-surface-subtle hover:text-ink-soft",
            focusRing,
          )}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 1v2.5a.5.5 0 0 0 .5.5H10M5 11V8.5a.5.5 0 0 0-.5-.5H2" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 1H1.5a.5.5 0 0 0-.5.5V4M8 1h2.5a.5.5 0 0 1 .5.5V4M4 11H1.5a.5.5 0 0 1-.5-.5V8M8 11h2.5a.5.5 0 0 0 .5-.5V8" />
            </svg>
          )}
        </button>
        {!isMaximized && (
          <button
            type="button"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            title={`Drag to move ${label}`}
            aria-label={`Drag to move ${label}`}
            className={cn(
              "flex cursor-grab items-center justify-center bg-surface/70 p-1.5 backdrop-blur transition-colors active:cursor-grabbing",
              radius.md,
              color.inkFaint,
              "hover:bg-surface-subtle hover:text-ink-soft",
              focusRing,
            )}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
              <circle cx="3.5" cy="2.5" r="1" />
              <circle cx="8.5" cy="2.5" r="1" />
              <circle cx="3.5" cy="6" r="1" />
              <circle cx="8.5" cy="6" r="1" />
              <circle cx="3.5" cy="9.5" r="1" />
              <circle cx="8.5" cy="9.5" r="1" />
            </svg>
          </button>
        )}
      </div>

      {/* While any module is being dragged, this overlay sits above the panel
          content (Monaco / PDF iframe / textarea) so drops always register. */}
      {isDragActive && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center transition-colors",
            radius.xl,
            isDropTarget && "bg-accent-subtle/60",
            isDragging && "border-2 border-dashed border-accent/50",
          )}
        >
          {isDropTarget && (
            <span
              className={cn(
                "border px-2.5 py-1 font-medium shadow-pop backdrop-blur",
                radius.full,
                typography.caption,
                "border-accent text-accent",
                color.surface,
              )}
            >
              Drop to swap
            </span>
          )}
        </div>
      )}

      <div className="h-full min-h-0">{children}</div>
    </div>
  );
}

/**
 * Build a clean "ghost" drag preview (a labeled pill) instead of the browser's
 * default snapshot of the tiny drag handle. Detached node is removed on the
 * next tick once the browser has captured the image.
 */
function setDragImage(event: DragEvent<HTMLButtonElement>, label: string) {
  if (typeof document === "undefined") return;
  const ghost = document.createElement("div");
  ghost.textContent = label;
  Object.assign(ghost.style, {
    position: "fixed",
    top: "-1000px",
    left: "-1000px",
    padding: "8px 14px",
    borderRadius: "10px",
    font: "600 13px/1 var(--font-geist-sans), system-ui, sans-serif",
    color: "var(--ink)",
    background: "var(--surface)",
    border: "1px solid var(--line-strong)",
    boxShadow: "var(--elevation-pop)",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(ghost);
  event.dataTransfer.setDragImage(ghost, 16, 16);
  window.setTimeout(() => ghost.remove(), 0);
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
      className={cn("group/resizer z-10 flex h-full w-4 items-center justify-center", className)}
    >
      {/* Invisible until hovered — the card edges already separate modules, so
          the resize affordance only appears when you reach for it. */}
      <div className="h-full w-1 rounded-full bg-transparent transition-colors duration-150 group-hover/resizer:bg-accent/70 group-active/resizer:bg-accent" />
    </div>
  );
}
