import type { Region, RegionType } from "../types";

/**
 * 创建行区域
 * @param size 网格大小
 * @returns 行区域数组
 */
export function createRowRegions(size: number): Region[] {
  return Array.from({ length: size }, (_, row) => ({
    id: `row-${row}`,
    type: "row" as RegionType,
    cells: Array.from(
      { length: size },
      (_, col) => [row, col] as [number, number],
    ),
    properties: {},
  }));
}

/**
 * 创建列区域
 * @param size 网格大小
 * @returns 列区域数组
 */
export function createColRegions(size: number): Region[] {
  return Array.from({ length: size }, (_, col) => ({
    id: `col-${col}`,
    type: "column" as RegionType,
    cells: Array.from(
      { length: size },
      (_, row) => [row, col] as [number, number],
    ),
    properties: {},
  }));
}

/**
 * 创建宫格区域
 * @param size 网格大小
 * @param boxWidth 宫格宽度
 * @param boxHeight 宫格高度
 * @returns 宫格区域数组
 */
export function createBoxRegions(
  size: number,
  boxWidth: number,
  boxHeight: number,
): Region[] {
  const regions: Region[] = [];

  try {
    // 确保尺寸可以被宫格尺寸整除
    if (size % boxWidth !== 0 || size % boxHeight !== 0) {
      // 打印警告但不抛出错误
      console.warn(
        `无法为 ${size}x${size} 网格创建 ${boxWidth}x${boxHeight} 的宫格，尺寸不匹配`,
      );

      // 返回空数组，让调用方决定如何处理
      return [];
    }

    const boxRowCount = size / boxHeight;
    const boxColCount = size / boxWidth;

    for (let boxRow = 0; boxRow < boxRowCount; boxRow++) {
      for (let boxCol = 0; boxCol < boxColCount; boxCol++) {
        const cells: [number, number][] = [];
        for (let r = 0; r < boxHeight; r++) {
          for (let c = 0; c < boxWidth; c++) {
            const row = boxRow * boxHeight + r;
            const col = boxCol * boxWidth + c;
            cells.push([row, col]);
          }
        }
        regions.push({
          id: `box-${boxRow}-${boxCol}`,
          type: "block" as RegionType,
          cells,
          properties: {},
        });
      }
    }
    return regions;
  } catch (error) {
    console.error(`创建宫格区域错误: ${error}`);
    return [];
  }
}

/**
 * 创建对角线区域
 * @param size 网格大小
 * @returns 对角线区域数组
 */
export function createDiagonalRegions(size: number): Region[] {
  // 主对角线
  const mainDiagonal: Region = {
    id: "diagonal-main",
    type: "diagonal" as RegionType,
    cells: Array.from({ length: size }, (_, i) => [i, i] as [number, number]),
    properties: {},
  };

  // 副对角线
  const antiDiagonal: Region = {
    id: "diagonal-anti",
    type: "diagonal" as RegionType,
    cells: Array.from(
      { length: size },
      (_, i) => [i, size - 1 - i] as [number, number],
    ),
    properties: {},
  };

  return [mainDiagonal, antiDiagonal];
}

/**
 * 创建所有区域
 * @param size 网格大小
 * @param boxWidth 宫格宽度
 * @param boxHeight 宫格高度
 * @param enableDiagonal 是否启用对角线规则
 * @returns 所有区域数组
 */
export function createRegions(
  size: number,
  boxWidth: number,
  boxHeight: number,
  enableDiagonal: boolean,
): Region[] {
  try {
    // 基础检查
    if (!size || size <= 0 || !boxWidth || !boxHeight) {
      console.warn(
        `创建区域参数无效: size=${size}, boxWidth=${boxWidth}, boxHeight=${boxHeight}`,
      );
      return [];
    }

    const regions: Region[] = [
      ...createRowRegions(size),
      ...createColRegions(size),
    ];

    // 尝试创建宫格区域，忽略错误
    try {
      const boxRegions = createBoxRegions(size, boxWidth, boxHeight);
      if (boxRegions.length > 0) {
        regions.push(...boxRegions);
      } else {
        console.warn("无法创建宫格区域，将只使用行列约束");
      }
    } catch (boxError) {
      console.error("创建宫格区域时出错:", boxError);
    }

    if (enableDiagonal) {
      regions.push(...createDiagonalRegions(size));
    }

    return regions;
  } catch (error) {
    console.error("创建区域时发生严重错误:", error);
    // 返回至少行和列区域，确保基本约束依然可用
    return [...createRowRegions(size), ...createColRegions(size)];
  }
}

/**
 * 获取包含指定单元格的所有区域
 * @param regions 所有区域
 * @param row 行
 * @param col 列
 * @returns 包含该单元格的区域
 */
export function getRegionsForCell(
  regions: Region[],
  row: number,
  col: number,
): Region[] {
  if (!regions || !Array.isArray(regions)) {
    return [];
  }

  return regions.filter((region) =>
    region.cells.some(([r, c]) => r === row && c === col),
  );
}
