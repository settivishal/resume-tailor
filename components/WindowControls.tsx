"use client";

import { cn, focusRing } from "@/lib/ui";

interface WindowControlsProps {
  label: string;
  isMaximized: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onZoom: () => void;
}

/**
 * macOS-style traffic-light window controls (close / minimize / zoom).
 * Placed top-left on each dashboard module.
 */
export default function WindowControls({
  label,
  isMaximized,
  isMinimized,
  onClose,
  onMinimize,
  onZoom,
}: WindowControlsProps) {
  const zoomLabel = isMaximized
    ? `Restore ${label}`
    : isMinimized
      ? `Restore ${label} from dock`
      : `Maximize ${label}`;

  return (
    <div
      className="flex items-center gap-1.5"
      role="toolbar"
      aria-label={`${label} window controls`}
    >
      <button
        type="button"
        onClick={onClose}
        title={`Minimize ${label} to dock`}
        aria-label={`Minimize ${label} to dock`}
        className={cn(
          "window-control window-control--close",
          focusRing,
        )}
      />
      <button
        type="button"
        onClick={onMinimize}
        title={`Minimize ${label}`}
        aria-label={`Minimize ${label}`}
        className={cn(
          "window-control window-control--minimize",
          focusRing,
        )}
      />
      <button
        type="button"
        onClick={onZoom}
        title={zoomLabel}
        aria-label={zoomLabel}
        className={cn(
          "window-control window-control--zoom",
          isMaximized && "window-control--zoom-restore",
          focusRing,
        )}
      />
    </div>
  );
}
