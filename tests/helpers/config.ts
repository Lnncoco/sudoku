/**
 * @fileoverview 测试帮助函数 - 生成数独配置
 */

import { DiagonalVariant } from '@/core/variants/diagonal';
import { generateRowRegions, generateColumnRegions, generateBlockRegions } from '@/core/regions';
import type { SudokuConfig } from '@/core/types';

/**
 * 创建标准数独配置
 * @param size 网格大小
 * @returns 标准数独配置
 */
export function createStandardConfig(size: number): SudokuConfig {
  // 检查是否为完全平方数
  const blockSize = Math.sqrt(size);
  const isInt = blockSize === Math.floor(blockSize);
  if (!isInt) throw new Error(`Size ${size} is not a perfect square`);
  
  return {
    size,
    blockWidth: blockSize,
    blockHeight: blockSize,
    regions: [
      ...generateRowRegions(size),
      ...generateColumnRegions(size),
      ...generateBlockRegions(size, blockSize, blockSize)
    ],
    variantRules: []
  };
}

/**
 * 创建对角线数独配置
 * @param size 网格大小
 * @returns 对角线数独配置
 */
export function createDiagonalConfig(size: number): SudokuConfig {
  // 首先创建标准配置
  const config = createStandardConfig(size);
  
  // 创建对角线变体规则并获取相应区域
  const diagonalVariant = new DiagonalVariant();
  const diagonalRegions = diagonalVariant.getRegions(config);
  
  // 构建带对角线规则的配置
  return {
    ...config,
    regions: [...config.regions, ...diagonalRegions],
    variantRules: [diagonalVariant]
  };
} 