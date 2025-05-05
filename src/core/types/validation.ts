/**
 * @fileoverview 验证相关类型定义
 * 定义验证结果、验证器函数及错误类型
 */

import type { Grid } from "./grid";

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean;

  /** 错误单元格列表 [row, col] */
  errorCells: Array<[number, number]>;

  /** 冲突源单元格列表 [row, col]（导致规则冲突的源单元格） */
  conflictSources?: Array<[number, number]>;

  /** 具体的错误信息，用于调试和用户提示 */
  errorMessages?: string[];
}

/**
 * 验证器函数类型
 * 使用Record<string, unknown>替代SudokuConfig，避免循环引用
 */
export type Validator = (
  grid: Grid,
  config: Record<string, unknown>,
) => ValidationResult;

/**
 * 验证错误类型
 */
export enum ValidationErrorType {
  /** 重复数字错误 */
  DUPLICATE = "duplicate",

  /** 总和错误（用于杀手数独） */
  SUM = "sum",

  /** 连续关系错误 */
  CONSECUTIVE = "consecutive",

  /** 不等关系错误 */
  INEQUALITY = "inequality",

  /** 自定义错误 */
  CUSTOM = "custom",
}
