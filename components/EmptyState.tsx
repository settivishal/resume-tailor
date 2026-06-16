import { cn, color, radius, typography } from "@/lib/ui";

interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-3 p-6 text-center">
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center border",
          radius.lg,
          color.border,
          color.surfaceSubtle,
          color.inkFaint,
        )}
        aria-hidden
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className={cn(typography.body, "font-medium", color.inkSoft)}>{title}</p>
        <p className={cn(typography.caption, "mx-auto max-w-xs", color.inkFaint)}>
          {description}
        </p>
      </div>
    </div>
  );
}
