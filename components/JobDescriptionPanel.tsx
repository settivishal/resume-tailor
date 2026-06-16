"use client";

import Panel from "./Panel";
import { cn, color, typography } from "@/lib/ui";

interface JobDescriptionPanelProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function JobDescriptionPanel({
  value,
  onChange,
  disabled = false,
}: JobDescriptionPanelProps) {
  return (
    <Panel title="Job Description" className="h-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste the job posting here…"
        className={cn(
          "h-full w-full resize-none bg-transparent p-3.5 outline-none transition-shadow disabled:cursor-not-allowed disabled:opacity-50",
          "placeholder:text-ink-faint",
          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus/40",
          typography.body,
          color.inkBody,
        )}
      />
    </Panel>
  );
}
