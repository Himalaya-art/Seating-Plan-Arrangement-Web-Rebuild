import StudentUpload from './StudentUpload';
import GridSettings from './GridSettings';
import ModeSelector from './ModeSelector';
import '../ConfigPanel.css';

export default function ConfigPanel() {
  return (
    <div className="config-panel">
      <h2>配置面板</h2>
      <StudentUpload />
      <GridSettings />
      <ModeSelector />
    </div>
  );
}
