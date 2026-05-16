import { useRef } from 'react';
import { useSeating } from '../../context/SeatingContext';
import { parseStudentsCSV, studentsToCSV } from '../../utils/csvParser';
import '../ConfigPanel.css';

export default function StudentUpload() {
  const { students, setStudents } = useSeating();
  const fileRef = useRef(null);
  const textRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseStudentsCSV(text);
      if (parsed.length > 0) {
        setStudents(parsed);
        if (textRef.current) textRef.current.value = text;
      } else {
        alert('未识别到有效学生数据，请检查CSV格式（姓名,性别）');
      }
    };
    reader.readAsText(file);
  };

  const handleTextParse = () => {
    const text = textRef.current?.value || '';
    const parsed = parseStudentsCSV(text);
    if (parsed.length > 0) {
      setStudents(parsed);
    } else {
      alert('未识别到有效学生数据，请检查格式（姓名,性别 每行一个）');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseStudentsCSV(text);
      if (parsed.length > 0) {
        setStudents(parsed);
        if (textRef.current) textRef.current.value = text;
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const csv = studentsToCSV(students);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '学生名单.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSample = async () => {
    try {
      const response = await fetch('/data/sampleStudents.csv');
      const text = await response.text();
      const parsed = parseStudentsCSV(text);
      setStudents(parsed);
      if (textRef.current) textRef.current.value = text;
    } catch {
      alert('加载样例数据失败');
    }
  };

  return (
    <div className="panel-section">
      <h3>📋 学生名单</h3>
      <div className="student-upload-area" onDragOver={handleDragOver} onDrop={handleDrop}>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          ref={fileRef}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileRef.current?.click()} className="btn btn-small">
          选择 CSV 文件
        </button>
        <button onClick={loadSample} className="btn btn-small btn-secondary">
          加载样例
        </button>
        <span className="hint">或拖放文件到下方文本框</span>
      </div>
      <textarea
        ref={textRef}
        className="student-textarea"
        placeholder="姓名,性别&#10;张三,男&#10;小红,女&#10;..."
        rows={6}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      />
      <div className="button-row">
        <button onClick={handleTextParse} className="btn btn-small">
          解析文本
        </button>
        <button onClick={handleExportCSV} className="btn btn-small btn-secondary" disabled={students.length === 0}>
          导出学生 CSV
        </button>
      </div>
      {students.length > 0 && (
        <div className="student-count">
          已加载 <strong>{students.length}</strong> 名学生
          （男：{students.filter(s => s.gender === '男').length}，
          女：{students.filter(s => s.gender === '女').length}）
        </div>
      )}
    </div>
  );
}
