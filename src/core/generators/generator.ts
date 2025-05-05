/**
 * @fileoverview 数独谜题生成器
 * 实现数独生成的核心算法
 */

import { setCellValue } from "../grid/access";
import { cloneGrid, createEmptyGrid } from "../grid/create";
import { CoreLoggers } from "../logger";
import type { SudokuConfig } from "../types/engine";
import type {
  GeneratorCallback,
  GeneratorOptions,
  GeneratorResult,
  GeneratorStats,
} from "../types/generator";
import type { Grid } from "../types/grid";
import { DifficultyLevel } from "../types/solver";
import type { SolverOptions } from "../types/solver";
import { validateAllRegions } from "../validation/collector";

// 获取生成器专用日志记录器
const generatorLogger = CoreLoggers.get("generator:core");

/**
 * 创建默认的生成器统计信息
 */
function createDefaultGeneratorStats(): GeneratorStats {
  return {
    timeMs: 0,
    attempts: 0,
    fullGridsGenerated: 0,
    digAttempts: 0,
    refillAttempts: 0,
  };
}

/**
 * 随机打乱数字数组
 * @param array 要打乱的数组
 * @returns 打乱后的新数组
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 计算给定数字数量
 * @param grid 数独网格
 * @returns 非零单元格数量
 */
function countGivens(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.value !== 0) {
        count++;
      }
    }
  }
  return count;
}

/**
 * 获取对称位置
 * @param row 行索引
 * @param col 列索引
 * @param size 网格大小
 * @param type 对称类型
 * @returns 对称位置坐标
 */
function getSymmetricPosition(
  row: number,
  col: number,
  size: number,
  type: "rotational" | "mirror" | "diagonal",
): [number, number] {
  switch (type) {
    case "rotational":
      // 旋转对称 (通过中心点的180度旋转)
      return [size - 1 - row, size - 1 - col];
    case "mirror":
      // 镜像对称 (水平中轴线)
      return [size - 1 - row, col];
    case "diagonal":
      // 对角线对称
      return [col, row];
    default:
      return [row, col];
  }
}

/**
 * 使用优化后的随机回溯算法生成一个填满的有效数独网格
 *
 * @param config 数独配置
 * @param solveCallback 解题回调函数
 * @returns 填满的有效数独网格，或null表示生成失败
 */
export function generateFilledGrid(
  config: SudokuConfig,
  solveCallback?: (grid: Grid) => boolean | undefined,
): Grid | null {
  const startTime = Date.now();
  generatorLogger.debug("开始生成完整填充网格");

  const size = config.size;
  const grid = createEmptyGrid(size);

  // 尝试生成满网格
  const success = fillGridWithBacktracking(grid, 0, 0, config, solveCallback);

  const endTime = Date.now();
  if (success) {
    generatorLogger.info(
      `成功生成完整填充网格，耗时: ${endTime - startTime}ms`,
    );
    return grid;
  }

  generatorLogger.warn("生成完整填充网格失败");
  return null;
}

/**
 * 通过回溯法填充数独网格
 *
 * @param grid 要填充的网格
 * @param startRow 开始填充的行
 * @param startCol 开始填充的列
 * @param config 数独配置
 * @param solveCallback 解题回调
 * @returns 是否成功填充
 */
function fillGridWithBacktracking(
  grid: Grid,
  startRow: number,
  startCol: number,
  config: SudokuConfig,
  solveCallback?: (grid: Grid) => boolean | undefined,
): boolean {
  const size = grid.length;
  let row = startRow;
  let col = startCol;

  // 找到下一个要填充的单元格
  while (row < size && grid[row][col].value !== 0) {
    col++;
    if (col >= size) {
      col = 0;
      row++;
    }
  }

  // 如果没有空白单元格了，说明填充完成
  if (row >= size) {
    return true;
  }

  // 随机尝试1到size的所有数字
  const numbers = shuffleArray(Array.from({ length: size }, (_, i) => i + 1));

  for (const num of numbers) {
    // 检查当前位置填入num是否有效
    const tempGrid = setCellValue(grid, row, col, num);
    const validation = validateAllRegions(tempGrid, config.regions);

    if (validation.isValid) {
      // 有效，继续填充下一个单元格
      if (solveCallback) {
        const shouldContinue = solveCallback(tempGrid);
        if (shouldContinue === false) {
          return false;
        }
      }

      const nextCol = (col + 1) % size;
      const nextRow = col + 1 >= size ? row + 1 : row;

      if (
        fillGridWithBacktracking(
          tempGrid,
          nextRow,
          nextCol,
          config,
          solveCallback,
        )
      ) {
        // 复制回当前网格
        for (let r = 0; r < grid.length; r++) {
          for (let c = 0; c < grid[r].length; c++) {
            grid[r][c] = { ...tempGrid[r][c] };
          }
        }
        return true;
      }
    }
  }

  // 所有数字都尝试过，回溯
  return false;
}

/**
 * 生成数独谜题
 * 先生成完整填充的数独解，然后挖洞形成谜题
 *
 * @param config 数独配置
 * @param options 生成器选项
 * @returns 生成结果
 */
export function generateSudoku(
  config: SudokuConfig,
  options: GeneratorOptions = {},
): GeneratorResult {
  const startTime = Date.now();
  const stats = createDefaultGeneratorStats();

  generatorLogger.info("开始生成数独谜题", { options });

  // 处理选项默认值
  const {
    difficulty = DifficultyLevel.MEDIUM,
    uniqueSolution = true,
    minGivens = Math.floor(config.size * config.size * 0.25), // 默认至少25%的单元格有提示
    maxGivens = Math.floor(config.size * config.size * 0.5), // 默认最多50%的单元格有提示
    symmetrical = false,
    symmetryType = "rotational",
    timeoutMs = 30000, // 默认30秒超时
    onProgress,
  } = options;

  // 计算超时时间戳
  const timeoutTimestamp = startTime + timeoutMs;

  // 生成结果
  const result: GeneratorResult = {
    success: false,
    puzzle: null,
    solution: null,
    stats,
    finishReason: "error",
  };

  try {
    // 生成完整解
    let filledGrid: Grid | null = null;
    let attempts = 0;
    const maxAttempts = 10; // 最多尝试10次生成完整解

    while (!filledGrid && attempts < maxAttempts) {
      attempts++;
      stats.attempts++;

      // 检查超时
      if (Date.now() > timeoutTimestamp) {
        generatorLogger.warn("生成完整解超时");
        result.finishReason = "timeout";
        break;
      }

      filledGrid = generateFilledGrid(config, (grid) => {
        // 进度回调
        if (onProgress) {
          return onProgress("grid", grid);
        }
        return undefined;
      });
    }

    // 如果没有生成完整解，返回错误
    if (!filledGrid) {
      generatorLogger.error("无法生成有效的完整解");
      result.finishReason = filledGrid === null ? "error" : "interrupted";
      return result;
    }

    stats.fullGridsGenerated++;

    // 保存完整解
    const solution = cloneGrid(filledGrid);
    result.solution = solution;

    // 创建谜题（克隆解，然后挖洞）
    const puzzleGrid = cloneGrid(solution);
    // 设置所有单元格为谜题初始值
    for (let r = 0; r < puzzleGrid.length; r++) {
      for (let c = 0; c < puzzleGrid[r].length; c++) {
        if (puzzleGrid[r][c].value !== 0) {
          puzzleGrid[r][c].isPuzzle = true;
        }
      }
    }

    // 挖洞算法
    const modifiedPuzzle = digHoles(
      puzzleGrid,
      solution,
      config,
      {
        difficulty,
        uniqueSolution,
        minGivens,
        maxGivens,
        symmetrical,
        symmetryType,
        timeoutTimestamp,
        onProgress,
      },
      stats,
    );

    if (!modifiedPuzzle) {
      result.finishReason = "error";
      generatorLogger.error("挖洞过程失败");
      return result;
    }

    const givensCount = countGivens(modifiedPuzzle);

    // 设置结果
    result.success = true;
    result.puzzle = modifiedPuzzle;
    result.finishReason = "success";
    result.givensCount = givensCount;
    result.difficulty = difficulty; // 实际难度需要通过分析确定

    generatorLogger.info("成功生成数独谜题", {
      givensCount,
      difficulty,
      uniqueSolution,
    });
  } catch (error) {
    generatorLogger.error("生成过程发生错误", { error });
    result.finishReason = "error";
    result.errorMessage =
      error instanceof Error ? error.message : String(error);
  } finally {
    // 计算耗时
    stats.timeMs = Date.now() - startTime;
  }

  return result;
}

/**
 * 挖洞算法实现
 * 从完整解中移除数字，形成谜题
 */
interface DigOptions {
  difficulty: DifficultyLevel;
  uniqueSolution: boolean;
  minGivens: number;
  maxGivens: number;
  symmetrical: boolean;
  symmetryType: "rotational" | "mirror" | "diagonal";
  timeoutTimestamp: number;
  onProgress?: GeneratorCallback;
}

/**
 * 挖洞算法 - 从完整解中移除数字形成谜题
 *
 * @param grid 初始网格(完整解的副本)
 * @param solution 完整解(用于验证)
 * @param config 数独配置
 * @param options 挖洞选项
 * @param stats 统计信息
 * @returns 挖洞后的谜题，或null表示失败
 */
function digHoles(
  grid: Grid,
  solution: Grid,
  config: SudokuConfig,
  options: DigOptions,
  stats: GeneratorStats,
): Grid | null {
  const {
    difficulty,
    uniqueSolution,
    minGivens,
    maxGivens,
    symmetrical,
    symmetryType,
    timeoutTimestamp,
    onProgress,
  } = options;

  generatorLogger.debug("开始挖洞", {
    difficulty,
    uniqueSolution,
    minGivens,
    maxGivens,
    symmetrical,
  });

  const size = grid.length;
  const totalCells = size * size;

  // 创建所有单元格位置的数组
  const positions: [number, number][] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      positions.push([row, col]);
    }
  }

  // 随机打乱位置顺序
  const shuffledPositions = shuffleArray(positions);

  // 根据难度确定目标给定数字数量
  let targetGivens: number;
  switch (difficulty) {
    case DifficultyLevel.EASY:
      targetGivens = Math.floor(totalCells * 0.45);
      break;
    case DifficultyLevel.MEDIUM:
      targetGivens = Math.floor(totalCells * 0.35);
      break;
    case DifficultyLevel.HARD:
      targetGivens = Math.floor(totalCells * 0.3);
      break;
    case DifficultyLevel.EXPERT:
      targetGivens = Math.floor(totalCells * 0.25);
      break;
    default:
      targetGivens = Math.floor(totalCells * 0.35);
  }

  // 确保目标数量在限制范围内
  targetGivens = Math.max(minGivens, Math.min(targetGivens, maxGivens));

  generatorLogger.debug(
    `目标给定数字: ${targetGivens} (总单元格: ${totalCells})`,
  );

  // 用于记录已经尝试过但无法移除的单元格
  const cannotRemove = new Set<string>();

  // 使用临时变量存储工作中的网格，避免修改函数参数
  let workingGrid = cloneGrid(grid);

  // 开始挖洞过程
  for (const [row, col] of shuffledPositions) {
    // 检查超时
    if (Date.now() > timeoutTimestamp) {
      generatorLogger.warn("挖洞过程超时");
      break;
    }

    // 如果当前位置已经是空的，跳过
    if (workingGrid[row][col].value === 0) {
      continue;
    }

    // 如果这个位置已经尝试过无法移除，跳过
    const posKey = `${row},${col}`;
    if (cannotRemove.has(posKey)) {
      continue;
    }

    // 记录挖洞次数
    stats.digAttempts++;

    // 检查给定数字数量是否已经达到目标
    const currentGivens = countGivens(workingGrid);
    if (currentGivens <= targetGivens) {
      generatorLogger.debug(`已达到目标给定数字数量: ${currentGivens}`);
      break;
    }

    // 尝试移除当前单元格
    const originalValue = workingGrid[row][col].value;
    const tempGrid = cloneGrid(workingGrid);

    // 清除当前单元格
    tempGrid[row][col].value = 0;
    tempGrid[row][col].isPuzzle = false;

    // 如果需要对称，也清除对称位置
    if (symmetrical) {
      const [symRow, symCol] = getSymmetricPosition(
        row,
        col,
        size,
        symmetryType,
      );

      // 确保对称位置有效且不是同一个位置
      if (
        symRow >= 0 &&
        symRow < size &&
        symCol >= 0 &&
        symCol < size &&
        !(symRow === row && symCol === col) &&
        tempGrid[symRow][symCol].value !== 0
      ) {
        tempGrid[symRow][symCol].value = 0;
        tempGrid[symRow][symCol].isPuzzle = false;
      }
    }

    // 检查是否仍然有唯一解
    let canRemove = true;
    if (uniqueSolution) {
      canRemove = hasUniqueSolution(tempGrid, solution, config, stats);
    }

    if (canRemove) {
      // 可以移除，更新网格
      workingGrid = tempGrid;

      // 进度回调
      if (onProgress) {
        const shouldContinue = onProgress("puzzle", workingGrid);
        if (shouldContinue === false) {
          generatorLogger.debug("挖洞过程被回调函数中断");
          return workingGrid;
        }
      }
    } else {
      // 不能移除，记录位置
      cannotRemove.add(posKey);

      // 如果是对称模式，也记录对称位置
      if (symmetrical) {
        const [symRow, symCol] = getSymmetricPosition(
          row,
          col,
          size,
          symmetryType,
        );
        cannotRemove.add(`${symRow},${symCol}`);
      }
    }
  }

  // 确保最少给定数字数量
  const finalGivens = countGivens(workingGrid);
  if (finalGivens < minGivens) {
    generatorLogger.warn(
      `给定数字数量(${finalGivens})低于最小要求(${minGivens})`,
    );
  }

  generatorLogger.info(`挖洞完成，最终给定数字: ${finalGivens}`);
  return workingGrid;
}

/**
 * 检查谜题是否有唯一解
 *
 * @param grid 要检查的谜题
 * @param solution 已知的解
 * @param config 数独配置
 * @param stats 统计信息
 * @returns 是否有唯一解
 */
function hasUniqueSolution(
  grid: Grid,
  solution: Grid,
  config: SudokuConfig,
  stats: GeneratorStats,
): boolean {
  // TODO: 调用解题器检查唯一解
  // 这里仅为简单实现，实际上应调用解题器查找所有解

  stats.refillAttempts++;

  // 模拟检查: 填入一个与已知解不同的值，看是否仍有解
  // 真实实现中应使用完整的解题器逻辑

  // 检查是否有空格
  let hasEmptyCell = false;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.value === 0) {
        hasEmptyCell = true;
        break;
      }
    }
    if (hasEmptyCell) break;
  }

  // 如果没有空格，则只有一个解
  if (!hasEmptyCell) {
    return true;
  }

  // 简单检查：找到第一个空格
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c].value === 0) {
        // 查找除正确解之外可能的值
        const correctValue = solution[r][c].value;

        for (let v = 1; v <= grid.length; v++) {
          if (v !== correctValue) {
            // 尝试填入一个错误的值
            const testGrid = cloneGrid(grid);
            testGrid[r][c].value = v;

            // 验证这个值是否符合基本规则
            const validation = validateAllRegions(testGrid, config.regions);
            if (validation.isValid) {
              // 如果这个错误的值是有效的，那么可能有多个解
              return false;
            }
          }
        }

        // 只检查第一个空格
        return true;
      }
    }
  }

  return true;
}

/**
 * 分析数独谜题难度
 * 基于给定数字数量和解题技巧难度评估
 *
 * @param puzzle 数独谜题
 * @param config 数独配置
 * @returns 估计难度级别
 */
export function analyzeDifficulty(
  puzzle: Grid,
  config: SudokuConfig,
): DifficultyLevel {
  const size = puzzle.length;
  const givensCount = countGivens(puzzle);
  const totalCells = size * size;
  const givensPercent = givensCount / totalCells;

  // 简单根据给定数字百分比判断难度
  if (givensPercent > 0.45) {
    return DifficultyLevel.EASY;
  }
  if (givensPercent > 0.35) {
    return DifficultyLevel.MEDIUM;
  }
  if (givensPercent > 0.28) {
    return DifficultyLevel.HARD;
  }
  return DifficultyLevel.EXPERT;

  // TODO: 使用解题器模拟人类解题过程，分析所需技巧难度
}
