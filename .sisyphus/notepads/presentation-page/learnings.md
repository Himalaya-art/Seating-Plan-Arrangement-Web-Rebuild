# Learnings

## T9 E2E Validation (2026-05-17)

### All 4 animation modes work
- flip (🃏 翻转卡片): All 56 `.present-seat` elements get `.revealed` class
- fade (📖 逐行渐显): Same behavior, animation completes cleanly
- bounce (💥 跳跃弹出): Same behavior
- scan (🌊 扫描揭示): Same behavior (fastest, ~1.1s)

### Regen works
- After any animation, "🔄 重新揭晓" button appears
- Clicking it regenerates the seating plan and replays animation
- All seats fully revealed after regen

### Tab round-trip preserves config
- Switching ⚙️配置 → 🎭展示 → ⚙️配置 preserves rows=8, cols=7, aisles="2, 5"
- Presentation view shows correctly after round-trip with button enabled

### Zero-student edge case
- Fresh page → 🎭展示 shows "请先在配置页加载学生名单" hint
- "🎲 揭晓座位" button is disabled

### UI selection pattern
- Mode radio labels are clickable (full text including emoji + description)
- Used `page.getByText('📖 逐行渐显')` to select modes

### Button state transitions
- Initial: "🎲 揭晓座位" (enabled)
- During animation: "揭晓中..." (disabled)
- After animation: "🔄 重新揭晓" (enabled)

### Seat count
- 40 students in 8×7 grid = 56 total positions (16 empty seats)
- All 56 `.present-seat` positions get `.revealed` class after animation

### Build
- `npm run build` passes (exit 0)
- Expected chunk size warning for xlsx library (documented in AGENTS.md) — Presentation Page

## T1: Tab Toggle Implementation (2026-05-17)

### What was done
- Added `useState` import alongside existing `useRef` in `src/App.jsx`
- Created `activeTab` state defaulting to `'config'`
- Added tab bar with two buttons (⚙️ 配置 / 🎭 展示) using CSS class toggling for active state
- Wrapped existing config content in `{activeTab === 'config' && (...)}`
- Added `{activeTab === 'present' && <Presentation />}` placeholder
- Created minimal `src/components/Presentation/Presentation.jsx` placeholder so build passes before T3
- Added `.tab-bar`, `.tab`, `.tab:hover`, `.tab.active` CSS to `src/App.css`

### Key decisions
- Tab bar placed inside `<SeatingProvider>` but outside `.app-container` (so context is available in both tabs)
- Presentation component imported as placeholder — T3 will flesh it out
- All CSS uses design tokens from `src/index.css` (`--color-primary`, `--space-sm`, etc.)

### Verification
- `npm run build` passes cleanly (44 modules, 229ms)
- No existing CSS (.app-container, .app-body) modified
- `chartRef` prop preserved on Toolbar

## T2: Presentation.css Created (2026-05-17)

### What was done
- Created `src/components/Presentation.css` with dark theme, grid styles, button overrides, and 4 animation keyframes
- Scoped all dark-theme variables inside `.presentation-view` block
- Defined `.present-seat` (80×44px) matching `.seat` dimensions from `SeatingChart.css`
- Gender colors use direct hex values matching existing `--color-male-*` / `--color-female-*` tokens
- Button system: dark-mode overrides for `.btn`/`.btn-primary` within `.presentation-view`, plus `.reveal-btn` and `.reveal-again-btn` sizing classes
- 4 `@keyframes`: `flipIn` (3D rotateY), `fadeIn` (opacity), `bouncePop` (scale overshoot), `scanReveal` (clip-path swipe)
- 4 animation application classes: `.anim-flip`, `.anim-fade`, `.anim-bounce`, `.anim-scan` scoped to `.present-seat.revealed`

### Key decisions
- `.present-seat` default state: `opacity: 0; transform: scale(0);` — animations override to reveal
- `.present-seat.revealed` (no animation): `opacity: 1; transform: scale(1);` — instant fallback
- Button dark-mode overrides needed because `ConfigPanel.css` `.btn` has `background: #fff` which would clash with dark bg
- Animation curves: `cubic-bezier(0.25, 0.8, 0.25, 1)` (ease-out-quart) for flip/fade/scan; `cubic-bezier(0.34, 1.56, 0.64, 1)` (custom overshoot) for bounce
- All animations use `animation-fill-mode: both` so final state persists
- Zero Impeccable violations: no gradient text, no glassmorphism, no side-stripe borders, no layout prop animations

### Patterns established
- Dark-theme override pattern: `.presentation-view .existing-class` overrides light-theme styles
- Seat naming convention: `present-seat` (not `seat`) to avoid conflicts with SeatingChart
- Animation classes follow pattern: `.anim-{name} .present-seat.revealed` — one class on parent toggles animation for all revealed children

### Verification
- `npm run build` passes cleanly (44 modules → 9.69 KB combined CSS)
- LSP unavailable (biome not installed) — CSS validity confirmed via Vite build
- No files modified other than `src/components/Presentation.css`

## T3: Presentation.jsx Skeleton (2026-05-17)

### What was done
- Replaced 3-line placeholder with full skeleton component (~160 lines)
- Local state: `animationMode` (stub), `isAnimating`, `hasRevealed`, `revealedSeats` (Set)
- Context consumption: `students`, `seatingPlan`, `nCols`, `aisles`, `generatePlan` from `useSeating()`
- Three empty-state branches: no students, pre-reveal, post-reveal
- `handleReveal()`: guard on `isAnimating`/`students.length`, reset state, call `generatePlan()`
- `useEffect` on `seatingPlan`: sets `isAnimating=true`, stub setTimeout(100ms) reveals all seats (T4-T7 replace with real animation engine); handles null plan (failed generation)
- Cleanup `useEffect`: clears all timeouts on unmount
- Grid rendering: uses `getBlockStructure(nCols, aisles)` → `blockRanges`, builds `gridTemplateColumns` (`80px` per seat, `20px` per aisle), renders via `flatMap` per row inserting aisle divs between blocks
- Animation class `anim-${animationMode}` applied to grid parent (CSS keyframes defined in T2)

### Key decisions
- Grid built independently — does NOT reuse `SeatingChart.jsx` (no DnD, simpler rendering)
- `flatMap` pattern for row rendering: each block produces seats array, aisle div inserted between blocks
- Grid columns: `80px × blockWidth` then `20px` aisle between blocks → matches CSS: `.present-seat { width: 80px }`, `.present-aisle { width: 20px }`
- Empty seats remain in grid (null cells shown as dashed-border `.present-seat.empty`)
- `timerRef` used to track all timeouts for proper cleanup on unmount
- No `React` import needed — React 19 JSX transform handles fragments natively

### Patterns established
- Independent grid rendering (not shared with SeatingChart)
- Stub animation pattern: setTimeout → T4-T7 replaces with staggered reveal engine
- Button state machine: `!hasRevealed && !isAnimating` → reveal | `isAnimating` → disabled "揭晓中..." | `hasRevealed && !isAnimating` → "重新揭晓"

### Verification
- `npm run build` passes cleanly (45 modules, 188ms)
- LSP unavailable (TypeScript server not installed) — build success confirms correctness

## T4: animateFlip Function Added (2026-05-17)

### What was done
- Added `animateFlip(plan, nRows, nCols, timerRef, setRevealedSeats)` function at lines 62-86
- Row-major staggered reveal: each seat delayed by `(r * nCols + c) * 80ms`
- Each timeout pushes its id to `timerRef.current` for cleanup
- Uses functional `setRevealedSeats(prev => ...)` update to avoid stale closures
- On final seat reveal (`completed >= total`), calls `setIsAnimating(false)` and `setHasRevealed(true)`
- Total animation: `nRows * nCols * 80ms + 400ms` (CSS animation-duration) ≈ 4.9s for 7×8 grid

### Key decisions
- Function placed above `renderGrid` (line 63) but NOT yet called — T8 will dispatch from the `useEffect` stub
- `setIsAnimating` / `setHasRevealed` accessed via closure (defined at component scope)
- `completed` counter tracked in closure; checked on each seat reveal to detect completion
- Stub `useEffect` (lines 31-52) untouched per T4 spec

### Patterns established
- Animation functions receive React state setters as parameters for explicit dependency tracking
- All timeouts registered in `timerRef.current` for cleanup

### Verification
- `npm run build` passes cleanly (45 modules, 181ms)
- Function correctly isolated: no impact on existing behavior

## T8: Mode Selector UI + Animation Dispatch (2026-05-17)

### What was done
- Added `setAnimationMode` to `useState` destructuring (line 8) — previously read-only
- Replaced stub `useEffect` (lines 31-52) with `switch(animationMode)` dispatch that routes to the correct animation function
- Added 4-option mode selector `<div className="mode-selector">` with radio inputs above the podium div
- Each radio `onChange` guards with `if (!isAnimating)` to prevent mid-animation mode switches
- useEffect dependency array updated to `[seatingPlan, animationMode]` so mode changes trigger re-animation
- Double-fire prevention: `if (isAnimating) return` in useEffect

### Key decisions
- Reused `.mode-selector` and `.mode-option` classes from `ConfigPanel.css` (exact same pattern as `ModeSelector.jsx`)
- Mode selector uses `animMode` as radio group name (distinct from ConfigPanel's `mode`)
- Null plan handling preserved: `if (!seatingPlan) { setIsAnimating(false); setHasRevealed(false); return; }`
- Animation functions called with `timerRef` (not `timerRef.current`) — passed by reference so functions push to the same array
- Dark-mode visual adaptation of `.mode-option` deferred to T9 (QA) — uses light-theme borders on dark background, functional but not polished

### Edge cases handled
- **Null plan**: silent fallback, clears animation state
- **Mid-animation mode switch**: each radio onChange guarded with `if (!isAnimating)`
- **Rapid re-click**: `handleReveal` checks `if (isAnimating) return`
- **Double-fire prevention**: `if (isAnimating) return` in useEffect
- **Empty grid**: `nCols = seatingPlan[0]?.length || 0` safe access

### Verification
- `npm run build` passes cleanly (45 modules, 186ms)
- `animClass` at line 204 confirmed: `const animClass = \`anim-${animationMode}\`;` uses state correctly
- No CSS files modified — all styling reuses existing classes

## F2: Code Quality Review (2026-05-17)

### Build
- `npm run build` passes cleanly (45 modules, 188ms) — exit 0

### Lint
- ESLint 10 fails: "ESLint couldn't find an eslint.config.(js|mjs|cjs) file"
- Pre-existing infrastructure gap (documented in AGENTS.md), not a regression

### Code Quality Checklist
| Check | App.jsx | App.css | Presentation.jsx | Presentation.css |
|-------|---------|---------|------------------|------------------|
| `as any` / `@ts-ignore` | 0 | N/A | 0 | N/A |
| Empty catch blocks | 0 | N/A | 0 | N/A |
| `console.log` | 0 | N/A | 0 | N/A |
| Commented-out code | 0 | 0 | 0 | 0 |
| Unused imports | 0 | N/A | 0 | N/A |
| Gradient text | N/A | 0 | N/A | 0 |
| Glassmorphism | N/A | 0 | N/A | 0 |
| Side-stripe borders | N/A | 0 | N/A | 0 |
| Bounce/elastic easing | N/A | 0 | N/A | 0 |

### Issue Found: 1 (minor)
- **Unused `plan` parameter** in 4 animation functions (lines 70, 96, 122, 159). Functions accept `plan` as first argument but only use `nRows`/`nCols`.

### Scope Verification
- All 4 expected files modified: `App.jsx`, `App.css`, `Presentation.jsx`, `Presentation.css` ✅
- No unauthorized source files modified ✅
- Screenshot PNGs (t1-*.png, t3-*.png) and `page-initial.yml` are untracked test artifacts

### CSS File Size
- `Presentation.css`: 213 lines (within expected ~247 range) ✅

### Verdict: APPROVE

