import { useSeating } from '../../context/SeatingContext';
import '../ConfigPanel.css';

export default function ModeSelector() {
  const { mode, setMode, generatePlan, studentCountWarning } = useSeating();

  const handleGenerate = () => {
    generatePlan();
  };

  return (
    <div className="panel-section">
      <h3>⚙️ 生成模式</h3>
      <div className="mode-selector">
        <label className={`mode-option ${mode === 'random' ? 'active' : ''}`}>
          <input
            type="radio"
            name="mode"
            value="random"
            checked={mode === 'random'}
            onChange={() => setMode('random')}
          />
          <span className="mode-label">
            <strong>随机排位</strong>
            <small>所有学生随机填入座位</small>
          </span>
        </label>
        <label className={`mode-option ${mode === 'gender' ? 'active' : ''}`}>
          <input
            type="radio"
            name="mode"
            value="gender"
            checked={mode === 'gender'}
            onChange={() => setMode('gender')}
          />
          <span className="mode-label">
            <strong>按过道分离男女</strong>
            <small>每个块内性别一致，至多一个混合块</small>
          </span>
        </label>
      </div>

      <button onClick={handleGenerate} className="btn btn-primary btn-generate">
        🎲 生成座位表
      </button>

      {studentCountWarning && (
        <div className="warning">{studentCountWarning}</div>
      )}
    </div>
  );
}
