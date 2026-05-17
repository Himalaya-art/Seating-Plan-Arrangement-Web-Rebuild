import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { randomArrange } from '../algorithms/randomArrange';
import { genderArrange } from '../algorithms/genderArrange';
import { seededArrange } from '../algorithms/seededArrange';

const SeatingContext = createContext(null);

export function SeatingProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [nRows, setNRowsState] = useState(() => {
    const saved = localStorage.getItem('grid-nRows');
    return saved ? parseInt(saved, 10) : 7;
  });
  const [nCols, setNColsState] = useState(() => {
    const saved = localStorage.getItem('grid-nCols');
    return saved ? parseInt(saved, 10) : 9;
  });
  const [aisles, setAislesState] = useState(() => {
    const saved = localStorage.getItem('grid-aisles');
    return saved ? JSON.parse(saved) : [3, 6];
  });
  const [mode, setMode] = useState('random');
  const [seatingPlan, setSeatingPlan] = useState(null);
  const [constraints, setConstraints] = useState({});
  const [violations, setViolations] = useState([]);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [studentCountWarning, setStudentCountWarning] = useState('');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [animationMode, setAnimationModeState] = useState(() => {
    const saved = localStorage.getItem('grid-animationMode');
    return saved || 'flip';
  }); // flip|fade|bounce|scan

  // Persist grid settings to localStorage
  useEffect(() => { localStorage.setItem('grid-nRows', nRows); }, [nRows]);
  useEffect(() => { localStorage.setItem('grid-nCols', nCols); }, [nCols]);
  useEffect(() => { localStorage.setItem('grid-aisles', JSON.stringify(aisles)); }, [aisles]);
  useEffect(() => { localStorage.setItem('grid-animationMode', animationMode); }, [animationMode]);

  const resetPlan = useCallback(() => {
    setSeatingPlan(null);
    setViolations([]);
    setSelectedSeat(null);
  }, []);

  const generatePlan = useCallback(() => {
    if (students.length === 0) {
      setStudentCountWarning('请先导入学生名单');
      return;
    }

    const totalSeats = nRows * nCols;
    if (students.length > totalSeats) {
      setStudentCountWarning(`学生人数(${students.length})超过座位数(${totalSeats})，将截断多余学生`);
    } else if (students.length < totalSeats) {
      setStudentCountWarning(`学生人数(${students.length})少于座位数(${totalSeats})，部分座位将留空`);
    } else {
      setStudentCountWarning('');
    }

    const studentsToUse = students.slice(0, totalSeats);

    let result;
    if (constraints && Object.keys(constraints).length > 0) {
      result = seededArrange(studentsToUse, nRows, nCols, aisles, mode, constraints);
    } else if (mode === 'random') {
      result = randomArrange(studentsToUse, nRows, nCols, aisles);
    } else {
      result = genderArrange(studentsToUse, nRows, nCols, aisles);
    }

    setSeatingPlan(result.seatingPlan);
    setViolations(result.violations);
    setSelectedSeat(null);
  }, [students, nRows, nCols, aisles, mode, constraints]);

  const swapSeats = useCallback((row1, col1, row2, col2) => {
    if (!seatingPlan) return;
    const newPlan = seatingPlan.map(r => r.map(c => (c ? { ...c } : null)));
    const temp = newPlan[row1][col1];
    newPlan[row1][col1] = newPlan[row2][col2];
    newPlan[row2][col2] = temp;
    setSeatingPlan(newPlan);
  }, [seatingPlan]);

  const handleSeatClick = useCallback((row, col) => {
    if (!seatingPlan) return;
    if (selectedSeat) {
      if (selectedSeat.row === row && selectedSeat.col === col) {
        setSelectedSeat(null);
      } else {
        swapSeats(selectedSeat.row, selectedSeat.col, row, col);
        setSelectedSeat(null);
      }
    } else {
      setSelectedSeat({ row, col });
    }
  }, [seatingPlan, selectedSeat, swapSeats]);

  const clearViolations = useCallback(() => {
    setViolations([]);
  }, []);

  const handleRowsChange = useCallback((val) => {
    setNRowsState(val);
    resetPlan();
  }, [resetPlan]);

  const handleColsChange = useCallback((val) => {
    setNColsState(val);
    resetPlan();
  }, [resetPlan]);

  const handleAislesChange = useCallback((val) => {
    setAislesState(val);
    resetPlan();
  }, [resetPlan]);

  // Auto-load config.json on startup
  useEffect(() => {
    if (localStorage.getItem('configDisabled') === 'true') return;

    const loadConfig = async () => {
      for (const path of ['/data/config.json', '/config.json']) {
        try {
          const res = await fetch(path);
          if (res.ok) {
            const config = await res.json();
            if (config && Object.keys(config).length > 0) {
              setConstraints(config);
              setIsConfigLoaded(true);
            }
            return;
          }
        } catch { /* try next path */ }
      }
    };
    loadConfig();
  }, []); // run once on mount

  const value = {
    students, setStudents,
    nRows, setNRows: handleRowsChange,
    nCols, setNCols: handleColsChange,
    aisles, setAisles: handleAislesChange,
    mode, setMode,
    seatingPlan, setSeatingPlan,
    constraints, setConstraints,
    violations, setViolations,
    isConfigLoaded, setIsConfigLoaded,
    studentCountWarning,
    selectedSeat,
    animationMode, setAnimationMode: setAnimationModeState,
    generatePlan,
    swapSeats,
    handleSeatClick,
    clearViolations,
    resetPlan,
  };

  return (
    <SeatingContext.Provider value={value}>
      {children}
    </SeatingContext.Provider>
  );
}

export function useSeating() {
  const ctx = useContext(SeatingContext);
  if (!ctx) throw new Error('useSeating must be used within SeatingProvider');
  return ctx;
}
