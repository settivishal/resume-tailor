"use client";

import { cn, color, focusRing, glass, glassInset, radius, status, transitionPolish, typography } from "@/lib/ui";

interface ModuleDockProps {
  modules: { key: string; label: string; abbrev: string }[];
  onRestore: (key: string) => void;
}

/** macOS-style dock strip for minimized modules. */
export default function ModuleDock({ modules, onRestore }: ModuleDockProps) {
  if (modules.length === 0) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-4",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5",
          radius.full,
          glass.sm,
        )}
        role="toolbar"
        aria-label="Minimized modules"
      >
        {modules.map((mod) => (
          <button
            key={mod.key}
            type="button"
            onClick={() => onRestore(mod.key)}
            title={`Restore ${mod.label}`}
            aria-label={`Restore ${mod.label}`}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1 active:scale-[0.98]",
              radius.full,
              glassInset,
              typography.caption,
              color.inkSoft,
              transitionPolish,
              "hover:text-ink-body hover:shadow-brand-glow",
              focusRing,
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center font-semibold",
                radius.full,
                typography.micro,
                status.accentBadge,
              )}
              aria-hidden
            >
              {mod.abbrev}
            </span>
            <span className="max-w-[8rem] truncate">{mod.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
