import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { writeFile, readFile, rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function compileWithPdflatex(latex: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "resume-tailor-"));
  const texPath = join(dir, "resume.tex");
  const pdfPath = join(dir, "resume.pdf");

  try {
    await writeFile(texPath, latex, "utf-8");
    await execFileAsync("pdflatex", [
      "-interaction=nonstopmode",
      "-output-directory",
      dir,
      texPath,
    ]);
    return await readFile(pdfPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function compileWithLatexOnline(latex: string): Promise<Buffer> {
  const response = await fetch("https://latexonline.cc/compile", {
    method: "POST",
    headers: { "Content-Type": "application/x-tex" },
    body: latex,
  });

  if (!response.ok) {
    throw new Error(`Remote compile failed (${response.status})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function POST(request: Request) {
  const { latex } = await request.json();

  if (!latex?.trim()) {
    return NextResponse.json({ error: "LaTeX content is required" }, { status: 400 });
  }

  try {
    let pdf: Buffer;
    try {
      pdf = await compileWithPdflatex(latex);
    } catch {
      pdf = await compileWithLatexOnline(latex);
    }

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Compilation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
