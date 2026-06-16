"use client";

import { useEffect, useState } from "react";

interface PdfPreviewProps {
  latex: string;
}

export default function PdfPreview({ latex }: PdfPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!latex.trim()) {
      setPdfUrl(null);
      setError(null);
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
    }, 800);

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
    <div className="flex h-full flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700">
        PDF Preview
        {loading && (
          <span className="ml-2 text-zinc-500">Compiling…</span>
        )}
      </div>
      <div className="relative min-h-[480px] flex-1">
        {error && (
          <p className="p-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {!error && !pdfUrl && !loading && (
          <p className="p-4 text-sm text-zinc-500">
            Enter LaTeX to see a live preview.
          </p>
        )}
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            title="Resume PDF preview"
            className="absolute inset-0 h-full w-full"
          />
        )}
      </div>
    </div>
  );
}
