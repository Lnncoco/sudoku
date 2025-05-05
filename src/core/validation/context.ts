/**
 * @fileoverview 验证上下文
 * 提供高效的验证接口，用于优化解题器和生成器性能
 */

import { getCandidatesForCellBitmask } from "../candidates/optimized";
import { CoreLoggers } from "../logger";
import { findRegionsContainingCell } from "../regions/helpers";
import type { SudokuConfig } from "../types/engine";
import type { Grid } from "../types/grid";
import type { Region } from "../types/region";
import { isValidMoveBitmask } from "./standard";

const logger = CoreLoggers.validation;

/**
 * 验证上下文接口
 * 提供解题器和生成器所需的高效验证能力
 */
export interface ValidationContext {
  /**
   * 验证在指定位置填入数字是否有效
   * @param grid 数独网格
   * @param row 行索引
   * @param col 列索引
   * @param value 要填入的值
   * @returns 是否是有效的移动
   */
  isValidMove(grid: Grid, row: number, col: number, value: number): boolean;

  /**
   * 获取指定单元格的候选数
   * @param grid 数独网格
   * @param row 行索引
   * @param col 列索引
   * @returns 可能的候选数集合
   */
  getCellCandidates(grid: Grid, row: number, col: number): Set<number>;

  /**
   * 检查网格是否已完成且有效
   * @param grid 数独网格
   * @returns 是否完成且有效
   */
  isGridComplete(grid: Grid): boolean;

  /**
   * 获取空单元格列表
   * @param grid 数独网格
   * @returns 空单元格坐标数组
   */
  findEmptyCells(grid: Grid): Array<[number, number]>;

  /**
   * 应用所有变体规则的验证
   * @param grid 数独网格
   * @returns 是否符合所有变体规则
   */
  applyVariantRules(grid: Grid): boolean;
}

/**
 * 为每个单元格预计算包含它的区域，提高验证性能
 * @param config 数独配置
 */
function precalculateRegionMaps(config: SudokuConfig): Map<string, Region[]> {
  const regionsByCell = new Map<string, Region[]>();

  // 遍历所有区域
  for (const region of config.regions) {
    // 遍历区域中的每个单元格
    for (const [row, col] of region.cells) {
      const key = `${row},${col}`;

      // 获取或初始化该单元格的区域列表
      if (!regionsByCell.has(key)) {
        regionsByCell.set(key, []);
      }

      // 将当前区域添加到单元格的区域列表中
      regionsByCell.get(key)?.push(region);
    }
  }

  logger.debug(`为 ${regionsByCell.size} 个单元格预计算了区域映射`);
  return regionsByCell;
}

/**
 * 创建验证上下文，预处理配置信息以提高性能
 * @param config 数独配置
 * @returns 验证上下文实例
 */
export function createValidationContext(
  config: SudokuConfig,
): ValidationContext {
  logger.info(`为尺寸 ${config.size} 的数独创建验证上下文`);

  // 预处理区域查找
  const regionsByCell = precalculateRegionMaps(config);

  // 创建验证上下文实例
  return {
    isValidMove(grid, row, col, value) {
      // 如果是清除值，总是有效的
      if (value === 0) return true;

      // 获取包含该单元格的所有区域
      const key = `${row},${col}`;
      const regions =
        regionsByCell.get(key) ||
        findRegionsContainingCell(config.regions, row, col);

      // 使用优化的位掩码验证
      return isValidMoveBitmask(grid, row, col, value, regions);
    },

    getCellCandidates(grid, row, col) {
      // 使用优化的、支持变体规则的候选数计算
      return getCandidatesForCellBitmask(grid, row, col, config);
    },

    isGridComplete(grid) {
      // 检查是否所有单元格都已填写
      for (let r = 0; r < config.size; r++) {
        for (let c = 0; c < config.size; c++) {
          if (grid[r][c].value === 0) {
            return false;
          }
        }
      }

      // 验证所有区域
      for (const region of config.regions) {
        if (!isValidMoveBitmask(grid, -1, -1, -1, [region])) {
          return false;
        }
      }

      // 应用所有变体规则
      return this.applyVariantRules(grid);
    },

    findEmptyCells(grid) {
      const emptyCells: Array<[number, number]> = [];

      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c].value === 0) {
            emptyCells.push([r, c]);
          }
        }
      }

      return emptyCells;
    },

    applyVariantRules(grid) {
      // 应用所有变体规则
      for (const rule of config.variantRules) {
        if (rule.validate) {
          const result = rule.validate(grid, config);
          if (!result.isValid) {
            return false;
          }
        }
      }

      return true;
    },
  };
}
