"use client";

import Panel from "./Panel";

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
        className="h-full w-full resize-none bg-transparent p-3 text-sm leading-relaxed text-zinc-800 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100 dark:placeholder:text-zinc-600"
      />
    </Panel>
  );
}
