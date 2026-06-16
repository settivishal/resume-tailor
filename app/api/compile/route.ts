import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { writeFile, readFile, rm, mkdtemp, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createMockPdf } from "@/lib/mock-pdf";

const execFileAsync = promisify(execFile);

// GUI/IDE-launched Node processes often lack the TeX bin dir on PATH.
// Prepend common TeX install locations so `pdflatex` is found.
const TEX_BIN_DIRS = [
  "/Library/TeX/texbin", // MacTeX / BasicTeX (macOS)
  "/usr/local/texlive/2026basic/bin/universal-darwin",
  "/usr/local/bin",
  "/opt/homebrew/bin",
];

const execEnv = {
  ...process.env,
  PATH: [...TEX_BIN_DIRS, process.env.PATH ?? ""].filter(Boolean).join(":"),
};

async function hasPdflatex(): Promise<boolean> {
  try {
    await execFileAsync("pdflatex", ["--version"], { env: execEnv });
    return true;
  } catch {
    return false;
  }
}

async function compileWithPdflatex(latex: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "resume-tailor-"));
  const texPath = join(dir, "resume.tex");
  const pdfPath = join(dir, "resume.pdf");

  try {
    await writeFile(texPath, latex, "utf-8");

    try {
      await execFileAsync(
        "pdflatex",
        ["-interaction=nonstopmode", "-output-directory", dir, texPath],
        { timeout: 30_000, env: execEnv },
      );
    } catch {
      // pdflatex can exit non-zero on warnings yet still emit a valid PDF.
      // Swallow here and rely on the file-existence check below.
    }

    await access(pdfPath);
    return await readFile(pdfPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function compileWithLatexOnline(latex: string): Promise<Buffer> {
  // latexonline.cc compiles via GET with the source in the `text` query param.
  const url = `https://latexonline.cc/compile?text=${encodeURIComponent(latex)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/pdf" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Remote compile failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error(
      `Remote compile error: ${buffer.toString("utf-8").slice(0, 200)}`,
    );
  }

  return buffer;
}

export async function POST(request: Request) {
  const { latex } = await request.json();

  if (!latex?.trim()) {
    return NextResponse.json(
      { error: "LaTeX content is required" },
      { status: 400 },
    );
  }

  try {
    let pdf: Buffer;
    let mocked = false;

    if (await hasPdflatex()) {
      try {
        pdf = await compileWithPdflatex(latex);
      } catch {
        try {
          pdf = await compileWithLatexOnline(latex);
        } catch {
          pdf = createMockPdf();
          mocked = true;
        }
      }
    } else {
      try {
        pdf = await compileWithLatexOnline(latex);
      } catch {
        pdf = createMockPdf();
        mocked = true;
      }
    }

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
        ...(mocked && { "X-Pdf-Mocked": "true" }),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Compilation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
