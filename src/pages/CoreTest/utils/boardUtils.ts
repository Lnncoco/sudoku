import { createEmptyCell } from "@/core";
import type { CellPosition, CellState, Grid } from "../types";

/**
 * 创建空数独网格
 * @param size 网格大小
 * @returns 空网格
 */
export function createEmptyGrid(size: number): Grid {
  return Array(size)
    .fill(null)
    .map(() =>
      Array(size)
        .fill(null)
        .map(() => createEmptyCell()),
    );
}

/**
 * 深拷贝网格数据
 * @param grid 原始网格
 * @returns 深拷贝的网格
 */
export function cloneGrid(grid: Grid): Grid {
  return JSON.parse(JSON.stringify(grid));
}

/**
 * 获取单元格候选数的键
 * @param row 行
 * @param col 列
 * @returns 候选数Map的键
 */
export function getCellKey(row: number, col: number): string {
  return `${row},${col}`;
}

/**
 * 从键获取单元格位置
 * @param key 单元格键（如 "1,2"）
 * @returns 单元格位置
 */
export function getCellPositionFromKey(key: string): CellPosition {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

/**
 * 安全获取单元格值
 * @param grid 网格
 * @param row 行
 * @param col 列
 * @returns 单元格或undefined
 */
export function getCellSafe(
  grid: Grid,
  row: number,
  col: number,
): CellState | undefined {
  return grid?.[row]?.[col];
}

/**
 * 检查网格是否已满（无空格）
 * @param grid 网格
 * @param size 网格大小
 * @returns 是否填满
 */
export function isGridFull(grid: Grid, size: number): boolean {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (getCellSafe(grid, row, col)?.value === 0) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 根据尺寸计算宫格尺寸
 * @param size 网格大小
 * @returns 宫格尺寸
 */
export function calculateBoxDimensions(size: number): {
  width: number;
  height: number;
} {
  if (size === 4) return { width: 2, height: 2 };
  if (size === 6) return { width: 3, height: 2 }; // 6x6 使用 3x2 宫格
  if (size === 9) return { width: 3, height: 3 };
  if (size === 16) return { width: 4, height: 4 };

  // 尝试平方根
  const sqrtSize = Math.sqrt(size);
  if (sqrtSize === Math.floor(sqrtSize)) {
    return { width: sqrtSize, height: sqrtSize };
  }

  // 默认值
  console.warn(`无法确定 ${size}x${size} 网格的宫格尺寸，默认使用 3x3`);
  return { width: 3, height: 3 };
}
