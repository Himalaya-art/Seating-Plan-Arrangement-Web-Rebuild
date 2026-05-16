import {
  getAdjacencyRegion,
  getRangeRegion,
  getStudentNamesInSeats,
  findStudentSeat,
} from '../utils/blockUtils';

function deepClonePlan(plan) {
  return plan.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

function getAvailableStudents(plan) {
  const students = [];
  for (let r = 0; r < plan.length; r++) {
    for (let c = 0; c < (plan[r]?.length || 0); c++) {
      if (plan[r][c]) {
        students.push({ ...plan[r][c], _row: r, _col: c });
      }
    }
  }
  return students;
}

function getOutsideSeats(plan, region, excludeName) {
  const seats = [];
  for (let r = 0; r < plan.length; r++) {
    for (let c = 0; c < (plan[r]?.length || 0); c++) {
      if (!plan[r][c]) continue;
      if (plan[r][c].name === excludeName) continue;
      if (region.some(rs => rs.row === r && rs.col === c)) continue;
      seats.push({ row: r, col: c });
    }
  }
  return seats;
}

function checkAllConstraints(plan, constraints, nRows, nCols, aisles) {
  const violations = [];
  if (!constraints || Object.keys(constraints).length === 0) return violations;

  for (const [studentName, rules] of Object.entries(constraints)) {
    const studentSeat = findStudentSeat(plan, studentName);
    if (!studentSeat) continue;

    const { row, col } = studentSeat;

    if (rules.with?.adjacency) {
      const adjRegion = getAdjacencyRegion(row, col, nRows, nCols, aisles);
      const adjNames = getStudentNamesInSeats(plan, adjRegion);
      for (const targetName of rules.with.adjacency) {
        if (targetName === studentName) continue;
        if (!adjNames.includes(targetName)) {
          violations.push({
            type: 'with_adjacency',
            student: studentName,
            target: targetName,
            message: `${studentName} 必须与 ${targetName} 在同一行同一块（邻接区域）`,
          });
        }
      }
    }

    if (rules.with?.range) {
      const rangeRegion = getRangeRegion(row, col, nRows, nCols, aisles);
      const rangeNames = getStudentNamesInSeats(plan, rangeRegion);
      for (const targetName of rules.with.range) {
        if (targetName === studentName) continue;
        if (!rangeNames.includes(targetName)) {
          violations.push({
            type: 'with_range',
            student: studentName,
            target: targetName,
            message: `${studentName} 必须与 ${targetName} 在范围区域内（相邻三行同块）`,
          });
        }
      }
    }

    if (rules.without?.adjacency) {
      const adjRegion = getAdjacencyRegion(row, col, nRows, nCols, aisles);
      const adjNames = getStudentNamesInSeats(plan, adjRegion);
      for (const targetName of rules.without.adjacency) {
        if (targetName === studentName) continue;
        if (adjNames.includes(targetName)) {
          violations.push({
            type: 'without_adjacency',
            student: studentName,
            target: targetName,
            message: `${studentName} 不得与 ${targetName} 在同一行同一块（邻接区域）`,
          });
        }
      }
    }

    if (rules.without?.range) {
      const rangeRegion = getRangeRegion(row, col, nRows, nCols, aisles);
      const rangeNames = getStudentNamesInSeats(plan, rangeRegion);
      for (const targetName of rules.without.range) {
        if (targetName === studentName) continue;
        if (rangeNames.includes(targetName)) {
          violations.push({
            type: 'without_range',
            student: studentName,
            target: targetName,
            message: `${studentName} 不得与 ${targetName} 在范围区域内（相邻三行同块）`,
          });
        }
      }
    }
  }

  return violations;
}

function swapStudents(plan, r1, c1, r2, c2) {
  const temp = plan[r1][c1];
  plan[r1][c1] = plan[r2][c2];
  plan[r2][c2] = temp;
}

export function solveConstraints(plan, constraints, nRows, nCols, aisles, maxIterations = 2000) {
  if (!constraints || Object.keys(constraints).length === 0) {
    return { plan, violations: [] };
  }

  const workingPlan = deepClonePlan(plan);

  for (let iter = 0; iter < maxIterations; iter++) {
    const violations = checkAllConstraints(workingPlan, constraints, nRows, nCols, aisles);
    if (violations.length === 0) {
      return { plan: workingPlan, violations: [] };
    }

    let improved = false;

    for (const violation of violations) {
      const studentSeat = findStudentSeat(workingPlan, violation.student);
      const targetSeat = findStudentSeat(workingPlan, violation.target);

      if (violation.type === 'with_adjacency' || violation.type === 'with_range') {
        if (!studentSeat || !targetSeat) continue;

        const region = violation.type === 'with_adjacency'
          ? getAdjacencyRegion(studentSeat.row, studentSeat.col, nRows, nCols, aisles)
          : getRangeRegion(studentSeat.row, studentSeat.col, nRows, nCols, aisles);

        if (getStudentNamesInSeats(workingPlan, region).includes(violation.target)) {
          continue;
        }

        const candidateSeats = region.filter(s =>
          workingPlan[s.row]?.[s.col] &&
          workingPlan[s.row][s.col].name !== violation.student
        );

        if (candidateSeats.length > 0) {
          const pick = candidateSeats[Math.floor(Math.random() * candidateSeats.length)];
          swapStudents(workingPlan, pick.row, pick.col, targetSeat.row, targetSeat.col);
          improved = true;

          const newViolations = checkAllConstraints(workingPlan, constraints, nRows, nCols, aisles);
          if (newViolations.length >= violations.length) {
            swapStudents(workingPlan, pick.row, pick.col, targetSeat.row, targetSeat.col);
          } else {
            break;
          }
        }
      }

      if (violation.type === 'without_adjacency' || violation.type === 'without_range') {
        if (!studentSeat || !targetSeat) continue;

        const region = violation.type === 'without_adjacency'
          ? getAdjacencyRegion(studentSeat.row, studentSeat.col, nRows, nCols, aisles)
          : getRangeRegion(studentSeat.row, studentSeat.col, nRows, nCols, aisles);

        if (!getStudentNamesInSeats(workingPlan, region).includes(violation.target)) {
          continue;
        }

        const outsideSeats = getOutsideSeats(workingPlan, region, violation.student);

        if (outsideSeats.length > 0) {
          const pick = outsideSeats[Math.floor(Math.random() * outsideSeats.length)];
          swapStudents(workingPlan, pick.row, pick.col, targetSeat.row, targetSeat.col);
          improved = true;

          const newViolations = checkAllConstraints(workingPlan, constraints, nRows, nCols, aisles);
          if (newViolations.length >= violations.length) {
            swapStudents(workingPlan, pick.row, pick.col, targetSeat.row, targetSeat.col);
          } else {
            break;
          }
        }
      }
    }

    if (!improved) break;
  }

  const finalViolations = checkAllConstraints(workingPlan, constraints, nRows, nCols, aisles);
  return { plan: workingPlan, violations: finalViolations };
}
