import { useRef } from 'react';
import { SeatingProvider } from './context/SeatingContext';
import ConfigPanel from './components/ConfigPanel/ConfigPanel';
import SeatingChart from './components/SeatingChart/SeatingChart';
import Toolbar from './components/Toolbar/Toolbar';
import ConflictDialog from './components/ConflictDialog/ConflictDialog';
import './App.css';

export default function App() {
  const chartRef = useRef(null);

  return (
    <SeatingProvider>
      <div className="app-container">
        <Toolbar chartRef={chartRef} />
        <div className="app-body">
          <ConfigPanel />
          <SeatingChart ref={chartRef} />
        </div>
        <ConflictDialog />
      </div>
    </SeatingProvider>
  );
}
