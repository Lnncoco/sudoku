# 开发指南

本指南面向需要修改 `@core` 模块源代码、修复 Bug 或添加新功能的开发者。

## 编码规范与要求

1.  **语言**: 使用 TypeScript，遵循最新的 ECMAScript 标准。
2.  **代码风格**:
    - 遵循项目根目录 `biome.json` (或 `.prettierrc` / `.eslintrc`) 配置。
    - 命名:
      - 接口、类型、类、枚举、组件: `PascalCase` (e.g., `CellState`, `SudokuEngine`)
      - 函数、变量、常量: `camelCase` (e.g., `getCellState`, `isValidMove`)
      - 常量 (如果确实全局不变且重要): `UPPER_SNAKE_CASE` (较少使用)
    - 使用 `const` 优先，其次 `let`，避免 `var`。
    - 优先使用箭头函数 `() => {}`。
    - 模块导入: 使用 ES Module (`import`/`export`)，路径别名 `@/` 指向 `src/`。
3.  **类型**:
    - 尽可能提供明确的类型注解，避免使用 `any`。
    - 使用接口 (`interface`) 定义对象结构，类型别名 (`type`) 定义联合类型、交叉类型或复杂类型。
    - 利用 TypeScript 的 `Readonly`、`ReadonlyArray` 等工具类型增强不可变性。
4.  **注释**:
    - 使用 JSDoc 风格为公共 API（导出函数、类、接口、类型）编写注释，说明用途、参数、返回值。
    - 对复杂逻辑、算法、优化技巧添加必要的行内或块注释。
    - 保持注释与代码同步更新。
5.  **错误处理**:
    - 对于可预期错误（如无效输入），应返回明确结果（如 `null`, `false`, `ValidationResult`），避免直接抛出异常，除非是严重错误（如配置不兼容且设置了 `throwOnIncompatible`）。
    - 使用 `logger.warn` 或 `logger.error` 记录异常情况。
6.  **依赖**:
    - 尽量减少外部依赖。
    - 使用的库（如 `loglevel`, `dayjs`）应在 `package.json` 中明确版本。

## 文件职责划分

清晰的文件结构有助于维护和理解代码。

- **`grid/`**: 所有与网格数据结构本身的操作，与游戏规则解耦。包含创建、访问、转换网格数据的纯函数。
- **`regions/`**: 定义区域 (`Region`) 类型，提供创建标准区域和处理区域相关逻辑的函数。
- **`validation/`**: 包含所有验证逻辑，如检查重复、验证区域、验证总和等。同样应尽量保持纯函数。
- **`candidates/`**: 包含计算候选数的逻辑，区分基础实现和优化实现。
- **`engine/`**: 游戏引擎的核心，负责状态管理 (`currentGrid`)、集成各子模块功能、处理用户交互 (`setValue`, `toggleNote`)、管理历史记录 (`undo`/`redo`)、缓存优化以及状态导入导出。这是唯一可以包含内部状态的地方。
- **`variants/`**: 定义 `VariantRule` 接口和各种变体规则的具体实现。每个变体规则文件应包含其特定的验证、候选数排除、区域生成等逻辑。
- **`solvers/`**: 数独解题器相关功能，包括回溯算法 (`backtracking.ts`)、启发式策略 (`heuristics.ts`) 和解题器入口 (`index.ts`)。负责高效求解各种变体规则下的数独谜题，支持不同算法策略。
- **`generators/`**: 数独谜题生成器功能，包括完整网格生成、挖洞算法、难度评估等，生成器入口 (`index.ts`) 导出主要功能。负责创建不同难度和变体规则的数独谜题，确保唯一解。
- **`types/`**: 集中定义并在各自 `index.ts` 中导出各模块共享的 TypeScript 类型和接口。
- **`logger.ts`**: 配置和导出核心模块专用的日志记录器。
- **`index.ts`**: 作为模块的公共入口，导出所有需要对外暴露的 API 和类型。

## 核心设计原则

1.  **单一职责原则 (SRP)**: 每个模块和函数应专注于做好一件事情。例如，`grid` 模块只关心网格数据操作，不关心数独规则。
2.  **纯函数与不可变性**: 大部分核心逻辑（`grid`, `validation`, `candidates`, `regions`）都应设计为纯函数，接收输入，返回新的输出，不修改输入参数，无副作用。`SudokuEngine` 内部通过创建网格副本实现状态更新的不可变性。这极大地提高了代码的可预测性、可测试性和与状态管理库（如 React State, Zustand, Redux）的兼容性。
3.  **接口隔离原则 (ISP)**: `SudokuEngine` 提供了清晰的接口，隐藏了内部实现细节。`VariantRule` 接口定义了变体规则需要实现的方法。
4.  **依赖倒置原则 (DIP)**: `SudokuEngine` 依赖于抽象的 `VariantRule` 接口，而不是具体的变体实现，使得添加新变体更容易。
5.  **关注点分离 (SoC)**: 将核心逻辑（验证、计算）、状态管理（引擎）、数据结构（网格）分离到不同模块。
6.  **缓存优化**: `SudokuEngine` 内部对耗时操作（如 `validate`, `getAllCandidates`）的结果进行缓存，避免重复计算，提升性能。修改操作会自动清除缓存。

## 扩展设计

### 添加新变体规则

要添加一个新的数独变体规则（例如，"偶数"规则：灰色单元格必须填偶数）：

1.  **创建规则文件**: 在 `src/core/variants/` 目录下创建一个新文件，例如 `evenRule.ts`。
2.  **实现 `VariantRule` 接口**:

    ```typescript
    import type {
      VariantRule,
      ValidationResult,
      SudokuConfig,
    } from "@/core/types";
    import { CoreLoggers } from "@/core/logger";

    const logger = CoreLoggers.variants;

    // (可选) 定义规则需要的额外配置或区域信息
    interface EvenCellConfig {
      evenCells: Array<[number, number]>; // 定义哪些单元格是"偶数"单元格
    }

    export function evenRule(options: EvenCellConfig): VariantRule {
      const evenCellsSet = new Set(
        options.evenCells.map(([r, c]) => `${r},${c}`)
      );

      return {
        name: "EvenRule",
        description: "特定单元格必须填入偶数",

        // 实现验证逻辑
        validate: (grid, config): ValidationResult => {
          const errorCells: Array<[number, number]> = [];
          for (const [row, col] of options.evenCells) {
            const cell = grid[row]?.[col];
            if (cell && cell.value !== 0 && cell.value % 2 !== 0) {
              logger.debug(
                `EvenRule 验证失败: 单元格 (${row}, ${col}) 的值 ${cell.value} 不是偶数`
              );
              errorCells.push([row, col]);
            }
          }
          return {
            isValid: errorCells.length === 0,
            errorCells,
            errorMessages:
              errorCells.length > 0 ? ["标记单元格必须为偶数"] : [],
          };
        },

        // 实现候选数排除逻辑
        getExcludedCandidates: (grid, row, col, config): Set<number> => {
          const excluded = new Set<number>();
          const key = `${row},${col}`;
          // 如果是偶数单元格，排除所有奇数候选
          if (evenCellsSet.has(key)) {
            for (let i = 1; i <= config.size; i += 2) {
              excluded.add(i);
            }
            logger.trace(
              `EvenRule: 单元格 (${row},${col}) 排除奇数候选 ${[
                ...excluded,
              ].join(",")}`
            );
          }
          return excluded;
        },

        // (可选) 如果需要，实现其他接口方法，如 checkCompatibility
      };
    }
    ```

3.  **导出规则**: 在 `src/core/variants/index.ts` 中导出新规则。
    ```typescript
    // src/core/variants/index.ts
    // ... 其他导出
    export { evenRule } from "./evenRule";
    ```
4.  **使用规则**: 在创建引擎时，将新规则实例添加到 `SudokuConfig` 的 `variantRules` 数组中。

    ```typescript
    import { createSudokuEngine, evenRule } from "@/core";

    const config = {
      // ... 其他配置
      variantRules: [
        evenRule({
          evenCells: [
            [0, 0],
            [1, 1],
          ],
        }), // 传入规则需要的配置
      ],
    };
    const engine = createSudokuEngine(config);
    ```

### 扩展解题器功能

要添加新的解题器算法或扩展现有算法：

1. **创建新的算法文件**：在 `src/core/solvers/` 目录下创建新文件，例如 `dancingLinks.ts`（舞蹈链算法）。

2. **实现算法核心逻辑**：

   ```typescript
   import type { BacktrackingContext } from "./backtracking";
   import type { Grid } from "../types/grid";
   import { CoreLoggers } from "../logger";

   const dlxLogger = CoreLoggers.get("solver:dlx");

   /**
    * 使用舞蹈链算法(Dancing Links)解数独
    * 适用于大型数独和难题
    *
    * @param grid 初始数独网格
    * @param context 回溯上下文
    * @returns 是否成功找到解
    */
   export function solveWithDancingLinks(
     grid: Grid,
     context: BacktrackingContext
   ): boolean {
     dlxLogger.info("使用舞蹈链算法解数独");

     // 算法实现...
     // 包括：
     // 1. 构建精确覆盖矩阵
     // 2. 应用舞蹈链算法
     // 3. 将解转换回数独网格

     // 成功找到解时更新context.solutions
     return true; // 或失败时返回false
   }
   ```

3. **将算法集成到解题器入口**：修改 `src/core/solvers/index.ts` 添加新算法：

   ```typescript
   import { solveWithDancingLinks } from "./dancingLinks";

   // 在solveSudoku函数中:

   // 根据strategy选择解题算法
   let solved = false;
   if (strategy === "fastest") {
     solved = solveWithBacktracking(gridCopy, context);
   } else if (strategy === "dlx") {
     // 添加新的策略选项
     solved = solveWithDancingLinks(gridCopy, context);
   } else {
     // 其他策略...
   }
   ```

4. **更新类型定义**：在 `src/core/types/solver.ts` 中更新 `SolverOptions` 接口：
   ```typescript
   interface SolverOptions {
     // ...现有选项
     strategy?: "fastest" | "humanlike" | "dlx"; // 添加新策略
   }
   ```

### 自定义生成器配置

要添加新的生成器特性或自定义难度控制：

1. **扩展难度设定**：修改 `src/core/generators/generator.ts` 的 `analyzeDifficulty` 函数：

   ```typescript
   export function analyzeDifficulty(
     puzzle: Grid,
     config: SudokuConfig,
     options?: { detailedAnalysis?: boolean }
   ): { difficulty: DifficultyLevel; details?: DifficultyDetails } {
     // 基本难度评估...

     // 如果需要详细分析
     if (options?.detailedAnalysis) {
       // 进行更深入的分析，可能需要调用解题器模拟人类解题过程
       return {
         difficulty,
         details: {
           techniques: ["nakedSingle", "hiddenPair"], // 所需技巧
           criticalSteps: 5, // 关键步骤数
           avgCandidates: 4.2, // 平均候选数
         },
       };
     }

     return { difficulty };
   }
   ```

2. **添加对称性模式**：在 `src/core/generators/generator.ts` 中扩展对称挖洞算法：

   ```typescript
   function digHolesWithSymmetry(
     grid: Grid,
     solution: Grid,
     options: {
       symmetryType:
         | "rotational"
         | "diagonal"
         | "both"
         | "horizontal"
         | "vertical";
       // 其他选项...
     }
   ): Grid {
     // 实现不同对称性模式的挖洞逻辑...

     // 对于新增的水平/垂直对称:
     if (options.symmetryType === "horizontal") {
       // 实现水平对称挖洞...
     } else if (options.symmetryType === "vertical") {
       // 实现垂直对称挖洞...
     }

     return result;
   }
   ```

3. **更新类型和接口**：更新 `src/core/types/generator.ts` 中的选项接口：

   ```typescript
   interface GeneratorOptions {
     // ...现有选项
     symmetryType?:
       | "rotational"
       | "diagonal"
       | "both"
       | "horizontal"
       | "vertical";
     detailedAnalysis?: boolean; // 是否进行详细难度分析
   }

   // 添加新类型定义
   interface DifficultyDetails {
     techniques: string[]; // 所需技巧
     criticalSteps: number; // 关键步骤数
     avgCandidates: number; // 平均候选数
   }
   ```

## 日志与调试

本核心模块集成了基于 `loglevel` 的日志系统，用于开发过程中的调试和问题追踪。

- **获取日志器**: 通过导入 `CoreLoggers` 对象，可以获取各子模块（如 `grid`, `validation`, `engine` 等）的专用日志记录器。例如：`import { CoreLoggers } from '@/core/logger'; const logger = CoreLoggers.grid;`
- **日志级别**: 支持 `trace`, `debug`, `info`, `warn`, `error` 五个级别。默认级别为 `info`，在 Vite 开发环境 (`import.meta.env.DEV`) 下默认为 `debug`。
- **控制级别**: 可以通过 `import { setCoreLoggingLevel } from '@/core/logger'; setCoreLoggingLevel('debug');` 来全局设置核心模块的日志输出级别。
- **用途**: 使用 `logger.debug()`, `logger.info()`, `logger.warn()` 等方法记录不同重要程度的信息，辅助开发。

## 测试

- 遵循项目根目录的测试指南（如 `test-guidelines` 规则或项目 README 中的测试说明）。
- 优先使用 **Vitest** 进行单元测试和集成测试。
- 测试文件应放在 `tests/` 目录下，并与源文件结构保持对应。
- 对于核心逻辑函数（`grid`, `validation`, `candidates`, `regions` 中的纯函数），编写充分的单元测试，覆盖各种边界情况。
- 对于 `SudokuEngine`，编写集成测试，模拟用户交互流程（`setValue`, `undo`, `validate` 等），验证状态变化、历史记录、缓存行为是否符合预期。
- 对于变体规则，编写单元测试验证其 `validate` 和 `getExcludedCandidates` 方法的正确性。
- 对于解题器和生成器，应编写以下测试：
  - **解题器测试**：
    - 测试不同变体下的解题能力 (`tests/solvers/diagonal-solver.test.ts`, `killer-solver.test.ts` 等)
    - 测试超时处理和中断机制
    - 测试多解数独的处理和返回值
    - 测试无解数独的判断逻辑
    - 测试启发式选择策略的有效性
  - **生成器测试**：
    - 测试唯一解保证机制
    - 测试难度控制是否符合要求
    - 测试对称性选项生成结果
    - 测试在特定变体规则下生成谜题
    - 测试生成超时和错误处理
- 目标是实现**高测试覆盖率**，尤其是对于验证和核心计算逻辑，确保数独规则的正确性。

### 解题器测试示例

```typescript
// tests/solvers/diagonal-solver.test.ts
import { describe, it, expect } from "vitest";
import { solveSudoku } from "@/core/solvers";
import { createGridFromValues } from "@/core/grid";
import { createStandardRegions } from "@/core/regions";
import { DiagonalVariant } from "@/core/variants";

describe("对角线数独解题器", () => {
  it("应成功求解有效的对角线数独谜题", () => {
    // 准备测试数据：一个有唯一解的对角线数独谜题
    const puzzle = createGridFromValues([
      /* 测试数据 */
    ]);

    // 配置
    const config = {
      size: 9,
      regions: createStandardRegions(9),
      variantRules: [new DiagonalVariant()],
    };

    // 设置合理超时，防止测试阻塞
    const options = { timeoutMs: 5000 };

    // 调用解题器
    const result = solveSudoku(puzzle, config, options);

    // 验证结果
    expect(result.success).toBe(true);
    expect(result.solutions.length).toBeGreaterThan(0);
    expect(result.finishReason).toBe("solved");

    // 验证解的正确性
    const solution = result.solutions[0];
    // 检查对角线约束是否满足
    // ... 验证代码
  });

  it("应正确处理无解的对角线数独谜题", () => {
    /* 类似的测试结构，但使用无解谜题 */
  });

  it("应在超时限制内中止解题过程", () => {
    /* 使用复杂谜题和较短超时测试超时处理 */
  });
});
```

### 生成器测试示例

```typescript
// tests/generators/generator.test.ts
import { describe, it, expect } from "vitest";
import { generateSudoku } from "@/core/generators";
import { createStandardRegions } from "@/core/regions";
import { DiagonalVariant } from "@/core/variants";
import { DifficultyLevel } from "@/core/types/solver";
import { solveSudoku } from "@/core/solvers";

describe("数独生成器", () => {
  it("应生成有效的标准数独谜题", () => {
    const config = {
      size: 9,
      regions: createStandardRegions(9),
    };

    const options = {
      difficulty: DifficultyLevel.MEDIUM,
      timeoutMs: 10000,
    };

    const result = generateSudoku(config, options);

    // 验证基本结果
    expect(result.success).toBe(true);
    expect(result.puzzle).not.toBeNull();
    expect(result.solution).not.toBeNull();
    expect(result.difficulty).toBe(DifficultyLevel.MEDIUM);

    // 验证生成的谜题有唯一解
    if (result.puzzle && result.solution) {
      const solverResult = solveSudoku(result.puzzle, config, {
        findAllSolutions: true,
        maxSolutions: 2,
      });

      expect(solverResult.solutions.length).toBe(1);
    }
  });

  it("应生成对称的数独谜题", () => {
    /* 测试对称性选项 */
  });

  it("应生成对角线变体数独谜题", () => {
    /* 测试对角线变体 */
  });

  it("应尊重最小/最大提示数量限制", () => {
    /* 测试提示数限制 */
  });
});
```
