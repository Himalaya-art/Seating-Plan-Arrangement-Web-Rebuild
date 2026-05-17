import { useRef, useState } from 'react';
import { SeatingProvider } from './context/SeatingContext';
import ConfigPanel from './components/ConfigPanel/ConfigPanel';
import SeatingChart from './components/SeatingChart/SeatingChart';
import Toolbar from './components/Toolbar/Toolbar';
import ConflictDialog from './components/ConflictDialog/ConflictDialog';
import Presentation from './components/Presentation/Presentation';
import './App.css';

export default function App() {
  const chartRef = useRef(null);
  const [activeTab, setActiveTab] = useState('config');

  return (
    <SeatingProvider>
      <div className="tab-bar">
        <button
          className={`tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ 配置
        </button>
        <button
          className={`tab ${activeTab === 'present' ? 'active' : ''}`}
          onClick={() => setActiveTab('present')}
        >
          🎭 展示
        </button>
      </div>
      {activeTab === 'config' && (
        <div className="app-container">
          <Toolbar chartRef={chartRef} />
          <div className="app-body">
            <ConfigPanel />
            <SeatingChart ref={chartRef} />
          </div>
          <ConflictDialog />
        </div>
      )}
      {activeTab === 'present' && <Presentation />}
    </SeatingProvider>
  );
}
