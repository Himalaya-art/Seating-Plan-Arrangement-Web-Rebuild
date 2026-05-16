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

function fillPlanSequential(plan, students) {
  let idx = 0;
  for (let r = 0; r < plan.length; r++) {
    for (let c = 0; c < plan[r].length; c++) {
      plan[r][c] = idx < students.length ? students[idx] : null;
      idx++;
    }
  }
  return plan;
}

export function randomArrange(students, nRows, nCols, aisles) {
  const plan = createEmptyPlan(nRows, nCols);
  const shuffled = shuffle(students);
  fillPlanSequential(plan, shuffled);

  return { seatingPlan: plan, violations: [] };
}
