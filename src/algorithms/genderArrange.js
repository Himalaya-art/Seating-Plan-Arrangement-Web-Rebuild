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
  const { blockWidths, blockRanges, blocksPerRow } = getBlockStructure(nCols, aisles);

  const males = shuffle(students.filter(s => s.gender === '男'));
  const females = shuffle(students.filter(s => s.gender === '女'));

  // 只有一种性别时回退到随机排列
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

  const plan = createEmptyPlan(nRows, nCols);
  const maleQueue = [...males];
  const femaleQueue = [...females];

  // 从前往后（行0最接近讲台）逐行填充
  for (let r = 0; r < nRows; r++) {
    const totalRemaining = maleQueue.length + femaleQueue.length;
    if (totalRemaining === 0) break;

    // 按当前剩余男女生比例，估算本行男块数量
    const maleRatio = totalRemaining > 0 ? maleQueue.length / totalRemaining : 0.5;
    const numMaleBlockSlots = Math.round(maleRatio * blocksPerRow);

    // 为本行每个块位置随机分配偏好的性别
    const blockSlots = shuffle(
      Array.from({ length: blocksPerRow }, (_, i) => i < numMaleBlockSlots ? '男' : '女')
    );
    const rowBlockPositions = shuffle(
      Array.from({ length: blocksPerRow }, (_, b) => b)
    );

    for (let i = 0; i < rowBlockPositions.length; i++) {
      const b = rowBlockPositions[i];
      const range = blockRanges[b];
      if (!range) continue;

      const seats = [];
      for (let c = range.start; c <= range.end; c++) {
        seats.push(c);
      }
      shuffle(seats);

      // 确定主次性别队列
      let primaryQueue, secondaryQueue;
      const preferred = blockSlots[i];
      if (preferred === '男') {
        primaryQueue = maleQueue;
        secondaryQueue = femaleQueue;
      } else {
        primaryQueue = femaleQueue;
        secondaryQueue = maleQueue;
      }

      // 如果首选性别已用完，切换到另一种
      if (primaryQueue.length === 0 && secondaryQueue.length > 0) {
        [primaryQueue, secondaryQueue] = [secondaryQueue, primaryQueue];
      }

      if (primaryQueue.length === 0 && secondaryQueue.length === 0) continue;

      // 填充座位：先用主性别，主性别用完用另一种（形成混合块）
      for (const colIdx of seats) {
        if (primaryQueue.length > 0) {
          plan[r][colIdx] = primaryQueue.shift();
        } else if (secondaryQueue.length > 0) {
          plan[r][colIdx] = secondaryQueue.shift();
        }
      }
    }
  }

  // 如果有剩余学生但座位不够（不应出现，主流程已检查），忽略

  const { plan: solvedPlan, violations } = solveConstraints(
    plan, constraints, nRows, nCols, aisles
  );

  return { seatingPlan: solvedPlan, violations };
}
