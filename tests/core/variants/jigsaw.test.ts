/**
 * @fileoverview 异形宫数独变体规则测试
 * 测试异形宫数独变体规则实现
 */

import { describe, it, expect } from 'vitest';
import { JigsawVariant } from '@/core/variants/jigsaw';
import { createEmptyGrid } from '@/core/grid/create';
import { setCellValue } from '@/core/grid/access';
import type { Region, RegionType } from '@/core/types/region';
import type { SudokuConfig } from '@/core/types/engine';
import { BaseVariantRule } from '@/core/variants/interface';

describe('异形宫数独变体规则', () => {
  const jigsawVariant = new JigsawVariant();

  // 测试基本属性
  it('应具有正确的标识和名称', () => {
    expect(jigsawVariant.id).toBe('jigsaw');
    expect(jigsawVariant.name).toBe('异形宫数独');
    expect(jigsawVariant.description).toContain('不规则形状的区域');
  });

  // 创建测试用的异形宫区域
  function createJigsawRegions(size: number): Region[] {
    // 简单的2个异形宫示例（用于4x4网格）
    if (size === 4) {
      return [
        {
          id: 'jigsaw-0',
          type: 'jigsaw' as RegionType,
          cells: [[0, 0], [0, 1], [1, 0], [1, 1]], // 左上2x2区域
        },
        {
          id: 'jigsaw-1',
          type: 'jigsaw' as RegionType,
          cells: [[0, 2], [0, 3], [1, 2], [1, 3]], // 右上2x2区域
        },
        {
          id: 'jigsaw-2',
          type: 'jigsaw' as RegionType,
          cells: [[2, 0], [2, 1], [3, 0], [3, 1]], // 左下2x2区域
        },
        {
          id: 'jigsaw-3',
          type: 'jigsaw' as RegionType,
          cells: [[2, 2], [2, 3], [3, 2], [3, 3]], // 右下2x2区域
        }
      ];
    }
    
    // 默认返回空数组
    return [];
  }

  // 测试区域生成
  it('应能正确获取配置中的异形宫区域', () => {
    // 创建带有异形宫区域的配置
    const jigsawRegions = createJigsawRegions(4);
    const config: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: [...jigsawRegions], // 添加预定义的异形宫区域
      variantRules: []
    };

    // 获取异形宫区域
    const regions = jigsawVariant.getRegions(config);
    
    // 应返回所有异形宫区域
    expect(regions.length).toBe(4);
    expect(regions.every(r => r.type === 'jigsaw')).toBe(true);
    
    // 检查是否包含所有原始区域
    for (const original of jigsawRegions) {
      const found = regions.some(r => r.id === original.id);
      expect(found).toBe(true);
    }
  });

  // 测试规则验证
  it('应能正确验证异形宫规则', () => {
    // 创建带有异形宫区域的4x4配置
    const jigsawRegions = createJigsawRegions(4);
    const config: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: [...jigsawRegions],
      variantRules: []
    };
    
    // 创建一个空网格
    let grid = createEmptyGrid(4);
    
    // 添加有效的数字（第一个异形宫内放置1,2,3,4）
    grid = setCellValue(grid, 0, 0, 1);
    grid = setCellValue(grid, 0, 1, 2);
    grid = setCellValue(grid, 1, 0, 3);
    grid = setCellValue(grid, 1, 1, 4);
    
    // 验证规则 - 应该有效
    let result = jigsawVariant.validate!(grid, config);
    expect(result.isValid).toBe(true);
    expect(result.errorCells.length).toBe(0);
    
    // 添加冲突数字 (同一异形宫内重复数字)
    grid = setCellValue(grid, 0, 0, 2); // 与(0,1)上的2冲突
    
    // 验证规则 - 应该无效
    result = jigsawVariant.validate!(grid, config);
    expect(result.isValid).toBe(false);
    expect(result.errorCells.length).toBeGreaterThan(0);
  });

  // 测试候选数排除
  it('应正确排除异形宫内已有的数字', () => {
    // 创建带有异形宫区域的配置
    const jigsawRegions = createJigsawRegions(4);
    const config: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: [...jigsawRegions],
      variantRules: []
    };
    
    // 创建一个有数字的网格
    let grid = createEmptyGrid(4);
    grid = setCellValue(grid, 0, 0, 1); // 左上角异形宫
    grid = setCellValue(grid, 2, 2, 2); // 右下角异形宫
    
    // 检查同一异形宫内的排除(1,1位置在左上角异形宫内，应排除1)
    let excluded = jigsawVariant.getExcludedCandidates(grid, 1, 1, config);
    expect(excluded.has(1)).toBe(true);
    expect(excluded.size).toBe(1);
    
    // 检查不同异形宫内的单元格(0,2不在左上角异形宫内，不应排除1)
    excluded = jigsawVariant.getExcludedCandidates(grid, 0, 2, config);
    expect(excluded.has(1)).toBe(false);
    expect(excluded.size).toBe(0);
  });

  // 测试配置兼容性检查
  it('应正确检查配置兼容性', () => {
    // 有效配置 - 包含完整异形宫定义
    const jigsawRegions = createJigsawRegions(4);
    const validConfig: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: [...jigsawRegions],
      variantRules: []
    };
    
    let result = jigsawVariant.supportsConfig(validConfig);
    expect(result.compatible).toBe(true);
    
    // 无效配置：没有异形宫定义
    const invalidConfig1: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: [],
      variantRules: []
    };
    
    result = jigsawVariant.supportsConfig(invalidConfig1);
    expect(result.compatible).toBe(false);
    expect(result.reason).toContain('需要明确定义异形宫区域');
    
    // 无效配置：异形宫单元格不完整
    const incompleteJigsawRegions: Region[] = [
      {
        id: 'jigsaw-0',
        type: 'jigsaw' as RegionType,
        cells: [[0, 0], [0, 1]], // 只包含2个单元格
      }
    ];
    
    const incompleteConfig: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      regions: incompleteJigsawRegions,
      variantRules: []
    };
    
    result = jigsawVariant.supportsConfig(incompleteConfig);
    expect(result.compatible).toBe(false);
    expect(result.reason).toContain('异形宫区域必须覆盖所有单元格');
  });
  
  // 测试与其他规则的兼容性
  it('应正确判断与其他规则的兼容性', () => {
    class MockStandardVariant extends BaseVariantRule {
      id = 'standard';
      name = 'Standard';
      
      supportsConfig() {
        return { compatible: true };
      }
      
      isCompatibleWith() {
        return { compatible: true };
      }
    }
    
    const standardVariantMock = new MockStandardVariant();
    
    const config: SudokuConfig = {
      size: 9,
      blockWidth: 3,
      blockHeight: 3,
      regions: [],
      variantRules: []
    };
    
    // 与标准数独不兼容
    let result = jigsawVariant.isCompatibleWith(standardVariantMock, config);
    expect(result.compatible).toBe(false);
    expect(result.reason).toContain('异形宫数独不能与标准数独规则组合');
    
    // 与其他规则兼容
    class MockOtherVariant extends BaseVariantRule {
      id = 'other';
      name = 'Other';
      
      supportsConfig() {
        return { compatible: true };
      }
      
      isCompatibleWith() {
        return { compatible: true };
      }
    }
    
    const otherVariantMock = new MockOtherVariant();
    
    result = jigsawVariant.isCompatibleWith(otherVariantMock, config);
    expect(result.compatible).toBe(true);
  });
  
  // 测试渲染提示
  it('应提供正确的渲染提示', () => {
    const hints = jigsawVariant.getRenderingHints();
    expect(hints.showJigsawBorders).toBe(true);
    expect(hints.useJigsawColors).toBe(true);
  });
}); 