export default function SuggestionSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-3.5 w-4/5 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="h-5 w-12 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-14 rounded-md bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-6 w-14 rounded-md bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
}
