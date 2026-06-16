"use client";

import dynamic from "next/dynamic";
import Panel from "./Panel";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
      Loading editor…
    </div>
  ),
});

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LatexEditor({ value, onChange }: LatexEditorProps) {
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
