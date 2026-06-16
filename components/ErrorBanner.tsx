import { cn, color, radius, status, typography } from "@/lib/ui";

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
    <div className={cn("px-3 py-2", radius.md, status.destructiveBanner)}>
      <p className={cn(typography.caption, color.destructiveText)}>{message}</p>
      {(onDismiss || onRetry) && (
        <div className="mt-2 flex gap-2">
          {onRetry && (
            <button type="button" onClick={onRetry} className={cn(typography.caption, status.destructiveLink)}>
              Try again
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className={cn(typography.caption, color.destructiveText, "hover:opacity-80")}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
