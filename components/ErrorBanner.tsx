interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export default function ErrorBanner({
  message,
  onDismiss,
  onRetry,
}: ErrorBannerProps) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950/30">
      <p className="text-xs text-red-700 dark:text-red-300">{message}</p>
      {(onDismiss || onRetry) && (
        <div className="mt-2 flex gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-medium text-red-800 underline hover:no-underline dark:text-red-200"
            >
              Try again
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
