# 课堂展示页面：动画揭晓座位表

## TL;DR

> **核心目标**：在现有 React 应用中新增一个展示模式，通过四种不同动效逐个揭示座位，为课堂投屏创造戏剧性的揭晓体验。
>
> **交付物**：
> - `src/App.jsx` 标签切换（配置 ↔ 展示）
> - `src/components/Presentation/Presentation.jsx` — 展示页 React 组件
> - `src/components/Presentation.css` — 展示页深色主题 + 四种动画 `@keyframes`
>
> **预计工作量**：Medium（~350 行新代码 + 1 个现有文件小幅修改）
> **并行执行**：YES — 2 波（Wave 1: 基础 + CSS，Wave 2: 四种动画并行）
> **关键路径**：Task 1（App.jsx 标签）→ Task 3（骨架）→ Task 4-7（四种动画）→ Task 8（整合）

---

## Context

### 原始需求
规划开发一个单独的展示页面，便于课堂展示，页面中仅保留生成座位表按钮，按下后每个座位以一定动效逐渐展示，具有一定期待感，开发依据 impeccable skill。

### 访谈摘要
**关键决策**：
- 架构：React 子页面（非独立 HTML），与主界面共享 `SeatingContext`
- 切换方式：App.jsx 中 `useState('config' | 'present')` 标签切换
- 动画模式：四种全做 —— 翻转卡片、逐行渐显、跳跃弹出、扫描式揭示（左→右）
- 交互流程：标题 + 模式选择器 + 醒目按钮 → 点击 → 1-2s 前奏 → 动画揭示
- 生成策略：始终新鲜生成（忽略配置页已有方案），重新揭晓也重新生成
- 冲突处理：展示模式下隐藏 `ConflictDialog`，空方案静默回退
- 外观：全屏沉浸式深色背景，座位为主体，讲台在上方，"共 N 人"小字

**Impeccable 设计决策**：
- Register：product（工具型 UI，设计服务于功能）
- 场景：班主任上午班会投屏，全班学生盯着幕布等座位揭晓
- 色彩策略：**Committed** — 深色戏剧化背景（`#14181E`），座位用现有性别色（男 `#E8F0FE` / 女 `#FCE4EC`）在暗底上突出
- 动画曲线：`cubic-bezier(0.25, 0.8, 0.25, 1)`（ease-out-quart），仅 `transform` + `opacity`
- 绝对禁止：渐变文字、玻璃态、侧标签强调线、弹窗优先

### 调研发现
- **无 `@keyframes`**：项目现有 CSS 零动画定义，全部新建无冲突
- **`--color-accent*` 令牌未使用**：可重用于展示页
- **无暗色模式**：展示页需自定义 CSS 变量
- **最大网格**：20×20（400 座），44px 行高 → 1080p 投影完全容纳
- **`seatingPlan` 形状**：`Array<Array<{name, gender} | null>>`
- **`generatePlan()` 可能返回 `null`**：`seededArrange` 100 次全失败时
- **CSS 约定**：BEM-ish（`.btn`, `.btn-primary`, `.seat-male`, `.seat-female`）

### Metis 审查
**已解决的关键缺口**：
- 扫描方向 → 左→右（光带从左扫到右）
- 空方案回退 → 静默回到按钮初始状态
- 零学生 → 按钮 disabled + 提示文字
- 投影分辨率 → 目标 1920×1080 (16:9)，相对单位
- 学生人数警告 → 展示模式静默抑制
- 空座位 → 淡色轮廓，不参与动画序列
- 过道 → 始终可见
- 标签切换中途 → 组件卸载，`useEffect` cleanup 清除所有 timer

---

## Work Objectives

### 核心目标
在现有 React SPA 中新增展示视图，通过标签切换进入，提供四种座位动画揭示模式，为课堂投屏创造期待感和戏剧性。

### 交付物
1. `src/App.jsx` — 新增标签切换（`useState('config' | 'present')`）+ 条件渲染
2. `src/components/Presentation/Presentation.jsx` — 展示页组件（状态管理 + 网格渲染 + 四种动画引擎）
3. `src/components/Presentation.css` — 深色主题 + 动画 `@keyframes` + 网格样式

### 定义完成
- [ ] `npm run build` 通过
- [ ] 加载样例 → 切换到展示页 → 四种模式各生成一次 → 座位动画正常揭示
- [ ] 切换回配置页 → 配置参数保留（行数/列数/过道不变）
- [ ] 零学生 → 展示页按钮 disabled
- [ ] 约束冲突 → 展示页静默回退（无弹窗）

### 必须包含
- App.jsx 标签切换（配置 ↔ 展示），`activeTab` state
- 四种动画模式全部可工作（翻转/逐行/弹跳/扫描）
- 生成按钮 disabled 状态（动画播放中 / 零学生）
- 重新揭晓按钮（动画完成后出现）
- "共 N 人"显示 + 讲台 + 过道线
- 展示模式隐藏 ConflictDialog 和 Toolbar
- 组件卸载时清除所有 `setTimeout`

### 必须避免（Guardrails）
- **绝不修改** `SeatingContext.jsx`、任何算法文件、`SeatingChart/Seat/Aisle.jsx`
- **绝不修改** `ConfigPanel.jsx` 及其子组件、`Toolbar.jsx`、`ConflictDialog.jsx`
- **绝不修改** 任何现有 CSS 文件（`ConfigPanel.css`, `SeatingChart.css`, `Toolbar.css`, `ConflictDialog.css`, `App.css`, `index.css`）
- **绝不复用** `SeatingChart.jsx` 作为展示网格 —— 展示页建立独立网格渲染器
- **绝对禁止**（AI slop）：音效、倒计时、彩纸特效、速度选择器、localStorage 持久化
- **绝对禁止**：键盘快捷键、预览按钮、自动重播、导出按钮
- **绝对禁止**：响应式断点、暗色/亮色主题切换、标签过渡动画
- **绝对禁止**：新 npm 依赖

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — 全部验证由 Playwright 代理执行。

### Test Decision
- **Infrastructure exists**: 否
- **Automated tests**: 无（项目无测试基础设施）
- **Agent QA**: Playwright 浏览器自动化

### QA Policy
每个任务包含 Agent-Executed QA Scenarios。证据保存至 `.sisyphus/evidence/task-{N}-{scenario-slug}.png`。

---

## Execution Strategy

### 并行执行波

```
Wave 1（立即开始 — 基础 + 骨架）:
├── Task 1: App.jsx 标签切换 + 条件渲染 [quick]
├── Task 2: Presentation.css — 深色主题 + 网格样式 [visual-engineering]
└── Task 3: Presentation.jsx 骨架 — 状态管理 + 空状态 [quick]

Wave 2（Wave 1 完成后 — 四种动画并行）:
├── Task 4: 动画 — 翻转卡片 [visual-engineering]
├── Task 5: 动画 — 逐行渐显 [visual-engineering]
├── Task 6: 动画 — 跳跃弹出 [visual-engineering]
└── Task 7: 动画 — 扫描式揭示 [visual-engineering]

Wave 3（Wave 2 完成后 — 整合 + 边缘情况）:
├── Task 8: 模式选择器 + 重新揭晓按钮 + 边缘情况 [visual-engineering]
└── Task 9: Playwright 端到端验证 [unspecified-high]

Wave FINAL（所有任务后 — 4 个并行审查）:
├── Task F1: Plan Compliance Audit (oracle)
├── Task F2: Code Quality Review (unspecified-high)
├── Task F3: Real Manual QA (unspecified-high + playwright)
└── Task F4: Scope Fidelity Check (deep)
```

### 依赖矩阵

| 任务 | 依赖 | 阻塞 | 波次 |
|------|------|------|------|
| 1 (App.jsx) | — | 3 | 1 |
| 2 (CSS) | — | 4-8 | 1 |
| 3 (骨架) | 1 | 4-7 | 1 |
| 4 (翻转) | 2, 3 | 8 | 2 |
| 5 (逐行) | 2, 3 | 8 | 2 |
| 6 (弹跳) | 2, 3 | 8 | 2 |
| 7 (扫描) | 2, 3 | 8 | 2 |
| 8 (整合) | 4-7 | 9 | 3 |
| 9 (验证) | 8 | F1-F4 | 3 |

### Agent Dispatch Summary

- **Wave 1**: 3 — T1→`quick`, T2→`visual-engineering`, T3→`quick`
- **Wave 2**: 4 — T4-T7→`visual-engineering`（并行）
- **Wave 3**: 2 — T8→`visual-engineering`, T9→`unspecified-high` (+ `playwright`)
- **FINAL**: 4 — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

- [x] 1. App.jsx — 标签切换 + 条件渲染

  **What to do**:
  - 在 `App.jsx` 顶部添加 `useState`：`const [activeTab, setActiveTab] = useState('config')`
  - 在 `<SeatingProvider>` 内部、现有内容上方添加标签栏：
    ```jsx
    <div className="tab-bar">
      <button className={`tab ${activeTab === 'config' ? 'active' : ''}`}
              onClick={() => setActiveTab('config')}>⚙️ 配置</button>
      <button className={`tab ${activeTab === 'present' ? 'active' : ''}`}
              onClick={() => setActiveTab('present')}>🎭 展示</button>
    </div>
    ```
  - 条件渲染现有内容：`{activeTab === 'config' && (<>原有 Toolbar + ConfigPanel + SeatingChart</>)}`
  - 条件渲染展示页：`{activeTab === 'present' && <Presentation />}`
  - 条件渲染 ConflictDialog：`{activeTab === 'config' && <ConflictDialog />}`
  - 导入 Presentation：`import Presentation from './components/Presentation/Presentation'`
  - 标签 CSS 写在 `src/App.css`：水平排列、底部高亮指示器、字体 `--text-sm`

  **Must NOT do**:
  - 不要修改 `SeatingProvider` 包裹方式
  - 不要添加路由库
  - 不要在标签栏使用侧标签强调线

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单 state 添加 + 条件渲染，3 个文件微调
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3)
  - **Blocks**: T3
  - **Blocked By**: None

  **References**:
  - `src/App.jsx:1-30` — 当前 App 结构，理解 `SeatingProvider` 包裹 + 现有组件渲染顺序
  - `src/App.css:1-20` — 现有 App 布局样式，追加标签栏 CSS

  **Acceptance Criteria**:
  - [ ] 页面加载默认显示「配置」标签，现有界面完整显示
  - [ ] 点击「展示」标签切换视图，ConfigPanel/Toolbar/SeatingChart 隐藏
  - [ ] 点击「配置」标签切回，所有配置参数保留
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 标签切换往返
    Tool: Playwright
    Steps:
      1. 打开 http://localhost:5173 → 默认在配置标签
      2. 断言 ConfigPanel (.config-panel) 可见
      3. 断言展示组件 (.presentation-view) 不存在
      4. 点击「展示」标签 → 断言 .presentation-view 可见
      5. 断言 .config-panel 不可见
      6. 点击「配置」标签 → 断言 .config-panel 再次可见
    Expected Result: 标签切换正常，组件正确挂载/卸载
    Evidence: .sisyphus/evidence/task-1-tabs.png

  Scenario: 展示模式下 ConflictDialog 不可见
    Tool: Playwright
    Preconditions: 加载有冲突的 config.json + 样例
    Steps:
      1. 在配置页加载样例 + config.json → 点击生成座位表
      2. 断言 ConflictDialog (.conflict-overlay) 可见
      3. 切换到展示标签
      4. 断言 .conflict-overlay 不可见
    Expected Result: 展示模式无弹窗遮罩
    Evidence: .sisyphus/evidence/task-1-no-conflict.png
  ```

  **Commit**: YES (groups with T2, T3)
  - Message: `feat(present): tab toggle + conditional rendering`
  - Files: `src/App.jsx`, `src/App.css`

- [x] 2. Presentation.css — 深色主题 + 网格样式 + 动画 @keyframes

  **What to do**:
  - 创建 `src/components/Presentation.css`
  - 定义深色主题 CSS 变量（scoped to `.presentation-view`）：
    ```css
    .presentation-view {
      --present-bg: #14181E;
      --present-text: #E8ECF1;
      --present-text-muted: #6B7280;
      --present-accent: var(--color-accent);
    }
    ```
  - 页面级布局：flex column, `min-height: 100vh`, `background: var(--present-bg)`, `color: var(--present-text)`
  - 标题样式：`.presentation-title` — `font-size: var(--text-xl)`, bold, centered, `margin-bottom: var(--space-lg)`
  - 人数显示：`.student-count` — `font-size: var(--text-xs)`, `color: var(--present-text-muted)`, right-aligned
  - 座位网格：`.present-grid` — CSS Grid, `display: grid`, `justify-content: center`, `gap: 4px`
  - 座位单元格：`.present-seat` — `width: 80px; height: 44px`, `border-radius: var(--radius-sm)`, flex center
  - 性别色：`.present-seat.male` (bg `#E8F0FE`, border `#A8C8FA`) `.present-seat.female` (bg `#FCE4EC`, border `#F48FB1`)
  - 空座位轮廓：`.present-seat.empty` — 透明背景 + 虚线边框 `border: 1px dashed var(--present-text-muted)`
  - 座位初始隐藏状态：`.present-seat` 默认 `opacity: 0; transform: scale(0)`，`.present-seat.revealed` 显示
  - 过道：`.present-aisle` — 20px 宽透明间距
  - 讲台：`.podium` — 居中文字 "讲台", `--text-xs`, `--present-text-muted`
  - 按钮样式：复用 `.btn .btn-primary`（从 `ConfigPanel.css` 继承），追加 `.reveal-btn` 尺寸放大 + `.reveal-btn:disabled` 样式
  - "重新揭晓"按钮：`.reveal-again-btn` — 比主按钮小一号，居中
  - 重写 `ConfigPanel.css` 中 `.btn:disabled` 的暗色适配（如果被覆盖）
  - 四种动画的 `@keyframes` 定义：
    - `@keyframes flipIn` — rotateY(90deg) → rotateY(0)
    - `@keyframes fadeIn` — opacity: 0 → 1
    - `@keyframes bouncePop` — scale(0) → scale(1.15) → scale(1)
    - `@keyframes scanGlow` — 光带扫过（使用伪元素）
  - 动画应用类：`.anim-flip .present-seat.revealed`, `.anim-fade .present-seat.revealed`, `.anim-bounce .present-seat.revealed`, `.anim-scan .present-seat.revealed`

  **Must NOT do**:
  - 不要创建 CSS 模块文件
  - 不要修改 `src/index.css` 中的 `:root` 变量
  - 不要使用 `@import`
  - 不要使用渐变文字、玻璃态、弹跳/弹性缓动（bounce/elastic）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 深色主题设计 + 复杂动画 @keyframes + Impeccable 合规
  - **Skills**: `['impeccable']`
    - `impeccable`: 确保深色主题不触碰 AI slop 反模式（渐变文字、玻璃态等）

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3)
  - **Blocks**: T4, T5, T6, T7
  - **Blocked By**: None

  **References**:
  - `src/index.css:1-61` — `:root` 设计令牌（`--color-*`, `--text-*`, `--space-*`, `--radius-*`, `--shadow-*`）
  - `src/components/SeatingChart.css:1-80` — 现有座位网格样式（`.seat`, `.seat-male`, `.seat-female`, `.aisle`）
  - `src/components/ConfigPanel.css:1-30` — `.btn`, `.btn-primary` 按钮类定义
  - `src/App.css` — App 级布局样式

  **Acceptance Criteria**:
  - [ ] CSS 文件不包含任何 Impeccable 绝对禁止项（渐变文字、玻璃态、侧标签线）
  - [ ] 深色背景变量正确：背景 `#14181E`、文字 `#E8ECF1`
  - [ ] 四种 `@keyframes` 定义完整，使用 `transform` + `opacity` 仅
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 深色主题视觉验证
    Tool: Playwright
    Steps:
      1. 切换到展示标签
      2. 断言 .presentation-view background-color 为 rgb(20, 24, 30)
      3. 断言文字颜色为浅色
    Expected Result: 深色主题正确渲染
    Evidence: .sisyphus/evidence/task-2-dark-theme.png
  ```

  **Commit**: YES (groups with T1, T3)
  - Message: `feat(present): dark theme + grid styles + animation keyframes`
  - Files: `src/components/Presentation.css`

- [x] 3. Presentation.jsx 骨架 — 状态管理 + 空状态 + 基础网格

  **What to do**:
  - 创建 `src/components/Presentation/Presentation.jsx`
  - 导入：`import { useSeating } from '../../context/SeatingContext'` + `import '../Presentation.css'`
  - 组件内状态（全为本地 `useState`/`useRef`，不污染 Context）：
    ```js
    const [animationMode, setAnimationMode] = useState('flip') // 'flip'|'fade'|'bounce'|'scan'
    const [isAnimating, setIsAnimating] = useState(false)
    const [hasRevealed, setHasRevealed] = useState(false)
    const [revealedSeats, setRevealedSeats] = useState(new Set())
    const timerRef = useRef([])
    ```
  - 从 Context 读取：`const { students, seatingPlan, nRows, nCols, aisles, generatePlan } = useSeating()`
  - 空状态判断：
    - `students.length === 0` → 显示提示「请先在配置页加载学生名单」，按钮 disabled
    - `!seatingPlan && !isAnimating` → 显示初始状态（按钮可用）
  - `handleReveal()` 函数（占位）：
    ```js
    const handleReveal = () => {
      const result = generatePlan() // 触发 Context 中的 generatePlan
      // result 通过 useEffect 监听 seatingPlan 变化来感知
    }
    ```
  - `useEffect` 监听 `seatingPlan` 变化：当 `seatingPlan` 变为非 null → 触发动画
  - 基础网格渲染（无动画）：遍历 `seatingPlan[r][c]`，渲染 `.present-seat`（暂不连接动画）
  - 过道渲染：在两个块之间插入 `<div className="present-aisle" />`
  - 讲台渲染：网格上方 `<div className="podium">讲台</div>`
  - "共 N 人"：`<div className="student-count">共 {students.length} 人</div>`
  - 所有 `timerRef.current` 在 `useEffect` cleanup 中清除：
    ```js
    useEffect(() => () => { timerRef.current.forEach(clearTimeout) }, [])
    ```
  - 处理 `seatingPlan === null`（`generatePlan()` 失败）：setIsAnimating(false), setHasRevealed(false) — 静默回退

  **Must NOT do**:
  - 不要在 `SeatingContext` 中添加任何状态
  - 不要在此任务中实现动画逻辑（仅骨架）
  - 不要在展示页中渲染 `ModeSelector` 或任何配置组件

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 标准 React 组件结构，`useSeating()` 消费 + 本地状态管理
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (but sequential within Wave 1 — depends on T1)
  - **Blocks**: T4, T5, T6, T7
  - **Blocked By**: T1

  **References**:
  - `src/context/SeatingContext.jsx:1-152` — `useSeating()` 导出的所有状态和函数
  - `src/components/SeatingChart/SeatingChart.jsx:1-84` — 现有网格渲染逻辑（`seatingPlan[r][c]` 遍历、`gridTemplateColumns` 计算）
  - `src/components/ConfigPanel/ModeSelector.jsx:1-52` — `generatePlan()` 调用模式
  - `src/utils/blockUtils.js:1-22` — `getBlockStructure(nCols, aisles)` 返回 0-indexed blockRanges

  **Acceptance Criteria**:
  - [ ] 零学生时按钮 disabled，显示提示文字
  - [ ] 有学生时按钮可用，点击调用 `generatePlan()`
  - [ ] 座位网格正确渲染（含性别色、空座位轮廓、过道线）
  - [ ] 讲台在网格上方显示
  - [ ] "共 N 人" 显示正确人数
  - [ ] 组件卸载时 timer 被清除（无内存泄漏）

  **QA Scenarios**:
  ```
  Scenario: 零学生空状态
    Tool: Playwright
    Preconditions: 不加载任何 CSV
    Steps:
      1. 切换到展示标签
      2. 断言按钮 (.reveal-btn) 有 disabled 属性
      3. 断言提示文字「请先在配置页加载学生名单」可见
    Expected Result: 空状态正确显示
    Evidence: .sisyphus/evidence/task-3-empty.png

  Scenario: 基础网格渲染
    Tool: Playwright
    Preconditions: 在配置页加载样例 40 人，rows=8, cols=7, aisles=[2,5]
    Steps:
      1. 切换到展示标签 → 点击揭晓按钮
      2. 断言座位 (.present-seat) 数量 = 56 (8×7)
      3. 断言过道 (.present-aisle) 可见
      4. 断言讲台文字「讲台」可见
      5. 断言「共 40 人」可见
    Expected Result: 网格完整渲染，过道和讲台存在
    Evidence: .sisyphus/evidence/task-3-grid.png
  ```

  **Commit**: YES (groups with T1, T2)
  - Message: `feat(present): component skeleton with state management`
  - Files: `src/components/Presentation/Presentation.jsx`

- [x] 4. 动画 — 翻转卡片

  **What to do**:
  - 实现 `animateFlip(seatingPlan, nRows, nCols, timerRef, setRevealed)` 函数
  - 逻辑：逐行、每行从左到右，每个座位延迟 80ms × (row × nCols + col)
  - 每到一个座位：添加 `.revealed` 类（触发 `@keyframes flipIn`：`rotateY(90deg)` → `rotateY(0)`）
  - 动画持续时间：每个座位 400ms（CSS `animation-duration`）
  - 总时长 ~ 56 × 80ms + 400ms ≈ 4.9s
  - 实现 `perspective` 和 `backface-visibility` 确保 3D 效果
  - 所有 timeout ID 推入 `timerRef.current` 数组
  - 动画完成后：`setIsAnimating(false)`, `setHasRevealed(true)`
  - 动画中防止重复触发：`if (isAnimating) return`

  **Must NOT do**:
  - 不要使用 `requestAnimationFrame`（与 `setTimeout` 混合会导致时序错乱）
  - 不要在 CSS 中动画 `width`/`height`/`position`

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 3D CSS transform + 精确时序控制
  - **Skills**: `['impeccable']`
    - `impeccable`: 确保动画曲线合规（ease-out-quart）、无反弹/弹性

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T5, T6, T7)
  - **Blocks**: T8
  - **Blocked By**: T2, T3

  **References**:
  - `src/components/Presentation.css` — `@keyframes flipIn` 定义（T2 产物）
  - `src/components/Presentation/Presentation.jsx` — 骨架代码（T3 产物）

  **Acceptance Criteria**:
  - [ ] 选择翻转模式 → 点击揭晓 → 座位逐个 3D 翻转出现
  - [ ] 动画中按钮 disabled，动画完成后「重新揭晓」出现
  - [ ] 每个座位延迟增量均匀（80ms），无跳跃或卡顿
  - [ ] 3D 透视效果可见（perspective 生效）

  **QA Scenarios**:
  ```
  Scenario: 翻转卡片完整播放
    Tool: Playwright
    Preconditions: 加载样例 40 人，切换到展示页
    Steps:
      1. 选择翻转卡片模式
      2. 点击揭晓按钮
      3. 等待动画完成（timeout: 10s）
      4. 断言所有 .present-seat 有 .revealed 类
      5. 断言 .reveal-again-btn 可见（非 .reveal-btn）
    Expected Result: 全部座位翻转揭示，重新揭晓按钮出现
    Evidence: .sisyphus/evidence/task-4-flip.png

  Scenario: 动画中按钮 disabled
    Tool: Playwright
    Steps:
      1. 点击揭晓按钮
      2. 立即断言 .reveal-btn 为 disabled
      3. 快速再次点击（应无效果）
    Expected Result: 按钮在动画期间不可点击
    Evidence: .sisyphus/evidence/task-4-disabled.png
  ```

  **Commit**: YES (groups with T5, T6, T7)
  - Message: `feat(present): flip card animation`
  - Files: `src/components/Presentation/Presentation.jsx`, `src/components/Presentation.css`

- [x] 5. 动画 — 逐行渐显

  **What to do**:
  - 实现 `animateFade(seatingPlan, nRows, nCols, timerRef, setRevealed)` 函数
  - 逻辑：整行一起淡入，每行延迟 400ms，同一行内所有座位同时添加 `.revealed`
  - CSS 动画 `@keyframes fadeIn`：`opacity: 0` → `opacity: 1`，持续时间 600ms
  - 节奏：行 0 在 0ms 触发 → 行 1 在 400ms → … → 行 7 在 2800ms
  - 总时长 ~ 2800ms + 600ms ≈ 3.4s
  - 同一行使用一个 timeout：`setTimeout(() => row.forEach(col => addRevealed(row, col)), rowDelay)`

  **Must NOT do**:
  - 不要逐列延迟（那会变成翻转风格）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 批量元素同步动画 + 行级时序
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T4, T6, T7)
  - **Blocks**: T8
  - **Blocked By**: T2, T3

  **References**:
  - `src/components/Presentation.css` — `@keyframes fadeIn` 定义
  - `src/components/Presentation/Presentation.jsx` — 骨架代码

  **Acceptance Criteria**:
  - [ ] 选择逐行模式 → 点击揭晓 → 第一行同时淡入 → 第二行 400ms 后淡入...
  - [ ] 同行内所有座位同时出现（非逐个）
  - [ ] 动画完成后「重新揭晓」出现

  **QA Scenarios**:
  ```
  Scenario: 逐行渐显行级同步
    Tool: Playwright
    Preconditions: 加载样例 40 人，8 行 7 列
    Steps:
      1. 选择逐行渐显模式 → 点击揭晓
      2. 等待 800ms（第 0 行 + 第 1 行应已显示）
      3. 断言第 0 行所有座位有 .revealed
      4. 断言第 1 行所有座位有 .revealed
      5. 断言第 5 行座位暂无 .revealed
    Expected Result: 行级同步淡入
    Evidence: .sisyphus/evidence/task-5-fade.png
  ```

  **Commit**: YES (groups with T4, T6, T7)
  - Message: `feat(present): row fade animation`
  - Files: `src/components/Presentation/Presentation.jsx`

- [x] 6. 动画 — 跳跃弹出

  **What to do**:
  - 实现 `animateBounce(seatingPlan, nRows, nCols, timerRef, setRevealed)` 函数
  - 逻辑：随机打乱座位顺序，每隔 70ms 弹出一个座位（非行优先）
  - 随机化：`shuffle(所有座位坐标)`，然后按 shuffle 顺序 apply
  - CSS 动画 `@keyframes bouncePop`：`scale(0) → scale(1.15) → scale(1)`，持续时间 500ms
  - 使用 `cubic-bezier(0.34, 1.56, 0.64, 1)` 作为弹性效果（非 bounce 库，纯 CSS 曲线）
  - 总时长 ~ 56 × 70ms + 500ms ≈ 4.4s
  - 随机种子：不需要（每次不同即可）

  **Must NOT do**:
  - 不要使用 `Math.random()` 在渲染循环中（用 `useMemo` 或 `useRef` 缓存 shuffle 结果）
  - 不要使用 `@keyframes` 中 `bounce` / `elastic` 命名（暗示反弹）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 随机化序列 + 弹性曲线微调
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T4, T5, T7)
  - **Blocks**: T8
  - **Blocked By**: T2, T3

  **References**:
  - `src/components/Presentation.css` — `@keyframes bouncePop` 定义
  - `src/components/Presentation/Presentation.jsx` — 骨架代码

  **Acceptance Criteria**:
  - [ ] 选择弹跳模式 → 点击揭晓 → 座位以随机顺序弹出
  - [ ] 弹跳有缩放过冲效果（1.15 → 1）
  - [ ] 每次生成的弹出顺序不同（随机性）
  - [ ] 动画完成后「重新揭晓」出现

  **QA Scenarios**:
  ```
  Scenario: 弹跳随机顺序
    Tool: Playwright
    Preconditions: 加载样例 40 人
    Steps:
      1. 选择跳跃弹出模式 → 点击揭晓
      2. 录制第一次动画的座位出现顺序（截图序列）
      3. 点击重新揭晓 → 再次录制
      4. 对比两次顺序：应不同
    Expected Result: 随机顺序弹出，每次不同
    Evidence: .sisyphus/evidence/task-6-bounce.png
  ```

  **Commit**: YES (groups with T4, T5, T7)
  - Message: `feat(present): bounce pop animation`
  - Files: `src/components/Presentation/Presentation.jsx`

- [x] 7. 动画 — 扫描式揭示

  **What to do**:
  - 实现 `animateScan(seatingPlan, nRows, nCols, timerRef, setRevealed)` 函数
  - 逻辑：模拟光带从左到右扫过，经过的座位瞬间揭示
  - 不依赖伪元素扫描条（可能性能差），改用列优先时序：列 0 → 列 1 → … → 列 nCols-1
  - 每列延迟 120ms，列内所有行同时揭示
  - CSS：`.anim-scan .present-seat.revealed` 使用 `@keyframes scanReveal`：`clip-path: inset(0 100% 0 0) → inset(0 0 0 0)` + `opacity: 0 → 1`
  - 总时长 ~ 7 × 120ms + 300ms ≈ 1.14s（最快）
  - 可选项（锦上添花）：添加一道半透明水平光带（CSS 伪元素 `::after` with `left: 0→100%` 动画），与列揭示同步

  **Must NOT do**:
  - 不要使用 `clip-path` 做复杂形状（仅矩形裁剪 `inset`）
  - 光带效果是可选的（非必须），如加则需在 300ms 内完成

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 列级时序 + `clip-path` 动画
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T4, T5, T6)
  - **Blocks**: T8
  - **Blocked By**: T2, T3

  **References**:
  - `src/components/Presentation.css` — `@keyframes scanReveal` 定义
  - `src/components/Presentation/Presentation.jsx` — 骨架代码

  **Acceptance Criteria**:
  - [ ] 选择扫描模式 → 点击揭晓 → 座位从左列到右列依次揭示
  - [ ] 列内所有座位同时出现
  - [ ] 扫描总时长 < 2s（最快的动画）
  - [ ] 动画完成后「重新揭晓」出现

  **QA Scenarios**:
  ```
  Scenario: 扫描列级揭示
    Tool: Playwright
    Preconditions: 加载样例 40 人，8 行 7 列
    Steps:
      1. 选择扫描式揭示 → 点击揭晓
      2. 等待 300ms
      3. 断言第 0 列所有座位有 .revealed
      4. 断言第 1 列部分座位有 .revealed
      5. 断言第 6 列座位暂无 .revealed
    Expected Result: 左→右列级扫描
    Evidence: .sisyphus/evidence/task-7-scan.png
  ```

  **Commit**: YES (groups with T4, T5, T6)
  - Message: `feat(present): scan reveal animation`
  - Files: `src/components/Presentation/Presentation.jsx`

- [x] 8. 模式选择器 + 重新揭晓 + 边缘情况整合

  **What to do**:
  - 模式选择器 UI：四个选项（翻转卡片 / 逐行渐显 / 跳跃弹出 / 扫描式揭示）
  - 复用 `.mode-selector` + `.mode-option` 样式模式（从 `ConfigPanel.css`）
  - 选中态高亮当前模式
  - 重新揭晓按钮：`{hasRevealed && !isAnimating && <button className="btn btn-primary reveal-again-btn" onClick={handleReveal}>🔄 重新揭晓</button>}`
  - 整合四种动画函数调度：
    ```js
    useEffect(() => {
      if (!seatingPlan || isAnimating) return
      setIsAnimating(true)
      switch (animationMode) {
        case 'flip': animateFlip(...); break
        case 'fade': animateFade(...); break
        case 'bounce': animateBounce(...); break
        case 'scan': animateScan(...); break
      }
    }, [seatingPlan, animationMode])
    ```
  - 边缘情况处理：
    - `generatePlan()` 返回 null → `useEffect` 不触发（`!seatingPlan` guard），`setIsAnimating(false)`, `setHasRevealed(false)` — 静默回退到按钮状态
    - 动画中切换动画模式 → 忽略（`if (isAnimating) return`）
    - 快速连续点击重新揭晓 → 忽略（同上）
  - 确保 `seatingPlan` watch 在每次 `generatePlan()` 后正确触发（可能在同一个 tick 中 Context 已更新）

  **Must NOT do**:
  - 不要为模式选择器创建新 CSS 类（复用 `.mode-selector` + `.mode-option`）
  - 不要在展示页暴露生成模式（random/gender）选择

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 整合 + 动画调度逻辑 + 边缘情况
  - **Skills**: `['impeccable']`
    - `impeccable`: 确保模式选择器 UI 不触碰反模式

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential after T4-T7)
  - **Blocks**: T9
  - **Blocked By**: T4, T5, T6, T7

  **References**:
  - `src/components/Presentation/Presentation.jsx` — 骨架 + 四种动画函数
  - `src/components/Presentation.css` — 所有样式
  - `src/components/ConfigPanel/ModeSelector.jsx:14-41` — `.mode-selector` + `.mode-option` 复用模式

  **Acceptance Criteria**:
  - [ ] 四种模式可切换，选中态高亮
  - [ ] 重新揭晓按钮在动画完成后出现
  - [ ] 约束冲突时静默回退（无弹窗，按钮恢复可用）
  - [ ] 动画中切换模式无效果
  - [ ] 快速连击重新揭晓无错误

  **QA Scenarios**:
  ```
  Scenario: 完整流程：模式选择 → 揭晓 → 重新揭晓
    Tool: Playwright
    Steps:
      1. 加载样例 → 切换到展示页
      2. 选择「逐行渐显」→ 点击揭晓 → 等待动画完成
      3. 断言 .reveal-again-btn 可见
      4. 切换模式到「翻转卡片」→ 点击重新揭晓
      5. 断言座位以翻转方式重新揭示
    Expected Result: 模式切换生效，重新揭晓正常
    Evidence: .sisyphus/evidence/task-8-regen.png

  Scenario: 约束冲突静默回退
    Tool: Playwright
    Preconditions: 加载 impossible 约束 config
    Steps:
      1. 加载样例 + 不可能约束 → 切换到展示页
      2. 点击揭晓按钮
      3. 断言无 .conflict-overlay
      4. 断言按钮恢复为 .reveal-btn（非 disabled）
      5. 断言无座位渲染
    Expected Result: 静默回退，无弹窗
    Evidence: .sisyphus/evidence/task-8-silent.png
  ```

  **Commit**: YES
  - Message: `feat(present): mode selector + regen + edge cases`
  - Files: `src/components/Presentation/Presentation.jsx`, `src/components/Presentation.css`

- [x] 9. Playwright 端到端验证

  **What to do**:
  - 确认 `npm run dev` 运行中
  - 执行完整 QA 矩阵（所有场景从 T1-T8）
  - 验证跨任务集成：
    1. 加载样例 40 人 → 配置页设置 rows=8, cols=7, aisles=[2,5]
    2. 切换到展示页 → 四种模式各执行一次完整动画
    3. 每次动画后点击「重新揭晓」→ 验证新方案生成 + 动画重播
    4. 切换回配置页 → 验证参数保留（rows/cols/aisles 不变）
    5. 切换回展示页 → 再次生成 → 验证状态重置正确
  - 截图保存到 `.sisyphus/evidence/final-qa/`

  **Must NOT do**:
  - 不要只测试一个模式

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 综合性端到端验证，需 Playwright 技能
  - **Skills**: `['playwright']`
    - `playwright`: 浏览器自动化 + 截图取证

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after T8)
  - **Blocks**: F1-F4
  - **Blocked By**: T8

  **References**:
  - `src/components/Presentation/Presentation.jsx` — 完整组件
  - `src/components/Presentation.css` — 完整样式

  **Acceptance Criteria**:
  - [ ] 四种动画模式全部通过
  - [ ] 重新揭晓功能正常
  - [ ] 标签往返切换参数保留
  - [ ] 零学生/约束冲突边缘情况正常
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 全动画矩阵 + 往返切换
    Tool: Playwright
    Steps:
      1. 加载样例 → 设置 8×7, aisles=[2,5]
      2. for mode in [翻转, 逐行, 弹跳, 扫描]:
         a. 切换到展示页 → 选择 mode → 点击揭晓
         b. 等待动画完成 → 截图
         c. 点击重新揭晓 → 等待完成 → 截图
      3. 切换回配置页 → 断言 rows=8, cols=7, aisles=[2,5]
      4. 切换到展示页 → 断言按钮可用（非 disabled）
    Expected Result: 全部通过
    Evidence: .sisyphus/evidence/final-qa/
  ```

  **Commit**: NO (验证任务，无代码变更)

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`
  读取计划逐项验证：Must Have 全部存在（grep/read 文件），Must NOT Have 全部缺失（搜索禁止模式 file:line），证据文件存在 `.sisyphus/evidence/`。
  输出：`Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  运行 `npm run build` + `npm run lint`。检查所有变更文件：`as any`/`@ts-ignore`、空 catch、console.log、注释掉的代码、未使用导入。检查 AI slop 反模式。
  输出：`Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright`)
  从零状态启动。执行所有任务的 QA Scenarios（精确步骤、选择器、断言）。测试跨任务集成：四种动画各播放一次 → 重新揭晓 → 标签切换往返。
  保存至 `.sisyphus/evidence/final-qa/`。
  输出：`Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  逐任务验证：对比 "What to do" 与实际 `git diff`。确认所有规格内交付物存在，无规格外变更。检查 Must NOT do 合规性。检测跨任务污染。
  输出：`Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(present): tab toggle + skeleton + dark theme` — `App.jsx`, `Presentation.jsx`, `Presentation.css`
- **Wave 2**: `feat(present): four animation modes` — `Presentation.jsx`, `Presentation.css`
- **Wave 3**: `feat(present): mode selector + polish` — `Presentation.jsx`, `Presentation.css`

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: ✓ built, no errors
npm run lint   # Expected: 0 errors, 0 warnings
```

### Final Checklist
- [ ] 加载样例 → 展示页 → 四种模式各生成 → 动画正常揭示
- [ ] 重新揭晓 → 生成新方案 → 动画重播
- [ ] 切换回配置 → 参数保留
- [ ] 零学生 → 按钮 disabled
- [ ] 约束冲突 → 静默回退
- [ ] `npm run build` 通过
- [ ] 无现有文件被修改（除 App.jsx）
- [ ] 无新 npm 依赖
