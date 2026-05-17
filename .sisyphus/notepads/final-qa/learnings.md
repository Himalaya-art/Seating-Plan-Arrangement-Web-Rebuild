# Final QA Learnings

## Test Execution Notes

### Test Environment
- Dev server: `http://localhost:5173` (Vite, React 19)
- Browser: Playwright (Chromium)
- App state: `SeatingProvider` context persists across tab switches

### Key Discovery: Auto-animation on Tab Switch
When switching to "🎭 展示" tab, if `seatingPlan` already exists in context (e.g., from a previous generation in config mode), the `useEffect` in `Presentation.jsx` auto-triggers the animation. This is because the effect watches both `seatingPlan` and `animationMode`.

This means:
- First tab switch → auto-animates with default mode (flip)
- Subsequent mode changes + regen clicks → manual animation

### Timing Issue with `.revealed` Class
The `.reveal-again-btn` appears in the DOM slightly before all `.present-seat.revealed` classes are applied. Using `waitFor('.reveal-again-btn')` alone is insufficient. Required a polling approach (`waitForAllRevealed`) that loops checking `totalSeats === revealedSeats`.

### Selector Map
| UI Element | Selector |
|---|---|
| Config tab | `button:has-text("⚙️ 配置")` |
| Presentation tab | `button:has-text("🎭 展示")` |
| Load sample | `button:has-text("加载样例")` |
| Aisle input | `input[placeholder="例如：2, 5"]` |
| Rows input | `input[type="number"]` (first) |
| Cols input | `input[type="number"]` (nth=1) |
| Animation mode | `.mode-option:has-text("<mode>")` |
| Reveal button | `.reveal-btn:has-text("🎲 揭晓座位")` |
| Regen button | `.reveal-again-btn` |
| Present seat | `.present-seat` |
| Revealed seat | `.present-seat.revealed` |
| Seat name | `.seat-name` |
| Hint (no students) | `.presentation-hint` |
| Config panel | `.config-panel` |
| Presentation view | `.presentation-view` |

### Console Errors
- Only error: `favicon.ico` 404 (missing static resource, not an app JS error)
- 0 real JavaScript errors throughout all tests
