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
  /** Panel title on frosted glass — black on grey header strip (light theme). */
  overlineGlass: "text-[11px] font-semibold uppercase tracking-[0.06em] text-panel-header",
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
  surfaceHeader: "bg-surface-header",
  // Borders
  border: "border-line",
  borderStrong: "border-line-strong",
  glassBorder: "border-[color:var(--glass-border)]",
  // Text (ink ramp, strongest → faintest)
  inkStrong: "text-ink",
  inkBody: "text-ink-body",
  inkSoft: "text-ink-soft",
  inkMuted: "text-ink-muted",
  inkFaint: "text-ink-faint",
  // Semantic actions
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  destructiveText: "text-destructive",
  // Accent (selection / highlight)
  accent: "text-accent",
  accentSubtle: "bg-accent-subtle",
} as const;

/** Signature brand identity — blushed-brick (light) / pumpkin-spice (dark) on neutrals. */
export const brand = {
  mark: "brand-mark",
  glowHover: "brand-glow-hover",
  titleAccent: "bg-linear-to-r from-[color:var(--brand-primary)] to-[color:var(--brand-secondary)] bg-clip-text text-transparent",
} as const;

/** Shared polish transition for interactive surfaces. */
export const transitionPolish =
  "transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]";

/** Button treatments — primary (pumpkin-spice), secondary (charcoal), destructive (dark pumpkin). */
export const button = {
  primary:
    "bg-primary text-primary-foreground transition-[background-color,opacity,transform,box-shadow] duration-200 ease-out hover:opacity-90 hover:shadow-brand-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none",
  secondary:
    "bg-secondary text-secondary-foreground transition-[background-color,opacity,transform,box-shadow] duration-200 ease-out hover:opacity-90 hover:shadow-brand-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none",
  destructive:
    "bg-destructive text-destructive-foreground transition-[background-color,opacity,transform,box-shadow] duration-200 ease-out hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
  secondaryOutline:
    "border border-secondary/35 bg-transparent text-secondary transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out hover:border-secondary/50 hover:bg-secondary/8 hover:shadow-brand-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none",
} as const;

/** Status / feedback surfaces derived from the palette. */
export const status = {
  destructiveBanner: "border border-destructive/25 bg-destructive-subtle text-destructive",
  destructiveLink: "font-medium text-destructive underline hover:no-underline",
  accentBadge: "bg-status-accent-subtle text-accent",
} as const;

/** Diff highlighting — pumpkin-spice (removed / added variants). */
export const diff = {
  removeMark: "rounded-sm bg-diff-remove-subtle text-diff-remove",
  addMark: "rounded-sm bg-diff-add-subtle text-diff-add",
  removeDot: "bg-destructive/70",
  addDot: "bg-primary/75",
} as const;

/** Suggestion impact pills. */
export const impact = {
  high: "bg-impact-high-subtle text-impact-high",
  medium: "bg-impact-medium-subtle text-impact-medium",
  low: "bg-surface-subtle text-ink-soft",
} as const;

/** Corner radius scale. */
export const radius = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  /** macOS window corner radius. */
  window: "rounded-2xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
} as const;

/** Elevation (soft shadow) scale, backed by tokens in globals.css. */
export const elevation = {
  none: "shadow-none",
  card: "shadow-card",
  pop: "shadow-pop",
  // Soft, diffused glass shadows (depth levels for translucent surfaces).
  glassSm: "shadow-glass-sm",
  glassMd: "shadow-glass-md",
  glassLg: "shadow-glass-lg",
} as const;

/**
 * Premium card edge: hairline border + faint inner top-highlight + soft
 * shadow in a single token. Reads as crisp, lit depth on light *and* dark
 * surfaces (where flat box-shadows are nearly invisible).
 */
export const cardEdge = "card-edge";

/**
 * Glass UI foundation (macOS-inspired). Reusable primitives backed by the
 * glass tokens in `globals.css`.
 *
 *   - `frost`   — frosted backdrop blur only; compose onto any fill.
 *   - `glass`   — a complete glass surface (translucent fill + blur + soft
 *                 border + lit highlight + diffused shadow) in three depth
 *                 levels for a layered hierarchy.
 *
 * `glassChrome` is the original app-chrome frost (kept for back-compat).
 */
export const frost = {
  sm: "frost-sm",
  md: "frost-md",
  lg: "frost-lg",
} as const;

export const glass = {
  sm: "glass-sm",
  md: "glass-md",
  lg: "glass-lg",
} as const;

/** Slightly denser header band for glass panels (no extra blur pass). */
export const glassHeader = "glass-header";

/** Nested translucent fill inside a glass module (no extra blur). */
export const glassInset = "glass-inset";

/** Default frosted-glass surface for dashboard module cards. */
export const glassPanel = glass.md;

/** Marker class for glass interaction CSS (paired with `.glass-module` wrapper). */
export const glassPanelSurface = "glass-panel";

/** Wrapper class for module-level glass interaction states. */
export const glassModule = "glass-module";

/**
 * Depth layer z-index scale for the macOS-style glass environment:
 *   bg      — ambient canvas (handled by body pseudo-elements)
 *   mid     — dashboard modules / main content
 *   fg      — app chrome (header)
 *   overlay — maximized modules, drag targets
 *   toast   — transient feedback (foreground interactions)
 */
export const layer = {
  mid: "relative z-10",
  fg: "relative z-20",
  overlay: "z-40",
  toast: "z-50",
} as const;

/** Original frosted-glass treatment for app chrome (header / floating bars). */
export const glassChrome = "glass";

/** Standard focus ring — pumpkin-spice glow for accessible highlights. */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:shadow-brand-glow-focus";
