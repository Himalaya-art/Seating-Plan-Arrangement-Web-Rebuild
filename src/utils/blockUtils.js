export function getBlockStructure(nCols, aisles) {
  const sorted = [...aisles].filter(a => a >= 1 && a < nCols).sort((a, b) => a - b);
  const blockWidths = [];
  const blockRanges = [];
  let start = 0;

  for (const aisle of sorted) {
    const end = aisle - 1;
    blockWidths.push(end - start + 1);
    blockRanges.push({ start, end });
    start = aisle;
  }

  if (start < nCols) {
    blockWidths.push(nCols - start);
    blockRanges.push({ start, end: nCols - 1 });
  }

  return { blockWidths, blockRanges, blocksPerRow: blockWidths.length };
}

export function getBlockPosition(col, aisles) {
  const sorted = [...aisles].sort((a, b) => a - b);
  let pos = 0;
  for (const aisle of sorted) {
    if (col < aisle) return pos;
    pos++;
  }
  return pos;
}

export function getBlockForSeat(row, col, nCols, aisles) {
  const { blocksPerRow } = getBlockStructure(nCols, aisles);
  const blockPos = getBlockPosition(col, aisles);
  return { blockPos, blocksPerRow };
}

export function getAdjacencyRegion(row, col, nRows, nCols, aisles) {
  const { blockRanges } = getBlockStructure(nCols, aisles);
  const blockPos = getBlockPosition(col, aisles);

  if (blockPos >= blockRanges.length) return [];

  const range = blockRanges[blockPos];
  const seats = [];
  for (let c = range.start; c <= range.end; c++) {
    seats.push({ row, col: c });
  }
  return seats;
}

export function getRangeRegion(row, col, nRows, nCols, aisles) {
  const { blockRanges } = getBlockStructure(nCols, aisles);
  const blockPos = getBlockPosition(col, aisles);

  if (blockPos >= blockRanges.length) return [];

  const prevRow = row === 0 ? nRows - 1 : row - 1;
  const nextRow = row === nRows - 1 ? 0 : row + 1;
  const range = blockRanges[blockPos];
  const seats = [];

  for (const r of [prevRow, row, nextRow]) {
    for (let c = range.start; c <= range.end; c++) {
      seats.push({ row: r, col: c });
    }
  }

  return seats;
}

export function getStudentNamesInSeats(seatingPlan, seats) {
  const names = [];
  for (const seat of seats) {
    const student = seatingPlan[seat.row]?.[seat.col];
    if (student) {
      names.push(student.name);
    }
  }
  return names;
}

export function findStudentSeat(seatingPlan, studentName) {
  for (let r = 0; r < seatingPlan.length; r++) {
    for (let c = 0; c < (seatingPlan[r]?.length || 0); c++) {
      if (seatingPlan[r][c]?.name === studentName) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}
