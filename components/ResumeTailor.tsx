"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import DiffViewer from "./DiffViewer";
import JobDescriptionPanel from "./JobDescriptionPanel";
import LatexEditor from "./LatexEditor";
import PdfPreviewPanel from "./PdfPreviewPanel";
import SuggestionsPanel from "./SuggestionsPanel";
import ModuleDock from "./ModuleDock";
import { ModuleChromeProvider } from "./ModuleChromeContext";
import Toaster from "./Toaster";
import ThemeToggle from "./ThemeToggle";
import WindowControls from "./WindowControls";
import { SAMPLE_LATEX } from "@/lib/constants";
import { getErrorMessage, parseApiError } from "@/lib/errors";
import { applyPatch, toTextPatch } from "@/lib/patches";
import { toast } from "@/lib/toast";
import { useDebounce } from "@/lib/use-debounce";
import { cn, brand, button, color, focusRing, glassChrome, glassModule, layer, radius, transitionPolish, typography } from "@/lib/ui";
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

const MODULE_ABBREV: Record<ModuleKey, string> = {
  job: "JD",
  latex: "LX",
  suggestions: "SG",
  diff: "DF",
  preview: "PDF",
};

type WindowSnapshot = {
  slots: ModuleKey[];
  leftPx: number;
  rightPx: number;
  minimized: ModuleKey[];
};

type LayoutState = {
  slots: ModuleKey[];
  leftPx: number;
  rightPx: number;
  minimized?: ModuleKey[];
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
  const [minimizedModules, setMinimizedModules] = useState<ModuleKey[]>([]);
  const layoutMemoryRef = useRef<WindowSnapshot | null>(null);
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
      if (Array.isArray(parsed.minimized)) {
        const normalizedMin = parsed.minimized.filter((x): x is ModuleKey =>
          DEFAULT_SLOTS.includes(x as ModuleKey),
        );
        if (normalizedMin.length > 0) {
          setMinimizedModules(normalizedMin);
          restored = true;
        }
      }
      if (restored) toast("Layout restored", { tone: "info" });
    } catch {
      // ignore
    }
  }, []);

  // Persist layout
  useEffect(() => {
    const state: LayoutState = { slots, leftPx, rightPx, minimized: minimizedModules };
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [slots, leftPx, rightPx, minimizedModules]);

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

  const captureLayoutSnapshot = useCallback((): WindowSnapshot => ({
    slots: [...slots],
    leftPx,
    rightPx,
    minimized: [],
  }), [slots, leftPx, rightPx]);

  const saveLayoutMemory = useCallback(() => {
    if (layoutMemoryRef.current) return;
    layoutMemoryRef.current = captureLayoutSnapshot();
  }, [captureLayoutSnapshot]);

  const applyLayoutMemory = useCallback(() => {
    const mem = layoutMemoryRef.current;
    if (!mem) return false;
    setSlots([...mem.slots]);
    setLeftPx(mem.leftPx);
    setRightPx(mem.rightPx);
    setMinimizedModules([]);
    setMaximizedModule(null);
    layoutMemoryRef.current = null;
    return true;
  }, []);

  const handleMinimizeModule = useCallback(
    (module: ModuleKey) => {
      if (minimizedModules.includes(module)) return;
      if (maximizedModule === null && minimizedModules.length === 0) {
        saveLayoutMemory();
      }
      if (maximizedModule === module) setMaximizedModule(null);
      setMinimizedModules((prev) => [...prev, module]);
      toast(`Minimized ${moduleLabels[module]}`, { tone: "info" });
    },
    [minimizedModules, maximizedModule, saveLayoutMemory],
  );

  const handleZoomModule = useCallback(
    (module: ModuleKey) => {
      if (maximizedModule === module) {
        if (applyLayoutMemory()) {
          toast("Restored layout", { tone: "info" });
        } else {
          setMaximizedModule(null);
          toast("Restored layout", { tone: "info" });
        }
        return;
      }
      if (minimizedModules.includes(module)) {
        const remaining = minimizedModules.filter((m) => m !== module);
        setMinimizedModules(remaining);
        if (!maximizedModule && remaining.length === 0) applyLayoutMemory();
        toast(`Restored ${moduleLabels[module]}`, { tone: "info" });
        return;
      }
      if (maximizedModule === null && minimizedModules.length === 0) {
        saveLayoutMemory();
      }
      setMaximizedModule(module);
      toast(`Maximized ${moduleLabels[module]}`, { tone: "info" });
    },
    [maximizedModule, minimizedModules, applyLayoutMemory, saveLayoutMemory],
  );

  const handleRestoreFromDock = useCallback(
    (key: string) => {
      const module = key as ModuleKey;
      const remaining = minimizedModules.filter((m) => m !== module);
      setMinimizedModules(remaining);
      if (!maximizedModule && remaining.length === 0) applyLayoutMemory();
      toast(`Restored ${moduleLabels[module]}`, { tone: "info" });
    },
    [maximizedModule, minimizedModules, applyLayoutMemory],
  );

  const dockModules = useMemo(
    () =>
      minimizedModules.map((key) => ({
        key,
        label: moduleLabels[key],
        abbrev: MODULE_ABBREV[key],
      })),
    [minimizedModules],
  );

  const anyMaximized = maximizedModule !== null;

  // Allow Escape to exit a maximized module and restore the saved layout.
  useEffect(() => {
    if (!maximizedModule) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (applyLayoutMemory()) {
        toast("Restored layout", { tone: "info" });
      } else {
        setMaximizedModule(null);
        toast("Restored layout", { tone: "info" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maximizedModule, applyLayoutMemory]);

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
    <div className="relative flex h-screen flex-col">
      <header
        className={cn(
          "app-chrome sticky top-0 flex shrink-0 items-center justify-between gap-4 px-5 py-2",
          layer.fg,
          glassChrome,
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center text-[11px] font-semibold text-white/95",
              brand.mark,
              brand.glowHover,
              radius.md,
            )}
            aria-hidden
          >
            RT
          </div>
          <h1 className={cn(typography.h1, brand.titleAccent)}>Resume Tailor AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-35",
              radius.lg,
              button.primary,
              focusRing,
            )}
          >
            {loading && (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            )}
            {loading ? "Analyzing…" : "Generate Suggestions"}
          </button>
        </div>
      </header>

      <main className={cn("min-h-0 flex-1 p-[var(--space-module-gap)]", layer.mid)}>
        <div
          className="relative hidden h-full min-h-0 gap-[var(--space-module-gap)] lg:grid"
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
              isMinimized={minimizedModules.includes(module)}
              anyMaximized={anyMaximized}
              onMinimize={() => handleMinimizeModule(module)}
              onZoom={() => handleZoomModule(module)}
              onDragStart={() => setDraggingModule(module)}
              onDragEnd={() => setDraggingModule(null)}
              onDropModule={swapModules}
            >
              {renderModule(module)}
            </ModuleContainer>
          ))}
          <ModuleDock modules={dockModules} onRestore={handleRestoreFromDock} />
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
  isMinimized,
  anyMaximized,
  onMinimize,
  onZoom,
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
  isMinimized: boolean;
  anyMaximized: boolean;
  onMinimize: () => void;
  onZoom: () => void;
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
  const isDropTarget = dragOver && !isDragging && !isMinimized;
  const isActive = isMaximized;
  const isDimmed =
    (isDragActive && !isDragging && !isDropTarget) ||
    (anyMaximized && !isMaximized);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const dragged = event.dataTransfer.getData("text/module") as ModuleKey;
    if (dragged) onDropModule(dragged, module);
  };

  return (
    <div
      style={isMinimized ? undefined : isMaximized ? undefined : { gridArea: area }}
      tabIndex={-1}
      data-active={isActive ? "" : undefined}
      data-dimmed={isDimmed ? "" : undefined}
      data-dragging={isDragging ? "" : undefined}
      data-minimized={isMinimized ? "" : undefined}
      data-drop-target={isDropTarget ? "" : undefined}
      className={cn(
        glassModule,
        "group/module min-h-0 outline-none",
        radius.window,
        isMaximized
          ? cn("absolute inset-0 animate-panel-zoom-in", layer.overlay)
          : "relative",
      )}
    >
      <div
        className={cn(
          "absolute right-2 top-[var(--space-panel-y)] z-30 transition-opacity duration-200 ease-out",
          isMaximized || isMinimized
            ? "pointer-events-none opacity-0"
            : "opacity-0 group-hover/module:opacity-100 focus-within:opacity-100",
        )}
      >
        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          title={`Drag to move ${label}`}
          aria-label={`Drag to move ${label}`}
          className={cn(
            "flex cursor-grab items-center justify-center p-1.5 active:cursor-grabbing",
            radius.md,
            color.inkMuted,
            transitionPolish,
            "hover:text-accent",
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
      </div>

      {/* While any module is being dragged, this overlay sits above the panel
          content (Monaco / PDF iframe / textarea) so drops always register. */}
      {isDragActive && !isMinimized && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center transition-colors duration-200 ease-out",
            radius.window,
          )}
        >
          {isDropTarget && (
            <span
              className={cn(
                "px-3 py-1 font-medium",
                radius.full,
                typography.caption,
                "glass-sm text-ink-soft",
              )}
            >
              Drop to swap
            </span>
          )}
        </div>
      )}

      <ModuleChromeProvider
        chrome={
          <WindowControls
            label={label}
            isMaximized={isMaximized}
            isMinimized={isMinimized}
            onClose={onMinimize}
            onMinimize={onMinimize}
            onZoom={onZoom}
          />
        }
      >
        <div className={cn("window-surface h-full min-h-0", isMinimized && "window-surface--minimized")}>
          {children}
        </div>
      </ModuleChromeProvider>
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
      <div className="h-full w-1 rounded-full bg-transparent transition-colors duration-200 ease-out group-hover/resizer:bg-[hsl(var(--palette-blushed-brick-hsl)/0.45)] group-active/resizer:bg-[hsl(var(--palette-blushed-brick-hsl)/0.65)]" />
    </div>
  );
}
