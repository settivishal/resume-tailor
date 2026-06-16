"use client";

import { cn, color, focusRing, radius, transitionPolish } from "@/lib/ui";
import { useTheme } from "./ThemeProvider";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Compact theme switch for the app chrome — fixed size, animated sun/moon icons. */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Light mode" : "Dark mode"}
      suppressHydrationWarning
      className={cn(
        "theme-toggle relative flex h-8 w-8 shrink-0 items-center justify-center",
        radius.lg,
        "border border-[color:var(--border-subtle)] bg-[color:var(--surface-glass-subtle)]",
        color.inkSoft,
        transitionPolish,
        "hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-glass)]",
        "active:scale-[0.94]",
        focusRing,
      )}
    >
      <SunIcon
        className={cn(
          "absolute transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isDark
            ? "pointer-events-none scale-75 rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100",
        )}
      />
      <MoonIcon
        className={cn(
          "absolute transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isDark
            ? "scale-100 rotate-0 opacity-100"
            : "pointer-events-none scale-75 -rotate-90 opacity-0",
        )}
      />
    </button>
  );
}
