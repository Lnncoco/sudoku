/**
 * @fileoverview 对角线数独变体规则测试
 * 测试对角线数独变体规则实现
 */

import { describe, it, expect } from 'vitest';
import { DiagonalVariant } from '@/core/variants/diagonal';
import { createEmptyGrid } from '@/core/grid/create';
import { setCellValue } from '@/core/grid/access';
import type { Region } from '@/core/types/region';
import type { SudokuConfig } from '@/core/types/engine';

describe('对角线数独变体规则', () => {
  const diagonalVariant = new DiagonalVariant();

  // 测试基本属性
  it('应具有正确的标识和名称', () => {
    expect(diagonalVariant.id).toBe('diagonal');
    expect(diagonalVariant.name).toBe('对角线数独');
    expect(diagonalVariant.description).toContain('对角线上的数字');
  });

  // 测试区域生成
  it('应正确生成对角线区域', () => {
    const config: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: [],
      variantRules: []
    };

    const regions = diagonalVariant.getRegions(config);
    
    // 应该有两个对角线区域：主对角线和副对角线
    expect(regions.length).toBe(2);
    
    // 检查区域类型
    expect(regions[0].type).toBe('diagonal');
    expect(regions[1].type).toBe('diagonal');
    
    // 检查主对角线单元格 (左上到右下)
    expect(regions[0].id).toBe('diagonal-main');
    expect(regions[0].cells).toHaveLength(4);
    expect(regions[0].cells).toContainEqual([0, 0]); // 左上角
    expect(regions[0].cells).toContainEqual([3, 3]); // 右下角
    
    // 检查副对角线单元格 (右上到左下)
    expect(regions[1].id).toBe('diagonal-anti');
    expect(regions[1].cells).toHaveLength(4);
    expect(regions[1].cells).toContainEqual([0, 3]); // 右上角
    expect(regions[1].cells).toContainEqual([3, 0]); // 左下角
  });

  // 测试规则验证
  it('应能正确验证对角线规则', () => {
    // 创建4x4数独配置
    const config: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: [],
      variantRules: []
    };
    
    // 生成对角线区域并添加到配置
    config.regions = diagonalVariant.getRegions(config);
    
    // 创建一个空网格
    let grid = createEmptyGrid(4);
    
    // 添加有效的数字（主对角线上放置1,2,3,4）
    grid = setCellValue(grid, 0, 0, 1); // 左上角
    grid = setCellValue(grid, 1, 1, 2);
    grid = setCellValue(grid, 2, 2, 3);
    grid = setCellValue(grid, 3, 3, 4); // 右下角
    
    // 验证规则 - 应该有效
    let result = diagonalVariant.validate!(grid, config);
    expect(result.isValid).toBe(true);
    expect(result.errorCells.length).toBe(0);
    
    // 添加冲突数字 (主对角线上重复数字)
    grid = setCellValue(grid, 0, 0, 2); // 与(1,1)上的2冲突
    
    // 验证规则 - 应该无效
    result = diagonalVariant.validate!(grid, config);
    expect(result.isValid).toBe(false);
    expect(result.errorCells.length).toBeGreaterThan(0);
  });

  // 测试候选数排除
  it('应正确排除对角线上已有的数字', () => {
    const config: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: [],
      variantRules: []
    };
    
    // 创建一个有数字的网格
    let grid = createEmptyGrid(4);
    grid = setCellValue(grid, 0, 0, 1); // 主对角线左上角
    grid = setCellValue(grid, 3, 0, 2); // 副对角线左下角
    
    // 检查主对角线上的排除(1,1位置在主对角线上，应排除1)
    let excluded = diagonalVariant.getExcludedCandidates(grid, 1, 1, config);
    expect(excluded.has(1)).toBe(true);
    expect(excluded.size).toBe(1);
    
    // 检查副对角线上的排除(2,1位置在副对角线上，应排除2)
    excluded = diagonalVariant.getExcludedCandidates(grid, 2, 1, config);
    expect(excluded.has(2)).toBe(true);
    expect(excluded.size).toBe(1);
    
    // 检查不在对角线上的位置(0,1不在任何对角线上)
    excluded = diagonalVariant.getExcludedCandidates(grid, 0, 1, config);
    expect(excluded.size).toBe(0);
  });

  // 测试配置兼容性检查
  it('应正确检查配置兼容性', () => {
    // 有效配置 - 正方形网格
    const validConfig: SudokuConfig = {
      size: 9,
      blockWidth: 3,
      blockHeight: 3,
      regions: [],
      variantRules: []
    };
    
    let result = diagonalVariant.supportsConfig(validConfig);
    expect(result.compatible).toBe(true);
    
    // 无效配置：网格太小
    const invalidConfig1: SudokuConfig = {
      size: 2,
      blockWidth: 2,
      blockHeight: 1,
      regions: [],
      variantRules: []
    };
    
    result = diagonalVariant.supportsConfig(invalidConfig1);
    expect(result.compatible).toBe(false);
    expect(result.reason).toContain('至少3x3的网格');
    
    // 无效配置：非正方形网格
    const invalidConfig2: SudokuConfig = {
      size: 6,
      blockWidth: 3,
      blockHeight: 2,
      regions: [],
      variantRules: []
    };
    
    result = diagonalVariant.supportsConfig(invalidConfig2);
    expect(result.compatible).toBe(false);
    expect(result.reason).toContain('正方形网格');
  });
  
  // 测试渲染提示
  it('应提供正确的渲染提示', () => {
    const hints = diagonalVariant.getRenderingHints();
    expect(hints.showDiagonals).toBe(true);
    
    // 使用类型断言处理diagonalColors属性
    const diagonalColors = hints.diagonalColors as { main: string; anti: string };
    expect(diagonalColors).toBeDefined();
    expect(diagonalColors.main).toBeDefined();
    expect(diagonalColors.anti).toBeDefined();
  });
}); 