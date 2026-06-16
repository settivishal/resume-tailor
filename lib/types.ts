export interface Patch {
  id: string;
  description: string;
  search: string;
  replace: string;
}

export type PatchStatus = "pending" | "accepted" | "rejected";

export interface SuggestResponse {
  patches: Patch[];
}
