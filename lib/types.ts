export type Impact = "high" | "medium" | "low";

export interface Patch {
  id: string;
  reason: string;
  impact: Impact;
  search: string;
  replace: string;
}

export type PatchStatus = "pending" | "accepted" | "rejected";

export interface AnalyzeResponse {
  patches: Patch[];
  matchScore: number;
  missingKeywords: string[];
}
