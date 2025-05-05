/**
 * @fileoverview 标准数独变体规则测试
 * 测试标准数独变体规则实现
 */

import { describe, it, expect } from 'vitest';
import { StandardVariant } from '@/core/variants/standard';
import { createEmptyGrid } from '@/core/grid/create';
import { setCellValue } from '@/core/grid/access';
import type { Region } from '@/core/types/region';
import type { SudokuConfig } from '@/core/types/engine';

describe('标准数独变体规则', () => {
  const standardVariant = new StandardVariant();

  // 测试基本属性
  it('应具有正确的标识和名称', () => {
    expect(standardVariant.id).toBe('standard');
    expect(standardVariant.name).toBe('标准数独');
    expect(standardVariant.description).toContain('数字1-N只能出现一次');
  });

  // 测试区域生成
  it('应正确生成标准数独的行、列、宫区域', () => {
    const config: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: [],
      variantRules: []
    };

    const regions = standardVariant.getRegions(config);
    
    // 应该有4行、4列、4宫，总共12个区域
    expect(regions.length).toBe(12);
    
    // 检查行区域
    const rowRegions = regions.filter(r => r.type === 'row');
    expect(rowRegions.length).toBe(4);
    
    // 检查列区域
    const colRegions = regions.filter(r => r.type === 'column');
    expect(colRegions.length).toBe(4);
    
    // 检查宫区域
    const blockRegions = regions.filter(r => r.type === 'block');
    expect(blockRegions.length).toBe(4);
    
    // 检查区域中的单元格数量
    for (const region of regions) {
      expect(region.cells.length).toBe(4); // 4x4数独中每个区域有4个单元格
    }
  });

  // 测试规则验证
  it('应能正确验证标准数独规则', () => {
    // 创建4x4数独配置
    const config: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: [],
      variantRules: []
    };
    
    // 生成区域并添加到配置
    config.regions = standardVariant.getRegions(config);
    
    // 创建一个空网格
    let grid = createEmptyGrid(4);
    
    // 添加有效的数字
    grid = setCellValue(grid, 0, 0, 1);
    grid = setCellValue(grid, 0, 1, 2);
    grid = setCellValue(grid, 1, 0, 3);
    grid = setCellValue(grid, 1, 1, 4);
    
    // 验证规则 - 应该有效
    let result = standardVariant.validate!(grid, config);
    expect(result.isValid).toBe(true);
    expect(result.errorCells.length).toBe(0);
    
    // 添加冲突数字 (在同一行重复)
    grid = setCellValue(grid, 0, 2, 1); // 行0已经有1了
    
    // 验证规则 - 应该无效
    result = standardVariant.validate!(grid, config);
    expect(result.isValid).toBe(false);
    expect(result.errorCells.length).toBeGreaterThan(0);
  });

  // 测试候选数排除
  it('应返回空的候选数排除集合', () => {
    const config: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: [],
      variantRules: []
    };
    
    const grid = createEmptyGrid(4);
    
    // 标准数独的候选数排除逻辑已在位掩码计算中实现，此方法应返回空集合
    const excluded = standardVariant.getExcludedCandidates(grid, 0, 0, config);
    expect(excluded.size).toBe(0);
  });

  // 测试配置兼容性检查
  it('应正确检查配置兼容性', () => {
    // 有效配置
    const validConfig: SudokuConfig = {
      size: 9,
      blockWidth: 3,
      blockHeight: 3,
      regions: [],
      variantRules: []
    };
    
    let result = standardVariant.supportsConfig(validConfig);
    expect(result.compatible).toBe(true);
    
    // 无效配置：网格大小不能被宫格整除
    const invalidConfig1: SudokuConfig = {
      size: 7, // 不能被blockWidth=3和blockHeight=3整除
      blockWidth: 3,
      blockHeight: 3,
      regions: [],
      variantRules: []
    };
    
    result = standardVariant.supportsConfig(invalidConfig1);
    expect(result.compatible).toBe(false);
    expect(result.reason).toContain('网格大小(7)必须能被宫格宽度(3)和高度(3)整除');
    
    // 无效配置：网格太小
    const invalidConfig2: SudokuConfig = {
      size: 1,
      blockWidth: 1,
      blockHeight: 1,
      regions: [],
      variantRules: []
    };
    
    result = standardVariant.supportsConfig(invalidConfig2);
    expect(result.compatible).toBe(false);
    expect(result.reason).toContain('网格大小至少为2x2');
  });
}); 