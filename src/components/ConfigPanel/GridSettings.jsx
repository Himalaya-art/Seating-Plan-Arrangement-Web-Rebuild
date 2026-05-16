import { useState, useRef, useCallback } from 'react';
import { useSeating } from '../../context/SeatingContext';
import '../ConfigPanel.css';

export default function GridSettings() {
  const { nRows, setNRows, nCols, setNCols, aisles, setAisles } = useSeating();
  const [rawAislesText, setRawAislesText] = useState(aisles.join(', '));
  const parseTimer = useRef(null);

  const parseAndSetAisles = useCallback((text) => {
    const trimmed = text.trim();
    if (trimmed === '') {
      setAisles([]);
      return;
    }
    const values = trimmed
      .split(/[,，]+/)
      .map(v => parseInt(v.trim(), 10))
      .filter(v => !isNaN(v) && v > 0);
    setAisles(values);
  }, [setAisles]);

  const handleAislesChange = (e) => {
    const raw = e.target.value;
    setRawAislesText(raw);

    if (parseTimer.current) clearTimeout(parseTimer.current);
    parseTimer.current = setTimeout(() => {
      parseAndSetAisles(raw);
    }, 400);
  };

  const handleAislesBlur = () => {
    if (parseTimer.current) clearTimeout(parseTimer.current);
    parseAndSetAisles(rawAislesText);
  };

  const syncFromAisles = useCallback(() => {
    if (aisles.length > 0) {
      setRawAislesText(aisles.join(', '));
    } else {
      setRawAislesText('');
    }
  }, [aisles]);

  return (
    <div className="panel-section">
      <h3>📐 座位表规格</h3>
      <div className="grid-input-row">
        <label>
          行数：
          <input
            type="number"
            min={2}
            max={20}
            value={nRows}
            onChange={e => setNRows(Math.max(2, Math.min(20, parseInt(e.target.value) || 2)))}
            className="input-number"
          />
        </label>
        <label>
          列数：
          <input
            type="number"
            min={2}
            max={20}
            value={nCols}
            onChange={e => setNCols(Math.max(2, Math.min(20, parseInt(e.target.value) || 2)))}
            className="input-number"
          />
        </label>
      </div>
      <div className="aisle-input">
        <label>
          过道位置（在第几列之后，逗号分隔）：
          <input
            type="text"
            value={rawAislesText}
            onChange={handleAislesChange}
            onBlur={handleAislesBlur}
            onFocus={syncFromAisles}
            placeholder="例如：2, 5"
            className="input-text"
          />
        </label>
        <span className="hint">过道位置需在 1 ~ {nCols - 1} 之间</span>
      </div>
    </div>
  );
}
