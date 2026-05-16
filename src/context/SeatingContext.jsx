import { createContext, useContext, useState, useCallback } from 'react';
import { randomArrange } from '../algorithms/randomArrange';
import { genderArrange } from '../algorithms/genderArrange';

const SeatingContext = createContext(null);

export function SeatingProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [nRows, setNRows] = useState(8);
  const [nCols, setNCols] = useState(7);
  const [aisles, setAisles] = useState([]);
  const [mode, setMode] = useState('random');
  const [seatingPlan, setSeatingPlan] = useState(null);
  const [constraints, setConstraints] = useState({});
  const [violations, setViolations] = useState([]);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [studentCountWarning, setStudentCountWarning] = useState('');
  const [selectedSeat, setSelectedSeat] = useState(null);

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
    if (mode === 'random') {
      result = randomArrange(studentsToUse, nRows, nCols, aisles, constraints);
    } else {
      result = genderArrange(studentsToUse, nRows, nCols, aisles, constraints);
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
    setNRows(val);
    resetPlan();
  }, [resetPlan]);

  const handleColsChange = useCallback((val) => {
    setNCols(val);
    resetPlan();
  }, [resetPlan]);

  const handleAislesChange = useCallback((val) => {
    setAisles(val);
    resetPlan();
  }, [resetPlan]);

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
