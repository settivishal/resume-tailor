import EmptyState from "./EmptyState";
import Panel from "./Panel";

export default function PdfPreviewPanel() {
  return (
    <Panel title="PDF Preview">
      <EmptyState
        title="Preview not available"
        description="Compiled PDF will appear here once LaTeX changes are applied."
      />
    </Panel>
  );
}
