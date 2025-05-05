/**
 * @fileoverview 引擎创建工厂
 * 提供创建引擎实例的工厂函数
 */

import type { SudokuConfig } from "../types/engine";
import { validateVariantRulesCombination } from "../variants/helpers";
import type { SudokuEngine } from "./core";
import { createSudokuEngineCore } from "./core";

/**
 * 创建数独引擎实例
 *
 * @param config 数独配置
 * @param validateRules 是否验证规则兼容性，默认为 true
 * @returns 数独引擎实例
 * @throws 如果变体规则不兼容且 throwOnIncompatible 为 true，则抛出错误
 */
export function createSudokuEngine(
  config: SudokuConfig,
  options: {
    validateRules?: boolean;
    throwOnIncompatible?: boolean;
  } = {},
): SudokuEngine {
  const { validateRules = true, throwOnIncompatible = false } = options;

  // 执行规则兼容性验证（可选）
  if (validateRules && config.variantRules && config.variantRules.length > 0) {
    const validationResult = validateVariantRulesCombination(
      config.variantRules,
      config,
    );

    if (!validationResult.valid) {
      const errorMessage = `变体规则组合存在兼容性问题:\n${validationResult.errors.join("\n")}`;

      // 根据选项决定是抛出错误还是仅显示警告
      if (throwOnIncompatible) {
        throw new Error(errorMessage);
      } else {
        console.warn(errorMessage);
      }
    }
  }

  return createSudokuEngineCore(config);
}
