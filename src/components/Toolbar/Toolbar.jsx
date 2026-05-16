import { useRef } from 'react';
import { useSeating } from '../../context/SeatingContext';
import { exportCSV, exportExcel, exportPNG } from '../../utils/exportUtils';
import '../Toolbar.css';

export default function Toolbar({ chartRef }) {
  const { seatingPlan, nRows, nCols, aisles } = useSeating();

  const handleExportCSV = () => {
    if (!seatingPlan) return;
    exportCSV(seatingPlan, nRows, nCols, aisles);
  };

  const handleExportExcel = () => {
    if (!seatingPlan) return;
    exportExcel(seatingPlan, nRows, nCols, aisles);
  };

  const handleExportPNG = async () => {
    if (!chartRef?.current) return;
    await exportPNG(chartRef.current);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-title">🏫 班级座位表排位系统</span>
      </div>
      <div className="toolbar-right">
        <button
          className="btn btn-small"
          onClick={handleExportCSV}
          disabled={!seatingPlan}
          title="导出为 CSV 文件"
        >
          📄 导出 CSV
        </button>
        <button
          className="btn btn-small"
          onClick={handleExportExcel}
          disabled={!seatingPlan}
          title="导出为 Excel 文件"
        >
          📊 导出 Excel
        </button>
        <button
          className="btn btn-small"
          onClick={handleExportPNG}
          disabled={!seatingPlan}
          title="导出为 PNG 图片"
        >
          🖼️ 导出 PNG
        </button>
      </div>
    </div>
  );
}
