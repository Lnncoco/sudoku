/**
 * @fileoverview 位运算优化的候选数计算实现
 * 使用位掩码加速候选数的计算和操作
 */

import { getLogger } from "@/utils/logger";
import type { SudokuConfig, VariantRule } from "../types/engine";
import type { Grid } from "../types/grid";
import type { Region } from "../types/region";
import {
  createFullBitmask,
  valueToBitmask,
  valuesFromBitmask,
} from "../validation/bitmask";

const logger = getLogger("core.candidates");

/**
 * 使用位运算优化的候选数计算
 *
 * @param grid 数独网格
 * @param row 行索引
 * @param col 列索引
 * @param config 数独配置 (包含 size, regions, variantRules)
 * @returns 可能的候选数集合
 */
export function getCandidatesForCellBitmask(
  grid: Grid,
  row: number,
  col: number,
  config: SudokuConfig,
): Set<number> {
  // 如果单元格已有值，返回空集合
  if (grid[row][col].value !== 0) {
    return new Set<number>();
  }

  const size = config.size;
  const regions = config.regions;
  const variantRules = config.variantRules;

  // 获取包含当前单元格的所有区域
  const relevantRegions = regions.filter((region) =>
    region.cells.some(([r, c]) => r === row && c === col),
  );

  // 初始候选数掩码：1到size的所有数字
  let candidatesBitmask = createFullBitmask(size);

  // 对每个相关区域，使用掩码标记已使用的数字
  for (const region of relevantRegions) {
    let usedValues = 0;

    for (const [r, c] of region.cells) {
      // 跳过当前单元格本身
      if (r === row && c === col) continue;

      const value = grid[r][c].value;
      if (value !== 0) {
        usedValues |= valueToBitmask(value);
      }
    }

    // 从候选集合中移除已使用的值
    candidatesBitmask &= ~usedValues;
  }

  // 应用变体规则的排除逻辑
  for (const rule of variantRules) {
    // 检查规则是否有 getExcludedCandidates 方法
    if (typeof rule.getExcludedCandidates === "function") {
      const excludedByRule = rule.getExcludedCandidates(grid, row, col, config);
      if (excludedByRule.size > 0) {
        logger.trace(
          `单元格 (${row}, ${col}) 因规则 ${rule.id} 排除: ${[...excludedByRule].join(", ")}`,
        );
      }
      for (const excludedValue of excludedByRule) {
        candidatesBitmask &= ~valueToBitmask(excludedValue);
      }
    } else {
      logger.warn(`变体规则 ${rule.id} 缺少 getExcludedCandidates 方法`);
    }
  }

  // 将位掩码转换回数字集合
  const finalCandidates = new Set(valuesFromBitmask(candidatesBitmask));
  logger.trace(
    `单元格 (${row}, ${col}) 的最终候选数: ${[...finalCandidates].join(", ") || "无"}`,
  );
  return finalCandidates;
}

/**
 * 使用位运算优化的全网格候选数计算
 * 比单独调用getCandidatesForCellBitmask更高效
 *
 * @param grid 数独网格
 * @param config 数独配置
 * @returns 每个空单元格的候选数，键格式为 "row,col"
 */
export function getAllCandidatesBitmask(
  grid: Grid,
  config: SudokuConfig,
): Map<string, Set<number>> {
  const candidatesMap = new Map<string, Set<number>>();
  const size = config.size;
  const regions = config.regions;
  const variantRules = config.variantRules;

  // 预先计算每个区域的已使用值掩码
  const regionUsedValues = new Map<string, number>();
  for (const region of regions) {
    let usedValues = 0;
    for (const [r, c] of region.cells) {
      const value = grid[r][c].value;
      if (value !== 0) {
        usedValues |= valueToBitmask(value);
      }
    }
    regionUsedValues.set(region.id, usedValues);
  }

  // 遍历所有空单元格
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      // 跳过非空单元格
      if (grid[row][col].value !== 0) continue;

      // 获取包含当前单元格的区域
      const relevantRegions = regions.filter((region) =>
        region.cells.some(([r, c]) => r === row && c === col),
      );

      // 初始候选数掩码
      let candidatesBitmask = createFullBitmask(size);

      // 对每个相关区域，使用预计算的掩码
      for (const region of relevantRegions) {
        const usedValues = regionUsedValues.get(region.id) || 0;
        candidatesBitmask &= ~usedValues;
      }

      // 应用变体规则的排除逻辑
      for (const rule of variantRules) {
        // 检查规则是否有 getExcludedCandidates 方法
        if (typeof rule.getExcludedCandidates === "function") {
          const excludedByRule = rule.getExcludedCandidates(
            grid,
            row,
            col,
            config,
          );
          // 不在此处添加日志，避免重复记录
          for (const excludedValue of excludedByRule) {
            candidatesBitmask &= ~valueToBitmask(excludedValue);
          }
        } // 此处省略 else 警告日志，避免重复
      }

      // 将位掩码转换回数字集合并存储
      const finalCandidates = new Set(valuesFromBitmask(candidatesBitmask));
      logger.trace(
        `单元格 (${row}, ${col}) 的候选数: ${[...finalCandidates].join(", ") || "无"}`,
      );
      candidatesMap.set(`${row},${col}`, finalCandidates);
    }
  }

  return candidatesMap;
}
