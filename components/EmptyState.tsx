interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{title}</p>
      <p className="max-w-xs text-xs text-zinc-400 dark:text-zinc-500">{description}</p>
    </div>
  );
}
