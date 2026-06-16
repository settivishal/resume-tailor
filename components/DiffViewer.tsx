import EmptyState from "./EmptyState";
import Panel from "./Panel";

export default function DiffViewer() {
  return (
    <Panel title="Diff Viewer">
      <EmptyState
        title="No patch selected"
        description="Select a suggestion to preview its changes before accepting or rejecting."
      />
    </Panel>
  );
}
