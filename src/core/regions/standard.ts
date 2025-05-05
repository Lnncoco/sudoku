/**
 * @fileoverview 标准区域生成函数
 * 生成标准数独的行、列、宫区域定义
 */

import type { Region } from "../types";

/**
 * 生成所有行区域
 *
 * @param size 网格尺寸
 * @returns 行区域数组
 */
export function generateRowRegions(size: number): Region[] {
  const regions: Region[] = [];

  for (let row = 0; row < size; row++) {
    const cells: Array<[number, number]> = [];

    for (let col = 0; col < size; col++) {
      cells.push([row, col]);
    }

    regions.push({
      id: `row-${row}`,
      type: "row",
      cells,
    });
  }

  return regions;
}

/**
 * 生成所有列区域
 *
 * @param size 网格尺寸
 * @returns 列区域数组
 */
export function generateColumnRegions(size: number): Region[] {
  const regions: Region[] = [];

  for (let col = 0; col < size; col++) {
    const cells: Array<[number, number]> = [];

    for (let row = 0; row < size; row++) {
      cells.push([row, col]);
    }

    regions.push({
      id: `column-${col}`,
      type: "column",
      cells,
    });
  }

  return regions;
}

/**
 * 生成所有宫区域
 *
 * @param size 网格尺寸
 * @param blockWidth 宫宽度
 * @param blockHeight 宫高度
 * @returns 宫区域数组
 */
export function generateBlockRegions(
  size: number,
  blockWidth: number,
  blockHeight: number,
): Region[] {
  const regions: Region[] = [];
  const blocksPerRow = size / blockWidth;

  for (let blockIndex = 0; blockIndex < size; blockIndex++) {
    const blockRow = Math.floor(blockIndex / blocksPerRow);
    const blockCol = blockIndex % blocksPerRow;

    const cells: Array<[number, number]> = [];
    const startRow = blockRow * blockHeight;
    const startCol = blockCol * blockWidth;

    for (let r = 0; r < blockHeight; r++) {
      for (let c = 0; c < blockWidth; c++) {
        cells.push([startRow + r, startCol + c]);
      }
    }

    regions.push({
      id: `block-${blockIndex}`,
      type: "block",
      cells,
    });
  }

  return regions;
}

/**
 * 生成标准对角线区域
 *
 * @param size 网格尺寸
 * @returns 对角线区域数组
 */
export function generateDiagonalRegions(size: number): Region[] {
  // 主对角线 (左上到右下)
  const mainDiagonalCells: Array<[number, number]> = [];
  for (let i = 0; i < size; i++) {
    mainDiagonalCells.push([i, i]);
  }

  // 副对角线 (右上到左下)
  const antiDiagonalCells: Array<[number, number]> = [];
  for (let i = 0; i < size; i++) {
    antiDiagonalCells.push([i, size - 1 - i]);
  }

  return [
    {
      id: "diagonal-main",
      type: "diagonal",
      cells: mainDiagonalCells,
    },
    {
      id: "diagonal-anti",
      type: "diagonal",
      cells: antiDiagonalCells,
    },
  ];
}
