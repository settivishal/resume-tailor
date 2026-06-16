import { cn, glassInset, radius } from "@/lib/ui";

export default function SuggestionSkeleton() {
  return (
    <div className={cn("animate-pulse p-3.5", radius.lg, glassInset)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-full rounded bg-surface-subtle" />
          <div className="h-3.5 w-4/5 rounded bg-surface-subtle" />
        </div>
        <div className="h-5 w-12 shrink-0 rounded-full bg-surface-subtle" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-14 rounded-md bg-surface-subtle" />
        <div className="h-6 w-14 rounded-md bg-surface-subtle" />
      </div>
    </div>
  );
}
