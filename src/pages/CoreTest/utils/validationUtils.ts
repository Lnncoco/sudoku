import { getCandidatesForCellBitmask } from "@/core/candidates/optimized";
import {
  checkDuplicatesBitmask,
  isValidMoveBitmask,
} from "@/core/validation/standard";
import type { CellState, Grid, Region } from "../types";
import { getCellSafe } from "./boardUtils";
import { createRegions, getRegionsForCell } from "./regionUtils";

/**
 * 检查单元格填入是否有效
 * @param grid 网格
 * @param row 行
 * @param col 列
 * @param num 填入的数字
 * @param size 网格大小
 * @param boxWidth 宫格宽度
 * @param boxHeight 宫格高度
 * @param enableDiagonal 是否启用对角线规则
 * @returns 是否有效
 */
export function isValidPlacement(
  grid: Grid,
  row: number,
  col: number,
  num: number,
  size: number,
  boxWidth: number,
  boxHeight: number,
  enableDiagonal: boolean,
): boolean {
  // 安全检查
  if (!getCellSafe(grid, row, col)) {
    return false;
  }

  try {
    // 创建临时网格
    const tempGrid = JSON.parse(JSON.stringify(grid));
    if (tempGrid[row]?.[col]) {
      tempGrid[row][col].value = 0; // 清除当前值
    }

    // 获取候选数
    const regions = createRegions(size, boxWidth, boxHeight, enableDiagonal);
    // 创建完整的配置对象
    const config = {
      size,
      regions,
      blockWidth: boxWidth,
      blockHeight: boxHeight,
      variantRules: [], // 空数组，因为variant规则在createRegions中已经考虑
    };
    // 使用优化版本的候选数计算函数
    const candidates = getCandidatesForCellBitmask(tempGrid, row, col, config);

    // 检查数字是否在候选数中
    return candidates.has(num);
  } catch (error) {
    console.error("Error validating placement:", error);
    return false; // 出错时，视为无效
  }
}

/**
 * 获取单元格可能的候选数
 * @param grid 网格
 * @param row 行
 * @param col 列
 * @param size 网格大小
 * @param boxWidth 宫格宽度
 * @param boxHeight 宫格高度
 * @param enableDiagonal 是否启用对角线
 * @returns 候选数数组
 */
export function calculateCandidatesForCell(
  grid: Grid,
  row: number,
  col: number,
  size: number,
  boxWidth: number,
  boxHeight: number,
  enableDiagonal: boolean,
): number[] {
  try {
    // 安全检查：确保网格、行和列都有效
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      console.warn("calculateCandidatesForCell: 无效的网格");
      return [];
    }

    // 确保单元格存在
    if (!grid[row] || !grid[row][col]) {
      console.warn(`calculateCandidatesForCell: 单元格 (${row},${col}) 不存在`);
      return [];
    }

    // 如果单元格已有值，则没有候选数
    if (grid[row][col].value > 0) {
      return [];
    }

    // 创建正确的区域
    const regions = createRegions(size, boxWidth, boxHeight, enableDiagonal);

    // 创建完整的配置对象
    const config = {
      size,
      regions,
      blockWidth: boxWidth,
      blockHeight: boxHeight,
      variantRules: [], // 空数组，因为variant规则在createRegions中已经考虑
    };

    // 使用优化版本的候选数计算函数
    return Array.from(getCandidatesForCellBitmask(grid, row, col, config));
  } catch (error) {
    console.error("计算候选数时出错:", error);
    return [];
  }
}

/**
 * 检查网格是否几乎为空（非题目单元格少于阈值）
 * @param grid 网格
 * @param threshold 阈值（默认为10%）
 * @returns 是否为空
 */
export function isGridMostlyEmpty(grid: Grid, threshold = 0.1): boolean {
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    return true;
  }

  const size = grid.length;
  const totalCells = size * size;
  let filledCount = 0;

  // 计算已填充的单元格数量
  for (let row = 0; row < size; row++) {
    if (!grid[row]) continue;
    for (let col = 0; col < size; col++) {
      if (grid[row][col]?.value > 0) {
        filledCount++;
      }
    }
  }

  // 如果填充的单元格数量低于阈值，则认为网格几乎为空
  return filledCount / totalCells < threshold;
}

/**
 * 检查整个网格是否有效
 * @param grid 网格
 * @param enableDiagonal 是否启用对角线规则
 * @param boxWidth 宫格宽度
 * @param boxHeight 宫格高度
 * @returns 是否有效
 */
export function checkGrid(
  grid: Grid,
  enableDiagonal: boolean,
  boxWidth: number,
  boxHeight: number,
): boolean {
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    console.warn("无效的网格结构: 网格为空或非数组");
    return true; // 如果网格不存在或为空，视为有效
  }

  // 检查网格是否几乎为空，如果是则直接返回有效
  if (isGridMostlyEmpty(grid)) {
    return true;
  }

  const size = grid.length;

  // 安全检查：确保网格是一个有效的二维数组，且每个单元格都有正确的属性
  for (let row = 0; row < size; row++) {
    if (!grid[row] || !Array.isArray(grid[row]) || grid[row].length !== size) {
      console.warn(`无效的网格结构: 行 ${row} 结构错误`);
      return false; // 网格结构无效
    }

    for (let col = 0; col < size; col++) {
      // 增强的安全检查，确保单元格和value属性存在
      if (!grid[row][col]) {
        console.warn(`无效的网格结构: 单元格 (${row},${col}) 不存在`);
        return false;
      }

      if (typeof grid[row][col].value !== "number") {
        console.warn(
          `无效的网格结构: 单元格 (${row},${col}) 的value属性不是数字`,
        );
        return false; // 单元格结构无效
      }
    }
  }

  try {
    const regions = createRegions(size, boxWidth, boxHeight, enableDiagonal);

    // 检查每个区域是否有重复值
    for (const region of regions) {
      // 安全检查region.cells
      if (
        !region.cells ||
        !Array.isArray(region.cells) ||
        region.cells.length === 0
      ) {
        console.warn(`无效的区域结构: 区域 ${region.id} 的cells属性无效`);
        continue; // 跳过无效的区域
      }

      // 检查每个单元格坐标是否有效
      let invalidCellFound = false;
      for (const [r, c] of region.cells) {
        if (
          r < 0 ||
          r >= size ||
          c < 0 ||
          c >= size ||
          !grid[r] ||
          !grid[r][c]
        ) {
          console.warn(`区域 ${region.id} 包含无效坐标: (${r},${c})`);
          invalidCellFound = true;
          break;
        }
      }

      if (invalidCellFound) continue;

      // 现在安全地进行重复检查
      try {
        const { duplicates } = checkDuplicatesBitmask(grid, region.cells);
        if (duplicates.length > 0) {
          return false;
        }
      } catch (regionError) {
        console.error(`检查区域 ${region.id} 重复值时出错:`, regionError);
      }
    }

    return true;
  } catch (error) {
    console.error("检查网格有效性时出错:", error);
    return false; // 出现错误时，视为无效
  }
}

/**
 * 验证并标记整个网格的错误单元格
 * @param grid 当前网格
 * @param size 网格大小
 * @param boxWidth 宫格宽度
 * @param boxHeight 宫格高度
 * @param enableDiagonal 是否启用对角线规则
 * @param enableErrorHighlighting 是否启用错误高亮
 * @returns 更新后的网格
 */
export function validateAllCells(
  grid: Grid,
  size: number,
  boxWidth: number,
  boxHeight: number,
  enableDiagonal: boolean,
  enableErrorHighlighting: boolean,
): Grid {
  if (!grid) return grid;

  // 如果不启用错误高亮或网格几乎为空，跳过验证直接返回原网格
  if (!enableErrorHighlighting || isGridMostlyEmpty(grid)) {
    return grid;
  }

  try {
    // 防御性复制
    const safeGrid = JSON.parse(JSON.stringify(grid));
    const regions = createRegions(size, boxWidth, boxHeight, enableDiagonal);

    return safeGrid.map((row: CellState[] | null, rowIdx: number) => {
      if (!row) return row;

      return row.map((cell: CellState | null, colIdx: number) => {
        if (cell && cell.value > 0) {
          try {
            // 获取包含该单元格的所有区域
            const relevantRegions = getRegionsForCell(regions, rowIdx, colIdx);

            // 为了使用isValidMoveBitmask，我们需要检查当前值是否与其所在区域的其他值冲突
            // 因此，我们暂时将当前单元格的值视为0，然后检查填入当前值是否有效
            const tempGrid = JSON.parse(JSON.stringify(safeGrid));
            if (tempGrid[rowIdx]?.[colIdx]) {
              tempGrid[rowIdx][colIdx].value = 0;
            }

            // 检查当前值是否能在临时网格的这个位置放置
            const isValidPlacement = isValidMoveBitmask(
              tempGrid,
              rowIdx,
              colIdx,
              cell.value,
              relevantRegions,
            );

            // 根据enableErrorHighlighting决定是否标记错误
            const hasError = !isValidPlacement;

            return {
              ...cell,
              error: hasError,
            };
          } catch (err) {
            console.error(
              `验证单元格 (${rowIdx + 1},${colIdx + 1}) 时出错:`,
              err,
            );
            // 出错时保留原错误状态或标记为无错误
            return { ...cell, error: cell.error ?? false };
          }
        }
        // 对于空单元格，总是清除错误状态
        if (cell) {
          return { ...cell, error: false };
        }
        return cell;
      });
    });
  } catch (error) {
    console.error("验证网格时出错:", error);
    return grid;
  }
}
