import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { writeFile, readFile, rm, mkdtemp, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createMockPdf } from "@/lib/mock-pdf";

const execFileAsync = promisify(execFile);

async function hasPdflatex(): Promise<boolean> {
  try {
    await execFileAsync("pdflatex", ["--version"]);
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
    await execFileAsync(
      "pdflatex",
      ["-interaction=nonstopmode", "-output-directory", dir, texPath],
      { timeout: 30_000 },
    );

    await access(pdfPath);
    return await readFile(pdfPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
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
        pdf = createMockPdf();
        mocked = true;
      }
    } else {
      pdf = createMockPdf();
      mocked = true;
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
