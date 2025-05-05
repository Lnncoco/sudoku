/**
 * @fileoverview 对角线数独变体规则实现
 * 实现对角线数独规则：两条对角线上各数字1-N只出现一次
 */

import type { CompatibilityResult, SudokuConfig } from "../types/engine";
import type { Grid } from "../types/grid";
import type { Region } from "../types/region";
import type { ValidationResult } from "../types/validation";
import { validateAllRegions } from "../validation/collector";
import { BaseVariantRule } from "./interface";

/**
 * 对角线数独变体规则类
 * 在标准数独基础上，添加了主对角线(左上至右下)和副对角线(右上至左下)的约束
 */
export class DiagonalVariant extends BaseVariantRule {
  id = "diagonal";
  name = "对角线数独";
  description = "在标准数独的基础上，两条对角线上的数字1-N也只能出现一次";

  /**
   * 检查对角线数独是否支持给定配置
   * @param config 数独配置
   */
  supportsConfig(config: SudokuConfig): CompatibilityResult {
    // 对角线数独要求网格必须是正方形
    if (config.size < 3) {
      return {
        compatible: false,
        reason: "对角线数独要求至少3x3的网格大小",
      };
    }

    // 检查是否为非正方形网格
    if (config.blockWidth !== config.blockHeight) {
      return {
        compatible: false,
        reason: "对角线数独需要正方形网格（如9x9，而非6x6）",
      };
    }

    return { compatible: true };
  }

  /**
   * 检查对角线规则是否与其他规则兼容
   * @param otherRule 其他变体规则
   * @param config 数独配置
   */
  isCompatibleWith(
    otherRule: BaseVariantRule,
    config: SudokuConfig,
  ): CompatibilityResult {
    // 对角线规则与大多数规则兼容，目前没有特殊限制
    return { compatible: true };
  }

  /**
   * 获取对角线区域定义
   * @param config 数独配置
   * @returns 包含主对角线和副对角线的区域定义
   */
  getRegions(config: SudokuConfig): Region[] {
    const { size } = config;
    const regions: Region[] = [];

    // 添加主对角线区域 (左上到右下)
    const mainDiagonal: Region = {
      id: "diagonal-main",
      type: "diagonal",
      cells: [],
      properties: {
        color: "#FFD700", // 金色
        label: "主对角线",
      },
    };

    for (let i = 0; i < size; i++) {
      mainDiagonal.cells.push([i, i]);
    }

    regions.push(mainDiagonal);

    // 添加副对角线区域 (右上到左下)
    const antiDiagonal: Region = {
      id: "diagonal-anti",
      type: "diagonal",
      cells: [],
      properties: {
        color: "#FFA500", // 橙色
        label: "副对角线",
      },
    };

    for (let i = 0; i < size; i++) {
      antiDiagonal.cells.push([i, size - 1 - i]);
    }

    regions.push(antiDiagonal);

    return regions;
  }

  /**
   * 验证网格是否符合对角线数独规则
   * @param grid 网格数据
   * @param config 数独配置
   * @returns 验证结果
   */
  validate(grid: Grid, config: SudokuConfig): ValidationResult {
    // 只验证对角线区域
    const diagonalRegions = config.regions.filter(
      (region) => region.type === "diagonal",
    );

    if (diagonalRegions.length === 0) {
      // 如果配置中没有对角线区域，先生成它们
      diagonalRegions.push(...this.getRegions(config));
    }

    return validateAllRegions(grid, diagonalRegions);
  }

  /**
   * 获取当前单元格因对角线规则需要排除的候选数
   * @param grid 网格数据
   * @param row 行索引
   * @param col 列索引
   * @param config 数独配置
   * @returns 需要排除的候选数集合
   */
  getExcludedCandidates(
    grid: Grid,
    row: number,
    col: number,
    config: SudokuConfig,
  ): Set<number> {
    const size = config.size;
    const excluded = new Set<number>();

    // 检查单元格是否在主对角线上
    const isOnMainDiagonal = row === col;

    // 检查单元格是否在副对角线上
    const isOnAntiDiagonal = row + col === size - 1;

    // 如果不在任何对角线上，直接返回空集合
    if (!isOnMainDiagonal && !isOnAntiDiagonal) {
      return excluded;
    }

    // 查找对角线上已经使用的数字
    if (isOnMainDiagonal) {
      for (let i = 0; i < size; i++) {
        // 跳过当前单元格和空单元格
        if (i !== row && grid[i][i].value > 0) {
          excluded.add(grid[i][i].value);
        }
      }
    }

    if (isOnAntiDiagonal) {
      for (let i = 0; i < size; i++) {
        // 跳过当前单元格和空单元格
        if (i !== row && grid[i][size - 1 - i].value > 0) {
          excluded.add(grid[i][size - 1 - i].value);
        }
      }
    }

    return excluded;
  }

  /**
   * 获取渲染提示
   * @returns 用于UI渲染的特殊提示
   */
  getRenderingHints(): Record<string, unknown> {
    return {
      showDiagonals: true,
      diagonalColors: {
        main: "#FFD700", // 金色
        anti: "#FFA500", // 橙色
      },
    };
  }
}
