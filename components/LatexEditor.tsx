"use client";

import dynamic from "next/dynamic";
import Panel from "./Panel";
import { cn, color, typography } from "@/lib/ui";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      className={cn(
        "flex h-full items-center justify-center",
        typography.body,
        color.inkFaint,
      )}
    >
      Loading editor…
    </div>
  ),
});

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function LatexEditor({
  value,
  onChange,
  disabled = false,
}: LatexEditorProps) {
  return (
    <Panel title="LaTeX Resume" className="h-full">
      <div className="h-full min-h-[200px]">
        <MonacoEditor
          height="100%"
          language="latex"
          theme="vs-dark"
          value={value}
          onChange={(next) => onChange(next ?? "")}
          options={{
            readOnly: disabled,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 12 },
          }}
        />
      </div>
    </Panel>
  );
}
