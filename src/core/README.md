# 数独核心模块

## 目录

1.  [模块简介](#模块简介)
2.  [安装与集成](#安装与集成)
3.  [目录结构概览](#目录结构概览)
4.  [快速入门](#快速入门)
5.  [核心类型说明](#核心类型说明)
6.  [使用案例](#使用案例)
    - [案例 1: 标准 9x9 数独初始化与交互](#案例-1-标准-9x9-数独初始化与交互)
    - [案例 2: 加载题目并检查完成状态](#案例-2-加载题目并检查完成状态)
    - [案例 3: 实现简单的候选数提示](#案例-3-实现简单的候选数提示)
    - [案例 4: 处理验证错误并高亮](#案例-4-处理验证错误并高亮)
    - [案例 5: 使用存档/读档功能](#案例-5-使用存档读档功能)
    - [案例 6: 集成对角线变体规则](#案例-6-集成对角线变体规则)
    - [案例 7: 使用解题器解数独谜题](#案例-7-使用解题器解数独谜题)
    - [案例 8: 使用生成器创建数独谜题](#案例-8-使用生成器创建数独谜题)
7.  [详细文档](#详细文档)
8.  [相关信息](#相关信息)

## 模块简介

本模块 (`@core`) 是一个功能全面、高度可扩展的数独游戏核心逻辑库，使用 TypeScript 构建。它旨在提供稳定、高效、易于集成的数独解决方案，支持标准数独及多种复杂变体。

**主要特性:**

- **网格与单元格管理:** 提供创建、访问、修改数独网格及单元格状态的底层函数。
- **区域抽象:** 支持灵活定义不同类型的区域（宫、行、列、对角线、不规则区域等）。
- **变体规则支持:** 通过可插拔的 `VariantRule` 接口，轻松扩展支持对角线、杀手、宫格变体（Jigsaw）等多种数独规则。
- **高效验证:** 内置优化的验证算法（包括位运算），快速检查规则冲突。
- **候选数计算:** 提供基础和优化的候选数计算方法。
- **游戏引擎:** 封装核心逻辑，提供状态管理、历史记录（撤销/重做）、缓存优化等功能。
- **类型安全:** 完整的 TypeScript 类型定义，提升开发体验和代码健壮性。
- **集成日志:** 内置基于 `loglevel` 的日志系统，支持多级别输出，方便调试与追踪。
- **可测试性:** 设计注重纯函数和模块化，易于进行单元测试。
- **解题器:** 提供高效的数独解题算法，支持不同策略和复杂变体规则。
- **生成器:** 支持创建不同难度和变体的数独谜题，保证唯一解。

## 安装与集成

本模块设计为项目内部模块，推荐直接将其源代码置于项目 `src/core` 目录下。

**环境依赖:**

- TypeScript 4.5+
- Node.js 16+ (用于开发和测试)

**推荐配合使用的库:**

- `loglevel`: 用于日志记录 (已集成在 `@/utils/logger.ts` 中)
- `dayjs`: 用于日志时间戳格式化 (已集成在 `@/utils/logger.ts` 中)
- `immer`: (可选) 配合 Zustand 等状态管理库，简化不可变状态更新。
- `nanoid`: (可选) 用于生成唯一 ID。

## 目录结构概览

```
src/core/
  ├─ docs/         # 详细文档 (API参考, 开发指南)
  ├─ grid/         # 网格创建 (create.ts), 访问 (access.ts), 转换 (transform.ts)
  ├─ regions/      # 区域定义 (standard.ts), 辅助函数 (helpers.ts)
  ├─ validation/   # 验证算法 (standard.ts), 错误收集 (collector.ts), 位运算 (bitmask.ts)
  ├─ candidates/   # 候选数计算 (basic.ts, optimized.ts)
  ├─ engine/       # 核心引擎 (core.ts), 工厂 (factory.ts), 历史记录 (history.ts), 缓存 (cache.ts), 状态导入导出 (state.ts)
  ├─ variants/     # 变体规则接口 (interface.ts), 标准/对角线/杀手/宫格等实现
  ├─ solvers/      # 解题算法 (backtracking.ts), 启发式方法 (heuristics.ts), 入口 (index.ts)
  ├─ generators/   # 谜题生成器 (generator.ts), 入口 (index.ts)
  ├─ types/        # 各模块类型定义 (grid.ts, region.ts, engine.ts, solver.ts, generator.ts, etc.)
  ├─ logger.ts     # 核心模块日志配置与导出
  ├─ index.ts      # 模块功能统一导出入口
```

## 快速入门

以下示例展示了如何创建一个标准 9x9 数独引擎并进行基本交互：

```typescript
import { createSudokuEngine } from "@/core";
import { createStandardRegions } from "@/core/regions";
import { createGridFromValues } from "@/core/grid";
import { CoreLoggers, setCoreLoggingLevel } from "@/core/logger";

// 0. (可选) 设置日志级别为 DEBUG
setCoreLoggingLevel("debug");
const logger = CoreLoggers.root; // 获取根日志记录器

logger.info("--- 数独核心模块快速入门 ---");

// 1. 定义数独配置
const config = {
  size: 9,
  regions: createStandardRegions(9), // 使用标准 9x9 区域 (宫、行、列)
  // 可以提供一个初始谜题，0 代表空格
  initialGrid: createGridFromValues([
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ]),
  // 对于标准数独，variantRules 为空或不提供
  // variantRules: [],
};
logger.info("数独配置已创建", config);

// 2. 创建引擎实例
const engine = createSudokuEngine(config);
logger.info("数独引擎已创建");

// 3. 获取当前状态
let currentGrid = engine.getCurrentGrid();
logger.debug("获取初始网格:", engine.getPuzzle()); // 初始谜题
logger.debug("获取当前网格:", currentGrid); // 当前状态

// 4. 进行操作：在 (0, 2) 填入 1
logger.info("尝试在 (0, 2) 填入 1");
if (engine.isValidMove(0, 2, 1)) {
  currentGrid = engine.setValue(0, 2, 1);
  logger.info("设置成功，新网格:", currentGrid);
} else {
  logger.warn("无效移动: 在 (0, 2) 填入 1 会导致冲突");
}

// 5. 验证当前网格
const validationResult = engine.validate();
logger.info("当前网格验证结果:", validationResult);
if (!validationResult.isValid) {
  logger.warn("存在错误单元格:", validationResult.errorCells);
}

// 6. 获取候选数
const candidates_0_3 = engine.getCandidatesForCell(0, 3);
logger.info("单元格 (0, 3) 的候选数:", candidates_0_3);

const allCandidates = engine.getAllCandidates(); // 获取所有空格的候选数 (带缓存)
logger.debug("所有空格的候选数:", allCandidates);

// 7. 撤销操作
logger.info("执行撤销 (undo)");
const previousGrid = engine.undo();
if (previousGrid) {
  logger.info("撤销成功，恢复到:", previousGrid);
} else {
  logger.warn("无法撤销");
}

// 8. 重做操作
logger.info("执行重做 (redo)");
const redoGrid = engine.redo();
if (redoGrid) {
  logger.info("重做成功，恢复到:", redoGrid);
} else {
  logger.warn("无法重做");
}

// 9. 检查是否完成
const isComplete = engine.isComplete();
logger.info("当前数独是否已完成且合法:", isComplete);

logger.info("--- 快速入门结束 ---");
```

## 核心类型说明

核心模块的类型定义是理解和使用该库的基础。

- **`Grid: CellState[][]`**:
  表示数独网格，是一个二维数组，每个元素是 `CellState` 对象。
- **`CellState`**:
  描述单个单元格的状态。
  ```typescript
  interface CellState {
    value: number; // 单元格的值 (0 表示空)
    isPuzzle: boolean; // 是否为初始谜题数字 (只读)
    notes: Set<number>; // 用户笔记 (小数字)
    error?: boolean; // 标记当前单元格是否违反规则
    highlight?: HighlightType; // 高亮类型 (如 'selected', 'error', 'related-peer')
    animationState?: "changed" | "cleared"; // 用于 UI 动画提示
  }
  ```
- **`CellPosition: { row: number; col: number }`**:
  表示单元格的坐标。
- **`Region`**:
  定义一个区域（如宫、行、列、对角线、杀手笼）。
  ```typescript
  interface Region {
    id: string; // 区域唯一标识 (如 'row-0', 'box-1', 'killer-cage-3')
    type: RegionType; // 区域类型 ('row', 'col', 'box', 'diagonal', 'killer', 'jigsaw', 'custom')
    cells: ReadonlyArray<readonly [number, number]>; // 区域包含的单元格坐标数组
    properties?: Record<string, any>; // 可选，区域特定属性 (如杀手数独的 sum)
  }
  ```
- **`SudokuConfig`**:
  创建引擎所需的配置对象。
  ```typescript
  interface SudokuConfig {
    size: number; // 网格尺寸 (如 9)
    regions: Region[]; // 所有区域定义
    initialGrid?: Grid; // 可选，初始谜题网格
    variantRules?: VariantRule[]; // 可选，应用的变体规则列表
    historyLimit?: number; // 可选，历史记录步数限制 (默认 100)
    cacheEnabled?: boolean; // 可选，是否启用内部缓存 (默认 true)
  }
  ```
- **`VariantRule`**:
  定义变体规则的接口，包含验证逻辑、候选数排除逻辑、区域生成等。
- **`ValidationResult`**:
  验证操作的返回结果。
  ```typescript
  interface ValidationResult {
    isValid: boolean; // 是否整体有效
    errorCells: Array<[number, number]>; // 违反规则的单元格坐标列表
    conflictSources?: Array<[number, number]>; // (可选) 导致冲突的源单元格列表
    errorMessages?: string[]; // (可选) 错误描述信息
  }
  ```
- **`MinimalState`**:
  用于导出/导入游戏状态的最小化表示（存档）。
  ```typescript
  interface MinimalState {
    cells: Record<string, { value?: number; notes?: number[] }>; // "row,col" -> {value, notes}
    meta?: { timestamp: number; [key: string]: unknown }; // 可选元数据
  }
  ```
- **`SolverOptions`**:
  数独解题器的配置选项。
  ```typescript
  interface SolverOptions {
    findAllSolutions?: boolean; // 是否寻找所有解（默认仅寻找一个解）
    maxSolutions?: number; // 最大解数量限制 (若 findAllSolutions 为 true)
    timeoutMs?: number; // 计算超时时间(毫秒)
    collectStats?: boolean; // 是否收集求解过程中的统计信息
    onProgress?: SolveCallback; // 求解过程回调函数
    strategy?: "fastest" | "humanlike"; // 求解策略，影响难度评估和步骤输出
  }
  ```
- **`SolverResult`**:
  解题器返回的结果。
  ```typescript
  interface SolverResult {
    success: boolean; // 是否成功完成求解过程
    solutions: Grid[]; // 找到的所有解
    stats?: SolverStats; // 解题过程统计信息
    finishReason:
      | "solved"
      | "no_solution"
      | "timeout"
      | "interrupted"
      | "error"; // 解题结束的原因
    failReason?: string; // 如果 finishReason 是 'error' 或 'no_solution'，这里提供详细信息
    difficulty?: DifficultyLevel; // 谜题的估计难度 (若成功求解)
  }
  ```
- **`GeneratorOptions`**:
  数独生成器的配置选项。
  ```typescript
  interface GeneratorOptions {
    difficulty?: DifficultyLevel; // 期望的难度级别
    uniqueSolution?: boolean; // 是否确保唯一解
    minGivens?: number; // 最少提示数量
    maxGivens?: number; // 最多提示数量
    symmetrical?: boolean; // 是否生成对称谜题
    symmetryType?: "rotational" | "diagonal" | "both"; // 对称类型
    timeoutMs?: number; // 生成超时时间(毫秒)
    onProgress?: GeneratorCallback; // 生成过程回调函数
  }
  ```
- **`GeneratorResult`**:
  生成器返回的结果。
  ```typescript
  interface GeneratorResult {
    success: boolean; // 是否成功生成谜题
    puzzle: Grid | null; // 生成的谜题
    solution: Grid | null; // 谜题的解
    stats?: GeneratorStats; // 生成过程统计信息
    finishReason: "generated" | "timeout" | "max_attempts" | "error"; // 生成结束原因
    difficulty?: DifficultyLevel; // 难度评估结果
  }
  ```
- **`SudokuEngine`**:
  核心引擎接口，定义了所有可供外部调用的方法 (详见 API 参考)。

所有类型定义位于 `src/core/types/` 目录下，并通过 `src/core/index.ts` 或各子模块入口导出。

## 使用案例

### 案例 1: 标准 9x9 数独初始化与交互

```typescript
import { createSudokuEngine } from "@/core";
import { createStandardRegions } from "@/core/regions";
import { createGridFromValues } from "@/core/grid";

const config = {
  size: 9,
  regions: createStandardRegions(9),
  initialGrid: createGridFromValues([
    /* ... 9x9 puzzle data ... */
  ]),
};
const engine = createSudokuEngine(config);

console.log("初始网格:", engine.getCurrentGrid());

// 玩家在 (0, 2) 填入 4
const gridAfterSet = engine.setValue(0, 2, 4);
console.log("填入 4 后:", gridAfterSet);

// 检查是否合法
const validation = engine.validate();
if (!validation.isValid) {
  console.error("网格不合法!", validation.errorCells);
}

// 玩家点击撤销
const gridAfterUndo = engine.undo();
console.log("撤销后:", gridAfterUndo);
```

### 案例 2: 加载题目并检查完成状态

```typescript
import {
  createSudokuEngine,
  createStandardRegions,
  createGridFromValues,
} from "@/core";

const solvedPuzzle = [
  /* ... 9x9 solved puzzle data ... */
];
const config = {
  size: 9,
  regions: createStandardRegions(9),
  initialGrid: createGridFromValues(solvedPuzzle),
};
const engine = createSudokuEngine(config);

// 假设引擎加载的是一个已完成的谜题
if (engine.isComplete()) {
  console.log("恭喜！数独已完成且合法！");
} else {
  console.log("数独尚未完成或存在错误。");
  // 可以进一步检查是未填满还是有错误
  if (!engine.validate().isValid) {
    console.error("存在错误:", engine.validate().errorCells);
  } else {
    console.log("还有空格未填。");
  }
}
```

### 案例 3: 实现简单的候选数提示

```typescript
import { createSudokuEngine /* ... */ } from "@/core";

const config = {
  /* ... */
};
const engine = createSudokuEngine(config);

// 用户点击了单元格 (1, 1)
const row = 1,
  col = 1;
const cellState = engine.getCurrentGrid()[row][col];

if (cellState.value === 0) {
  // 只为空格计算候选数
  const candidates = engine.getCandidatesForCell(row, col);
  console.log(
    `单元格 (${row}, ${col}) 的候选数是: ${[...candidates].sort().join(", ")}`
  );
  // UI 可以根据 candidates 渲染候选数列表
}
```

### 案例 4: 处理验证错误并高亮

```typescript
import { createSudokuEngine /* ... */ } from "@/core";
import { setCellHighlight } from "@/core/grid"; // 需要底层函数来修改高亮

const config = {
  /* ... */
};
const engine = createSudokuEngine(config);

// 用户填入一个数字后，进行验证
engine.setValue(2, 2, 5); // 假设这导致了冲突
const validationResult = engine.validate();

let gridForDisplay = engine.getCurrentGrid(); // 获取当前网格用于显示

if (!validationResult.isValid) {
  console.warn("发现错误!");
  // 清除旧的高亮（假设之前有）
  // ... (需要遍历 gridForDisplay 清除 highlight)

  // 设置错误单元格高亮
  for (const [errRow, errCol] of validationResult.errorCells) {
    // 注意：直接修改 getCurrentGrid 的副本仅用于本次显示
    // 正确做法是通过 engine 或状态管理更新高亮状态
    gridForDisplay = setCellHighlight(gridForDisplay, errRow, errCol, "error");
  }
  // 如果有冲突源，也设置高亮
  if (validationResult.conflictSources) {
    for (const [srcRow, srcCol] of validationResult.conflictSources) {
      gridForDisplay = setCellHighlight(
        gridForDisplay,
        srcRow,
        srcCol,
        "error-source"
      );
    }
  }
}

// UI 根据 gridForDisplay 渲染，错误单元格将高亮
console.log("用于显示的网格（带高亮）:", gridForDisplay);
```

### 案例 5: 使用存档/读档功能

```typescript
import { createSudokuEngine /* ... */ } from "@/core";

const config = {
  /* ... */
};
const engine = createSudokuEngine(config);

// 玩家进行了一些操作
engine.setValue(0, 0, 1);
engine.toggleNote(1, 1, 9);

// 存档
const savedState = engine.exportState();
console.log("游戏状态已保存:", savedState);
// 可以将 savedState (JSON.stringify) 保存到 localStorage 或服务器

// --- 稍后，玩家重新打开游戏 ---

// 创建一个新的引擎实例（或使用之前的）
const newEngine = createSudokuEngine(config);

// 读档
try {
  // 从 localStorage 或服务器获取 savedState
  const loadedState = JSON.parse(localStorage.getItem("sudokuSave") || "null");
  if (loadedState) {
    const restoredGrid = newEngine.importState(loadedState);
    console.log("游戏状态已恢复:", restoredGrid);
    // UI 更新为 restoredGrid
  }
} catch (e) {
  console.error("读档失败:", e);
}
```

### 案例 6: 集成对角线变体规则

```typescript
import {
  createSudokuEngine,
  createStandardRegions,
  diagonalRule,
} from "@/core";

const config = {
  size: 9,
  regions: createStandardRegions(9), // 标准区域仍然需要
  // 添加对角线规则
  variantRules: [diagonalRule],
  initialGrid: [
    /* ... 9x9 puzzle ... */
  ],
};

const engine = createSudokuEngine(config);

// 现在 engine 的 validate, getCandidatesForCell, isValidMove 等方法
// 会自动考虑对角线规则的约束

// 例如，在 (1, 1) 填入数字时，不仅检查行、列、宫，还会检查主对角线
engine.setValue(1, 1, 8);
const validation = engine.validate(); // 验证会包含对角线检查

const candidates_2_2 = engine.getCandidatesForCell(2, 2); // 候选数会排除对角线上已有的数字

console.log("对角线数独验证结果:", validation);
console.log("单元格 (2, 2) 候选数:", candidates_2_2);
```

### 案例 7: 使用解题器解数独谜题

```typescript
import { createGridFromValues } from "@/core/grid";
import { createStandardRegions } from "@/core/regions";
import { solveSudoku } from "@/core/solvers";
import { DiagonalVariant } from "@/core/variants";

// 创建对角线数独配置
const config = {
  size: 9,
  regions: createStandardRegions(9),
  variantRules: [new DiagonalVariant()],
};

// 待解的谜题
const puzzle = createGridFromValues([
  [0, 0, 0, 0, 0, 0, 0, 8, 0],
  [0, 0, 0, 4, 0, 0, 0, 0, 0],
  [0, 3, 0, 0, 0, 9, 0, 0, 1],
  [0, 0, 7, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 8, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 9, 0, 0],
  [6, 0, 0, 3, 0, 0, 0, 4, 0],
  [0, 0, 0, 0, 0, 5, 0, 0, 0],
  [0, 5, 0, 0, 0, 0, 0, 0, 0],
]);

// 配置解题器选项
const options = {
  timeoutMs: 5000, // 5秒超时
  strategy: "humanlike", // 使用人类解题策略，用于评估难度
  onProgress: (type, data) => {
    if (type === "step") {
      // 处理单步解题进度
      const { row, col, value } = data as {
        row: number;
        col: number;
        value: number;
      };
      console.log(`解题步骤: 在 (${row}, ${col}) 填入 ${value}`);
    }
    return true; // 继续解题
  },
};

// 解数独
const result = solveSudoku(puzzle, config, options);

if (result.success) {
  console.log("成功找到解决方案!");
  console.log("解的数量:", result.solutions.length);
  console.log("第一个解:", result.solutions[0]);
  console.log("谜题难度:", result.difficulty);

  if (result.stats) {
    console.log("解题统计信息:");
    console.log(`- 耗时: ${result.stats.timeMs}ms`);
    console.log(`- 回溯次数: ${result.stats.backtracks}`);
    console.log(`- 候选数计算次数: ${result.stats.candidateCalculations}`);
  }
} else {
  console.log("解题失败:", result.finishReason);
  if (result.failReason) {
    console.log("失败原因:", result.failReason);
  }
}
```

### 案例 8: 使用生成器创建数独谜题

```typescript
import { createStandardRegions } from "@/core/regions";
import { generateSudoku } from "@/core/generators";
import { DiagonalVariant } from "@/core/variants";
import { DifficultyLevel } from "@/core/types/solver";

// 创建对角线数独配置
const config = {
  size: 9,
  regions: createStandardRegions(9),
  variantRules: [new DiagonalVariant()],
};

// 配置生成器选项
const options = {
  difficulty: DifficultyLevel.MEDIUM, // 中等难度
  uniqueSolution: true, // 确保唯一解
  minGivens: 25, // 最少给定25个数字
  maxGivens: 35, // 最多给定35个数字
  symmetrical: true, // 生成对称谜题
  symmetryType: "rotational", // 旋转对称
  timeoutMs: 30000, // 30秒超时
  onProgress: (phase, data) => {
    if (phase === "grid") {
      console.log("生成了完整填充的网格");
    } else if (phase === "puzzle") {
      console.log("正在挖洞生成谜题...");
    }
    return true; // 继续生成
  },
};

// 生成数独谜题
const result = generateSudoku(config, options);

if (result.success) {
  console.log("成功生成数独谜题!");
  console.log("难度级别:", result.difficulty);
  console.log("提示数数量:", result.stats?.clueCount);
  console.log("生成耗时:", result.stats?.timeMs, "ms");

  // 展示生成的谜题
  console.log("生成的谜题:");
  if (result.puzzle) {
    result.puzzle.forEach((row) => {
      console.log(row.map((cell) => cell.value || ".").join(" "));
    });
  }

  // 谜题解
  console.log("谜题解:");
  if (result.solution) {
    result.solution.forEach((row) => {
      console.log(row.map((cell) => cell.value).join(" "));
    });
  }
} else {
  console.log("生成谜题失败:", result.finishReason);
}
```

## 详细文档

- **[API 参考](./docs/api-reference.md)**: 查看完整的模块接口和函数说明。
- **[开发指南](./docs/development-guide.md)**: 了解模块的编码规范、设计原则和扩展方法。

## 相关信息

- **类型定义**: 位于 [`src/core/types/`](./types/) 目录下。
- **变体规则**: 内置实现及接口定义见 [`src/core/variants/`](./variants/)。
