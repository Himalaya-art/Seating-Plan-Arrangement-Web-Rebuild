# F1 Learnings

## Playwright Testing Approach
- **MCP limiation**: browser_run_code_unsafe crashes / page closes between calls on Windows. Workaround: standalone Playwright script via `npx playwright` + system Chrome.
- **Seat DOM structure**: `.seat` elements use `data-row`/`data-col` attributes (NOT `.seat-row` wrappers as CSS grid is used). Grid extraction must use these attributes.
- **Selector format**: Playwright `page.getByRole('button', { name: '...' })` works for Chinese text buttons.

## seededArrange Algorithm
- **Phase 1 (seed placement)**: Places constrained students + their "with" targets using BFS queue. Uses `canPlaceWithTargets` to verify forward-placement feasibility.
- **Phase 2 (fillRemaining)**: Fills empty seats respecting exclusions and gender locks.
- **Phase 3 (validation)**: Validates final grid against constraints. If violations found, retries up to 5 times.
- **No constraints path**: Falls back to `genderArrange`/`randomArrange` directly.

## Gender Block Semantics
- "Block" = contiguous column segment within ONE row (per-row, not per-column-position across rows)
- "至多一个混合块" = ≤1 row-block (across entire grid) can have mixed genders
- Per-row-block check needed, NOT per-column-segment across all rows

## Constraint Violation Detection
- `validateConstraints` checks all constraints against current grid
- Returns array of violations with message strings
- ConflictDialog shows when violations.length > 0

## Random Variance
- seed placement uses `Math.random()` for seat selection
- Gender fill also shuffles block positions per row
- Occasional 2-mixed-block runs (∼1/3 probability) — algorithm non-deterministic
