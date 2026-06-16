"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  dismissToast,
  getToasts,
  subscribeToasts,
  type ToastItem,
} from "@/lib/toast";
import { cn, color, glass, layer, radius, typography } from "@/lib/ui";

const toneDot: Record<ToastItem["tone"], string> = {
  default: "bg-ink-faint",
  success: "bg-primary",
  info: "bg-accent",
};

/**
 * Renders the active toast stack (bottom-right). Each row owns its own
 * dismissal timer so it can animate out before being removed from the store.
 */
export default function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={cn(
        "pointer-events-none fixed bottom-4 right-4 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2",
        layer.toast,
      )}
    >
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastRow({ toast }: { toast: ToastItem }) {
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast.duration <= 0) return;
    timerRef.current = setTimeout(() => setLeaving(true), toast.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.duration]);

  const close = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLeaving(true);
  };

  return (
    <div
      role="status"
      onAnimationEnd={() => {
        if (leaving) dismissToast(toast.id);
      }}
      className={cn(
        "pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5",
        radius.lg,
        glass.sm,
        leaving ? "animate-toast-out" : "animate-toast-in",
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDot[toast.tone])}
        aria-hidden
      />
      <p className={cn("flex-1", typography.caption, color.inkBody)}>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss notification"
        className={cn(
          "shrink-0 text-base leading-none transition-colors",
          color.inkFaint,
          "hover:text-ink-soft active:scale-90",
        )}
      >
        &times;
      </button>
    </div>
  );
}
