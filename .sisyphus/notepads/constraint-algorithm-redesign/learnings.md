# Learnings - Constraint Algorithm Redesign

## Patterns & Conventions
- All existing algorithms return `{ seatingPlan, violations }` — kept this contract in seededArrange
- `students` array elements are `{ name: string, gender: '男'|'女' }` — always copy, never mutate originals
- Aisles are 1-indexed throughout the app; blockUtils handles conversion internally
- `getBlockPosition(col, aisles)` expects 0-indexed col and 1-indexed aisles
- Grid is `seatingPlan[row][col]`, both 0-indexed

## Successful Approaches
- BFS-style queue (not recursive DFS) for seed placement avoids stack overflow and infinite loops
- Exclusion map keyed by "row-col" string for O(1) lookup
- Gender lock propagation after each seed placement ensures block gender consistency
- 5-attempt retry loop handles randomization failures gracefully
- Fallback to existing randomArrange/genderArrange when no constraints present — avoids duplication

## Files Created
- `src/algorithms/seededArrange.js` — main algorithm file (~500 lines)

## Build Verification
- `npm run build` passes cleanly (43 modules transformed, 212ms)

## Fix: placeSeeds "with" target validation (2026-05-17)
### Problem
When placing a constrained student (e.g. 小明 with adjacency targets 小红/小刚 in gender mode), the candidate seat was accepted even if gender-locked blocks in the adjacency/range region had no valid seats for the targets. This caused silent skipping of targets, leading to constraint violations.

### Solution (3 changes)
1. **Added `canPlaceWithTargets()` helper** — for a candidate seat, checks that every "with" target has ≥1 valid empty seat in its required region (adjacency or range). Returns false if any target cannot be placed.
2. **Filter validSeats through canPlaceWithTargets** — after finding basic valid seats, filter them: only keep seats where all "with" targets can be placed. If list becomes empty → `return { success: false }` (triggers retry).
3. **Strict target placement** — when actually placing "with" targets, if candidates list is empty → `return { success: false }`. This is defensive (shouldn't happen after pre-validation, but catches edge cases).

### Key insight
Gender locks propagate dynamically during seed placement. A seat that passes `findValidSeats` (basic validity) may still be a bad choice because the required region has become gender-locked for opposite-gender targets. Two-phase filtering (basic → constraint-aware) catches this.
- `npm run build` passes cleanly after fix (43 modules, 186ms)

## Fix 2: canPlaceWithTargets capacity counting (2026-05-17)
### Problem
The per-target loop checked each "with" target independently — each target found the same remaining empty seat in a crowded block. A 2-seat block (cols 0-1) with source occupying seat 0 left only 1 seat for 2 adjacency targets. Both passed individually (both found the 1 remaining seat), but both can't fit simultaneously.

### Solution
Replaced per-target loop with a **capacity counting** approach:
1. Count how many targets need placement (filter: not self, not already on grid)
2. Collect all distinct valid empty seats in the region (deduplicated via `Set` by seat key)
3. Return `false` if `validSeats.size < targetsNeeded.length`

Same independent check for adjacency and range regions (targets in different regions don't compete for the same seats).
- `npm run build` passes (182ms)

## Context Integration: Wiring seededArrange into SeatingContext (2026-05-17)
### Changes made
1. Added `import { seededArrange } from '../algorithms/seededArrange'`
2. Modified `generatePlan()` to branch:
   - **Constraints present** → calls `seededArrange(students, nRows, nCols, aisles, mode, constraints)` 
   - **No constraints** → calls `randomArrange(students, nRows, nCols, aisles)` or `genderArrange(students, nRows, nCols, aisles)` WITHOUT the constraints parameter
3. Removed `constraints` argument from original algorithm calls (they don't accept it anyway)

### Decision: Branch in context, not in algorithm
Even though `seededArrange` has an internal fallback for no-constraints case, the context-level branch is cleaner because:
- Original algorithms (`randomArrange`, `genderArrange`) don't accept constraints — passing them was an unused extra arg
- The context is the decision point for "which algorithm to use"
- `seededArrange` return value with `seatingPlan: null` is handled gracefully (state set to null, violations shown)
- `npm run build` passes (178ms)

## F2 Verification: No-constraint regression testing (2026-05-17)
### Results: ALL 4 TESTS PASS

1. **Test 1 (Random no-constraint)**: ✅ 40 filled seats, 0 conflict dialogs, no errors
2. **Test 2 (Gender no-constraint)**: ✅ 40 filled seats, 0 conflict dialogs, aisle "2,5" set, gender mode active
3. **Test 3 (Exports)**: ✅ CSV/Excel/PNG buttons all enabled, all 3 downloads triggered (csv, xlsx, png), 0 page errors
4. **Test 4 (Click-to-swap)**: ✅ exactSwap confirmed: 天昊 ↔ 建军 swapped correctly

### Playwright MCP notes
- Browser lock file at `%LOCALAPPDATA%/ms-playwright/mcp-chrome-*` persists between crashes; must `Remove-Item -Recurse -Force` before re-navigate
- `browser_run_code_unsafe` with shorter code (navigate + 1 action + verify) works most reliably
- Long-running scripts (>30s) tend to lose the browser context

### VERDICT: APPROVE
No regressions detected. Algorithm refactor preserves all existing no-constraint functionality.
