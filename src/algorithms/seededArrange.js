import {
  getBlockStructure,
  getBlockPosition,
  getAdjacencyRegion,
  getRangeRegion,
  findStudentSeat,
  getStudentNamesInSeats,
} from '../utils/blockUtils';
import { randomArrange } from './randomArrange';
import { genderArrange } from './genderArrange';

// ── Shuffle helper ──────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════════════════════
// 4.2 HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════

/**
 * Parse config.json format into a constraint graph.
 * Returns Map<studentName, { withAdj, withRange, withoutAdj, withoutRange }>
 */
function buildConstraintGraph(constraints) {
  const graph = new Map();
  if (!constraints) return graph;

  for (const [studentName, rules] of Object.entries(constraints)) {
    const entry = {
      withAdj: [],
      withRange: [],
      withoutAdj: [],
      withoutRange: [],
    };

    if (rules.with?.adjacency) {
      entry.withAdj = rules.with.adjacency.filter(Boolean);
    }
    if (rules.with?.range) {
      entry.withRange = rules.with.range.filter(Boolean);
    }
    if (rules.without?.adjacency) {
      entry.withoutAdj = rules.without.adjacency.filter(Boolean);
    }
    if (rules.without?.range) {
      entry.withoutRange = rules.without.range.filter(Boolean);
    }

    graph.set(studentName, entry);
  }

  return graph;
}

/**
 * Sort by number of constraints (descending). Includes constraint targets
 * that aren't in the graph keys (they get 0 constraints for sorting).
 * Most constrained student first.
 */
function sortByConstraints(graph, allStudents) {
  // Collect all names that appear anywhere in constraints
  const allRelevantNames = new Set();
  for (const key of graph.keys()) {
    allRelevantNames.add(key);
  }
  for (const entry of graph.values()) {
    for (const name of [
      ...entry.withAdj,
      ...entry.withRange,
      ...entry.withoutAdj,
      ...entry.withoutRange,
    ]) {
      allRelevantNames.add(name);
    }
  }

  // Count constraints per student (including self-references)
  const constraintCount = new Map();
  for (const name of allRelevantNames) {
    const entry = graph.get(name);
    if (entry) {
      constraintCount.set(
        name,
        entry.withAdj.length +
          entry.withRange.length +
          entry.withoutAdj.length +
          entry.withoutRange.length
      );
    } else {
      constraintCount.set(name, 0);
    }
  }

  // Sort: most constraints first, then alphabetically for determinism
  return [...allRelevantNames].sort((a, b) => {
    const diff = (constraintCount.get(b) || 0) - (constraintCount.get(a) || 0);
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });
}

/**
 * Return Set of ALL student names involved in any constraint (source + target).
 */
function findAllConstrainedNames(constraints) {
  const names = new Set();
  if (!constraints) return names;

  for (const [studentName, rules] of Object.entries(constraints)) {
    names.add(studentName);
    if (rules.with?.adjacency) {
      for (const t of rules.with.adjacency) names.add(t);
    }
    if (rules.with?.range) {
      for (const t of rules.with.range) names.add(t);
    }
    if (rules.without?.adjacency) {
      for (const t of rules.without.adjacency) names.add(t);
    }
    if (rules.without?.range) {
      for (const t of rules.without.range) names.add(t);
    }
  }

  return names;
}

// ── Privacy helper: convert row,col to a Map key ────────────────
function seatKey(r, c) {
  return `${r}-${c}`;
}

/**
 * Check if a single seat is valid for a given student.
 */
function isSeatValid(grid, r, c, student, exclusionMap, genderLocks, mode) {
  // Seat occupied
  if (grid[r]?.[c]) return false;

  // Excluded
  const excluded = exclusionMap.get(seatKey(r, c));
  if (excluded && excluded.has(student.name)) return false;

  // Gender lock
  if (mode === 'gender') {
    const lock = genderLocks.get(seatKey(r, c));
    if (lock && lock !== student.gender) return false;
  }

  return true;
}

/**
 * Count existing students by gender in a specific block of a row.
 * Returns { male, female, total }.
 */
function countBlockGenders(grid, row, nCols, aisles, blockPos) {
  const { blockRanges } = getBlockStructure(nCols, aisles);
  const range = blockRanges[blockPos];
  if (!range || !grid[row]) return { male: 0, female: 0, total: 0 };

  let male = 0;
  let female = 0;
  for (let c = range.start; c <= range.end && c < nCols; c++) {
    const student = grid[row][c];
    if (student) {
      if (student.gender === '男') male++;
      else if (student.gender === '女') female++;
    }
  }
  return { male, female, total: male + female };
}

/**
 * Return array of {row, col} for all valid seats for a given student.
 * In gender mode, also skips seats whose block already has a different
 * gender majority.
 */
function findValidSeats(grid, nRows, nCols, student, exclusionMap, genderLocks, mode, aisles) {
  const valid = [];
  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      if (!isSeatValid(grid, r, c, student, exclusionMap, genderLocks, mode)) continue;

      if (mode === 'gender') {
        const blockPos = getBlockPosition(c, aisles);
        const counts = countBlockGenders(grid, r, nCols, aisles, blockPos);
        // If block already has a clear majority gender, skip if student doesn't match
        if (counts.male > counts.female && student.gender !== '男') continue;
        if (counts.female > counts.male && student.gender !== '女') continue;
      }

      valid.push({ row: r, col: c });
    }
  }
  return valid;
}

/**
 * Build the gender lock map for all empty seats in a given row's block.
 * Locks empty seats to a specific gender if the block already has
 * placed students of only one gender.
 */
function propagateGenderLocks(grid, row, nCols, aisles, genderLocks) {
  const { blockRanges, blocksPerRow } = getBlockStructure(nCols, aisles);

  for (let b = 0; b < blocksPerRow; b++) {
    const range = blockRanges[b];
    if (!range || !grid[row]) continue;

    const counts = countBlockGenders(grid, row, nCols, aisles, b);
    let lockGender = null;

    if (counts.male > 0 && counts.female === 0) {
      lockGender = '男';
    } else if (counts.female > 0 && counts.male === 0) {
      lockGender = '女';
    }
    // Mixed block → no lock

    if (lockGender) {
      for (let c = range.start; c <= range.end && c < nCols; c++) {
        if (!grid[row][c]) {
          genderLocks.set(seatKey(row, c), lockGender);
        }
      }
    }
  }
}

/**
 * Port of constraintSolver's checkAllConstraints. Returns array of
 * violation objects.
 */
function validateConstraints(grid, constraints, nRows, nCols, aisles) {
  const violations = [];
  if (!constraints || Object.keys(constraints).length === 0) return violations;

  for (const [studentName, rules] of Object.entries(constraints)) {
    const studentSeat = findStudentSeat(grid, studentName);
    if (!studentSeat) continue;

    const { row, col } = studentSeat;

    // with adjacency
    if (rules.with?.adjacency) {
      const adjRegion = getAdjacencyRegion(row, col, nRows, nCols, aisles);
      const adjNames = getStudentNamesInSeats(grid, adjRegion);
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

    // with range
    if (rules.with?.range) {
      const rangeRegion = getRangeRegion(row, col, nRows, nCols, aisles);
      const rangeNames = getStudentNamesInSeats(grid, rangeRegion);
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

    // without adjacency
    if (rules.without?.adjacency) {
      const adjRegion = getAdjacencyRegion(row, col, nRows, nCols, aisles);
      const adjNames = getStudentNamesInSeats(grid, adjRegion);
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

    // without range
    if (rules.without?.range) {
      const rangeRegion = getRangeRegion(row, col, nRows, nCols, aisles);
      const rangeNames = getStudentNamesInSeats(grid, rangeRegion);
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

/**
 * Check whether ALL "with" targets of a student have at least one
 * valid seat available in their required region, given a candidate
 * seat for the source student.
 *
 * Returns false if any target cannot be placed — the candidate seat
 * is invalid for this student.
 */
function canPlaceWithTargets(
  grid,
  seat,
  student,
  graph,
  studentMap,
  exclusionMap,
  genderLocks,
  mode,
  nRows,
  nCols,
  aisles
) {
  const entry = graph.get(student.name);
  if (!entry) return true; // no constraints → always valid

  // ── Helper: check if a name is already placed on the grid ──
  const isOnGrid = (name) =>
    grid.some((row) => row.some((cell) => cell && cell.name === name));

  // ── Check "with adjacency": count how many distinct seats are
  //     valid for at least one remaining target. There must be
  //     enough distinct seats for all targets that need placement. ──
  const adjTargetsNeeded = entry.withAdj.filter(
    (name) => name !== student.name && !isOnGrid(name)
  );

  if (adjTargetsNeeded.length > 0) {
    const adjRegion = getAdjacencyRegion(seat.row, seat.col, nRows, nCols, aisles);
    const adjValidSeats = new Set(
      adjRegion
        .filter(({ row: r, col: c }) => {
          if (grid[r]?.[c]) return false; // occupied
          // At least one target can be placed at this seat
          return adjTargetsNeeded.some((targetName) => {
            const ts = studentMap.get(targetName);
            return ts && isSeatValid(grid, r, c, ts, exclusionMap, genderLocks, mode);
          });
        })
        .map(({ row: r, col: c }) => seatKey(r, c))
    );

    if (adjValidSeats.size < adjTargetsNeeded.length) return false;
  }

  // ── Check "with range": same counting approach ───────────
  const rangeTargetsNeeded = entry.withRange.filter(
    (name) => name !== student.name && !isOnGrid(name)
  );

  if (rangeTargetsNeeded.length > 0) {
    const rangeRegion = getRangeRegion(seat.row, seat.col, nRows, nCols, aisles);
    const rangeValidSeats = new Set(
      rangeRegion
        .filter(({ row: r, col: c }) => {
          if (grid[r]?.[c]) return false; // occupied
          return rangeTargetsNeeded.some((targetName) => {
            const ts = studentMap.get(targetName);
            return ts && isSeatValid(grid, r, c, ts, exclusionMap, genderLocks, mode);
          });
        })
        .map(({ row: r, col: c }) => seatKey(r, c))
    );

    if (rangeValidSeats.size < rangeTargetsNeeded.length) return false;
  }

  return true;
}

// ══════════════════════════════════════════════════════════════════
// 4.3 SEED PLACEMENT ENGINE
// ══════════════════════════════════════════════════════════════════

/**
 * Place "with" constraint targets near the source student, and
 * recursively propagate their own constraints.
 *
 * Uses a BFS-like queue to avoid deep recursion and infinite loops.
 */
function placeSeeds(
  grid,
  constraints,
  students,
  nRows,
  nCols,
  aisles,
  mode,
  exclusionMap,
  genderLocks,
  placed
) {
  const graph = buildConstraintGraph(constraints);

  // Build name→student lookup
  const studentMap = new Map();
  for (const s of students) {
    studentMap.set(s.name, s);
  }

  const sortedNames = sortByConstraints(graph, students);
  const MAX_ITERATIONS = 2000;

  // ── BFS-style placement queue ──────────────────────────────
  // Each item: { name: string, phase: 'place' | 'propagate-without' }
  // 'place' = find seat + place + handle with constraints + schedule propagation
  // 'propagate-without' = add exclusions + gender locks
  const queue = sortedNames.map((name) => ({ name, phase: 'place' }));
  // Track which names we've already scheduled for 'place' phase
  const scheduledForPlace = new Set(sortedNames);
  let iter = 0;

  while (queue.length > 0 && iter < MAX_ITERATIONS) {
    iter++;
    const { name, phase } = queue.shift();

    // ── PLACE PHASE ─────────────────────────────────────────
    if (phase === 'place') {
      // Skip if already placed
      if (placed.has(name)) continue;

      const student = studentMap.get(name);
      if (!student) {
        // Student not in roster → skip
        continue;
      }

      // Find valid seats
      const validSeats = findValidSeats(grid, nRows, nCols, student, exclusionMap, genderLocks, mode, aisles);
      if (validSeats.length === 0) {
        return { success: false, reason: `无法为 ${name} 找到有效座位` };
      }

      // Filter: ensure "with" targets can be placed nearby
      const entryForFilter = graph.get(name);
      let trulyValidSeats = validSeats;
      if (entryForFilter && (entryForFilter.withAdj.length > 0 || entryForFilter.withRange.length > 0)) {
        trulyValidSeats = validSeats.filter((seat) =>
          canPlaceWithTargets(
            grid, seat, student, graph, studentMap,
            exclusionMap, genderLocks, mode, nRows, nCols, aisles
          )
        );
      }

      if (trulyValidSeats.length === 0) {
        return { success: false, reason: `无法为 ${name} 找到满足所有约束的座位` };
      }

      // Pick random valid seat
      const seat = trulyValidSeats[Math.floor(Math.random() * trulyValidSeats.length)];
      grid[seat.row][seat.col] = { ...student };
      placed.add(name);

      // Handle "with" constraints → place targets nearby
      const entry = graph.get(name);
      if (entry) {
        // ── with adjacency ───────────────────────────────
        for (const targetName of entry.withAdj) {
          if (targetName === name) continue;
          if (placed.has(targetName)) continue;

          const targetStudent = studentMap.get(targetName);
          if (!targetStudent) continue;

          const adjRegion = getAdjacencyRegion(seat.row, seat.col, nRows, nCols, aisles);
          // Find empty, valid seats in the adjacency region
          const adjCandidates = adjRegion.filter(({ row: r, col: c }) =>
            isSeatValid(grid, r, c, targetStudent, exclusionMap, genderLocks, mode) &&
            !grid[r]?.[c]
          );

          if (adjCandidates.length === 0) {
            return { success: false, reason: `无法将 ${targetName} 放置在 ${name} 的邻接区域` };
          }

          const pick = adjCandidates[Math.floor(Math.random() * adjCandidates.length)];
          grid[pick.row][pick.col] = { ...targetStudent };
          placed.add(targetName);

          // If target has its own constraints, schedule placement
          if (graph.has(targetName) && !scheduledForPlace.has(targetName)) {
            scheduledForPlace.add(targetName);
            queue.unshift({ name: targetName, phase: 'place' });
          }
          // Always schedule propagation for placed targets
          if (!scheduledForPlace.has(targetName)) {
            scheduledForPlace.add(targetName);
          }
        }

        // ── with range ───────────────────────────────────
        for (const targetName of entry.withRange) {
          if (targetName === name) continue;
          if (placed.has(targetName)) continue;

          const targetStudent = studentMap.get(targetName);
          if (!targetStudent) continue;

          const rangeRegion = getRangeRegion(seat.row, seat.col, nRows, nCols, aisles);
          const rangeCandidates = rangeRegion.filter(({ row: r, col: c }) =>
            isSeatValid(grid, r, c, targetStudent, exclusionMap, genderLocks, mode) &&
            !grid[r]?.[c]
          );

          if (rangeCandidates.length === 0) {
            return { success: false, reason: `无法将 ${targetName} 放置在 ${name} 的范围区域` };
          }

          const pick = rangeCandidates[Math.floor(Math.random() * rangeCandidates.length)];
          grid[pick.row][pick.col] = { ...targetStudent };
          placed.add(targetName);

          if (graph.has(targetName) && !scheduledForPlace.has(targetName)) {
            scheduledForPlace.add(targetName);
            queue.unshift({ name: targetName, phase: 'place' });
          }
          if (!scheduledForPlace.has(targetName)) {
            scheduledForPlace.add(targetName);
          }
        }

        // ── Schedule "without" propagation ────────────────
        queue.push({ name, phase: 'propagate-without' });

        // ── Gender lock propagation in gender mode ────────
        if (mode === 'gender') {
          propagateGenderLocks(grid, seat.row, nCols, aisles, genderLocks);
        }
      }

      continue;
    }

    // ── PROPAGATE-WITHOUT PHASE ──────────────────────────────
    if (phase === 'propagate-without') {
      const studentSeat = findStudentSeat(grid, name);
      if (!studentSeat) continue;

      const entry = graph.get(name);
      if (!entry) continue;

      // ── without adjacency: exclude targets from adjacency region ──
      if (entry.withoutAdj.length > 0) {
        const adjRegion = getAdjacencyRegion(
          studentSeat.row, studentSeat.col, nRows, nCols, aisles
        );
        for (const targetName of entry.withoutAdj) {
          if (targetName === name) continue;
          for (const { row: r, col: c } of adjRegion) {
            const key = seatKey(r, c);
            if (!exclusionMap.has(key)) {
              exclusionMap.set(key, new Set());
            }
            exclusionMap.get(key).add(targetName);
          }
        }
      }

      // ── without range: exclude targets from range region ──
      if (entry.withoutRange.length > 0) {
        const rangeRegion = getRangeRegion(
          studentSeat.row, studentSeat.col, nRows, nCols, aisles
        );
        for (const targetName of entry.withoutRange) {
          if (targetName === name) continue;
          for (const { row: r, col: c } of rangeRegion) {
            const key = seatKey(r, c);
            if (!exclusionMap.has(key)) {
              exclusionMap.set(key, new Set());
            }
            exclusionMap.get(key).add(targetName);
          }
        }
      }
    }
  }

  if (iter >= MAX_ITERATIONS) {
    return { success: false, reason: '种子放置超出最大迭代次数' };
  }

  return { success: true };
}

// ══════════════════════════════════════════════════════════════════
// 4.4 REMAINING FILL
// ══════════════════════════════════════════════════════════════════

/**
 * Fill all remaining empty seats with unplaced students.
 * Returns the filled grid or null if placement fails.
 */
function fillRemaining(
  grid,
  allStudents,
  nRows,
  nCols,
  aisles,
  mode,
  exclusionMap,
  genderLocks
) {
  // Collect unplaced students (preserve original array, copy)
  const unplaced = allStudents.filter(
    (s) => !grid.some((row) =>
      row.some((cell) => cell && cell.name === s.name)
    )
  );

  if (unplaced.length === 0) return grid;

  const studentMap = new Map(unplaced.map((s) => [s.name, s]));

  if (mode === 'random') {
    const shuffledStudents = shuffle(unplaced);
    for (const student of shuffledStudents) {
      let placed = false;
      // Try seats in row-major order
      for (let r = 0; r < nRows && !placed; r++) {
        for (let c = 0; c < nCols && !placed; c++) {
          if (isSeatValid(grid, r, c, student, exclusionMap, genderLocks, mode)) {
            grid[r][c] = { ...student };
            placed = true;
          }
        }
      }
      if (!placed) return null; // Cannot place this student
    }
    return grid;
  }

  // ── Gender mode fill ─────────────────────────────────────
  if (mode === 'gender') {
    const { blockRanges } = getBlockStructure(nCols, aisles);
    const maleQueue = shuffle(unplaced.filter((s) => s.gender === '男'));
    const femaleQueue = shuffle(unplaced.filter((s) => s.gender === '女'));

    // Single-gender fallback
    if (maleQueue.length === 0 || femaleQueue.length === 0) {
      // Fall back to random fill within gender constraints
      const allQueue = shuffle(unplaced);
      for (const student of allQueue) {
        let placed = false;
        for (let r = 0; r < nRows && !placed; r++) {
          for (let c = 0; c < nCols && !placed; c++) {
            if (isSeatValid(grid, r, c, student, exclusionMap, genderLocks, mode)) {
              grid[r][c] = { ...student };
              placed = true;
            }
          }
        }
        if (!placed) return null;
      }
      return grid;
    }

    // Process rows front-to-back
    for (let r = 0; r < nRows; r++) {
      if (maleQueue.length + femaleQueue.length === 0) break;

      // Shuffle block positions for this row
      const blockPositions = shuffle(
        Array.from({ length: blockRanges.length }, (_, i) => i)
      );

      for (const b of blockPositions) {
        const range = blockRanges[b];
        if (!range) continue;

        // Gather empty seats in this block
        const emptySeats = [];
        for (let c = range.start; c <= range.end && c < nCols; c++) {
          if (!grid[r][c]) {
            // Check if seat is usable (respect exclusionMap and genderLocks)
            emptySeats.push(c);
          }
        }

        if (emptySeats.length === 0) continue;

        // Determine block gender:
        // genderLocks → existing occupants → majority → random
        let blockGender = null;

        // Check genderLocks first
        for (const c of emptySeats) {
          const lock = genderLocks.get(seatKey(r, c));
          if (lock) {
            blockGender = lock;
            break;
          }
        }

        // If no lock, check existing occupants
        if (!blockGender) {
          const counts = countBlockGenders(grid, r, nCols, aisles, b);
          if (counts.male > counts.female) blockGender = '男';
          else if (counts.female > counts.male) blockGender = '女';
        }

        // If still no gender determined, use majority of remaining students
        if (!blockGender) {
          blockGender =
            maleQueue.length >= femaleQueue.length ? '男' : '女';
        }

        // Assign primary/secondary queues
        let primaryQueue, secondaryQueue;
        if (blockGender === '男') {
          primaryQueue = maleQueue;
          secondaryQueue = femaleQueue;
        } else {
          primaryQueue = femaleQueue;
          secondaryQueue = maleQueue;
        }

        // If primary is empty but secondary has students, swap
        if (primaryQueue.length === 0 && secondaryQueue.length > 0) {
          [primaryQueue, secondaryQueue] = [secondaryQueue, primaryQueue];
        }

        // Fill seats: filter by validity first
        const shuffledSeats = shuffle(emptySeats);
        for (const c of shuffledSeats) {
          // Pick student: try primary first, then secondary
          let student = null;

          // Find a valid student from primary queue
          const primLenBefore = primaryQueue.length;
          for (let tries = 0; tries < primLenBefore && primaryQueue.length > 0; tries++) {
            const candidate = primaryQueue[0];
            if (isSeatValid(grid, r, c, candidate, exclusionMap, genderLocks, mode)) {
              student = primaryQueue.shift();
              break;
            }
            // Student excluded from this seat, skip but keep in queue
            primaryQueue.push(primaryQueue.shift());
          }

          // If no primary, try secondary
          if (!student && secondaryQueue.length > 0) {
            // Just try the first valid from secondary
            const secLenBefore = secondaryQueue.length;
            for (let tries = 0; tries < secLenBefore; tries++) {
              const candidate = secondaryQueue[0];
              if (isSeatValid(grid, r, c, candidate, exclusionMap, genderLocks, mode)) {
                student = secondaryQueue.shift();
                break;
              }
              secondaryQueue.push(secondaryQueue.shift());
            }
          }

          if (student) {
            grid[r][c] = { ...student };
          }
          // If no student can use this seat, leave empty
        }
      }
    }

    // If any unplaced students remain, try to place them in any remaining empty seat
    const remaining = [...maleQueue, ...femaleQueue];
    if (remaining.length > 0) {
      for (const student of remaining) {
        let placed = false;
        for (let r = 0; r < nRows && !placed; r++) {
          for (let c = 0; c < nCols && !placed; c++) {
            if (!grid[r][c] && isSeatValid(grid, r, c, student, exclusionMap, genderLocks, mode)) {
              grid[r][c] = { ...student };
              placed = true;
            }
          }
        }
        if (!placed) return null;
      }
    }

    return grid;
  }

  // Unknown mode → fallback to sequential
  const shuffledStudents = shuffle(unplaced);
  let idx = 0;
  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      if (!grid[r][c] && idx < shuffledStudents.length) {
        grid[r][c] = { ...shuffledStudents[idx] };
        idx++;
      }
    }
  }
  return grid;
}

// ══════════════════════════════════════════════════════════════════
// 4.5 MAIN ENTRY POINT
// ══════════════════════════════════════════════════════════════════

/**
 * Constraint-aware constructive seating algorithm.
 *
 * Uses seed placement + exclusion propagation instead of iterative
 * swapping. Places the most-constrained students first, then fills
 * remaining seats with unconstrained students.
 *
 * @param {Array}  students    - Array of { name, gender }
 * @param {number} nRows       - Number of rows
 * @param {number} nCols       - Number of columns
 * @param {Array}  aisles      - 1-indexed aisle positions
 * @param {string} mode        - 'random' | 'gender'
 * @param {Object} constraints - config.json constraint object
 * @returns {{ seatingPlan: Array|null, violations: Array }}
 */
export function seededArrange(students, nRows, nCols, aisles, mode, constraints = {}) {
  // ── Fallback: no constraints → use existing algorithms ────
  if (!constraints || Object.keys(constraints).length === 0) {
    if (mode === 'gender') {
      return genderArrange(students, nRows, nCols, aisles);
    }
    return randomArrange(students, nRows, nCols, aisles, constraints);
  }

  // ── Edge case: no students ────────────────────────────────
  if (!students || students.length === 0) {
    const empty = Array.from({ length: nRows }, () =>
      Array.from({ length: nCols }, () => null)
    );
    return { seatingPlan: empty, violations: [] };
  }

  // ── Retry loop (up to 5 attempts) ─────────────────────────
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Fresh state
    const grid = Array.from({ length: nRows }, () =>
      Array.from({ length: nCols }, () => null)
    );
    const exclusionMap = new Map();
    const genderLocks = new Map();
    const placed = new Set();

    // Phase 1: Seed placement
    const seedResult = placeSeeds(
      grid, constraints, students,
      nRows, nCols, aisles, mode,
      exclusionMap, genderLocks, placed
    );

    if (!seedResult.success) {
      continue; // Next attempt
    }

    // Phase 2: Fill remaining seats
    const fillResult = fillRemaining(
      grid, students,
      nRows, nCols, aisles, mode,
      exclusionMap, genderLocks
    );

    if (!fillResult) {
      continue; // Next attempt
    }

    // Phase 3: Validate
    const violations = validateConstraints(grid, constraints, nRows, nCols, aisles);

    if (violations.length === 0) {
      return { seatingPlan: grid, violations: [] };
    }

    // Violations exist → try again
  }

  // All attempts failed
  return {
    seatingPlan: null,
    violations: [
      {
        type: 'global',
        student: '',
        target: '',
        message: '约束无法满足，请调整配置或重试',
      },
    ],
  };
}
