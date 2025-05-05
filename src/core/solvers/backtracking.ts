/**
 * @fileoverview 数独解题器回溯算法核心实现
 * 提供基于深度优先搜索和回溯的数独解题能力
 */

import { setCellValue } from "../grid/access";
import { cloneGrid } from "../grid/create";
import { CoreLoggers } from "../logger";
import type { SudokuConfig } from "../types/engine";
import type { Grid } from "../types/grid";
import type { SolveCallback, SolveStep, SolverStats } from "../types/solver";
import { validateAllRegions } from "../validation/collector";
import { selectCellWithMRV } from "./heuristics";

// 获取回溯算法专用日志记录器
const backtrackLogger = CoreLoggers.get("solver:backtracking");

// 回溯过程中每隔多少次递归检查一次超时，提升性能
const TIMEOUT_CHECK_INTERVAL = 100;

/**
 * 回溯解题上下文，包含解题过程中需要的状态
 */
export interface BacktrackingContext {
  /** 数独配置 */
  config: SudokuConfig;
  /** 解题过程回调 */
  onProgress?: SolveCallback;
  /** 是否寻找所有解 */
  findAllSolutions: boolean;
  /** 最大解数量 */
  maxSolutions: number;
  /** 超时时间戳 */
  timeoutTimestamp?: number;
  /** 已找到的解数组 */
  solutions: Grid[];
  /** 是否已经中断 */
  interrupted: boolean;
  /** 统计信息 */
  stats: SolverStats;
  /** 寻找单元格候选数的函数 */
  getCandidatesForCell: (row: number, col: number) => Set<number>;
  /** 递归调用计数器，用于控制超时检查频率 */
  recursionCounter?: number;
}

/**
 * 使用回溯算法解数独
 *
 * @param grid 初始数独网格
 * @param context 回溯解题上下文
 * @returns 是否成功找到解
 */
export function solveWithBacktracking(
  grid: Grid,
  context: BacktrackingContext,
): boolean {
  // 初始化或增加递归计数器
  if (context.recursionCounter === undefined) {
    context.recursionCounter = 0;
  } else {
    context.recursionCounter++;
  }

  // 每隔固定次数检查一次超时，而不是每次递归都检查
  if (
    context.timeoutTimestamp &&
    context.recursionCounter % TIMEOUT_CHECK_INTERVAL === 0 &&
    Date.now() > context.timeoutTimestamp
  ) {
    backtrackLogger.warn("解题超时");
    return false;
  }

  // 检查是否已中断
  if (context.interrupted) {
    backtrackLogger.debug("解题已被中断");
    return false;
  }

  // 选择下一个要填充的单元格 (使用MRV启发式)
  const nextCell = selectCellWithMRV(
    grid,
    context.config,
    context.getCandidatesForCell,
  );

  // 如果没有空格，说明找到了一个解
  if (!nextCell) {
    // 额外验证当前网格是否真的是有效解决方案
    const validation = validateAllRegions(grid, context.config.regions);
    if (!validation.isValid) {
      backtrackLogger.warn("发现的解无效，跳过", {
        errorCells: validation.errorCells.length,
      });
      context.stats.backtracks++;
      return false;
    }

    const solution = cloneGrid(grid);
    context.solutions.push(solution);
    backtrackLogger.info("找到一个解", {
      solutionsCount: context.solutions.length,
    });

    // 通知进度回调
    if (context.onProgress) {
      const shouldContinue = context.onProgress("solution", solution);
      if (shouldContinue === false) {
        context.interrupted = true;
        backtrackLogger.debug("解题被回调函数中断");
        return false;
      }
    }

    // 检查是否已达到最大解数量
    if (context.solutions.length >= context.maxSolutions) {
      backtrackLogger.info("达到最大解数量，停止搜索", {
        maxSolutions: context.maxSolutions,
      });
      return true;
    }

    // 如果只需要找一个解，返回true；否则继续搜索其他解
    return !context.findAllSolutions;
  }

  // 如果选中的单元格没有候选数，当前路径无解
  if (nextCell.candidates.size === 0) {
    context.stats.backtracks++;
    return false;
  }

  const { row, col, candidates } = nextCell;

  // 尝试每个候选数
  for (const value of candidates) {
    const newGrid = setCellValue(grid, row, col, value);
    context.stats.assignments++;

    // 通知步骤回调
    if (context.onProgress) {
      const step: SolveStep = { row, col, value };
      const shouldContinue = context.onProgress("step", step);
      if (shouldContinue === false) {
        context.interrupted = true;
        backtrackLogger.debug("解题被回调函数中断");
        return false;
      }
    }

    // 递归尝试解题
    const solved = solveWithBacktracking(newGrid, context);

    // 如果找到解并且不需要找所有解，则提前返回
    if (solved && !context.findAllSolutions) {
      return true;
    }

    // 如果被中断或达到最大解数量，提前返回
    if (
      context.interrupted ||
      context.solutions.length >= context.maxSolutions
    ) {
      return false;
    }
  }

  // 尝试了所有候选数都没有找到解，回溯
  context.stats.backtracks++;
  return false;
}

/**
 * 解数独备份方案 (不使用启发式策略，仅用于对比或测试)
 * 简单的递归回溯算法
 *
 * @param grid 数独网格
 * @param context 回溯上下文
 * @returns 是否找到解
 */
export function solveWithSimpleBacktracking(
  grid: Grid,
  context: BacktrackingContext,
): boolean {
  // 初始化或增加递归计数器
  if (context.recursionCounter === undefined) {
    context.recursionCounter = 0;
  } else {
    context.recursionCounter++;
  }

  // 每隔固定次数检查一次超时，而不是每次递归都检查
  if (
    context.timeoutTimestamp &&
    context.recursionCounter % TIMEOUT_CHECK_INTERVAL === 0 &&
    Date.now() > context.timeoutTimestamp
  ) {
    backtrackLogger.warn("解题超时 (简单回溯)");
    return false;
  }

  // 检查是否已中断
  if (context.interrupted) {
    backtrackLogger.debug("解题已被中断 (简单回溯)");
    return false;
  }

  // 验证当前网格是否有效
  const validation = validateAllRegions(grid, context.config.regions);
  if (!validation.isValid) {
    context.stats.backtracks++;
    return false;
  }

  // 查找第一个空格
  let row = -1;
  let col = -1;
  let found = false;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c].value === 0) {
        row = r;
        col = c;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // 没有空格，说明找到解
  if (!found) {
    // 额外验证当前网格是否真的是有效解决方案
    const validation = validateAllRegions(grid, context.config.regions);
    if (!validation.isValid) {
      backtrackLogger.warn("发现的解无效 (简单回溯)，跳过", {
        errorCells: validation.errorCells.length,
      });
      context.stats.backtracks++;
      return false;
    }

    const solution = cloneGrid(grid);
    context.solutions.push(solution);

    // 通知进度回调
    if (context.onProgress) {
      const shouldContinue = context.onProgress("solution", solution);
      if (shouldContinue === false) {
        context.interrupted = true;
        backtrackLogger.debug("解题被回调函数中断 (简单回溯)");
        return false;
      }
    }

    return !context.findAllSolutions;
  }

  // 尝试1-9所有可能的数字
  const size = context.config.size;
  for (let num = 1; num <= size; num++) {
    // 先检查这个数字是否可以放在这个位置
    const candidates = context.getCandidatesForCell(row, col);
    if (!candidates.has(num)) continue;

    const newGrid = setCellValue(grid, row, col, num);
    context.stats.assignments++;

    // 通知步骤回调
    if (context.onProgress) {
      const step: SolveStep = { row, col, value: num };
      const shouldContinue = context.onProgress("step", step);
      if (shouldContinue === false) {
        context.interrupted = true;
        return false;
      }
    }

    // 递归尝试解题
    if (solveWithSimpleBacktracking(newGrid, context)) {
      return true;
    }

    // 如果被中断或达到最大解数量，提前返回
    if (
      context.interrupted ||
      context.solutions.length >= context.maxSolutions
    ) {
      return false;
    }
  }

  // 所有数字都尝试过，回溯
  context.stats.backtracks++;
  return false;
}
