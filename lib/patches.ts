import type { Patch } from "./types";

export function applyPatch(latex: string, patch: Patch): string {
  if (!latex.includes(patch.search)) {
    throw new Error(`Patch "${patch.id}" search text not found in resume`);
  }
  return latex.replace(patch.search, patch.replace);
}

export function previewPatch(latex: string, patch: Patch): string {
  if (!latex.includes(patch.search)) return latex;
  return latex.replace(patch.search, patch.replace);
}
