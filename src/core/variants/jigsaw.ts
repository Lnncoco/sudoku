/**
 * @fileoverview 异形宫数独变体规则实现
 * 实现异形宫数独规则：替代标准宫，使用不规则形状的区域
 */

import type { CompatibilityResult, SudokuConfig } from "../types/engine";
import type { Grid } from "../types/grid";
import type { Region } from "../types/region";
import type { ValidationResult } from "../types/validation";
import { validateAllRegions } from "../validation/collector";
import { BaseVariantRule } from "./interface";

/**
 * 异形宫数独变体规则类
 * 在标准数独基础上，将标准方形宫替换为不规则形状的区域
 */
export class JigsawVariant extends BaseVariantRule {
  id = "jigsaw";
  name = "异形宫数独";
  description =
    "替代标准宫格，使用不规则形状的区域，每个区域内数字1-N只出现一次";

  /**
   * 检查异形宫数独是否支持给定配置
   * @param config 数独配置
   */
  supportsConfig(config: SudokuConfig): CompatibilityResult {
    // 检查是否存在异形宫定义
    const jigsawRegions = config.regions.filter(
      (region) => region.type === "jigsaw",
    );

    if (jigsawRegions.length === 0) {
      return {
        compatible: false,
        reason: "异形宫数独需要明确定义异形宫区域",
      };
    }

    // 验证异形宫区域数量和大小
    const totalCells = config.size * config.size;
    let jigsawCells = 0;

    // 计算异形宫单元格总数
    for (const region of jigsawRegions) {
      jigsawCells += region.cells.length;
    }

    // 检查是否覆盖所有单元格
    if (jigsawCells !== totalCells) {
      return {
        compatible: false,
        reason: `异形宫区域必须覆盖所有单元格: 期望 ${totalCells} 个但只定义了 ${jigsawCells} 个`,
      };
    }

    return { compatible: true };
  }

  /**
   * 检查异形宫数独是否与其他规则兼容
   * @param otherRule 其他变体规则
   * @param config 数独配置
   */
  isCompatibleWith(
    otherRule: BaseVariantRule,
    config: SudokuConfig,
  ): CompatibilityResult {
    // 异形宫数独可以与多数规则组合
    if (otherRule.id === "standard") {
      return {
        compatible: false,
        reason: "异形宫数独不能与标准数独规则组合，因为它替代了标准宫区域",
      };
    }

    return { compatible: true };
  }

  /**
   * 获取异形宫区域定义
   * 注意: 异形宫需要在配置中提供，此方法不主动生成异形宫
   *
   * @param config 数独配置
   * @returns 异形宫区域定义
   */
  getRegions(config: SudokuConfig): Region[] {
    // 获取配置中定义的异形宫区域
    // 在实际应用中，异形宫应该由配置提供，而不是自动生成
    const jigsawRegions = config.regions.filter(
      (region) => region.type === "jigsaw",
    );

    // 如果没有提供异形宫区域，返回空数组
    if (jigsawRegions.length === 0) {
      console.warn(
        "未在配置中找到异形宫区域定义，异形宫数独需要显式提供区域定义",
      );
    }

    return jigsawRegions;
  }

  /**
   * 验证网格是否符合异形宫数独规则
   *
   * @param grid 网格数据
   * @param config 数独配置
   * @returns 验证结果
   */
  validate(grid: Grid, config: SudokuConfig): ValidationResult {
    // 只验证异形宫区域
    const jigsawRegions = config.regions.filter(
      (region) => region.type === "jigsaw",
    );

    if (jigsawRegions.length === 0) {
      return {
        isValid: false,
        errorCells: [],
        errorMessages: ["未找到异形宫区域定义，无法验证"],
      };
    }

    return validateAllRegions(grid, jigsawRegions);
  }

  /**
   * 获取当前单元格因异形宫规则需要排除的候选数
   *
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
    const excluded = new Set<number>();

    // 找出包含当前单元格的异形宫区域
    const jigsawRegions = config.regions.filter(
      (region) =>
        region.type === "jigsaw" &&
        region.cells.some(([r, c]) => r === row && c === col),
    );

    // 如果找不到包含当前单元格的异形宫，返回空集合
    if (jigsawRegions.length === 0) {
      return excluded;
    }

    // 对于每个包含当前单元格的异形宫
    for (const region of jigsawRegions) {
      // 获取区域内所有已填写的数字
      for (const [r, c] of region.cells) {
        // 跳过当前单元格和空单元格
        if ((r !== row || c !== col) && grid[r][c].value > 0) {
          excluded.add(grid[r][c].value);
        }
      }
    }

    return excluded;
  }

  /**
   * 获取渲染提示
   *
   * @returns 用于UI渲染的特殊提示
   */
  getRenderingHints(): Record<string, unknown> {
    return {
      showJigsawBorders: true,
      useJigsawColors: true,
    };
  }
}
