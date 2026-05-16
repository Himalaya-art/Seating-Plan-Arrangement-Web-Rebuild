# 约束算法重构：种子放置 (Seeded Placement)

## TL;DR

> **核心目标**：用"先放置约束学生、传播限制、后填充剩余"的构造式算法替代当前的"先随机填充、后迭代交换"修复式算法，从根本上解决约束冲突频繁无法求解的问题。
>
> **关键改动**：
> - 新建 `src/algorithms/seededArrange.js`（统一入口，含约束传播引擎）
> - 重构 `src/algorithms/randomArrange.js` / `genderArrange.js`（仅保留无约束的简单路径）
> - 废弃 `src/algorithms/constraintSolver.js`（不再需要修补式求解器）
>
> **预计工作量**：Medium（~200-300 行新代码 + 修改现有 3 个文件）

---

## Context

### 现有求解器致命缺陷

| 问题 | 描述 |
|------|------|
| **局部贪心** | 每次只修复一个违反，不评估全局最优交换，易陷入局部最优 |
| **无回溯** | 修复失败后仅回滚当前交换，不尝试替代路径 |
| **级联破裂** | 将目标学生换入区域时，挤出另一个有约束的学生，造成新的违反 |
| **无视模式** | 在性别分离模式下交换无视块的性别归属，破坏性别分离 |
| **单步修复** | 每轮只修一个违反就 `break`，收敛极慢 |
| **无约束传播** | 不理解一个约束满足会缩小其他约束的可行空间 |

### 用户提出的新思路

```
配置文件存在时 → 优先确定配置学生位置
→ 逐一随机选择座位
→ 每确定一人，根据范围和模式确定周围座位属性
→ with：同时安排对应学生
→ without：为对应座位创建排除列表
→ 顺次处理下一位，每次基于上一位的影响
→ 配置学生处理完毕后，用原有算法填充剩余
→ 尝试 3-5 次，若仍失败则报告
```

---

## Work Objectives

### 核心目标
用**构造式种子放置**替代**修复式迭代交换**，使约束求解从"碰运气"变为"确定性逐层构建"。

### 交付物
1. `src/algorithms/seededArrange.js` — 统一入口，含种子放置 + 约束传播 + 剩余填充
2. `src/algorithms/randomArrange.js` — 精简为仅无约束路径
3. `src/algorithms/genderArrange.js` — 精简为仅无约束路径
4. `src/algorithms/constraintSolver.js` — 删除（功能由 seededArrange 替代）
5. `src/context/SeatingContext.jsx` — 接入新算法

### 定义完成
- [ ] `npm run build` 通过
- [ ] 样例 40 人 + config.json（小明 约束）→ 两种模式下均成功生成，无冲突弹窗
- [ ] 无约束路径行为不变（回归测试）

### 必须包含
- 种子放置（约束学生优先）
- with 约束触发的递归放置
- without 约束生成的排除列表
- 性别模式下块性别传播
- 3-5 次重试机制

### 必须避免
- 约束求解失败后静默忽略
- 性别模式下违反块性别一致性
- 重试次数不足就放弃

---

## 验证策略

- **自动化测试**：否（项目无测试基础设施）
- **Agent QA**：Playwright 在浏览器中手动测试以下场景
  1. 加载样例 → 加载 config.json（小明约束）→ 随机模式 → 生成（应无冲突）
  2. 加载样例 → 加载 config.json → 性别模式 → aisles=[2,5] → 生成（应无冲突）
  3. 修改 config.json 为不可能满足的约束 → 生成 → 应弹窗提示冲突
  4. 无 config.json → 两种模式 → 行为与改动前一致

---

## 执行策略

### 并行执行波

```
Wave 1（立即开始）:
├── Task 1: 编写 seededArrange.js — 核心数据结构
├── Task 2: 编写 seededArrange.js — 种子放置引擎
└── Task 3: 编写 seededArrange.js — 剩余填充 + 重试循环

Wave 2（依赖 Wave 1）:
├── Task 4: 精简 randomArrange.js（仅无约束路径）
├── Task 5: 精简 genderArrange.js（仅无约束路径）
└── Task 6: 更新 SeatingContext.jsx 接入新算法

Wave 3（依赖 Wave 2）:
└── Task 7: 删除 constraintSolver.js，清理导入

Wave FINAL（所有任务后）:
├── Task F1: Playwright 验证 — 约束场景测试
├── Task F2: Playwright 验证 — 无约束回归测试
└── Task F3: npm run build 确认
```

### 依赖矩阵

| 任务 | 依赖 | 阻塞 | 波次 |
|------|------|------|------|
| T1-T3 | — | T4-T6 | 1 |
| T4 | T1-T3 | T7 | 2 |
| T5 | T1-T3 | T7 | 2 |
| T6 | T1-T3 | T7 | 2 |
| T7 | T4-T6 | F1-F3 | 3 |
| F1-F3 | T7 | — | FINAL |

---

## TODOs

- [x] 1. 编写 `seededArrange.js` — 数据模型与工具函数

  **What to do**:
  - 定义核心数据结构：
    ```js
    // 座位状态
    CellState: { student: null | {name, gender}, genderLock: null | '男'|'女' }
    
    // 全局追踪
    placed: Set<studentName>         // 已放置学生
    exclusionMap: Map<"r-c", Set<name>>  // 每座位的排除名单
    genderLocks: Map<"r-c", '男'|'女'>  // 性别锁定（性别模式用）
    
    // 约束依赖图
    constraintGraph: {
      deps: Map<name, {withAdj: name[], withRange: name[], withoutAdj: name[], withoutRange: name[]}>
    }
    ```
  - 编写辅助函数：
    - `buildConstraintGraph(constraints)` — 从 config.json 构建依赖图
    - `getConstrainedNames(constraints)` — 收集所有涉及约束的学生名
    - `sortByConstraintCount(graph)` — 按约束数量降序排列（越多约束越先放置）
    - `getStudentData(students, name)` — 从学生列表查找学生对象
    - `isSeatAvailable(grid, r, c, exclusionMap, name)` — 检查座位可用性
    - `findValidSeats(grid, nRows, nCols, student, exclusions, genderLocks, mode)` — 找所有合法座位

  **Must NOT do**:
  - 不要在工具函数里直接修改 grid
  - 不要假设 config.json 一定存在

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 数据结构设计需要仔细考虑所有约束类型
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3)
  - **Blocks**: T4, T5, T6
  - **Blocked By**: None

  **References**:
  - `src/algorithms/constraintSolver.js:37-113` — 当前约束检查逻辑，了解四种约束类型的语义
  - `src/utils/blockUtils.js:1-22` — `getBlockStructure()` 返回 0-indexed blockRanges
  - `src/utils/blockUtils.js:40-72` — `getAdjacencyRegion()` / `getRangeRegion()` 区域计算
  - `config.json` — 了解约束配置的数据格式

  **Acceptance Criteria**:
  - [ ] `buildConstraintGraph()` 能正确解析四种约束类型
  - [ ] `sortByConstraintCount()` 返回按约束数降序的学生名列表
  - [ ] `findValidSeats()` 在性别模式下排除性别不匹配的座位
  - [ ] `findValidSeats()` 在排除列表存在时排除对应座位

  **QA Scenarios**:
  ```
  Scenario: 构建约束图正确性
    Tool: Bash (node REPL)
    Preconditions: 导入 seededArrange 模块
    Steps:
      1. 传入 config.json 示例数据
      2. 调用 buildConstraintGraph(constraints)
      3. 断言 deps.get('小明').withAdj 包含 ['小红', '小刚']
      4. 断言 deps.get('小明').withoutAdj 包含 ['李四']
    Expected Result: 依赖图结构完整，所有约束正确分类
    Evidence: .sisyphus/evidence/task-1-graph.md

  Scenario: 排序正确性
    Tool: Bash (node REPL)
    Steps:
      1. 构建包含 3 个约束学生的图（约束数分别为 4, 2, 1）
      2. 调用 sortByConstraintCount(graph)
      3. 断言返回顺序为 [4约束学生, 2约束学生, 1约束学生]
    Expected Result: 按约束数降序排列
    Evidence: .sisyphus/evidence/task-1-sort.md
  ```

  **Commit**: YES (groups with T2, T3)
  - Message: `feat(algo): seeded placement — data model & utils`
  - Files: `src/algorithms/seededArrange.js`

- [x] 2. 编写 `seededArrange.js` — 种子放置引擎

  **What to do**:
  - 实现 `placeSeeds(grid, constraints, students, nRows, nCols, aisles, mode)` 函数：
    ```
    1. 从 constraints 构建依赖图 + 排序约束学生
    2. 为每个约束学生随机选合法座位（findValidSeats）
    3. 放置学生，标记 placed
    4. 处理 "with" 约束：
       a. withAdjacency: 在同一行同一块找空座 → 放置 target
       b. withRange: 在 range 区域找空座 → 放置 target
       c. 递归处理 target 自身的约束（如果 target 也在约束列表中）
    5. 处理 "without" 约束：
       a. 计算 region
       b. 将 target 名加入 region 内每个座位的 exclusionMap
    6. 性别模式下传播性别限制：
       a. 确定当前块的性别（已放置学生 > 占多数）
       b. 标记块内剩余空座为对应性别
    7. 继续下一个约束学生，跳过已放置的
    ```
  - 处理递归放置的终止条件（已放置 / 学生不在约束列表中）
  - 处理无解情况：某约束学生找不到合法座位 → 返回 `{success: false}`

  **Must NOT do**:
  - 不要修改已有的 blockUtils.js 接口
  - 不要在递归中无限循环（已放置的学生直接跳过）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 递归约束传播是 hairiest 的部分，需要仔细的终止条件设计
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (但要确保 T1 的数据结构已确定)
  - **Parallel Group**: Wave 1 (with T1, T3)
  - **Blocks**: T4, T5, T6
  - **Blocked By**: T1 (数据结构定义)

  **References**:
  - `src/utils/blockUtils.js:40-72` — `getAdjacencyRegion()` 和 `getRangeRegion()` 计算
  - `src/algorithms/genderArrange.js:37-88` — 性别模式块填充逻辑（参考块性别决定方式）
  - `src/algorithms/constraintSolver.js:121-199` — 当前修复式求解器（了解目前怎么处理约束）

  **Acceptance Criteria**:
  - [ ] 小明（with adjacency: 小红, 小刚）放置后，小红和小刚在同一行同一块
  - [ ] 小明（without adjacency: 李四）放置后，李四不在同一行同一块
  - [ ] 性别模式下，种子放置后在块内传播了正确性别
  - [ ] 无合法座位时返回 `{success: false}` 而非崩溃

  **QA Scenarios**:
  ```
  Scenario: with adjacency 触发级联放置
    Tool: Bash (node REPL)
    Preconditions: 8行7列 aisles=[2,5], 学生列表含 小明/小红/小刚, config 含小明with小红小刚
    Steps:
      1. 调用 placeSeeds(grid, constraints, students, 8, 7, [2,5], 'random')
      2. 验证 小明 被放置
      3. 验证 小红 与 小明 在同一行且列所属块相同
      4. 验证 小刚 与 小明 在同一行且列所属块相同
    Expected Result: 三个学生都在同一行同一块
    Evidence: .sisyphus/evidence/task-2-with-adj.md

  Scenario: without adjacency 生成排除列表
    Tool: Bash (node REPL)
    Preconditions: 同上
    Steps:
      1. 调用 placeSeeds(...)
      2. 检查 exclusionMap，验证小明 adjacency 区域内的座位排除李四
      3. 验证李四最终不在小明 adjacency 区域内
    Expected Result: exclusionMap 正确记录，李四不在 adjacency 区域
    Evidence: .sisyphus/evidence/task-2-without-adj.md

  Scenario: 递归终止 — 已放置学生跳过
    Tool: Bash (node REPL)
    Preconditions: 小红在小明的 with adjacency 列表中，小红已在 placed 中
    Steps:
      1. 调用 placeSeeds，当处理小明的 with 约束时
      2. 验证不会再次尝试放置小红
    Expected Result: 无重复放置，placed 集合大小不变
    Evidence: .sisyphus/evidence/task-2-recursion.md
  ```

  **Commit**: YES (groups with T1, T3)
  - Message: `feat(algo): seeded placement — seed engine`
  - Files: `src/algorithms/seededArrange.js`

- [x] 3. 编写 `seededArrange.js` — 剩余填充 + 主入口

  **What to do**:
  - 实现 `fillRemaining(grid, remainingStudents, mode, genderLocks, exclusionMap, nRows, nCols, aisles)`：
    ```
    1. 收集所有空座位（未被 occupied）
    2. 按行优先排列（性别模式从第 0 行往后）
    3. 随机模式：shuffle 剩余学生 → 依次填入空座（跳过排除名单中的学生 / 性别不匹配的学生）
    4. 性别模式：
       a. 从前往后逐行、逐块填充
       b. 对每块，确定性别（优先使用 genderLock，其次用已填充学生的多数性别，最后随机）
       c. 填入对应性别学生
       d. 溢出时自动形成混合块
    5. 如果填不满（某些座位没学生可放）→ 返回 null
    ```
  - 实现 `seededArrange(students, nRows, nCols, aisles, mode, constraints)` — 主入口：
    ```
    1. 如果无 constraints → 委托给原有 randomArrange/genderArrange
    2. 循环 5 次：
       a. 初始化空 grid + exclusionMap + genderLocks + placed
       b. placeSeeds(...)
       c. 如果种子放置失败 → continue（下一轮）
       d. fillRemaining(...)
       e. 如果填充失败 → continue
       f. 最终验证所有约束 → 如果全部满足 → return {seatingPlan, violations: []}
    3. 5 次全失败 → return {seatingPlan: null, violations: [{message: '约束无法满足'}]}
    ```

  **Must NOT do**:
  - 不要在无约束时调用种子放置（增加无谓开销）
  - 不要修改 genderArrange.js 的块性别分配逻辑（复用即可）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 需要协调种子放置结果与剩余填充，集成复杂度较高
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2)
  - **Blocks**: T4, T5, T6
  - **Blocked By**: T1, T2

  **References**:
  - `src/algorithms/genderArrange.js:37-88` — 块填充逻辑（行优先 + 随机块顺序）
  - `src/algorithms/randomArrange.js:17-29` — 简单随机填充逻辑
  - `src/utils/blockUtils.js:1-22` — `getBlockStructure()`
  - `config.json` — 约束格式

  **Acceptance Criteria**:
  - [ ] 无约束时走原算法路径（不调用 seededArrange）
  - [ ] 有约束时最多重试 5 次
  - [ ] 5 次全失败时返回 `violations` 非空数组
  - [ ] 填充阶段尊重 exclusionMap 和 genderLocks

  **QA Scenarios**:
  ```
  Scenario: 完整流程 — 有约束成功
    Tool: Bash (node REPL)
    Preconditions: 40 样例学生 + config.json(小明约束), 8行7列, aisles=[2,5]
    Steps:
      1. 调用 seededArrange(students, 8, 7, [2,5], 'random', constraints)
      2. 验证 seatingPlan 非 null
      3. 验证 violations 为空数组
      4. 验证 小明 与 小红+小刚 在同一行同一块
      5. 验证 李四 不在小明 adjacency 区域
    Expected Result: 所有约束满足，弹窗无冲突
    Evidence: .sisyphus/evidence/task-3-full-success.md

  Scenario: 完整流程 — 约束冲突失败
    Tool: Bash (node REPL)
    Preconditions: 构造一个不可能的约束（如6个学生必须挤在一个2座块中）
    Steps:
      1. 调用 seededArrange(...)
      2. 验证 seatingPlan 为 null
      3. 验证 violations 包含错误信息
    Expected Result: 返回空 plan + 冲突消息
    Evidence: .sisyphus/evidence/task-3-full-fail.md

  Scenario: 无约束回归
    Tool: Bash (node REPL)
    Preconditions: 40 样例学生，无 config.json, 8行7列
    Steps:
      1. 调用 seededArrange(students, 8, 7, [2,5], 'gender', {})
      2. 验证结果与直接调用 genderArrange() 一致（结构相同，无报错）
    Expected Result: 与无约束原算法行为一致
    Evidence: .sisyphus/evidence/task-3-regression.md
  ```

  **Commit**: YES (groups with T1, T2)
  - Message: `feat(algo): seeded placement — fill remaining + main entry`
  - Files: `src/algorithms/seededArrange.js`

- [x] 4. 精简 `randomArrange.js` — 仅保留无约束路径

  **What to do**:
  - 移除 `import { solveConstraints } from './constraintSolver'`
  - 移除约束相关逻辑，`randomArrange()` 不再接收 `constraints` 参数
  - 简化为：shuffle → 行优先填入 → 直接返回
  - 保持函数签名兼容（或改为不需要 constraints 参数）

  **Must NOT do**:
  - 不要改变函数对外输出格式 `{seatingPlan, violations: []}`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的删除/精简操作
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T5, T6)
  - **Blocks**: T7
  - **Blocked By**: T1-T3

  **References**:
  - `src/algorithms/randomArrange.js` — 当前文件内容

  **Acceptance Criteria**:
  - [ ] 不再导入 constraintSolver
  - [ ] `randomArrange(students, nRows, nCols, aisles)` 可正常调用

  **QA Scenarios**:
  ```
  Scenario: 无约束随机模式正常生成
    Tool: Bash (Playwright)
    Steps:
      1. 加载样例 → random 模式 → 生成
      2. 验证 40 个学生全部显示，无冲突弹窗
    Expected Result: 座位表正常渲染，无报错
    Evidence: .sisyphus/evidence/task-4-random.md
  ```

  **Commit**: YES (groups with T5, T6)
  - Message: `refactor(algo): simplify randomArrange to no-constraint path`
  - Files: `src/algorithms/randomArrange.js`

- [x] 5. 精简 `genderArrange.js` — 仅保留无约束路径

  **What to do**:
  - 移除 `import { solveConstraints } from './constraintSolver'`
  - 移除约束相关逻辑，`genderArrange()` 不再接收 `constraints` 参数
  - 保持块性别分配 + 前端填充逻辑不变

  **Must NOT do**:
  - 不要改变函数对外输出格式 `{seatingPlan, violations: []}`
  - 不要触碰块填充核心逻辑

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的删除/精简操作
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T4, T6)
  - **Blocks**: T7
  - **Blocked By**: T1-T3

  **References**:
  - `src/algorithms/genderArrange.js` — 当前文件内容

  **Acceptance Criteria**:
  - [ ] 不再导入 constraintSolver
  - [ ] `genderArrange(students, nRows, nCols, aisles)` 可正常调用

  **QA Scenarios**:
  ```
  Scenario: 无约束性别模式正常生成
    Tool: Bash (Playwright)
    Steps:
      1. 加载样例 → 性别模式 → aisles=[2,5] → 生成
      2. 验证块性别分离正确，40 学生全部显示
    Expected Result: 座位表正常渲染，性别分离
    Evidence: .sisyphus/evidence/task-5-gender.md
  ```

  **Commit**: YES (groups with T4, T6)
  - Message: `refactor(algo): simplify genderArrange to no-constraint path`
  - Files: `src/algorithms/genderArrange.js`

- [x] 6. 更新 `SeatingContext.jsx` — 接入新算法

  **What to do**:
  - 导入 `seededArrange` from `'../algorithms/seededArrange'`
  - 修改 `generatePlan()`：
    ```
    if (Object.keys(constraints).length > 0) {
        result = seededArrange(studentsToUse, nRows, nCols, aisles, mode, constraints);
    } else {
        // 走原有路径
        if (mode === 'random') result = randomArrange(studentsToUse, nRows, nCols, aisles);
        else result = genderArrange(studentsToUse, nRows, nCols, aisles);
    }
    ```
  - 移除 `randomArrange` 和 `genderArrange` 调用中的 `constraints` 参数

  **Must NOT do**:
  - 不要改变任何 UI 组件
  - 不要修改 context 的状态结构

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的导入替换 + 条件分支
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T4, T5)
  - **Blocks**: T7
  - **Blocked By**: T1-T3

  **References**:
  - `src/context/SeatingContext.jsx:22-41` — generatePlan 函数
  - `src/context/SeatingContext.jsx:1-2` — 当前导入

  **Acceptance Criteria**:
  - [ ] 有 constraints 时走 seededArrange 路径
  - [ ] 无 constraints 时走原有路径
  - [ ] `npm run build` 通过

  **QA Scenarios**:
  ```
  Scenario: 有约束走新路径
    Tool: Bash (Playwright)
    Steps:
      1. 浏览器加载页面
      2. 加载样例 + config.json → 随机模式 → 生成
      3. 验证无冲突弹窗
    Expected Result: 正常生成
    Evidence: .sisyphus/evidence/task-6-integration.md
  ```

  **Commit**: YES (groups with T4, T5)
  - Message: `feat(ui): wire SeatingContext to seededArrange`
  - Files: `src/context/SeatingContext.jsx`

- [x] 7. 清理 — 删除 `constraintSolver.js` 及相关导入

  **What to do**:
  - 删除 `src/algorithms/constraintSolver.js`
  - 检查并清理所有 `import ... './constraintSolver'`（应在 T4, T5 中已移除）
  - `npm run build` 确认无 dead import 错误

  **Must NOT do**:
  - 不要删除 blockUtils.js 中的任何函数（仍被 seededArrange 使用）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单文件删除 + 验证
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (单独)
  - **Blocks**: F1-F3
  - **Blocked By**: T4, T5, T6

  **References**:
  - `src/algorithms/constraintSolver.js` — 待删除文件

  **Acceptance Criteria**:
  - [ ] `src/algorithms/constraintSolver.js` 已删除
  - [ ] `npm run build` 通过（无导入错误）
  - [ ] 项目中没有任何文件引用 constraintSolver

  **QA Scenarios**:
  ```
  Scenario: 构建通过
    Tool: Bash
    Steps:
      1. npm run build
      2. 验证 exit code 为 0
      3. 验证无 "Cannot find module" 错误
    Expected Result: 构建成功
    Evidence: .sisyphus/evidence/task-7-build.md
  ```

  **Commit**: YES
  - Message: `chore: remove deprecated constraintSolver.js`
  - Files: `src/algorithms/constraintSolver.js` (删除)

---

## Final Verification Wave

- [x] F1. **约束场景端到端测试** — `unspecified-high` (+ `playwright`)
  Playwright 浏览器测试：
  1. 加载样例 40 人
  2. 加载 config.json（小明 + 小红 + 小刚 + 李四 + 张三 + 王五 的完整约束）
  3. 随机模式 → 生成 → 验证无冲突弹窗
  4. 性别模式 → aisles=[2,5] → 生成 → 验证无冲突弹窗、块性别正确
  5. 点击交换座位后验证约束仍满足
  6. 修改 config.json 为不可能的约束 → 生成 → 验证弹窗显示冲突
  输出：`所有场景 [N/N pass] | VERDICT: APPROVE/REJECT`

- [x] F2. **无约束回归测试** — `unspecified-high` (+ `playwright`)
  Playwright 浏览器测试：
  1. 不加载 config.json
  2. 随机模式 → 生成 → 验证与改动前行为一致
  3. 性别模式 → 生成 → 验证与改动前行为一致
  4. 导出 CSV / Excel / PNG → 验证正常导出
  5. 拖拽交换 → 点击交换 → 验证正常
  输出：`所有场景 [N/N pass] | VERDICT: APPROVE/REJECT`

- [x] F3. **构建验证** — `quick`
  执行 `npm run build`，确认：
  1. 无 TypeScript/ESLint 错误
  2. 无 dead import
  3. 产物大小合理
  输出：`Build [PASS/FAIL] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(algo): seeded placement — core algorithm` — `src/algorithms/seededArrange.js`
- **Wave 2**: `refactor(algo): wire seeded placement, simplify existing algos` — `randomArrange.js`, `genderArrange.js`, `SeatingContext.jsx`
- **Wave 3**: `chore: remove deprecated constraintSolver.js` — 删除 `constraintSolver.js`

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: ✓ built in < 300ms, no errors
```

### Final Checklist
- [ ] 有约束 + 随机模式 → 生成成功（无冲突弹窗）
- [ ] 有约束 + 性别模式 → 生成成功（块性别正确 + 无冲突弹窗）
- [ ] 不可能约束 → 弹窗提示冲突（不静默失败）
- [ ] 无约束 → 两种模式行为与改动前一致
- [ ] `npm run build` 通过
- [ ] `constraintSolver.js` 已删除