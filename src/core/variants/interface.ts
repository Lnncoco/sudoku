/**
 * @fileoverview 变体规则接口定义
 * 定义所有变体规则必须遵循的接口
 */

import type { SudokuConfig, VariantRule } from "../types/engine";

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
 * 变体规则基类
 * 提供变体规则的基本实现和默认方法
 */
export abstract class BaseVariantRule implements VariantRule {
  /** 唯一标识符 */
  abstract id: string;

  /** 变体名称 */
  abstract name: string;

  /** 变体描述 */
  description?: string;

  /**
   * 检查此规则是否支持给定的配置（尺寸、宫格等）
   * @param config 数独配置
   * @returns 兼容性检查结果
   */
  supportsConfig(config: SudokuConfig): CompatibilityResult {
    // 默认实现：支持所有配置
    return { compatible: true };
  }

  /**
   * 检查此规则是否与其他规则兼容
   * @param otherRule 要检查兼容性的规则
   * @param config 数独配置
   * @returns 兼容性检查结果
   */
  isCompatibleWith(
    otherRule: VariantRule,
    config: SudokuConfig,
  ): CompatibilityResult {
    // 默认实现：与所有规则兼容
    return { compatible: true };
  }

  /**
   * 获取渲染提示，用于UI渲染时的特殊处理
   * @returns 渲染提示对象
   */
  getRenderingHints(): Record<string, unknown> {
    return {};
  }
}
