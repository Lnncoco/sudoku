/**
 * @fileoverview 验证错误收集器
 * 提供完整的错误收集和合并功能
 */

import type { Grid } from "../types/grid";
import type { Region } from "../types/region";
import type { ValidationResult } from "../types/validation";
import { validateRegionBitmask, validateSum } from "./standard";

/**
 * 合并多个验证结果
 *
 * @param results 多个验证结果
 * @returns 合并后的验证结果
 */
export function mergeValidationResults(
  ...results: ValidationResult[]
): ValidationResult {
  if (results.length === 0) {
    return { isValid: true, errorCells: [] };
  }

  // 使用Set避免重复
  const errorCellSet = new Set<string>();
  const conflictSourceSet = new Set<string>();
  const errorMessages: string[] = [];
  let isValid = true;

  // 合并所有结果
  for (const result of results) {
    isValid = isValid && result.isValid;

    // 收集错误单元格
    for (const [row, col] of result.errorCells) {
      errorCellSet.add(`${row},${col}`);
    }

    // 收集冲突源
    if (result.conflictSources) {
      for (const [row, col] of result.conflictSources) {
        conflictSourceSet.add(`${row},${col}`);
      }
    }

    // 收集错误消息
    if (result.errorMessages) {
      errorMessages.push(...result.errorMessages);
    }
  }

  // 将Set转换回坐标数组
  const errorCells = Array.from(errorCellSet).map((str) => {
    const [row, col] = str.split(",").map(Number);
    return [row, col] as [number, number];
  });

  const conflictSources = Array.from(conflictSourceSet).map((str) => {
    const [row, col] = str.split(",").map(Number);
    return [row, col] as [number, number];
  });

  return {
    isValid,
    errorCells,
    conflictSources: conflictSources.length > 0 ? conflictSources : undefined,
    errorMessages: errorMessages.length > 0 ? errorMessages : undefined,
  };
}

/**
 * 验证网格的所有区域
 *
 * @param grid 数独网格
 * @param regions 要验证的区域数组
 * @returns 完整的验证结果
 */
export function validateAllRegions(
  grid: Grid,
  regions: Region[],
): ValidationResult {
  console.log("validateAllRegions 被调用，区域数量:", regions.length);

  // 收集所有区域的验证结果
  const results = regions.map((region) => {
    // 标准数字重复验证
    const duplicateResult = validateRegionBitmask(grid, region);
    console.log(
      `验证区域 ${region.id} (${region.type}):`,
      JSON.stringify(duplicateResult),
    );

    // 如果是杀手数独笼子，还需要验证总和
    if (region.properties?.sum !== undefined) {
      const sumResult = validateSum(grid, region);
      return mergeValidationResults(duplicateResult, sumResult);
    }

    return duplicateResult;
  });

  // 合并所有结果
  const mergedResult = mergeValidationResults(...results);
  console.log("合并验证结果:", JSON.stringify(mergedResult));
  return mergedResult;
}

/**
 * 判断网格是否完整填满且有效
 *
 * @param grid 数独网格
 * @param regions 要验证的区域数组
 * @returns 是否完成
 */
export function isGridComplete(grid: Grid, regions: Region[]): boolean {
  console.log(
    "isGridComplete 被调用，网格尺寸:",
    grid.length,
    "x",
    grid[0].length,
  );

  // 检查是否所有单元格都已填写
  const allFilled = grid.every((row) => row.every((cell) => cell.value !== 0));
  console.log("所有单元格已填充:", allFilled);

  if (!allFilled) {
    return false;
  }

  // 验证所有规则
  const validation = validateAllRegions(grid, regions);
  console.log("验证结果是否有效:", validation.isValid);
  console.log("完成检查最终结果:", allFilled && validation.isValid);
  return allFilled && validation.isValid;
}
