# AGENTS.md

## Project overview
Chinese-language classroom seating arrangement app. React 19 + Vite 8, single-page, no TypeScript, no test suite.

## Commands
- `npm run dev` — start dev server (Vite, default `localhost:5173`)
- `npm run build` — production build (the only verification step)
- `npm run lint` — ESLint
- `npm run preview` — preview production build

## Architecture

### Entry and routing
- `index.html` → `src/main.jsx` → `src/App.jsx`
- Single page, no router. `App.jsx` wraps everything in `SeatingProvider` (React Context).

### State: `src/context/SeatingContext.jsx`
All state lives here via `useSeating()` hook. Key state shape:
- `seatingPlan` — `Array<Array<{name, gender} | null>>` (nRows × nCols, 0-indexed)
- `students` — flat array of `{name, gender}` from CSV
- `aisles` — array of 1-indexed column positions (e.g. `[2,5]` means aisles after cols 2 and 5)
- `constraints` — parsed `config.json` object, keyed by student name
- `selectedSeat` — `{row, col}` for click-to-swap
- Changing rows/cols auto-resets the plan via `resetPlan()`

### Critical indexing rule — blockUtils.js
**Aisles are 1-indexed** (user-facing column numbers). The seating grid and `blockRanges` are **0-indexed** internally. `getBlockStructure()` handles the conversion. `getBlockPosition(col, aisles)` expects 0-indexed `col` and 1-indexed `aisles` — the comparison `col < aisle` is correct for this mixed scheme.

Example: nCols=7, aisles=[2,5] → blocks=[[0,1],[2,4],[5,6]] (all 0-indexed).

### Component tree
```
App
├── Toolbar         (export CSV/Excel/PNG)
├── ConfigPanel
│   ├── StudentUpload (CSV upload, drag-drop, sample load, text parse)
│   ├── GridSettings  (rows, cols, aisle positions)
│   └── ModeSelector  (radio: random / gender-separated, generate button, config.json upload)
├── SeatingChart    (grid with DnD, renders Seat + Aisle components)
└── ConflictDialog  (modal shown when constraint violations exist after generation)
```

### Drag-and-drop setup
Uses `@dnd-kit/core` with `useDraggable` + `useDroppable` on the **same element** in `Seat.jsx`, NOT `useSortable`. The combined ref pattern merges both `setNodeRef`s via a callback ref. `DndContext` wraps the entire grid. No `SortableContext` needed. Click-to-swap also works: first click selects (yellow highlight), second click on another seat swaps.

### Static assets
Sample data is at `public/data/sampleStudents.csv`, fetched at runtime via `/data/sampleStudents.csv`. The `src/data/` copy exists but is not served — `public/` is the canonical location.

### CSS conventions
Each component folder has its own CSS file, imported by the component. Some CSS files live at the parent level and are shared by sibling components (e.g. `components/ConfigPanel.css` imported by all `components/ConfigPanel/*.jsx`). CSS class naming uses BEM-ish conventions (`.seat-male`, `.seat-female`, `.mode-option.active`).

### Constraint solving
`src/algorithms/constraintSolver.js` — iterative improvement up to 2000 rounds. Two region types:
- **adjacency**: same row, same horizontal block
- **range**: same block position across current + previous + next rows (with wrap-around)
- "with" constraints: target student must be in the region; solver tries swapping them in
- "without" constraints: target student must NOT be in the region; solver swaps them out
- `getOutsideSeats()` is called fresh each violation check (not a stale snapshot)

### Export
- CSV: raw string with BOM for UTF-8
- Excel: `xlsx` library (SheetJS)
- PNG: `html2canvas` — **dynamically imported** in `exportUtils.js`, not bundled eagerly. Requires a ref to the chart DOM element.

### Dependencies worth noting
- `xlsx` — large (bulk of the ~530KB main bundle); consider dynamic import if size matters
- `@dnd-kit/core` — drag-and-drop; `@dnd-kit/sortable` and `@dnd-kit/utilities` are installed but only `core` is actively used
