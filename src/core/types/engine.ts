/**
 * @fileoverview 引擎相关类型定义
 * 定义数独引擎配置、状态和变体规则
 */

import type { Grid, MinimalState } from "./grid";
import type { CellRelation, Region } from "./region";
import type { ValidationResult } from "./validation";

/**
 * 兼容性检查结果接口
 */
export interface CompatibilityResult {
  /** 是否兼容 */
  compatible: boolean;
  /** 不兼容原因（如果不兼容） */
  reason?: string;
}

/**
 * 数独配置
 */
export interface SudokuConfig {
  /** 网格大小 */
  size: number;

  /** 宫宽度，如九宫为 3 */
  blockWidth: number;

  /** 宫高度，如九宫为 3 */
  blockHeight: number;

  /** 区域定义，包括行、列、宫、对角线、笼子等 */
  regions: Region[];

  /** 单元格关系定义 */
  relations?: CellRelation[];

  /** 应用的变体规则 */
  variantRules: VariantRule[];

  /** 初始网格状态 (可选) */
  initialGrid?: Grid;

  /** 可选，自定义UI配置 */
  customUI?: {
    /** 渲染提示 */
    renderHints?: Record<string, unknown>;

    /** 颜色方案 */
    colorScheme?: Record<string, string>;

    /** 其他UI配置 */
    [key: string]: unknown;
  };
}

/**
 * 变体规则接口
 */
export interface VariantRule {
  /** 规则标识符 */
  id: string;

  /** 规则名称 */
  name: string;

  /** 规则描述 */
  description?: string;

  /**
   * 获取该规则涉及的所有区域
   * @param config 数独配置
   */
  getRegions?(config: SudokuConfig): Region[];

  /**
   * 获取该规则涉及的所有单元格关系
   * @param config 数独配置
   */
  getRelations?(config: SudokuConfig): CellRelation[];

  /**
   * 验证网格是否符合该规则
   * @param grid 网格数据
   * @param config 数独配置
   */
  validate?(grid: Grid, config: SudokuConfig): ValidationResult;

  /**
   * 更新单个单元格候选数时，需要排除的数字
   * @param grid 网格数据
   * @param row 行索引
   * @param col 列索引
   * @param config 数独配置
   */
  getExcludedCandidates?(
    grid: Grid,
    row: number,
    col: number,
    config: SudokuConfig,
  ): Set<number>;

  /**
   * 获取渲染提示
   */
  getRenderingHints?(): Record<string, unknown>;

  /**
   * 检查此规则是否支持给定的配置（尺寸、宫格等）
   * @param config 数独配置
   */
  supportsConfig(config: SudokuConfig): CompatibilityResult;

  /**
   * 检查此规则是否与其他规则兼容
   * @param otherRule 要检查兼容性的规则
   * @param config 数独配置
   */
  isCompatibleWith(
    otherRule: VariantRule,
    config: SudokuConfig,
  ): CompatibilityResult;
}
