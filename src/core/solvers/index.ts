/**
 * @fileoverview 数独解题器模块入口
 * 导出解题器相关功能
 */

import { cloneGrid } from "../grid/create";
import { CoreLoggers } from "../logger";
import type { SudokuConfig } from "../types/engine";
import type { Grid } from "../types/grid";
import type { SolverOptions, SolverResult, SolverStats } from "../types/solver";
import { validateAllRegions } from "../validation/collector";
import { isValidMoveBitmask } from "../validation/standard";
import type { BacktrackingContext } from "./backtracking";
import {
  solveWithBacktracking,
  solveWithSimpleBacktracking,
} from "./backtracking";

// 获取解题器日志记录器
const solverLogger = CoreLoggers.get("solver:core");

/**
 * 创建默认的解题器统计信息
 */
function createDefaultSolverStats(): SolverStats {
  return {
    timeMs: 0,
    backtracks: 0,
    assignments: 0,
    candidateCalculations: 0,
    steps: 0,
  };
}

/**
 * 解决数独谜题
 * 使用配置的算法解决数独
 *
 * @param grid 初始数独网格
 * @param config 数独配置
 * @param options 解题器选项
 * @returns 解题结果
 */
export function solveSudoku(
  grid: Grid,
  config: SudokuConfig,
  options: SolverOptions = {},
): SolverResult {
  const startTime = Date.now();
  solverLogger.info("开始解数独", { options });

  // 处理选项默认值
  const {
    findAllSolutions = false,
    maxSolutions = 1,
    timeoutMs = 30000, // 默认30秒超时
    collectStats = true,
    onProgress,
    strategy = "fastest",
  } = options;

  // 计算超时时间戳
  const timeoutTimestamp = timeoutMs ? startTime + timeoutMs : undefined;

  // 准备统计信息
  const stats = createDefaultSolverStats();

  // 准备结果对象
  const result: SolverResult = {
    success: false,
    solutions: [],
    stats: collectStats ? stats : undefined,
    finishReason: "error",
  };

  try {
    // 先验证初始网格是否有效
    const initialValidation = validateAllRegions(grid, config.regions);
    if (!initialValidation.isValid) {
      solverLogger.warn("初始网格无效，无法解题", {
        errorCells: initialValidation.errorCells,
      });
      result.finishReason = "no_solution";
      result.failReason = "初始网格无效";
      return result;
    }

    // 创建候选数计算缓存
    const candidatesCache = new Map<string, Set<number>>();

    // 创建回溯上下文
    const context: BacktrackingContext = {
      config,
      onProgress,
      findAllSolutions,
      maxSolutions,
      timeoutTimestamp,
      solutions: [],
      interrupted: false,
      stats,
      recursionCounter: 0, // 初始化递归计数器
      getCandidatesForCell: (row, col) => {
        // 计算一个位置的所有候选数
        stats.candidateCalculations++;

        // 如果单元格已有值，返回空集合
        if (grid[row][col].value !== 0) {
          return new Set<number>();
        }

        // 查找缓存
        const cacheKey = `${row},${col}`;
        if (candidatesCache.has(cacheKey)) {
          const cachedCandidates = candidatesCache.get(cacheKey);
          if (cachedCandidates) {
            return cachedCandidates;
          }
        }

        // 使用更高效的方式计算候选数（直接检查约束）
        const candidates = new Set<number>();
        for (let num = 1; num <= config.size; num++) {
          if (isValidMoveBitmask(grid, row, col, num, config.regions)) {
            candidates.add(num);
          }
        }

        // 缓存结果
        candidatesCache.set(cacheKey, candidates);
        return candidates;
      },
    };

    // 克隆网格，避免修改原始网格
    const gridCopy = cloneGrid(grid);

    // 根据策略选择解题算法
    let solved = false;
    if (strategy === "fastest") {
      solved = solveWithBacktracking(gridCopy, context);
    } else {
      // 人类解法模拟 (未实现)
      // 暂时使用简单回溯
      solved = solveWithSimpleBacktracking(gridCopy, context);
    }

    // 处理结果
    result.solutions = context.solutions;

    if (context.interrupted) {
      // 即使被中断，也应该检查返回的解是否有效
      if (context.solutions.length > 0) {
        const lastSolution = context.solutions[context.solutions.length - 1];
        const validation = validateAllRegions(lastSolution, config.regions);

        if (validation.isValid) {
          // 如果中断前找到了有效解，仍然可以标记为成功
          result.finishReason = "interrupted_with_solution";
          result.success = true;
          solverLogger.info("解题被中断，但找到了有效解");
        } else {
          // 解无效，移除错误解
          result.solutions = context.solutions.slice(0, -1);
          result.finishReason = "interrupted";
          result.success = result.solutions.length > 0; // 如果还有其他有效解，仍然标记成功
          solverLogger.warn("解题被中断，最后一个解无效，已移除");
        }
      } else {
        result.finishReason = "interrupted";
        solverLogger.info("解题过程被中断，未找到解");
      }
    } else if (timeoutTimestamp && Date.now() > timeoutTimestamp) {
      // 对超时情况也进行验证
      if (context.solutions.length > 0) {
        const lastSolution = context.solutions[context.solutions.length - 1];
        const validation = validateAllRegions(lastSolution, config.regions);
        result.success = validation.isValid;
      }
      result.finishReason = "timeout";
      solverLogger.warn("解题超时");
    } else if (context.solutions.length > 0) {
      result.finishReason = "solved";
      result.success = true;
      solverLogger.info(`找到 ${context.solutions.length} 个解`);
    } else {
      result.finishReason = "no_solution";
      solverLogger.warn("没有找到解");
    }
  } catch (error) {
    // 修复: 记录错误信息时避免直接传递原始error对象给可能无法处理它的日志库
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    solverLogger.error("解题过程发生错误", {
      message: errorMessage,
      stack: errorStack,
    });
    result.finishReason = "error";
    result.failReason = errorMessage; // 使用处理过的错误信息
  } finally {
    // 计算总耗时
    if (stats) {
      stats.timeMs = Date.now() - startTime;
    }
  }

  return result;
}

/**
 * 导出用于测试的内部函数
 */
export const __testing = {
  solveWithBacktracking,
  solveWithSimpleBacktracking,
};
