# F1 Issues

## Flaky Gender Separation (Test 2)
- **Symptom**: Occasionally 2 mixed row-blocks instead of 1 (2/3 runs PASS, 1/3 FAIL)
- **Root cause**: Random seed+fill placement. When 张三(male, range target) placed in different row of Block 1 than 小明, and that row's Block 1 already has females, it creates a 2nd mixed row-block.
- **Severity**: Low. Constraints always satisfied. Gender mode works correctly in majority of runs.
- **Suggested fix**: Prefer placing range targets in same row as source student when possible, or run fillRemaining FIRST for the seed-affected block positions before general fill.

## Impossible Constraint Test Setup
- **Constraint names must match actual student names** in the roster. Original test used `测试A-测试G` which don't exist in sample CSV → constraint silently ignored (student not found → skip).
- **Fix**: Enter custom students via textarea + "解析文本" button, THEN upload constraint JSON.
- **Grid resize**: Changing rows/cols auto-resets plan but preserves students (per AGENTS.md).
