---
name: 班级座位表排位系统
description: Chinese classroom seating arrangement tool with animated reveal. Two modes — config panel for teachers arranging seats at their desk, presentation mode for dramatic classroom projection.
colors:
  slate-blue-gray: "#4F5D75"
  deep-slate: "#3D4A5F"
  slate-mist: "#E8ECF1"
  slate-border: "#B0BEC5"
  sage-green: "#5B7B6F"
  deep-sage: "#4A6A5E"
  sage-mist: "#E8F0EC"
  chalk-white: "#FAFAFA"
  light-frost: "#F2F2F2"
  frost-gray: "#E5E5E5"
  mist-gray: "#CCCCCC"
  stone-gray: "#6B7280"
  ink-gray: "#404040"
  inkstone-black: "#1A1A1A"
  success-green: "#2D7A46"
  success-mist: "#E8F5E9"
  warning-amber: "#8A6D14"
  warning-cream: "#FFF8E1"
  danger-red: "#C62828"
  danger-deep: "#A01E1E"
  danger-blush: "#FFEBEE"
  male-sky: "#E8F0FE"
  male-sky-border: "#A8C8FA"
  male-text: "#1A3A5C"
  female-rose: "#FCE4EC"
  female-rose-border: "#F48FB1"
  female-text: "#5C1A2A"
  amber-gold: "#D4A017"
  amber-glow: "#E8C547"
  white: "#FFFFFF"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "14px"
    fontWeight: 400
  title:
    fontSize: "18px"
    fontWeight: 600
  label:
    fontSize: "12px"
    fontWeight: 400
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.slate-blue-gray}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.deep-slate}"
  button-danger:
    backgroundColor: "{colors.danger-red}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "{colors.ink-gray}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
  seat-male:
    backgroundColor: "{colors.male-sky}"
    rounded: "{rounded.md}"
  seat-female:
    backgroundColor: "{colors.female-rose}"
    rounded: "{rounded.md}"
  input:
    rounded: "{rounded.sm}"
  seat-selected:
    backgroundColor: "{colors.chalk-white}"
    rounded: "{rounded.md}"
---

# Design System: 班级座位表排位系统

## 1. Overview

**Creative North Star: "静谧课堂" (The Quiet Classroom)**

一个教师在清晨走进教室，阳光透过绿色窗帘洒在灰蓝色墙面上。空气安静，黑板干净，第一排课桌等待着学生的名字。这个工具置身其中：温和、井然有序、不打扰思考。

配色系统以石板灰蓝（Slate Blue-Gray）作为主色调，鼠尾草绿（Sage Green）作为点缀——两种颜色都源于教室的自然环境。灰蓝来自石板和天空，鼠尾草绿来自植物和窗帘。两者都处于中低饱和度，不刺眼，适合长时间配置操作，也适合大屏幕投影。

配置模式是教师在办公室的专注工具：浅色背景、清晰分区、操作路径最短。展示模式是课堂上的高光时刻：深色沉浸式背景、唯一的焦点按钮、四种揭晓动画。两种模式共享同一套设计令牌，但各自有不同的视觉节奏。

**Key Characteristics:**
- 温和中性色偏移，始终带暖色调（无冷灰、纯白、纯黑）
- 扁平表面静止，阴影仅在交互反馈时出现
- 小圆角（4px 为主）、清晰边框，工具感为主，不喧宾夺主
- 配置模式清晰分区，展示模式凝聚焦点
- 性别色彩（淡蓝 / 淡粉）作为数据可视化，不作为装饰

排斥：儿童化卡通风格、Material Design 的阴影卡片堆叠、深蓝企业仪表盘、AI 生成感的无性格灰白堆积。

## 2. Colors

### Primary

- **石板灰蓝** (#4F5D75): 主要操作按钮（生成座位），标签页激活状态，悬停边框。这是界面的「声音」——出现在最重要的交互上。
- **深石板** (#3D4A5F): 主按钮悬停态。比基准深一个层次。
- **石板薄雾** (#E8ECF1): 激活中的模式选项背景，微妙的视觉占据。
- **石板边框** (#B0BEC5): 模式选项悬停边框，过渡态指示。

### Secondary / Accent

- **鼠尾草绿** (#5B7B6F): 展示模式的揭晓按钮主色。在深色背景上的唯一彩色焦点。配置模式不出现。
- **深鼠尾草** (#4A6A5E): 展示按钮悬停态。
- **鼠尾草雾** (#E8F0EC): 未使用，保留用于未来的绿色标记或状态指示。

### Neutral

- **粉笔白** (#FAFAFA): 配置面板背景，座位默认背景。不是纯白。
- **浅霜** (#F2F2F2): 应用页面背景，分隔线。
- **霜灰** (#E5E5E5): 分隔线，禁用态边框。
- **雾灰** (#CCCCCC): 输入框和按钮的默认边框。
- **石灰色** (#6B7280): 提示文字，辅助信息，非活跃标签。
- **墨灰** (#404040): 正文文字，主要信息。
- **砚黑** (#1A1A1A): 最深文字（极少使用），重度强调。

### Semantic

- **成功绿** (#2D7A46 / #E8F5E9): 学生计数和配置状态的成功提示。
- **警告琥珀** (#8A6D14 / #FFF8E1): 约束警告横幅。
- **危险红** (#C62828 / #A01E1E / #FFEBEE): 清除按钮（破坏性操作）、冲突对话框标题。

### Data Visualization

- **男性天空蓝** (#E8F0FE / #A8C8FA / #1A3A5C): 男生座位底色、边框、文字。
- **女性玫瑰粉** (#FCE4EC / #F48FB1 / #5C1A2A): 女生座位底色、边框、文字。
- **琥珀金** (#D4A017 / #E8C547): 选中座位边框和光晕。仅用于交互状态，不作为静态装饰。

### Presentation (Dark Context)

- **深夜** (#14181E): 展示模式全屏背景。近乎黑但带极微蓝色偏移。
- **浅霜反相** (#E8ECF1): 展示模式主文字色。

**The Accent Discipline Rule.** 鼠尾草绿仅在展示模式的揭晓按钮上使用。配置模式的所有操作按钮使用石板灰蓝。两个颜色不在同一屏幕上同时作为主操作色。

**The No Pure Black/White Rule.** `#fff` 仅用于白色文字对照在深色按钮上，`#000` 不出现在任何位置。所有中性色从粉笔白到砚黑都带暖色调偏移。

## 3. Typography

**Display Font:** 无独立展示字体。
**Body Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`

**Character:** 系统字体栈优先保证平台原生感。中文首选苹方（macOS/iOS）和微软雅黑（Windows）。在西文环境退化为 SF Pro / Segoe UI。权衡：响应速度和平台一致性优先于定制字体个性。

### Hierarchy

- **Title** (18px, 600 weight): 面板标题（h2），配置模式下唯一使用。展示模式不使用。
- **Body** (14px, 400 weight): 默认正文字号。标签、按钮、输入框、说明文字均继承此尺寸。最大行宽 65-75ch（长文本场景极少）。
- **Label** (12px, 400 weight): 座位名称、提示文字、辅助信息。小字在密集网格中可读。

### Named Rules

**The Single Family Rule.** 整个应用使用同一套字体栈。标题不切换字体族，仅通过尺寸和字重区分层次。

**The Fixed Scale Rule.** 字号固定（12/14/16/18/20 px），不使用 `clamp()` 或 `vw` 单位。配置模式和展示模式共享相同的文字尺寸。

## 4. Elevation

本系统的层次主要通过背景色深浅区分，而非阴影。表面在静止状态下是平坦的。

- **配置面板**：粉笔白背景 + 右侧细线分隔，靠颜色区分于浅霜页面背景。
- **座位网格**：座位通过两色性别区分（淡蓝 / 淡粉）与空位（无背景）区分。选中态通过金色边框 + 光晕提升层次。
- **展示模式**：深夜全屏背景，座位卡片在暗底上自然突出。

### Shadow Vocabulary

阴影仅在交互反馈时出现，不用于静态深度暗示：

- **Ambient Low** (`0 1px 3px rgba(0,0,0,0.08)`): 座位悬停时使用，微微抬升。
- **Interaction** (`0 4px 16px rgba(0,0,0,0.1)`): 拖拽中座位使用。
- **Modal Overlay** (`0 8px 32px rgba(0,0,0,0.15)`): 冲突对话框使用。

**The Flat-By-Default Rule.** 表面静止时平坦。阴影仅作为状态响应出现（hover、drag、focus-overlay）。没有任何静态卡片自带投影。

## 5. Components

### Buttons

- **Shape:** 小圆角 4px，适应中文方形字符的美感偏好。
- **Primary (btn-primary):** 石板灰蓝背景 + 白字。用于主要操作（生成座位、揭晓座位）。悬停加深至深石板。
- **Secondary (btn-secondary):** 墨灰背景 + 白字。用于辅助操作（导出按钮）。
- **Danger (btn-danger):** 危险红背景 + 白字。用于破坏性操作（清除座位）。悬停加深。
- **Base (btn):** 白底 + 雾灰边框。用于次要/中性操作（加载样例、上传文件）。悬停变浅霜背景。
- **Generate CTA (btn-generate):** Primary 的全宽版本，加粗，更大的内边距。配置面板最重要的按钮。
- **Reveal CTA (reveal-btn):** 展示模式特化 primary，使用鼠尾草绿作为背景。最小宽度 200px，在深色背景上吸引全部注意力。
- **Reveal Again (reveal-again-btn):** 较小的 secondary 按钮，出现在展示模式动画结束后。

**The One Primary Rule.** 任何屏幕上只有一个按钮使用 primary/accent 背景色。配置模式的生成按钮使用石板灰蓝；展示模式的揭晓按钮使用鼠尾草绿。其余按钮使用 base 或 secondary 样式。

### Seats

- **Shape:** 6px 圆角，80×44px 尺寸。
- **Male (seat-male):** 天空蓝底色 + 天空蓝边框 + 深蓝文字。
- **Female (seat-female):** 玫瑰粉底色 + 玫瑰粉边框 + 深红文字。
- **Empty:** 无背景 + 虚线边框（展示模式）或默认白色（配置模式）。
- **Default (无性别):** 白色背景 + 雾灰边框。
- **Hover:** 边框变石板灰蓝 + 微阴影。
- **Drag:** 半透明 + 中阴影。
- **Drop Target:** 石板灰蓝边框 + 内阴影。
- **Selected:** 琥珀金边框 + 金色光晕，z-index 提升。
- **Presentation Seat:** 展示模式下座位初始不可见（opacity 0, scale 0），动画逐帧揭示。性别色彩使用相同的天空蓝 / 玫瑰粉但硬编码值而非 CSS 变量。

### Inputs / Fields

- **Shape:** 4px 圆角，单像素雾灰边框。
- **Number (input-number):** 60px 固定宽度，用于行列数输入。
- **Text (input-text):** 自适应宽度，用于过道位置输入。
- **Textarea (student-textarea):** 100% 宽度，最小 100px 高度，可垂直缩放。
- **Select (input-select):** 下拉选择器，用于动画模式选择。继承按钮风格。

### Mode Selector

- 单选按钮组，每项 6px 圆角 + 2px 边框。
- 未选中：霜灰边框，透明背景。
- 悬停：石板边框。
- 选中：石板灰蓝边框 + 石板薄雾背景。

### Navigation

标签切换栏（tab-bar）：居中排列的按钮组，底部 2px 石板灰蓝激活指示线。非激活标签为石灰色字，悬停变深。

### Dialog (ConflictDialog)

- 遮罩：半透明黑底（45%）。
- 对话框：白色背景 + 12px 圆角 + 最大阴影，最大 500px 宽。
- 标题：危险红。
- 操作按钮：右对齐，顶部有分隔线。

### Status Indicators

- **学生计数（student-count）**：成功绿背景 + 成功绿文字，4px 圆角标签。
- **警告横幅（warning）**：警告琥珀边框 + 警告奶油背景，4px 圆角。
- **配置状态（config-status.success）**：成功绿变体。

### Toolbar

- 白色背景 + 底部霜灰分隔线。
- 左侧标题（粗体 14px），右侧操作按钮组。
- 展示模式隐藏整个 Toolbar。

## 6. Do's and Don'ts

### Do:

- **Do** 使用 CSS 自定义属性引用颜色（`var(--color-*)`），不要硬编码颜色值。展示模式的性别色是目前唯一的例外。
- **Do** 保持按钮层次：每屏只有一个 primary/accent 按钮。
- **Do** 使用系统字体栈，不引入 web font。
- **Do** 通过背景色深浅区分层次，阴影仅用于交互反馈。
- **Do** 配置模式用石板灰蓝，展示模式用鼠尾草绿作为操作色。

### Don't:

- **Don't** 使用纯黑 `#000` 或纯白 `#fff` 作为背景色。`#fff` 仅允许作为深色按钮上的对比文字。
- **Don't** 引入超过 2px 的 border-left / border-right 作为装饰条纹。
- **Don't** 使用 `background-clip: text` 渐变文字效果。
- **Don't** 使用毛玻璃效果（backdrop-filter blur）作为默认卡片样式。
- **Don't** 在多个操作按钮上使用相同的 primary 颜色——始终一个主要、其余次要。
- **Don't** 引入儿童化卡通风格：彩虹色、卡通贴纸、过度装饰的圆角和插图。
- **Don't** 模仿传统企业后台的深蓝仪表盘配色。
- **Don't** 堆叠白色阴影卡片。表面应是平的，层次通过背景色传达。
- **Don't** 在动画中使用 `bounce` 或 `elastic` 缓动作为通用过渡，仅限已定义的 `bouncePop` 揭晓动画。
