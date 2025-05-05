/**
 * @fileoverview 标准数独变体规则实现
 * 实现标准数独规则：每行、每列、每宫各数字1-N只出现一次
 */

import type { CompatibilityResult, SudokuConfig } from "../types/engine";
import type { Grid } from "../types/grid";
import type { Region } from "../types/region";
import type { ValidationResult } from "../types/validation";
import { validateAllRegions } from "../validation/collector";
import { BaseVariantRule } from "./interface";

/**
 * 标准数独变体规则类
 * 标准数独要求每行、每列、每宫中数字1到N各出现一次
 */
export class StandardVariant extends BaseVariantRule {
  id = "standard";
  name = "标准数独";
  description = "每行、每列和每宫格中，数字1-N只能出现一次";

  /**
   * 检查标准数独是否支持给定配置
   * @param config 数独配置
   */
  supportsConfig(config: SudokuConfig): CompatibilityResult {
    // 标准数独要求网格大小必须能被宫大小整除
    if (
      config.size % config.blockWidth !== 0 ||
      config.size % config.blockHeight !== 0
    ) {
      return {
        compatible: false,
        reason: `网格大小(${config.size})必须能被宫格宽度(${config.blockWidth})和高度(${config.blockHeight})整除`,
      };
    }

    // 检查基本大小限制
    if (config.size < 2) {
      return {
        compatible: false,
        reason: "网格大小至少为2x2",
      };
    }

    return { compatible: true };
  }

  /**
   * 检查标准数独是否与其他规则兼容
   * @param otherRule 其他变体规则
   * @param config 数独配置
   */
  isCompatibleWith(
    otherRule: BaseVariantRule,
    config: SudokuConfig,
  ): CompatibilityResult {
    // 标准数独与异形宫数独不兼容，因为两者对宫区域有不同定义
    if (otherRule.id === "jigsaw") {
      return {
        compatible: false,
        reason: "标准数独与异形宫数独不兼容，因为它们对宫区域有不同定义",
      };
    }

    // 与其他规则兼容
    return { compatible: true };
  }

  /**
   * 获取标准数独的行、列、宫区域
   * 注意：通常引擎初始化时会自动生成这些区域，此方法一般不会被调用
   */
  getRegions(config: SudokuConfig): Region[] {
    const { size, blockWidth, blockHeight } = config;
    const regions: Region[] = [];

    // 生成行区域
    for (let row = 0; row < size; row++) {
      const rowRegion: Region = {
        id: `row-${row}`,
        type: "row",
        cells: [],
      };

      for (let col = 0; col < size; col++) {
        rowRegion.cells.push([row, col]);
      }

      regions.push(rowRegion);
    }

    // 生成列区域
    for (let col = 0; col < size; col++) {
      const colRegion: Region = {
        id: `col-${col}`,
        type: "column",
        cells: [],
      };

      for (let row = 0; row < size; row++) {
        colRegion.cells.push([row, col]);
      }

      regions.push(colRegion);
    }

    // 生成宫区域
    for (let blockRow = 0; blockRow < size / blockHeight; blockRow++) {
      for (let blockCol = 0; blockCol < size / blockWidth; blockCol++) {
        const blockRegion: Region = {
          id: `block-${blockRow}-${blockCol}`,
          type: "block",
          cells: [],
        };

        const startRow = blockRow * blockHeight;
        const startCol = blockCol * blockWidth;

        for (let r = 0; r < blockHeight; r++) {
          for (let c = 0; c < blockWidth; c++) {
            blockRegion.cells.push([startRow + r, startCol + c]);
          }
        }

        regions.push(blockRegion);
      }
    }

    return regions;
  }

  /**
   * 验证网格是否符合标准数独规则
   * 注意：通常不需要直接调用此方法，引擎会统一处理验证逻辑
   */
  validate(grid: Grid, config: SudokuConfig): ValidationResult {
    // 只过滤出标准区域（行、列、宫）来验证
    const standardRegions = config.regions.filter(
      (region) =>
        region.type === "row" ||
        region.type === "column" ||
        region.type === "block",
    );

    return validateAllRegions(grid, standardRegions);
  }

  /**
   * 获取当前单元格中因标准规则需要排除的候选数
   * 注意：位掩码计算已经包含了标准规则的约束，此方法一般不会被调用
   */
  getExcludedCandidates(
    grid: Grid,
    row: number,
    col: number,
    config: SudokuConfig,
  ): Set<number> {
    // 标准规则的候选数排除逻辑已在位掩码计算中实现
    // 这里返回空集合，表示没有额外的排除
    return new Set<number>();
  }

  /**
   * 获取渲染提示
   */
  getRenderingHints(): Record<string, unknown> {
    return {
      showStandardGrid: true,
    };
  }
}
