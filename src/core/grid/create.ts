/**
 * @fileoverview 网格创建相关的纯函数
 * 提供创建空网格、从数据创建网格等功能
 */

import { CoreLoggers } from "../logger";
import type { CellState, Grid } from "../types";

const logger = CoreLoggers.grid;

/**
 * 创建一个空的单元格状态
 * @returns 空单元格状态
 */
export function createEmptyCell(): CellState {
  logger.trace("创建空单元格");
  return {
    value: 0,
    isPuzzle: false,
    notes: new Set<number>(),
    error: false,
  };
}

/**
 * 创建一个指定尺寸的空网格
 *
 * @param size 网格尺寸
 * @returns 空的网格数据
 */
export function createEmptyGrid(size: number): Grid {
  logger.debug(`创建空网格，尺寸: ${size}×${size}`);
  const grid: Grid = [];
  for (let row = 0; row < size; row++) {
    const rowCells: CellState[] = [];
    for (let col = 0; col < size; col++) {
      rowCells.push(createEmptyCell());
    }
    grid.push(rowCells);
  }
  logger.info(`创建了 ${size}×${size} 的空网格`);
  return grid;
}

/**
 * 从数字数组创建网格（用于初始化题目）
 *
 * @param values 二维数字数组，0表示空
 * @returns 初始化后的网格
 */
export function createGridFromValues(values: number[][]): Grid {
  const size = values.length;
  logger.debug(`从 ${size}×${size} 数组创建网格`);

  const grid: Grid = [];
  let filledCells = 0;

  for (let row = 0; row < size; row++) {
    const rowCells: CellState[] = [];
    for (let col = 0; col < size; col++) {
      const value = values[row][col];
      if (value !== 0) {
        filledCells++;
      }
      rowCells.push({
        value,
        isPuzzle: value !== 0,
        notes: new Set<number>(),
        error: false,
      });
    }
    grid.push(rowCells);
  }

  logger.info(`创建了 ${size}×${size} 的网格，包含 ${filledCells} 个预填数字`);
  return grid;
}

/**
 * 创建一个网格的深度副本
 *
 * @param grid 源网格
 * @returns 新的网格副本（深拷贝）
 */
export function cloneGrid(grid: Grid): Grid {
  const size = grid.length;
  logger.debug(`克隆 ${size}×${size} 网格`);

  const cloned = grid.map((row) =>
    row.map((cell) => {
      let clonedNotes = new Set<number>();
      try {
        if (cell.notes && typeof cell.notes[Symbol.iterator] === "function") {
          clonedNotes = new Set(cell.notes);
        } else {
          logger.warn(
            `克隆单元格 (${row},${cell}) 时发现无效的 notes 属性，已重置为空 Set。原始值:`,
            cell.notes,
          );
        }
      } catch (e) {
        logger.error(
          `克隆单元格 (${row},${cell}) 的 notes 时发生错误，已重置为空 Set。错误:`,
          e,
        );
        clonedNotes = new Set<number>();
      }
      return {
        ...cell,
        notes: clonedNotes,
      };
    }),
  );

  logger.trace(`完成 ${size}×${size} 网格的克隆`);
  return cloned;
}
