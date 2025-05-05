/**
 * @fileoverview 区域辅助函数
 * 提供区域查询和操作的辅助函数
 */

import { nanoid } from "nanoid";
import type { Region } from "../types";

/**
 * 查找包含指定单元格的区域
 *
 * @param regions 区域数组
 * @param row 行索引
 * @param col 列索引
 * @returns 包含该单元格的区域数组
 */
export function findRegionsContainingCell(
  regions: Region[],
  row: number,
  col: number,
): Region[] {
  return regions.filter((region) =>
    region.cells.some(([r, c]) => r === row && c === col),
  );
}

/**
 * 查找指定类型的区域
 *
 * @param regions 区域数组
 * @param type 区域类型
 * @returns 指定类型的区域数组
 */
export function findRegionsByType(
  regions: Region[],
  type: Region["type"],
): Region[] {
  return regions.filter((region) => region.type === type);
}

/**
 * 查找指定ID的区域
 *
 * @param regions 区域数组
 * @param id 区域ID
 * @returns 找到的区域或undefined
 */
export function findRegionById(
  regions: Region[],
  id: string,
): Region | undefined {
  return regions.find((region) => region.id === id);
}

/**
 * 创建一个新的笼子区域（用于杀手数独）
 *
 * @param cells 单元格坐标数组
 * @param sum 可选的总和约束
 * @returns 新的笼子区域
 */
export function createCageRegion(
  cells: Array<[number, number]>,
  sum?: number,
): Region {
  const id = `cage-${nanoid(6)}`;

  const region: Region = {
    id,
    type: "cage",
    cells,
  };

  // 如果提供了总和，添加到属性中
  if (sum !== undefined) {
    region.properties = { sum };
  }

  return region;
}

/**
 * 获取指定区域内的单元格坐标数组
 *
 * @param region 区域
 * @returns 单元格坐标数组
 */
export function getCellsInRegion(region: Region): Array<[number, number]> {
  return region.cells;
}

/**
 * 找出两个区域的交集单元格
 *
 * @param region1 第一个区域
 * @param region2 第二个区域
 * @returns 两个区域共有的单元格坐标数组
 */
export function getIntersectionCells(
  region1: Region,
  region2: Region,
): Array<[number, number]> {
  return region1.cells.filter(([r1, c1]) =>
    region2.cells.some(([r2, c2]) => r1 === r2 && c1 === c2),
  );
}

/**
 * 检查区域是否有效（每个单元格只出现一次）
 *
 * @param region 要验证的区域
 * @returns 是否有效
 */
export function isValidRegion(region: Region): boolean {
  const seen = new Set<string>();

  for (const [row, col] of region.cells) {
    const key = `${row},${col}`;
    if (seen.has(key)) {
      return false; // 存在重复单元格
    }
    seen.add(key);
  }

  return true;
}

/**
 * 生成标准区域（行、列和宫）
 *
 * @param size 网格尺寸
 * @param blockWidth 宫宽度
 * @param blockHeight 宫高度
 * @returns 标准区域数组
 */
export function generateStandardRegions(
  size: number,
  blockWidth: number,
  blockHeight: number,
): Region[] {
  const regions: Region[] = [];

  // 生成所有行
  for (let row = 0; row < size; row++) {
    const rowCells: Array<[number, number]> = [];
    for (let col = 0; col < size; col++) {
      rowCells.push([row, col]);
    }
    regions.push({
      id: `row-${row}`,
      type: "row",
      cells: rowCells,
    });
  }

  // 生成所有列
  for (let col = 0; col < size; col++) {
    const colCells: Array<[number, number]> = [];
    for (let row = 0; row < size; row++) {
      colCells.push([row, col]);
    }
    regions.push({
      id: `col-${col}`,
      type: "column",
      cells: colCells,
    });
  }

  // 生成所有宫
  const blocksPerRow = size / blockWidth;
  for (let blockIndex = 0; blockIndex < size; blockIndex++) {
    const blockRow = Math.floor(blockIndex / blocksPerRow);
    const blockCol = blockIndex % blocksPerRow;

    const blockCells: Array<[number, number]> = [];
    const startRow = blockRow * blockHeight;
    const startCol = blockCol * blockWidth;

    for (let r = 0; r < blockHeight; r++) {
      for (let c = 0; c < blockWidth; c++) {
        blockCells.push([startRow + r, startCol + c]);
      }
    }

    regions.push({
      id: `block-${blockIndex}`,
      type: "block",
      cells: blockCells,
    });
  }

  return regions;
}
