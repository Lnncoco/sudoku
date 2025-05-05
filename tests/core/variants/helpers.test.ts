/**
 * @fileoverview 变体规则辅助函数测试
 * 测试变体规则的辅助函数，特别是兼容性检查机制
 */

import { describe, it, expect, vi } from 'vitest';
import { createVariantRule, validateVariantRulesCombination, validateVariantRuleConfig } from '@/core/variants/helpers';
import { StandardVariant } from '@/core/variants/standard';
import { DiagonalVariant } from '@/core/variants/diagonal';
import { JigsawVariant } from '@/core/variants/jigsaw';
import type { VariantRule, SudokuConfig } from '@/core/types/engine';
import type { Region, RegionType } from '@/core/types/region';

describe('变体规则辅助函数', () => {
  // 创建变体规则工厂函数测试
  describe('createVariantRule函数', () => {
    it('应能根据ID创建正确的变体规则实例', () => {
      // 测试创建标准数独
      const standard = createVariantRule('standard');
      expect(standard).toBeInstanceOf(StandardVariant);
      expect(standard?.id).toBe('standard');
      
      // 测试创建对角线数独
      const diagonal = createVariantRule('diagonal');
      expect(diagonal).toBeInstanceOf(DiagonalVariant);
      expect(diagonal?.id).toBe('diagonal');
      
      // 测试创建异形宫数独
      const jigsaw = createVariantRule('jigsaw');
      expect(jigsaw).toBeInstanceOf(JigsawVariant);
      expect(jigsaw?.id).toBe('jigsaw');
      
      // 测试未知规则ID
      const unknown = createVariantRule('unknown');
      expect(unknown).toBeNull();
    });
  });
  
  // 变体规则配置兼容性检查测试
  describe('validateVariantRuleConfig函数', () => {
    it('应能正确验证单个规则与配置的兼容性', () => {
      const standardVariant = new StandardVariant();
      
      // 有效配置
      const validConfig: SudokuConfig = {
        size: 9,
        blockWidth: 3,
        blockHeight: 3,
        regions: [],
        variantRules: []
      };
      
      const result = validateVariantRuleConfig(standardVariant, validConfig);
      expect(result.compatible).toBe(true);
      
      // 模拟不兼容的情况
      const mockVariant: VariantRule = {
        id: 'mock',
        name: 'Mock Variant',
        supportsConfig: vi.fn().mockReturnValue({ 
          compatible: false, 
          reason: '测试不兼容原因' 
        }),
        isCompatibleWith: vi.fn().mockReturnValue({ compatible: true })
      };
      
      const mockResult = validateVariantRuleConfig(mockVariant, validConfig);
      expect(mockResult.compatible).toBe(false);
      expect(mockResult.reason).toBe('测试不兼容原因');
      expect(mockVariant.supportsConfig).toHaveBeenCalledWith(validConfig);
    });
  });
  
  // 变体规则组合兼容性检验测试
  describe('validateVariantRulesCombination函数', () => {
    it('应能正确验证规则组合的兼容性', () => {
      // 创建基础配置
      const config: SudokuConfig = {
        size: 9,
        blockWidth: 3,
        blockHeight: 3,
        regions: [],
        variantRules: []
      };
      
      // 兼容的规则组合 (标准 + 对角线)
      const compatibleRules = [
        new StandardVariant(),
        new DiagonalVariant()
      ];
      
      const compatibleResult = validateVariantRulesCombination(compatibleRules, config);
      expect(compatibleResult.valid).toBe(true);
      expect(compatibleResult.errors.length).toBe(0);
      
      // 不兼容的规则组合 (标准 + 异形宫)
      const incompatibleRules = [
        new StandardVariant(),
        new JigsawVariant()
      ];
      
      // 异形宫数独需要异形宫区域定义才能通过配置验证
      const jigsawRegions: Region[] = [{
        id: 'jigsaw-0',
        type: 'jigsaw' as RegionType,
        cells: Array(81).fill(0).map((_, i) => [Math.floor(i / 9), i % 9])
      }];
      
      const jigsawConfig: SudokuConfig = {
        ...config,
        regions: jigsawRegions
      };
      
      const incompatibleResult = validateVariantRulesCombination(incompatibleRules, jigsawConfig);
      expect(incompatibleResult.valid).toBe(false);
      expect(incompatibleResult.errors.length).toBeGreaterThan(0);
      // 应该包含不兼容原因
      expect(incompatibleResult.errors.some(e => e.includes('标准数独与异形宫数独不兼容'))).toBe(true);
    });
    
    it('应能检测到配置不兼容的情况', () => {
      // 创建不适合对角线数独的配置 (非正方形网格)
      const invalidConfig: SudokuConfig = {
        size: 6,
        blockWidth: 3,
        blockHeight: 2, // 3×2的宫格，不是正方形
        regions: [],
        variantRules: []
      };
      
      // 包含对角线数独的规则组合
      const rules = [
        new StandardVariant(),
        new DiagonalVariant()
      ];
      
      const result = validateVariantRulesCombination(rules, invalidConfig);
      expect(result.valid).toBe(false);
      // 至少应包含一个关于对角线数独需要正方形网格的错误
      expect(result.errors.some(e => e.includes('正方形网格'))).toBe(true);
    });
    
    it('应正确处理空规则列表', () => {
      const config: SudokuConfig = {
        size: 9,
        blockWidth: 3,
        blockHeight: 3,
        regions: [],
        variantRules: []
      };
      
      const result = validateVariantRulesCombination([], config);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
}); 