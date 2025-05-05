# API 参考

`SudokuEngine` 是与数独核心逻辑交互的主要入口。通过 `createSudokuEngine(config)` 获取实例。

## SudokuEngine 接口

### 状态获取 (Read-only)

- **`getConfig(): Readonly<SudokuConfig>`**
  - **描述:** 获取创建引擎时使用的配置对象（只读副本）。
  - **返回:** `Readonly<SudokuConfig>` - 引擎配置。
- **`getPuzzle(): Readonly<Grid>`**
  - **描述:** 获取引擎初始化时使用的原始谜题网格（只读副本）。
  - **返回:** `Readonly<Grid>` - 初始谜题网格。
- **`getCurrentGrid(): Readonly<Grid>`**
  - **描述:** 获取当前游戏状态的网格（只读深拷贝副本）。这是最常用的获取网格状态的方法。
  - **返回:** `Readonly<Grid>` - 当前网格状态。
- **`getRegions(): Readonly<Region[]>`**
  - **描述:** 获取引擎定义的所有区域（包括标准区域和变体规则添加的区域）的列表（只读副本）。
  - **返回:** `Readonly<Region[]>` - 所有区域定义的列表。
- **`getRegionsForCell(row: number, col: number): Readonly<Region[]>`**
  - **描述:** 获取包含指定坐标单元格的所有区域定义的列表（只读副本）。
  - **参数:**
    - `row: number` - 单元格行索引。
    - `col: number` - 单元格列索引。
  - **返回:** `Readonly<Region[]>` - 相关区域列表。

### 验证与计算 (带缓存优化)

- **`validate(): ValidationResult`**
  - **描述:** 全面验证当前内部网格状态是否符合所有标准规则和已配置的变体规则。结果会被内部缓存，重复调用性能高。
  - **返回:** `ValidationResult` - 包含验证结果、错误单元格等信息。
  - **缓存:** 结果基于当前 `currentGrid` 缓存。
- **`validateRegion(regionId: string): ValidationResult`**
  - **描述:** 单独验证指定 ID 的区域是否符合规则。**注意：此方法结果不被引擎缓存。**
  - **参数:**
    - `regionId: string` - 要验证的区域 ID。
  - **返回:** `ValidationResult` - 指定区域的验证结果。
  - **缓存:** 无。
- **`getCandidatesForCell(row: number, col: number): Set<number>`**
  - **描述:** 计算指定空单元格的候选数。考虑所有相关区域（标准+变体）的约束。**注意：此方法结果不被引擎缓存。**
  - **参数:**
    - `row: number` - 单元格行索引。
    - `col: number` - 单元格列索引。
  - **返回:** `Set<number>` - 该单元格可能的候选数集合。如果单元格已有值，返回空 Set。
  - **缓存:** 无。
- **`getAllCandidates(): Map<string, Set<number>>`**
  - **描述:** 计算当前网格中所有空单元格的候选数。结果会被内部缓存，重复调用性能高。
  - **返回:** `Map<string, Set<number>>` - 键为 `"row,col"` 格式，值为对应单元格的候选数 Set。
  - **缓存:** 结果基于当前 `currentGrid` 缓存。
- **`isComplete(): boolean`**
  - **描述:** 检查当前网格是否所有单元格都已填满，并且整个网格符合所有规则（内部调用 `validate()`）。结果会被缓存。
  - **返回:** `boolean` - 如果完成且合法则返回 `true`。
  - **缓存:** 结果基于当前 `currentGrid` 和 `validate()` 的缓存。
- **`isValidMove(row: number, col: number, value: number): boolean`**
  - **描述:** 快速检查在指定位置填入指定数字是否会立即导致冲突（只检查相关区域的重复，不进行全局验证）。用于交互时的即时反馈。
  - **参数:**
    - `row: number` - 行索引。
    - `col: number` - 列索引。
    - `value: number` - 要检查的数字 (填 0 表示清除，总是有效)。
  - **返回:** `boolean` - 如果填入该数字不会立即冲突则返回 `true`。
  - **缓存:** 无。

### 修改操作 (更新状态，管理历史)

- **`setValue(row: number, col: number, value: number): Grid`**
  - **描述:** 在指定单元格设置数字。如果 `value` 为 0，则清除该单元格的值。不允许修改 `isPuzzle` 为 `true` 的单元格。
  - **副作用:**
    - 更新内部 `currentGrid`。
    - 将旧状态推入 `undo` 历史栈。
    - 清空 `redo` 历史栈。
    - 清除所有相关缓存（验证、候选数等）。
  - **参数:**
    - `row: number` - 行索引。
    - `col: number` - 列索引。
    - `value: number` - 要设置的数字 (1-size) 或 0 (清除)。
  - **返回:** `Grid` - 操作后 `currentGrid` 的深拷贝副本。
- **`toggleNote(row: number, col: number, noteValue: number): Grid`**
  - **描述:** 在指定空单元格添加或移除一个笔记数字（小数字）。如果单元格已有值或为题目单元格，则无效。
  - **副作用:**
    - 更新内部 `currentGrid` 中对应单元格的 `notes` 集合。
    - 将旧状态推入 `undo` 历史栈。
    - 清空 `redo` 历史栈。
    - 清除所有相关缓存。
  - **参数:**
    - `row: number` - 行索引。
    - `col: number` - 列索引。
    - `noteValue: number` - 要添加/移除的笔记数字 (1-size)。
  - **返回:** `Grid` - 操作后 `currentGrid` 的深拷贝副本。

### 历史记录操作

- **`undo(): Grid | null`**
  - **描述:** 撤销上一步 `setValue` 或 `toggleNote` 操作。
  - **副作用:**
    - 从 `undo` 栈弹出一个状态，恢复为内部 `currentGrid`。
    - 将当前状态（撤销前的状态）推入 `redo` 栈。
    - 清除所有相关缓存。
  - **返回:** `Grid | null` - 恢复后的 `currentGrid` 副本。如果无法撤销（历史为空），返回 `null`。
- **`redo(): Grid | null`**
  - **描述:** 重做上一步被撤销的操作。
  - **副作用:**
    - 从 `redo` 栈弹出一个状态，恢复为内部 `currentGrid`。
    - 将当前状态（重做前的状态）推入 `undo` 栈。
    - 清除所有相关缓存。
  - **返回:** `Grid | null` - 恢复后的 `currentGrid` 副本。如果无法重做（`redo` 栈为空），返回 `null`。

### 存档与读档

- **`exportState(): MinimalState`**
  - **描述:** 导出当前游戏状态的最小化表示，用于存档。只包含相对于初始 `puzzle` 的用户修改（值和笔记）。
  - **返回:** `MinimalState` - 包含 `cells` 和可选 `meta` 的存档对象。
- **`importState(minimalState: MinimalState): Grid`**
  - **描述:** 从 `MinimalState` 对象恢复游戏进度，用于读档。会完全覆盖当前的 `currentGrid` 和历史记录。
  - **副作用:**
    - 用 `minimalState` 更新内部 `currentGrid`。
    - 清空 `undo` 和 `redo` 历史栈。
    - 清除所有相关缓存。
  - **参数:**
    - `minimalState: MinimalState` - 要导入的存档对象。
  - **返回:** `Grid` - 恢复后的 `currentGrid` 副本。

### 辅助查询

- **`getRelatedCells(row: number, col: number): CellPosition[]`**
  - **描述:** 获取与指定单元格相关的所有单元格坐标（包括自身、同行、同列、同宫以及所有所属区域内的其他单元格，去重）。
  - **参数:**
    - `row: number` - 行索引。
    - `col: number` - 列索引。
  - **返回:** `CellPosition[]` - 相关单元格坐标的数组。

## 解题器 API (`@/core/solvers`)

解题器提供了高效解决各种变体数独谜题的功能。

- **`solveSudoku(grid: Grid, config: SudokuConfig, options?: SolverOptions): SolverResult`**
  - **描述:** 使用回溯算法和启发式优化解决数独谜题，支持各种变体规则。
  - **参数:**
    - `grid: Grid` - 待解决的数独网格，0 表示空单元格。
    - `config: SudokuConfig` - 数独配置，包含尺寸、区域、变体规则等。
    - `options?: SolverOptions` - (可选) 解题器选项，详见 `SolverOptions` 类型。
  - **返回:** `SolverResult` - 解题结果，包含找到的解、统计信息等。
  - **缓存:** 内部使用候选数缓存优化性能。

### 解题器类型

- **`DifficultyLevel`**: 数独难度级别枚举。

  ```typescript
  enum DifficultyLevel {
    EASY = "easy", // 简单
    MEDIUM = "medium", // 中等
    HARD = "hard", // 困难
    EXPERT = "expert", // 专家
  }
  ```

- **`SolverOptions`**: 解题器配置选项。

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

- **`SolveCallback`**: 解题过程中找到一个解或步骤时的回调函数。

  ```typescript
  type SolveCallback = (
    type: "solution" | "step",
    data: Grid | { row: number; col: number; value: number }
  ) => boolean | void;
  ```

- **`SolverResult`**: 解题器返回的结果。

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

- **`SolverStats`**: 解题过程统计信息。
  ```typescript
  interface SolverStats {
    timeMs: number; // 解题耗时(毫秒)
    backtracks: number; // 回溯次数
    assignments: number; // 赋值次数
    candidateCalculations: number; // 候选数计算次数
    steps: number; // 解题步骤数
  }
  ```

## 生成器 API (`@/core/generators`)

生成器提供创建不同难度和变体的数独谜题功能。

- **`generateSudoku(config: SudokuConfig, options?: GeneratorOptions): GeneratorResult`**

  - **描述:** 生成数独谜题，支持不同难度和变体规则。先生成完整填充的数独解，然后挖洞形成谜题。
  - **参数:**
    - `config: SudokuConfig` - 数独配置，包含尺寸、区域、变体规则等。
    - `options?: GeneratorOptions` - (可选) 生成器选项，详见 `GeneratorOptions` 类型。
  - **返回:** `GeneratorResult` - 生成结果，包含谜题、唯一解、难度评估等。

- **`generateFilledGrid(config: SudokuConfig, options?: { timeoutMs?: number }): Grid | null`**

  - **描述:** 仅生成完整填充的有效数独网格(解)，用于内部或自定义生成流程。
  - **参数:**
    - `config: SudokuConfig` - 数独配置。
    - `options?` - (可选) 生成选项，可设置超时时间。
  - **返回:** `Grid | null` - 成功时返回完整填充的网格，失败时返回 null。

- **`analyzeDifficulty(puzzle: Grid, config: SudokuConfig): DifficultyLevel`**
  - **描述:** 分析数独谜题难度，基于给定数量和解题技巧进行评估。
  - **参数:**
    - `puzzle: Grid` - 待分析的数独谜题。
    - `config: SudokuConfig` - 数独配置。
  - **返回:** `DifficultyLevel` - 估计的难度级别。

### 生成器类型

- **`GeneratorOptions`**: 数独生成器配置选项。

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

- **`GeneratorCallback`**: 生成过程中的回调函数。

  ```typescript
  type GeneratorCallback = (
    phase: "grid" | "puzzle", // grid: 完整解, puzzle: 谜题
    data: Grid
  ) => boolean | undefined;
  ```

- **`GeneratorResult`**: 生成器返回的结果。

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

- **`GeneratorStats`**: 生成过程统计信息。
  ```typescript
  interface GeneratorStats {
    timeMs: number; // 生成耗时(毫秒)
    attempts: number; // 尝试次数
    fullGridsGenerated: number; // 生成的完整网格数
    digAttempts: number; // 挖洞尝试次数
    refillAttempts: number; // 验证唯一解的尝试次数
    clueCount?: number; // 最终提示数量
  }
  ```

## 引擎创建 (`createSudokuEngine`)

- **`createSudokuEngine(config: SudokuConfig, options?: { validateRules?: boolean; throwOnIncompatible?: boolean }): SudokuEngine`**
  - **描述:** 工厂函数，用于创建 `SudokuEngine` 实例。
  - **参数:**
    - `config: SudokuConfig` - 必需，引擎配置对象。
    - `options` (可选):
      - `validateRules?: boolean` (默认 `true`): 是否在创建时检查 `variantRules` 之间的兼容性。
      - `throwOnIncompatible?: boolean` (默认 `false`): 如果规则不兼容，是抛出错误 (`true`) 还是仅在控制台打印警告 (`false`)。
  - **返回:** `SudokuEngine` - 创建的引擎实例。
  - **可能抛出:** 如果 `validateRules` 和 `throwOnIncompatible` 均为 `true` 且规则不兼容，则抛出 `Error`。

## 网格工具函数 (`@/core/grid`)

这些是操作 `Grid` 数据结构的底层纯函数，位于 `src/core/grid/` 下，并通过 `@/core/grid` 或 `@/core` 导出。

- **`createEmptyCell(): CellState`**: 创建一个初始的空单元格状态。
- **`createEmptyGrid(size: number): Grid`**: 创建指定尺寸的空网格。
- **`createGridFromValues(values: number[][]): Grid`**: 从二维数字数组创建网格 (0 表示空，非 0 为题目数字)。
- **`cloneGrid(grid: Grid): Grid`**: 深拷贝一个网格。
- **`getCellState(grid: Grid, row: number, col: number): CellState | null`**: 安全地获取指定坐标的单元格状态。
- **`getCellValue(grid: Grid, row: number, col: number): number`**: 获取单元格的值 (-1 表示无效坐标)。
- **`isValidPosition(grid: Grid, row: number, col: number): boolean`**: 检查坐标是否在网格内。
- **`setCellValue(grid: Grid, row: number, col: number, value: number, isEditingPuzzle?: boolean): Grid`**: **(纯函数版本)** 返回一个设置了值的新网格副本。**注意：不建议直接使用，应通过 `engine.setValue` 操作。**
- **`toggleCellNote(grid: Grid, row: number, col: number, digit: number): Grid`**: **(纯函数版本)** 返回一个切换了笔记的新网格副本。**注意：不建议直接使用，应通过 `engine.toggleNote` 操作。**
- **`setCellHighlight(grid: Grid, row: number, col: number, highlight: HighlightType | undefined): Grid`**: 返回设置了高亮的新网格副本。
- **`cellToKey(row: number, col: number): string`**: 将坐标转换为 `"row,col"` 格式的字符串键。
- **`keyToCell(key: string): [number, number]`**: 将字符串键转换回坐标。
- **`exportGridState(grid: Grid): MinimalState`**: **(纯函数版本)** 将网格导出为最小状态。**注意：应使用 `engine.exportState`。**
- **`importGridState(grid: Grid, state: MinimalState): Grid`**: **(纯函数版本)** 将最小状态导入网格。**注意：应使用 `engine.importState`。**
- **`gridToHashKey(grid: Grid): string`**: 计算网格的轻量级哈希字符串，用于缓存。
- **`gridToString(grid: Grid): string`**: 将网格转换为易读的字符串表示（用于调试）。

## 验证函数 (`@/core/validation`)

提供验证相关的纯函数。

- **`checkDuplicatesBitmask(grid: Grid, cellCoords: ReadonlyArray<readonly [number, number]>): { duplicates: Array<[number, number]>; sources: Array<[number, number]> }`**: 使用位运算检查一组单元格坐标中是否有重复数字。
- **`validateRegionBitmask(grid: Grid, region: Region): ValidationResult`**: 使用位运算验证单个区域是否符合无重复规则。
- **`validateSum(grid: Grid, region: Region): ValidationResult`**: 验证杀手数独区域的总和是否正确（需要区域 `properties` 中有 `sum`）。
- **`isValidMoveBitmask(grid: Grid, row: number, col: number, value: number, regions: Region[]): boolean`**: **(纯函数版本)** 检查移动是否有效。**注意：应使用 `engine.isValidMove`。**
- **`validateAllRegions(grid: Grid, regions: Region[]): ValidationResult`**: 验证所有给定区域，收集所有错误。
- **`isGridComplete(grid: Grid): boolean`**: 检查网格是否所有单元格都已填满。

## 候选数函数 (`@/core/candidates`)

提供计算候选数的纯函数。

- **`getCandidatesForCell(grid: Grid, row: number, col: number, size: number, regions: Region[]): Set<number>`**: (基础版) 计算单个单元格的候选数。
- **`getAllCandidates(grid: Grid, size: number, regions: Region[]): Map<string, Set<number>>`**: (基础版) 计算所有空单元格的候选数。
- **`getCandidatesForCellBitmask(...)`**: (优化版) 使用位运算计算单个单元格候选数。**引擎内部优先使用此版本。**
- **`getAllCandidatesBitmask(...)`**: (优化版) 使用位运算计算所有空单元格候选数。**引擎内部优先使用此版本。**

## 区域函数 (`@/core/regions`)

提供创建和处理区域的函数。

- **`createStandardRegions(size: number, boxWidth?: number, boxHeight?: number): Region[]`**: 创建标准数独的区域（行、列、宫）。
- **(其他辅助函数)** 如 `getRegionById`, `getRegionsForCell` 的纯函数版本等。

## 变体规则 (`@/core/variants`)

定义了 `VariantRule` 接口和一些内置实现。

- **`VariantRule` 接口**:
  ```typescript
  interface VariantRule {
    name: string; // 规则名称
    description?: string;
    // (可选) 验证网格是否符合此变体规则
    validate?: (grid: Grid, config: SudokuConfig) => ValidationResult;
    // (可选) 获取此规则排除的候选数
    getExcludedCandidates?: (
      grid: Grid,
      row: number,
      col: number,
      config: SudokuConfig
    ) => Set<number>;
    // (可选) 获取此规则定义的额外区域
    getRegions?: (config: SudokuConfig) => Region[] | undefined;
    // (可选) 检查与其他规则的兼容性
    checkCompatibility?: (
      otherRules: VariantRule[],
      config: SudokuConfig
    ) => { compatible: boolean; message?: string };
    // (可选) 初始化，例如创建杀手笼子
    initialize?: (config: SudokuConfig) => SudokuConfig | void;
  }
  ```
- **内置规则实现**:
  - `standardRule`: 标准数独规则 (通常无需显式添加，引擎默认处理)。
  - `diagonalRule`: 对角线数独规则。
  - `killerRule(options: { cages: KillerCage[] })`: 杀手数独规则，需要提供笼子定义。
  - `jigsawRule(options: { regions: JigsawRegionDefinition[] })`: 宫格变体 (Jigsaw) 规则，需要提供区域定义。
- **辅助函数**:
  - `validateVariantRulesCombination(rules: VariantRule[], config: SudokuConfig)`: 检查一组规则是否兼容。
  - `validateWithVariants(grid: Grid, config: SudokuConfig)`: 使用所有变体规则验证网格。
  - `getExcludedCandidatesFromVariants(...)`: 获取所有变体规则排除的候选数。

## 日志功能 (`@/core/logger`)

- **`CoreLoggers`**: 包含各子模块日志记录器的对象 (`CoreLoggers.grid`, `CoreLoggers.validation`, etc.)。
- **`setCoreLoggingLevel(level: LogLevel)`**: 全局设置核心模块所有日志记录器的级别 (`'trace' | 'debug' | 'info' | 'warn' | 'error'`)。
