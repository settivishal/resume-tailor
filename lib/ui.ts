/**
 * Design system foundation.
 *
 * This module centralizes the reusable UI primitives so future visual work
 * is consistent and happens in one place:
 *   - `cn`         — class composition helper
 *   - `SPACING`    — the approved spacing scale (4 / 8 / 12 / 16 / 24px)
 *   - `typography` — the type scale (H1, H2, body, caption, …)
 *   - `color`      — semantic color utilities backed by tokens in globals.css
 *   - `radius`     — corner radius scale
 *   - `focusRing`  — the standard focus treatment for interactive elements
 *
 * Color values themselves live in `app/globals.css` (`@theme`). Components
 * should reference these tokens rather than hardcoding `zinc-*` shades.
 */

export type ClassValue = string | false | null | undefined;

/** Join conditional class names, dropping falsy values. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Approved spacing scale, expressed as Tailwind steps (1 step = 4px).
 * Prefer these over arbitrary values to keep rhythm consistent.
 */
export const SPACING = {
  xs: 1, // 4px
  sm: 2, // 8px
  md: 3, // 12px
  lg: 4, // 16px
  xl: 6, // 24px
} as const;

/**
 * Typography scale — size / weight / leading / tracking only.
 * Apply a color token (e.g. `color.inkMuted`) separately so type and color
 * stay composable.
 */
export const typography = {
  /** Primary page heading. */
  h1: "text-lg font-semibold tracking-tight",
  /** Section heading. */
  h2: "text-base font-semibold tracking-tight",
  /** Small all-caps section label (panel headers, field labels). */
  overline: "text-xs font-semibold uppercase tracking-wide",
  /** Default body copy. */
  body: "text-sm leading-relaxed",
  /** Tighter body copy for dense cards. */
  bodySnug: "text-sm leading-snug",
  /** Monospace body (code / diffs). */
  mono: "font-mono text-xs leading-relaxed",
  /** Supporting caption. */
  caption: "text-xs",
  /** Smallest metadata / pills. */
  micro: "text-[10px]",
} as const;

/**
 * Semantic color utilities. Each maps to a CSS token defined in globals.css,
 * so swapping the palette is a one-file change.
 */
export const color = {
  // Surfaces
  canvas: "bg-canvas",
  surface: "bg-surface",
  surfaceSubtle: "bg-surface-subtle",
  // Borders
  border: "border-line",
  borderStrong: "border-line-strong",
  // Text (ink ramp, strongest → faintest)
  inkStrong: "text-ink",
  inkBody: "text-ink-body",
  inkSoft: "text-ink-soft",
  inkMuted: "text-ink-muted",
  inkFaint: "text-ink-faint",
  // Primary action
  primary: "bg-primary text-primary-foreground",
  // Accent (selection / highlight)
  accent: "text-accent",
  accentSubtle: "bg-accent-subtle",
} as const;

/** Corner radius scale. */
export const radius = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
} as const;

/** Elevation (soft shadow) scale, backed by tokens in globals.css. */
export const elevation = {
  none: "shadow-none",
  card: "shadow-card",
  pop: "shadow-pop",
} as const;

/** Frosted-glass treatment for app chrome. */
export const glass = "glass";

/** Standard focus ring for interactive elements (opt-in per component). */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";
