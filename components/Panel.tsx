"use client";

import { cn, glassHeader, glassPanel, glassPanelSurface, radius, typography } from "@/lib/ui";
import { useModuleChrome } from "./ModuleChromeContext";

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export default function Panel({ title, children, className = "", action }: PanelProps) {
  const windowControls = useModuleChrome();

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        radius.xl,
        glassPanel,
        glassPanelSurface,
        className,
      )}
    >
      <header
        className={cn(
          "flex shrink-0 items-center gap-3 px-3.5 py-2",
          glassHeader,
        )}
      >
        {windowControls && (
          <div className="flex shrink-0 items-center">{windowControls}</div>
        )}
        <h2 className={cn(typography.overlineGlass, "min-w-0 flex-1 truncate")}>
          {title}
        </h2>
        {action}
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}
