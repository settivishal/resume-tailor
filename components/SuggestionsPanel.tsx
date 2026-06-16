import EmptyState from "./EmptyState";
import Panel from "./Panel";

export default function SuggestionsPanel() {
  return (
    <Panel title="Suggestions">
      <EmptyState
        title="No suggestions yet"
        description='Click "Generate Suggestions" to get AI-powered edits for your resume.'
      />
    </Panel>
  );
}
