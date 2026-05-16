import { useSeating } from '../../context/SeatingContext';
import '../ConflictDialog.css';

export default function ConflictDialog() {
  const { violations, clearViolations, generatePlan } = useSeating();

  if (!violations || violations.length === 0) return null;

  const handleIgnore = () => {
    clearViolations();
  };

  const handleRegenerate = () => {
    clearViolations();
    generatePlan();
  };

  return (
    <div className="conflict-overlay" onClick={handleIgnore}>
      <div className="conflict-dialog" onClick={e => e.stopPropagation()}>
        <h3>⚠️ 约束冲突提示</h3>
        <p>以下 {violations.length} 项约束无法满足：</p>
        <ul className="conflict-list">
          {violations.map((v, i) => (
            <li key={i} className="conflict-item">{v.message}</li>
          ))}
        </ul>
        <div className="conflict-actions">
          <button className="btn" onClick={handleIgnore}>
            忽略并继续
          </button>
          <button className="btn btn-primary" onClick={handleRegenerate}>
            重新生成
          </button>
        </div>
      </div>
    </div>
  );
}
