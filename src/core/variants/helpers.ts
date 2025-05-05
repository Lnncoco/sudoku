/**
 * @fileoverview 变体规则辅助函数
 * 提供处理变体规则的实用工具函数
 */

import type {
  CompatibilityResult,
  SudokuConfig,
  VariantRule,
} from "../types/engine";
import type { Grid } from "../types/grid";
import type { Region } from "../types/region";
import type { ValidationResult } from "../types/validation";
import { DiagonalVariant } from "./diagonal";
import { JigsawVariant } from "./jigsaw";
import { StandardVariant } from "./standard";

/**
 * 变体规则工厂函数，根据ID创建变体规则实例
 *
 * @param id 变体规则ID
 * @returns 变体规则实例或null
 */
export function createVariantRule(id: string): VariantRule | null {
  switch (id) {
    case "standard":
      return new StandardVariant();
    case "diagonal":
      return new DiagonalVariant();
    case "jigsaw":
      return new JigsawVariant();
    default:
      console.warn(`未知的变体规则ID: ${id}`);
      return null;
  }
}

/**
 * 收集并合并所有变体规则提供的区域
 *
 * @param variantRules 变体规则列表
 * @param config 数独配置
 * @returns 合并后的区域列表
 */
export function collectRegionsFromVariants(
  variantRules: VariantRule[],
  config: SudokuConfig,
): Region[] {
  const regions: Region[] = [];

  for (const rule of variantRules) {
    if (rule.getRegions) {
      const ruleRegions = rule.getRegions(config);
      regions.push(...ruleRegions);
    }
  }

  return regions;
}

/**
 * 执行所有变体规则的验证并合并结果
 *
 * @param grid 网格数据
 * @param config 数独配置
 * @param variantRules 变体规则列表
 * @returns 合并后的验证结果
 */
export function validateWithVariants(
  grid: Grid,
  config: SudokuConfig,
  variantRules: VariantRule[],
): ValidationResult {
  // 初始化验证结果
  const result: ValidationResult = {
    isValid: true,
    errorCells: [],
    errorMessages: [],
  };

  // 对每个变体规则执行验证
  for (const rule of variantRules) {
    if (rule.validate) {
      const ruleResult = rule.validate(grid, config);

      // 合并验证结果
      result.isValid = result.isValid && ruleResult.isValid;

      // 合并错误单元格
      if (ruleResult.errorCells && ruleResult.errorCells.length > 0) {
        result.errorCells.push(...ruleResult.errorCells);
      }

      // 合并冲突源
      if (ruleResult.conflictSources && ruleResult.conflictSources.length > 0) {
        result.conflictSources = result.conflictSources || [];
        result.conflictSources.push(...ruleResult.conflictSources);
      }

      // 合并错误消息
      if (ruleResult.errorMessages && ruleResult.errorMessages.length > 0) {
        result.errorMessages = result.errorMessages || [];
        result.errorMessages.push(...ruleResult.errorMessages);
      }
    }
  }

  // 去重错误单元格
  result.errorCells = removeDuplicateCells(result.errorCells);

  // 去重冲突源
  if (result.conflictSources) {
    result.conflictSources = removeDuplicateCells(result.conflictSources);
  }

  return result;
}

/**
 * 获取单元格位置的排除候选数
 *
 * @param grid 网格数据
 * @param row 行索引
 * @param col 列索引
 * @param config 数独配置
 * @param variantRules 变体规则列表
 * @returns 需要排除的候选数集合
 */
export function getExcludedCandidatesFromVariants(
  grid: Grid,
  row: number,
  col: number,
  config: SudokuConfig,
  variantRules: VariantRule[],
): Set<number> {
  const excluded = new Set<number>();

  // 收集所有变体规则需要排除的候选数
  for (const rule of variantRules) {
    if (rule.getExcludedCandidates) {
      const ruleExcluded = rule.getExcludedCandidates(grid, row, col, config);
      // 合并排除的候选数
      for (const value of ruleExcluded) {
        excluded.add(value);
      }
    }
  }

  return excluded;
}

/**
 * 去除重复的单元格坐标
 *
 * @param cells 单元格坐标数组
 * @returns 去重后的单元格坐标数组
 */
function removeDuplicateCells(
  cells: Array<[number, number]>,
): Array<[number, number]> {
  const seen = new Set<string>();
  const result: Array<[number, number]> = [];

  for (const [row, col] of cells) {
    const key = `${row},${col}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push([row, col]);
    }
  }

  return result;
}

/**
 * 验证变体规则组合是否兼容
 *
 * @param rules 变体规则列表
 * @param config 数独配置
 * @returns 验证结果，包含是否有效和错误信息列表
 */
export function validateVariantRulesCombination(
  rules: VariantRule[],
  config: SudokuConfig,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查每个规则是否支持当前配置
  for (const rule of rules) {
    // 所有规则都应该实现 supportsConfig (从 BaseVariantRule 继承)
    const configResult = rule.supportsConfig(config);
    if (!configResult.compatible) {
      errors.push(
        `规则"${rule.name}"不支持当前配置: ${configResult.reason || "未指明原因"}`,
      );
    }
  }

  // 检查规则之间的相互兼容性
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const ruleA = rules[i];
      const ruleB = rules[j];

      // 双向检查兼容性
      const resultAB = ruleA.isCompatibleWith(ruleB, config);
      if (!resultAB.compatible) {
        errors.push(
          `规则"${ruleA.name}"与"${ruleB.name}"不兼容: ${resultAB.reason || "未指明原因"}`,
        );
      }

      const resultBA = ruleB.isCompatibleWith(ruleA, config);
      if (!resultBA.compatible) {
        errors.push(
          `规则"${ruleB.name}"与"${ruleA.name}"不兼容: ${resultBA.reason || "未指明原因"}`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 验证单个变体规则是否支持指定配置
 *
 * @param rule 变体规则
 * @param config 数独配置
 * @returns 兼容性检查结果
 */
export function validateVariantRuleConfig(
  rule: VariantRule,
  config: SudokuConfig,
): CompatibilityResult {
  return rule.supportsConfig(config);
}
