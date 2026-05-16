import { getBlockStructure } from '../utils/blockUtils';
import { solveConstraints } from './constraintSolver';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createEmptyPlan(nRows, nCols) {
  return Array.from({ length: nRows }, () => Array.from({ length: nCols }, () => null));
}

export function genderArrange(students, nRows, nCols, aisles, constraints = {}) {
  const { blockWidths, blocksPerRow } = getBlockStructure(nCols, aisles);
  const totalBlocks = nRows * blocksPerRow;

  const males = shuffle(students.filter(s => s.gender === '男'));
  const females = shuffle(students.filter(s => s.gender === '女'));

  if (males.length === 0 || females.length === 0) {
    const shuffled = shuffle(students);
    const plan = createEmptyPlan(nRows, nCols);
    let idx = 0;
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        plan[r][c] = idx < shuffled.length ? shuffled[idx] : null;
        idx++;
      }
    }
    return { seatingPlan: plan, violations: [] };
  }

  const blockList = [];
  for (let r = 0; r < nRows; r++) {
    for (let b = 0; b < blocksPerRow; b++) {
      blockList.push({ row: r, blockPos: b, capacity: blockWidths[b] });
    }
  }

  const shuffledBlocks = shuffle(blockList);

  const blockAssignments = {};
  let remainingMales = males.length;
  let remainingFemales = females.length;

  for (let i = 0; i < shuffledBlocks.length; i++) {
    const block = shuffledBlocks[i];
    const key = `${block.row}-${block.blockPos}`;
    if (remainingMales >= remainingFemales && remainingMales > 0) {
      const assign = Math.min(block.capacity, remainingMales);
      blockAssignments[key] = { gender: '男', count: assign };
      remainingMales -= assign;
    } else if (remainingFemales > 0) {
      const assign = Math.min(block.capacity, remainingFemales);
      blockAssignments[key] = { gender: '女', count: assign };
      remainingFemales -= assign;
    } else {
      blockAssignments[key] = { gender: null, count: 0 };
    }

    if (remainingMales === 0 && remainingFemales === 0) {
      for (let j = i + 1; j < shuffledBlocks.length; j++) {
        const b2 = shuffledBlocks[j];
        blockAssignments[`${b2.row}-${b2.blockPos}`] = { gender: null, count: 0 };
      }
      break;
    }
  }

  if (remainingMales > 0 || remainingFemales > 0) {
    for (let i = shuffledBlocks.length - 1; i >= 0; i--) {
      const block = shuffledBlocks[i];
      const key = `${block.row}-${block.blockPos}`;
      const total = remainingMales + remainingFemales;
      if (total <= block.capacity) {
        blockAssignments[key] = { gender: 'mixed', count: total };
        remainingMales = 0;
        remainingFemales = 0;
        break;
      }
    }
  }

  const maleQueue = [...males];
  const femaleQueue = [...females];

  const plan = createEmptyPlan(nRows, nCols);
  const { blockRanges } = getBlockStructure(nCols, aisles);

  for (let r = 0; r < nRows; r++) {
    for (let b = 0; b < blocksPerRow; b++) {
      const key = `${r}-${b}`;
      const assignment = blockAssignments[key] || { gender: null, count: 0 };
      const range = blockRanges[b];
      if (!range) continue;

      let seats = [];
      for (let c = range.start; c <= range.end; c++) {
        seats.push(c);
      }

      if (assignment.gender === '男' || (assignment.gender === 'mixed' && maleQueue.length > 0)) {
        for (const colIdx of seats) {
          if (assignment.gender === '男' || (assignment.gender === 'mixed' && maleQueue.length > 0)) {
            plan[r][colIdx] = maleQueue.shift() || null;
          } else if (assignment.gender === 'mixed' && femaleQueue.length > 0) {
            plan[r][colIdx] = femaleQueue.shift() || null;
          }
        }
        for (const colIdx of seats) {
          if (assignment.gender === 'mixed' && plan[r][colIdx] === null && femaleQueue.length > 0) {
            plan[r][colIdx] = femaleQueue.shift();
          }
        }
      } else if (assignment.gender === '女' || assignment.gender === 'mixed') {
        for (const colIdx of seats) {
          if ((assignment.gender === '女' || assignment.gender === 'mixed') && femaleQueue.length > 0) {
            plan[r][colIdx] = femaleQueue.shift() || null;
          } else if (assignment.gender === 'mixed' && maleQueue.length > 0) {
            plan[r][colIdx] = maleQueue.shift() || null;
          }
        }
        for (const colIdx of seats) {
          if (assignment.gender === 'mixed' && plan[r][colIdx] === null && maleQueue.length > 0) {
            plan[r][colIdx] = maleQueue.shift();
          }
        }
      }
    }
  }

  const { plan: solvedPlan, violations } = solveConstraints(
    plan, constraints, nRows, nCols, aisles
  );

  return { seatingPlan: solvedPlan, violations };
}
