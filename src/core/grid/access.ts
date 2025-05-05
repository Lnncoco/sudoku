/**
 * @fileoverview 网格访问相关的纯函数
 * 提供获取和设置网格单元格值的功能
 */

import { CoreLoggers } from "../logger";
import type { CellState, Grid, HighlightType } from "../types";

const logger = CoreLoggers.grid;

// 定义单元格位置类型（内部使用，与types/grid.ts保持一致）
interface CellPosition {
  row: number;
  col: number;
}

/**
 * 获取单元格状态
 *
 * @param grid 网格数据
 * @param row 行索引
 * @param col 列索引
 * @returns 单元格状态或null（如果坐标无效）
 */
export function getCellState(
  grid: Grid,
  row: number,
  col: number,
): CellState | null {
  if (
    row < 0 ||
    row >= grid.length ||
    col < 0 ||
    col >= (grid[0]?.length || 0)
  ) {
    logger.debug(`获取单元格状态失败: 无效位置 (${row}, ${col})`);
    return null;
  }
  logger.trace(`获取单元格状态: (${row}, ${col})`);
  return grid[row][col];
}

/**
 * 获取单元格值
 *
 * @param grid 网格数据
 * @param row 行索引
 * @param col 列索引
 * @returns 单元格值或-1（如果坐标无效）
 */
export function getCellValue(grid: Grid, row: number, col: number): number {
  const cell = getCellState(grid, row, col);
  const value = cell?.value ?? -1;
  logger.trace(`获取单元格值: (${row}, ${col}) = ${value}`);
  return value;
}

/**
 * 检查坐标是否在网格范围内
 *
 * @param grid 网格数据
 * @param row 行索引
 * @param col 列索引
 * @returns 是否在网格范围内
 */
export function isValidPosition(grid: Grid, row: number, col: number): boolean {
  const valid =
    row >= 0 && row < grid.length && col >= 0 && col < (grid[0]?.length || 0);
  if (!valid) {
    logger.trace(`位置检查: (${row}, ${col}) 不在网格范围内`);
  }
  return valid;
}

/**
 * 设置单元格值（创建新的网格副本）
 *
 * @param grid 网格数据
 * @param row 行索引
 * @param col 列索引
 * @param value 新值
 * @param isEditingPuzzle 是否处于编辑题目模式
 * @returns 新的网格副本
 */
export function setCellValue(
  grid: Grid,
  row: number,
  col: number,
  value: number,
  isEditingPuzzle = false,
): Grid {
  if (!isValidPosition(grid, row, col)) {
    logger.debug(`设置单元格值失败: 无效位置 (${row}, ${col})`);
    return grid; // 如果位置无效，返回原网格
  }

  const cell = grid[row][col];
  if (cell.isPuzzle && !isEditingPuzzle) {
    logger.debug(`设置单元格值失败: 尝试修改题目单元格 (${row}, ${col})`);
    return grid; // 如果是题目单元格且不在编辑模式，返回原网格
  }

  logger.info(
    `设置单元格值: (${row}, ${col}) = ${value}${isEditingPuzzle ? " (编辑题目模式)" : ""}`,
  );

  // 创建网格副本
  const newGrid = grid.map((r, rIndex) =>
    r.map((c, cIndex) => {
      if (rIndex === row && cIndex === col) {
        return {
          ...c,
          value,
          isPuzzle: isEditingPuzzle && value !== 0,
          notes: new Set<number>(), // 设置值时清空笔记
          animationState: "changed" as const,
        };
      }
      return { ...c };
    }),
  );

  return newGrid;
}

/**
 * 切换单元格笔记（创建新的网格副本）
 *
 * @param grid 网格数据
 * @param row 行索引
 * @param col 列索引
 * @param digit 笔记数字
 * @returns 新的网格副本
 */
export function toggleCellNote(
  grid: Grid,
  row: number,
  col: number,
  digit: number,
): Grid {
  if (!isValidPosition(grid, row, col)) {
    logger.debug(`切换单元格笔记失败: 无效位置 (${row}, ${col})`);
    return grid; // 如果位置无效，返回原网格
  }

  const cell = grid[row][col];
  if (cell.value !== 0 || cell.isPuzzle) {
    logger.debug(
      `切换单元格笔记失败: 单元格有值或是题目单元格 (${row}, ${col})`,
    );
    return grid; // 如果单元格有值或是题目单元格，返回原网格
  }

  const hasNote = cell.notes.has(digit);
  logger.info(
    `${hasNote ? "删除" : "添加"}单元格笔记: (${row}, ${col}) 数字 ${digit}`,
  );

  // 创建网格副本
  const newGrid = grid.map((r, rIndex) =>
    r.map((c, cIndex) => {
      if (rIndex === row && cIndex === col) {
        const newNotes = new Set(c.notes);
        if (newNotes.has(digit)) {
          newNotes.delete(digit);
        } else {
          newNotes.add(digit);
        }
        return {
          ...c,
          notes: newNotes,
        };
      }
      return { ...c };
    }),
  );

  return newGrid;
}

/**
 * 设置单元格高亮状态（创建新的网格副本）
 *
 * @param grid 网格数据
 * @param row 行索引
 * @param col 列索引
 * @param highlight 高亮类型
 * @returns 新的网格副本
 */
export function setCellHighlight(
  grid: Grid,
  row: number,
  col: number,
  highlight: HighlightType | undefined,
): Grid {
  if (!isValidPosition(grid, row, col)) {
    return grid;
  }

  return grid.map((r, rIndex) =>
    r.map((c, cIndex) => {
      if (rIndex === row && cIndex === col) {
        return {
          ...c,
          highlight,
        };
      }
      return c;
    }),
  );
}

/**
 * 将单元格坐标数组转换为CellPosition对象数组
 *
 * @param positions [row, col]形式的坐标数组
 * @returns CellPosition对象数组
 */
export function toCellPositions(
  positions: Array<[number, number]>,
): CellPosition[] {
  return positions.map(([row, col]) => ({ row, col }));
}

/**
 * 将CellPosition对象数组转换为[row, col]形式的坐标数组
 *
 * @param positions CellPosition对象数组
 * @returns [row, col]形式的坐标数组
 */
export function toCoordinates(
  positions: CellPosition[],
): Array<[number, number]> {
  return positions.map(({ row, col }) => [row, col]);
}

/**
 * 将单元格坐标数组转换为字符串键
 *
 * @param row 行索引
 * @param col 列索引
 * @returns 格式为"row,col"的字符串
 */
export function cellToKey(row: number, col: number): string {
  logger.trace(`单元格坐标转键: (${row}, ${col}) -> "${row},${col}"`);
  return `${row},${col}`;
}

/**
 * 将字符串键转换回单元格坐标
 *
 * @param key 格式为"row,col"的字符串
 * @returns [row, col]形式的坐标
 */
export function keyToCell(key: string): [number, number] {
  const [rowStr, colStr] = key.split(",");
  const row = Number.parseInt(rowStr, 10);
  const col = Number.parseInt(colStr, 10);
  logger.trace(`键转单元格坐标: "${key}" -> (${row}, ${col})`);
  return [row, col];
}
