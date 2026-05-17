# 班级座位表排位系统

面向中小学教师的教室座位排位工具。导入学生名单 → 设置网格参数 → 一键生成座位表 → 拖拽微调或投屏展示。

## 功能

- **CSV 导入** — 支持拖拽上传、文本粘贴、加载样例
- **网格配置** — 自定义行数、列数、过道位置（逗号分隔）
- **三种排位模式**
  - 🎲 **随机排列** — 纯随机洗牌
  - ♂♀ **性别分列** — 按性别分区，左右交替排列
  - 📐 **约束排位** — 通过 `config.json` 定义前后左右关系规则
- **座位微调** — 拖拽交换、点击交换
- **课堂展示页** — 全屏深色模式，四种动画揭晓
  - 🃏 翻转卡片 — 逐座 3D 翻转出现
  - 📖 逐行渐显 — 行级同步淡入
  - 💥 跳跃弹出 — 随机顺序弹跳出现
  - 🌊 扫描揭示 — 左→右列级扫描
- **导出** — CSV / Excel / PNG 截图
- **localStorage 持久化** — 网格参数和动画偏好自动记忆
- **约束冲突提示** — 无法满足的约束在配置页弹窗提示

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 |
| 构建 | Vite 8 |
| 拖拽 | @dnd-kit/core |
| 导出 | xlsx (SheetJS) · html2canvas |
| 样式 | CSS（BEM-ish 命名，CSS 变量令牌体系） |
| 语言 | JavaScript（无 TypeScript） |

## 快速开始

```bash
git clone https://github.com/Himalaya-art/Seating-Plan-Arrangement-Web-Rebuild.git
cd Seating-Plan-Arrangement-Web-Rebuild
npm install
npm run dev      # 启动开发服务器 → http://localhost:5173
```

```bash
npm run build    # 生产构建
npm run preview  # 预览构建结果
```

## 使用指南

### 1. 导入学生名单

CSV 格式要求：第一行为表头，至少包含 `姓名` 和 `性别` 列。

```csv
姓名,性别
张三,男
李四,女
王五,男
```

点击「加载样例」可快速体验。

### 2. 设置网格与生成

调整行数、列数、过道位置（如 `3,6` 表示在第 3 列和第 6 列之后有过道），选择排位模式和揭晓动画，点击「生成座位表」。

### 3. 微调与导出

在配置页可直接拖拽或点击交换座位位置。导出按钮支持 CSV、Excel、PNG 三种格式。

### 4. 课堂展示

点击顶部「🎭 展示」标签进入全屏模式。选择动画效果后点击「🎲 揭晓座位」，座位将逐步动画出现。动画完成后可点击「🔄 重新揭晓」生成新方案。

### 5. 约束排位（高级）

在 `public/data/config.json` 中定义约束规则：

```json
{
  "张三": {
    "with": { "adjacency": ["李四"] },
    "without": { "range": ["王五"] }
  }
}
```

- `with.adjacency` — 指定学生必须在同一排相邻块内
- `with.range` — 指定学生必须在同一块位置（跨行）
- `without.adjacency` — 指定学生不能在同一排相邻块内
- `without.range` — 指定学生不能在同一块位置

## 项目结构

```
src/
├── App.jsx / App.css           # 入口组件，标签切换
├── context/
│   └── SeatingContext.jsx      # 全局状态（Context + Provider）
├── algorithms/
│   ├── randomArrange.js        # 随机排列
│   ├── genderArrange.js        # 性别分列排列
│   └── seededArrange.js        # 约束排位引擎
├── components/
│   ├── ConfigPanel/            # 配置面板（上传、网格、模式）
│   ├── SeatingChart/           # 座位网格（拖拽、点击交换）
│   ├── Presentation/           # 展示页（四种动画）
│   ├── Toolbar/                # 导出工具栏
│   └── ConflictDialog/         # 约束冲突弹窗
├── utils/
│   ├── csvParser.js            # CSV 解析
│   ├── blockUtils.js           # 过道分块工具
│   └── exportUtils.js          # 导出（CSV/Excel/PNG）
└── index.css                   # 全局 CSS 变量（设计令牌）
```

## 许可证

GPL-3.0
