"use client";

import { useEffect, useState } from "react";
import EmptyState from "./EmptyState";
import Panel from "./Panel";

interface PdfPreviewPanelProps {
  latex: string;
}

export default function PdfPreviewPanel({ latex }: PdfPreviewPanelProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mocked, setMocked] = useState(false);

  useEffect(() => {
    if (!latex.trim()) {
      setPdfUrl(null);
      setError(null);
      setMocked(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latex }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to compile PDF");
        }

        setMocked(res.headers.get("X-Pdf-Mocked") === "true");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Compile error");
          setPdfUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        }
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [latex]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  return (
    <Panel
      title="PDF Preview"
      className="h-full"
      action={
        loading ? (
          <span className="text-[10px] text-zinc-400">Compiling…</span>
        ) : mocked ? (
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            Mock preview
          </span>
        ) : undefined
      }
    >
      {error && (
        <p className="p-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {!error && !pdfUrl && !loading && !latex.trim() && (
        <EmptyState
          title="No LaTeX to preview"
          description="Add resume content in the editor to compile a PDF."
        />
      )}
      {!error && !pdfUrl && !loading && latex.trim() && (
        <EmptyState
          title="Compiling…"
          description="PDF preview will appear shortly."
        />
      )}
      {pdfUrl && !error && (
        <iframe
          src={pdfUrl}
          title="Resume PDF preview"
          className="h-full min-h-[200px] w-full"
        />
      )}
    </Panel>
  );
}
