import { useRef } from 'react';
import { useSeating } from '../../context/SeatingContext';
import '../ConfigPanel.css';

export default function ModeSelector() {
  const { mode, setMode, generatePlan, studentCountWarning, isConfigLoaded, setConstraints, setIsConfigLoaded } = useSeating();
  const configRef = useRef(null);

  const handleGenerate = () => {
    generatePlan();
  };

  const handleConfigUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const config = JSON.parse(ev.target.result);
        setConstraints(config);
        setIsConfigLoaded(true);
      } catch {
        alert('配置文件格式错误，请检查 JSON 语法');
      }
    };
    reader.readAsText(file);
  };

  const handleClearConfig = () => {
    setConstraints({});
    setIsConfigLoaded(false);
    if (configRef.current) configRef.current.value = '';
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

      <div className="config-section">
        <h4>配置文件 (config.json)</h4>
        <input
          type="file"
          accept=".json"
          onChange={handleConfigUpload}
          ref={configRef}
          style={{ display: 'none' }}
        />
        <div className="button-row">
          <button onClick={() => configRef.current?.click()} className="btn btn-small">
            加载 config.json
          </button>
          {isConfigLoaded && (
            <button onClick={handleClearConfig} className="btn btn-small btn-danger">
              清除配置
            </button>
          )}
        </div>
        {isConfigLoaded && (
          <div className="config-status success">✓ 已加载约束配置</div>
        )}
      </div>
    </div>
  );
}
