/**
 * @fileoverview 标准数独规则验证
 * 使用位运算优化的验证算法检查规则合规性
 */

import { CoreLoggers } from "../logger";
import type { Grid } from "../types/grid";
import type { Region } from "../types/region";
import type { ValidationResult } from "../types/validation";
import { createFullBitmask, valueToBitmask } from "./bitmask";

const logger = CoreLoggers.validation;

/**
 * 使用位运算优化的重复检查
 * 时间复杂度: O(n)，其中n是区域内单元格数量
 *
 * @param grid 数独网格
 * @param cellCoords 要检查的单元格坐标数组
 * @returns 包含重复值的单元格坐标和冲突源
 */
export function checkDuplicatesBitmask(
  grid: Grid,
  cellCoords: ReadonlyArray<readonly [number, number]> | number[][],
): { duplicates: Array<[number, number]>; sources: Array<[number, number]> } {
  logger.debug(`使用位掩码检查 ${cellCoords.length} 个单元格是否存在重复`);

  const duplicates: Array<[number, number]> = [];
  const sources: Array<[number, number]> = [];

  // 按值分组的位置Map
  const valuePositions = new Map<number, Array<[number, number]>>();
  // 使用位掩码跟踪已见过的数字
  let usedValues = 0;

  // 单次遍历收集所有信息
  for (const coord of cellCoords) {
    const row = coord[0];
    const col = coord[1];
    const value = grid[row][col].value;
    if (value === 0) continue; // 跳过空格

    // 获取或初始化该值的位置数组
    if (!valuePositions.has(value)) {
      valuePositions.set(value, []);
    }
    // 安全地获取位置数组并添加新位置
    const positions = valuePositions.get(value);
    if (positions) {
      positions.push([row, col]);
    }

    // 检查是否已见过该值
    const valueMask = valueToBitmask(value);
    if ((usedValues & valueMask) !== 0) {
      // 值已经出现过，记录为重复
      // 稍后会处理冲突源
    } else {
      // 标记该值已使用
      usedValues |= valueMask;
    }
  }

  // 遍历valuePositions，找出所有重复值
  for (const [value, positions] of valuePositions.entries()) {
    if (positions.length > 1) {
      // 存在重复
      const [source, ...dups] = positions;
      sources.push(source);

      // 所有位置都标记为重复（包括源位置）
      for (const pos of positions) {
        duplicates.push(pos);
      }

      logger.debug(`发现重复值 ${value}，位置数量: ${positions.length}`);
    }
  }

  if (duplicates.length > 0) {
    logger.info(`检测到 ${duplicates.length} 个单元格有重复值`);
  } else {
    logger.trace("未检测到重复值");
  }

  return { duplicates, sources };
}

/**
 * 验证区域是否符合数独规则（无重复数字）
 *
 * @param grid 数独网格
 * @param region 要验证的区域
 * @returns 验证结果
 */
export function validateRegionBitmask(
  grid: Grid,
  region: Region,
): ValidationResult {
  logger.debug(
    `验证区域 ${region.id}，类型: ${region.type}，包含 ${region.cells.length} 个单元格`,
  );

  const { duplicates, sources } = checkDuplicatesBitmask(grid, region.cells);

  const result = {
    isValid: duplicates.length === 0,
    errorCells: duplicates,
    conflictSources: sources,
    errorMessages:
      duplicates.length > 0
        ? [`区域 ${region.id} 中存在 ${duplicates.length} 个重复单元格`]
        : [],
  };

  if (!result.isValid) {
    logger.info(
      `区域 ${region.id} 验证失败: ${result.errorMessages.join(", ")}`,
    );
  } else {
    logger.trace(`区域 ${region.id} 验证通过`);
  }

  return result;
}

/**
 * 验证区域总和（用于杀手数独）
 *
 * @param grid 数独网格
 * @param region 要验证的区域（必须包含sum属性）
 * @returns 验证结果
 */
export function validateSum(grid: Grid, region: Region): ValidationResult {
  const expectedSum = region.properties?.sum;

  if (expectedSum === undefined) {
    logger.trace(`跳过区域 ${region.id} 的求和验证: 未设置预期总和`);
    return { isValid: true, errorCells: [] };
  }

  logger.debug(`验证区域 ${region.id} 的总和，预期值: ${expectedSum}`);

  // 检查所有单元格是否都已填写
  const allFilled = region.cells.every(
    ([row, col]) => grid[row][col].value !== 0,
  );

  // 如果没有全部填写，暂不验证
  if (!allFilled) {
    logger.trace(`区域 ${region.id} 未完全填写，暂不验证总和`);
    return { isValid: true, errorCells: [] };
  }

  // 计算实际总和
  let actualSum = 0;
  for (const [row, col] of region.cells) {
    actualSum += grid[row][col].value;
  }

  // 验证总和
  const isValid = actualSum === expectedSum;

  if (!isValid) {
    logger.info(
      `区域 ${region.id} 总和错误: 预期 ${expectedSum}, 实际 ${actualSum}`,
    );
  } else {
    logger.debug(`区域 ${region.id} 总和验证通过: ${actualSum}`);
  }

  return {
    isValid,
    errorCells: isValid ? [] : region.cells,
    errorMessages: isValid
      ? []
      : [`总和错误: 期望 ${expectedSum}, 实际 ${actualSum}`],
  };
}

/**
 * 检查在指定位置填入数字是否导致冲突
 * 这是一个快速检查，不需要完整验证网格
 *
 * @param grid 数独网格
 * @param row 行索引
 * @param col 列索引
 * @param value 要检查的值
 * @param regions 包含该单元格的所有区域
 * @returns 是否是有效的移动
 */
export function isValidMoveBitmask(
  grid: Grid,
  row: number,
  col: number,
  value: number,
  regions: Region[],
): boolean {
  if (value === 0) {
    logger.trace(`位置 (${row}, ${col}) 清除值总是有效的`);
    return true; // 清除总是有效的
  }

  logger.debug(`检查在位置 (${row}, ${col}) 填入 ${value} 是否有效`);

  // 获取包含该单元格的所有区域
  const relevantRegions = regions.filter((region) =>
    region.cells.some(([r, c]) => r === row && c === col),
  );

  logger.trace(`该单元格属于 ${relevantRegions.length} 个区域`);

  // 对每个区域检查填入value是否会导致冲突
  for (const region of relevantRegions) {
    let usedValues = 0;

    for (const [r, c] of region.cells) {
      // 忽略当前单元格自身
      if (r === row && c === col) continue;

      const cellValue = grid[r][c].value;
      if (cellValue !== 0) {
        usedValues |= valueToBitmask(cellValue);
      }
    }

    // 检查value是否已在区域中使用
    if ((usedValues & valueToBitmask(value)) !== 0) {
      logger.info(`在区域 ${region.id} 中填入 ${value} 会导致冲突`);
      return false; // 冲突
    }
  }

  logger.debug(`在位置 (${row}, ${col}) 填入 ${value} 是有效的`);
  return true; // 所有区域都没有冲突
}
