export interface TextPatch {
  find: string;
  replace: string;
}

export type ApplyPatchResult =
  | { ok: true; text: string }
  | { ok: false; text: string; error: string };

/** Replaces the first exact occurrence of `find` with `replace`. */
export function applyPatch(
  originalText: string,
  patch: TextPatch,
): ApplyPatchResult {
  if (!patch.find) {
    return {
      ok: false,
      text: originalText,
      error: "Find text is empty",
    };
  }

  if (!originalText.includes(patch.find)) {
    return {
      ok: false,
      text: originalText,
      error: "Find text not present in document",
    };
  }

  return {
    ok: true,
    text: originalText.replace(patch.find, patch.replace),
  };
}

export function toTextPatch(patch: { search: string; replace: string }): TextPatch {
  return { find: patch.search, replace: patch.replace };
}
