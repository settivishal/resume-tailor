/**
 * Minimal, dependency-free toast store with an imperative API.
 *
 * Using a module-level store (instead of React context) keeps the public API
 * trivially callable from anywhere — event handlers, effects, plain functions —
 * without prop drilling or provider nesting. A single <Toaster /> subscribes
 * and renders the active toasts.
 *
 * Lifecycle note: `toast()` does NOT auto-remove items. Each rendered toast row
 * owns its own dismissal timer so it can play an exit animation before calling
 * `dismissToast`, which keeps removals smooth and jank-free.
 */

export type ToastTone = "default" | "success" | "info";

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  /** Auto-dismiss delay in ms. 0 disables auto-dismiss. */
  duration: number;
}

export interface ToastOptions {
  tone?: ToastTone;
  duration?: number;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts(): ToastItem[] {
  return toasts;
}

export function dismissToast(id: number) {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

/** Show a toast. Returns its id. */
export function toast(message: string, options: ToastOptions = {}): number {
  const id = nextId++;
  const item: ToastItem = {
    id,
    message,
    tone: options.tone ?? "default",
    duration: options.duration ?? 2600,
  };
  toasts = [...toasts, item];
  emit();
  return id;
}
