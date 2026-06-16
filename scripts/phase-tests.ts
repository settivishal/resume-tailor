/**
 * 3 tests per phase (21 total) — run with: npx tsx scripts/phase-tests.ts
 * API tests require server: npm run start (or set BASE_URL)
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { diffWords } from "diff";
import { applyPatch, toTextPatch } from "../lib/patches";
import { getErrorMessage, parseApiError } from "../lib/errors";
import { createMockPdf } from "../lib/mock-pdf";
import { SAMPLE_LATEX } from "../lib/constants";

const ROOT = join(import.meta.dirname, "..");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

type TestResult = { phase: number; name: string; pass: boolean; detail?: string };

const results: TestResult[] = [];

function test(phase: number, name: string, fn: () => void | Promise<void>) {
  return (async () => {
    try {
      await fn();
      results.push({ phase, name, pass: true });
      console.log(`  ✓ ${name}`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      results.push({ phase, name, pass: false, detail });
      console.log(`  ✗ ${name}: ${detail}`);
    }
  })();
}

function fileExists(rel: string) {
  assert.ok(existsSync(join(ROOT, rel)), `Missing file: ${rel}`);
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

// ── Phase 1: UI skeleton ──────────────────────────────────────────
async function phase1() {
  console.log("\nPhase 1 — UI skeleton");
  await test(1, "Main page renders ResumeTailor", () => {
    const page = readFileSync(join(ROOT, "app/page.tsx"), "utf-8");
    assert.match(page, /ResumeTailor/);
  });
  await test(1, "Core layout components exist", () => {
    fileExists("components/JobDescriptionPanel.tsx");
    fileExists("components/LatexEditor.tsx");
    fileExists("components/Panel.tsx");
  });
  await test(1, "Sample LaTeX resume is preloaded", () => {
    assert.ok(SAMPLE_LATEX.includes("\\documentclass"));
    assert.ok(SAMPLE_LATEX.includes("Jane Doe"));
  });
}

// ── Phase 2: AI analyze API ───────────────────────────────────────
async function phase2() {
  console.log("\nPhase 2 — AI analyze API");
  await test(2, "/api/analyze rejects empty input (400)", async () => {
    const res = await apiPost("/api/analyze", { jobDescription: "", latexResume: "" });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });
  await test(2, "/api/analyze route file validates response shape", () => {
    const route = readFileSync(join(ROOT, "app/api/analyze/route.ts"), "utf-8");
    assert.match(route, /matchScore/);
    assert.match(route, /missingKeywords/);
    assert.match(route, /patches/);
  });
  await test(2, "/api/analyze accepts valid input (200 or config error)", async () => {
    const res = await apiPost("/api/analyze", {
      jobDescription: "Software engineer with React and Node.js experience.",
      latexResume: SAMPLE_LATEX,
    });
    assert.ok(
      res.status === 200 || res.status === 500 || res.status === 502,
      `Unexpected status ${res.status}`,
    );
    if (res.status === 200) {
      const data = await res.json();
      assert.ok(Array.isArray(data.patches), "patches must be array");
      assert.ok(typeof data.matchScore === "number", "matchScore must be number");
      assert.ok(Array.isArray(data.missingKeywords), "missingKeywords must be array");
    }
  });
}

// ── Phase 3: Suggestions UI ─────────────────────────────────────
async function phase3() {
  console.log("\nPhase 3 — Suggestions UI");
  await test(3, "SuggestionsPanel renders suggestion cards", () => {
    const panel = readFileSync(join(ROOT, "components/SuggestionsPanel.tsx"), "utf-8");
    assert.match(panel, /SuggestionCard/);
    assert.match(panel, /matchScore/);
  });
  await test(3, "SuggestionCard shows reason, impact, accept/reject", () => {
    const card = readFileSync(join(ROOT, "components/SuggestionCard.tsx"), "utf-8");
    assert.match(card, /patch\.reason/);
    assert.match(card, /patch\.impact/);
    assert.match(card, /Accept/);
    assert.match(card, /Reject/);
  });
  await test(3, "ResumeTailor wires analyze flow to SuggestionsPanel", () => {
    const app = readFileSync(join(ROOT, "components/ResumeTailor.tsx"), "utf-8");
    assert.match(app, /\/api\/analyze/);
    assert.match(app, /setPatches/);
    assert.match(app, /SuggestionsPanel/);
  });
}

// ── Phase 4: Patch application ──────────────────────────────────
async function phase4() {
  console.log("\nPhase 4 — Patch application");
  await test(4, "applyPatch replaces exact match", () => {
    const result = applyPatch("hello world", { find: "world", replace: "universe" });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.text, "hello universe");
  });
  await test(4, "applyPatch fails gracefully when find missing", () => {
    const original = "unchanged text";
    const result = applyPatch(original, { find: "missing", replace: "x" });
    assert.equal(result.ok, false);
    assert.equal(result.text, original);
    assert.match(result.error, /not present/);
  });
  await test(4, "toTextPatch maps API patch fields", () => {
    const mapped = toTextPatch({ search: "old", replace: "new" });
    assert.deepEqual(mapped, { find: "old", replace: "new" });
    const applied = applyPatch("old value", mapped);
    assert.equal(applied.ok, true);
    if (applied.ok) assert.equal(applied.text, "new value");
  });
}

// ── Phase 5: Diff view ──────────────────────────────────────────
async function phase5() {
  console.log("\nPhase 5 — Diff view");
  await test(5, "diffWords highlights added text changes", () => {
    const changes = diffWords("Built REST APIs", "Built scalable REST APIs");
    const added = changes.filter((c) => c.added).map((c) => c.value).join("");
    const unchanged = changes.filter((c) => !c.added && !c.removed).map((c) => c.value).join("");
    assert.equal(added, "scalable ");
    assert.ok(unchanged.includes("REST APIs"));
  });
  await test(5, "DiffViewer has before/after split view", () => {
    const diff = readFileSync(join(ROOT, "components/DiffViewer.tsx"), "utf-8");
    assert.match(diff, /Before/);
    assert.match(diff, /After/);
    assert.match(diff, /data-diff-change/);
  });
  await test(5, "Selecting a patch passes it to DiffViewer", () => {
    const app = readFileSync(join(ROOT, "components/ResumeTailor.tsx"), "utf-8");
    assert.match(app, /selectedPatchId/);
    assert.match(app, /DiffViewer patch=\{selectedPatch\}/);
  });
}

// ── Phase 6: PDF preview ────────────────────────────────────────
async function phase6() {
  console.log("\nPhase 6 — PDF preview");
  await test(6, "/api/compile rejects empty latex (400)", async () => {
    const res = await apiPost("/api/compile", { latex: "" });
    assert.equal(res.status, 400);
  });
  await test(6, "/api/compile returns PDF for valid latex", async () => {
    const res = await apiPost("/api/compile", { latex: SAMPLE_LATEX });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/pdf");
    const buf = Buffer.from(await res.arrayBuffer());
    assert.ok(buf.subarray(0, 5).toString() === "%PDF-", "Response must be a PDF");
  });
  await test(6, "createMockPdf produces valid PDF bytes", () => {
    const pdf = createMockPdf();
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  });
}

// ── Phase 7: UX polish ──────────────────────────────────────────
async function phase7() {
  console.log("\nPhase 7 — UX polish");
  await test(7, "getErrorMessage extracts Error messages", () => {
    assert.equal(getErrorMessage(new Error("boom")), "boom");
    assert.equal(getErrorMessage("plain"), "plain");
    assert.equal(getErrorMessage(null), "Something went wrong");
  });
  await test(7, "parseApiError maps HTTP status codes", async () => {
    const res400 = new Response(JSON.stringify({}), { status: 400 });
    assert.match(await parseApiError(res400), /Invalid input/);
    const res502 = new Response(JSON.stringify({}), { status: 502 });
    assert.match(await parseApiError(res502), /temporarily unavailable/);
  });
  await test(7, "Loading skeletons and error banners exist", () => {
    fileExists("components/SuggestionSkeleton.tsx");
    fileExists("components/ErrorBanner.tsx");
    const app = readFileSync(join(ROOT, "components/ResumeTailor.tsx"), "utf-8");
    assert.match(app, /useDebounce/);
    assert.match(app, /isBusy/);
    assert.match(app, /debouncedLatex/);
  });
}

async function main() {
  console.log("Resume Tailor — Phase Test Suite");
  console.log(`API base: ${BASE_URL}`);

  await phase1();
  await phase2();
  await phase3();
  await phase4();
  await phase5();
  await phase6();
  await phase7();

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);

  console.log("\n" + "─".repeat(50));
  console.log(`Results: ${passed}/${results.length} passed`);

  if (failed.length > 0) {
    console.log("\nFailed:");
    for (const f of failed) {
      console.log(`  Phase ${f.phase}: ${f.name} — ${f.detail}`);
    }
    process.exit(1);
  }

  console.log("\nAll phase tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
