/**
 * @fileoverview 数独解题器启发式策略
 * 实现用于选择下一个填充单元格的启发式算法
 */

import { CoreLoggers } from "../logger";
import type { SudokuConfig } from "../types/engine";
import type { Grid } from "../types/grid";

const heuristicsLogger = CoreLoggers.get("solver:heuristics");

/**
 * 未赋值单元格的候选数信息
 */
interface CellCandidateInfo {
  /** 行索引 */
  row: number;
  /** 列索引 */
  col: number;
  /** 候选数集合 */
  candidates: Set<number>;
  /** 候选数数量 */
  count: number;
  /** 影响的其他未填充单元格数量 (度启发式) */
  constraintDegree?: number;
}

/**
 * 获取一个网格中所有未填充单元格的候选数信息
 * @param grid 数独网格
 * @param config 数独配置
 * @param calcCandidates 计算单元格候选数的函数
 * @returns 未填充单元格的候选数信息列表
 */
export function getAllEmptyCellsCandidates(
  grid: Grid,
  config: SudokuConfig,
  calcCandidates: (row: number, col: number) => Set<number>,
): CellCandidateInfo[] {
  const emptyCells: CellCandidateInfo[] = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col].value === 0) {
        const candidates = calcCandidates(row, col);
        emptyCells.push({
          row,
          col,
          candidates,
          count: candidates.size,
        });
      }
    }
  }

  return emptyCells;
}

/**
 * 使用最小剩余值(MRV)启发式选择下一个要填充的单元格
 * MRV选择候选数最少的单元格，这样更容易发现错误并回溯
 *
 * @param grid 数独网格
 * @param config 数独配置
 * @param calcCandidates 计算单元格候选数的函数
 * @returns 选择的单元格坐标和候选数，如果没有空格则返回null
 */
export function selectCellWithMRV(
  grid: Grid,
  config: SudokuConfig,
  calcCandidates: (row: number, col: number) => Set<number>,
): { row: number; col: number; candidates: Set<number> } | null {
  const emptyCells = getAllEmptyCellsCandidates(grid, config, calcCandidates);

  if (emptyCells.length === 0) {
    return null; // 没有空格，解题完成
  }

  // 按候选数数量升序排序
  emptyCells.sort((a, b) => a.count - b.count);

  // 如果第一个单元格没有候选数，说明遇到了错误
  if (emptyCells[0].count === 0) {
    heuristicsLogger.debug("发现无候选数单元格，需要回溯", {
      row: emptyCells[0].row,
      col: emptyCells[0].col,
    });
    return { ...emptyCells[0] }; // 返回这个无解的单元格，触发回溯
  }

  // 找出所有具有最少候选数的单元格
  const minCount = emptyCells[0].count;
  const mrvCells = emptyCells.filter((cell) => cell.count === minCount);

  if (mrvCells.length === 1) {
    const selected = mrvCells[0];
    heuristicsLogger.debug("MRV选择单元格", {
      row: selected.row,
      col: selected.col,
      candidatesCount: selected.count,
    });
    return { ...selected };
  }

  // 如果有多个单元格具有相同的最少候选数，使用度启发式
  return breakTiesByDegreeHeuristic(grid, config, mrvCells);
}

/**
 * 使用度启发式(Degree Heuristic)来打破MRV平局
 * 选择影响其他未赋值单元格最多的单元格
 *
 * @param grid 数独网格
 * @param config 数独配置
 * @param tiedCells 候选数数量相同的单元格列表
 * @returns 选择的单元格坐标和候选数
 */
function breakTiesByDegreeHeuristic(
  grid: Grid,
  config: SudokuConfig,
  tiedCells: CellCandidateInfo[],
): { row: number; col: number; candidates: Set<number> } {
  // 计算每个单元格的约束度（影响其他未赋值单元格的数量）
  for (const cell of tiedCells) {
    cell.constraintDegree = calculateConstraintDegree(
      grid,
      config,
      cell.row,
      cell.col,
    );
  }

  // 按约束度降序排序
  tiedCells.sort(
    (a, b) => (b.constraintDegree ?? 0) - (a.constraintDegree ?? 0),
  );

  const selected = tiedCells[0];
  heuristicsLogger.debug("使用度启发式选择单元格", {
    row: selected.row,
    col: selected.col,
    candidatesCount: selected.count,
    constraintDegree: selected.constraintDegree,
  });

  return { ...selected };
}

/**
 * 计算单元格的约束度
 * 即该单元格影响的其他未赋值单元格数量
 *
 * @param grid 数独网格
 * @param config 数独配置
 * @param row 行索引
 * @param col 列索引
 * @returns 约束度
 */
function calculateConstraintDegree(
  grid: Grid,
  config: SudokuConfig,
  row: number,
  col: number,
): number {
  // 安全检查：确保regions存在
  if (
    !config.regions ||
    !Array.isArray(config.regions) ||
    config.regions.length === 0
  ) {
    return 0; // 如果没有区域定义，返回0
  }

  // 获取包含此单元格的所有区域
  const regions = config.regions.filter((region) =>
    region.cells.some(([r, c]) => r === row && c === col),
  );

  // 统计这些区域中未赋值单元格的数量（不包括当前单元格）
  const affectedCells = new Set<string>();

  for (const region of regions) {
    for (const [r, c] of region.cells) {
      if ((r !== row || c !== col) && grid[r][c].value === 0) {
        affectedCells.add(`${r},${c}`);
      }
    }
  }

  return affectedCells.size;
}
