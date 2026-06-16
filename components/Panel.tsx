import { cn, color, glassHeader, glassPanel, radius, typography } from "@/lib/ui";

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export default function Panel({ title, children, className = "", action }: PanelProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        radius.xl,
        glassPanel,
        className,
      )}
    >
      <header
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 px-4 py-2.5",
          glassHeader,
        )}
      >
        <h2 className={cn(typography.overline, color.inkMuted)}>{title}</h2>
        {action}
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}
