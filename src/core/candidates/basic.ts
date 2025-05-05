/**
 * @fileoverview 基础候选数计算实现
 * 提供基于传统集合运算的候选数计算函数
 */

import { CoreLoggers } from "../logger";
import type { Grid } from "../types/grid";
import type { Region } from "../types/region";

const logger = CoreLoggers.candidates;

/**
 * 获取给定单元格的候选数
 *
 * @param grid 数独网格
 * @param row 行索引
 * @param col 列索引
 * @param size 数独尺寸（值的范围：1到size）
 * @param regions 包含该单元格的区域列表
 * @returns 可能的候选数集合
 */
export function getCandidatesForCell(
  grid: Grid,
  row: number,
  col: number,
  size: number,
  regions: Region[],
): Set<number> {
  logger.trace(`计算单元格 (${row}, ${col}) 的候选数`);

  // 如果单元格已有值，返回空集合
  if (grid[row][col].value !== 0) {
    logger.trace(
      `单元格 (${row}, ${col}) 已有值 ${grid[row][col].value}，无候选数`,
    );
    return new Set<number>();
  }

  // 获取包含当前单元格的所有区域
  const relevantRegions = regions.filter((region) =>
    region.cells.some(([r, c]) => r === row && c === col),
  );

  logger.trace(`单元格 (${row}, ${col}) 属于 ${relevantRegions.length} 个区域`);

  // 初始候选数：1到size的所有数字
  const candidates = new Set<number>();
  for (let i = 1; i <= size; i++) {
    candidates.add(i);
  }

  // 对每个相关区域，移除已使用的数字
  for (const region of relevantRegions) {
    for (const [r, c] of region.cells) {
      // 跳过当前单元格本身
      if (r === row && c === col) continue;

      const value = grid[r][c].value;
      if (value !== 0) {
        candidates.delete(value);
        logger.trace(
          `从候选数中移除 ${value} (同区域单元格 (${r}, ${c}) 中已使用)`,
        );
      }
    }
  }

  logger.debug(
    `单元格 (${row}, ${col}) 的候选数: [${[...candidates].join(", ")}]`,
  );
  return candidates;
}

/**
 * 计算所有空单元格的候选数
 *
 * @param grid 数独网格
 * @param size 数独尺寸
 * @param regions 所有区域定义
 * @returns 每个空单元格的候选数，键格式为 "row,col"
 */
export function getAllCandidates(
  grid: Grid,
  size: number,
  regions: Region[],
): Map<string, Set<number>> {
  logger.info(`开始计算 ${size}×${size} 网格的所有候选数`);

  const candidatesMap = new Map<string, Set<number>>();
  let emptyCellCount = 0;

  // 遍历所有单元格
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      // 跳过非空单元格
      if (grid[row][col].value !== 0) continue;

      emptyCellCount++;

      // 计算当前单元格的候选数
      const candidates = getCandidatesForCell(grid, row, col, size, regions);

      // 存储结果
      candidatesMap.set(`${row},${col}`, candidates);
    }
  }

  logger.info(`完成候选数计算: ${emptyCellCount} 个空单元格已处理`);

  // 记录没有候选数的单元格（死锁情况）
  const deadlockCells = [...candidatesMap.entries()]
    .filter(([_, candidates]) => candidates.size === 0)
    .map(([key]) => key);

  if (deadlockCells.length > 0) {
    logger.warn(
      `发现 ${deadlockCells.length} 个无候选数的单元格，可能是死锁状态`,
    );
    for (const cellKey of deadlockCells) {
      logger.debug(`无候选数的单元格: ${cellKey}`);
    }
  }

  return candidatesMap;
}
