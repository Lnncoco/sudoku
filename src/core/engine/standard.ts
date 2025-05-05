/**
 * @fileoverview 标准数独配置工厂
 * 提供创建标准数独配置的便捷函数
 */

import { generateStandardRegions } from "../regions";
import type { SudokuConfig } from "../types/engine";

/**
 * 创建标准数独配置
 *
 * @param size 数独尺寸，默认为9
 * @returns 标准数独配置对象
 */
export function createStandardSudokuConfig(size = 9): SudokuConfig {
  // 计算宫格大小
  const boxSize = Math.sqrt(size);

  // 确保是完全平方数
  if (boxSize !== Math.floor(boxSize)) {
    throw new Error(`尺寸 ${size} 无法形成有效的标准数独，需要是完全平方数。`);
  }

  // 创建标准区域（行、列、宫）
  const regions = generateStandardRegions(size, boxSize, boxSize);

  // 创建标准数独配置
  const config: SudokuConfig = {
    size,
    regions,
    blockWidth: boxSize,
    blockHeight: boxSize,
    variantRules: [], // 标准数独没有变体规则
    customUI: {
      renderHints: {
        gameName: `标准${size}x${size}数独`,
      },
    },
  };

  return config;
}
