/**
 * @fileoverview 单元测试 - src/core/validation/collector.ts
 * 验证错误收集器功能测试
 */
import { describe, it, expect, vi } from 'vitest';
import { 
  mergeValidationResults,
  validateAllRegions,
  isGridComplete
} from '@/core/validation/collector';
import type { Grid } from '@/core/types/grid';
import type { Region } from '@/core/types/region';
import type { ValidationResult } from '@/core/types/validation';

// 测试辅助函数：创建测试用网格
function createTestGrid(values: number[][]): Grid {
  return values.map(row => 
    row.map(value => ({
      value,
      isPuzzle: value !== 0,
      notes: new Set(),
    }))
  );
}

describe('验证错误收集器', () => {
  describe('验证结果合并', () => {
    it('应正确合并多个验证结果', () => {
      // 创建多个测试验证结果
      const result1: ValidationResult = {
        isValid: false,
        errorCells: [[0, 1], [0, 2]],
        conflictSources: [[0, 1]],
        errorMessages: ['行错误: 重复的数字']
      };
      
      const result2: ValidationResult = {
        isValid: false,
        errorCells: [[1, 0], [1, 1]],
        conflictSources: [[1, 0]],
        errorMessages: ['列错误: 重复的数字']
      };
      
      const result3: ValidationResult = {
        isValid: true,
        errorCells: []
      };
      
      // 合并验证结果
      const mergedResult = mergeValidationResults(result1, result2, result3);
      
      // 验证结果应为无效
      expect(mergedResult.isValid).toBe(false);
      
      // 应包含所有错误单元格，无重复
      expect(mergedResult.errorCells).toHaveLength(4);
      expect(mergedResult.errorCells).toContainEqual([0, 1]);
      expect(mergedResult.errorCells).toContainEqual([0, 2]);
      expect(mergedResult.errorCells).toContainEqual([1, 0]);
      expect(mergedResult.errorCells).toContainEqual([1, 1]);
      
      // 应包含所有冲突源，无重复
      expect(mergedResult.conflictSources).toHaveLength(2);
      expect(mergedResult.conflictSources).toContainEqual([0, 1]);
      expect(mergedResult.conflictSources).toContainEqual([1, 0]);
      
      // 应包含所有错误消息
      expect(mergedResult.errorMessages).toHaveLength(2);
      expect(mergedResult.errorMessages?.[0]).toBe('行错误: 重复的数字');
      expect(mergedResult.errorMessages?.[1]).toBe('列错误: 重复的数字');
    });
    
    it('应处理空的验证结果数组', () => {
      const result = mergeValidationResults();
      expect(result.isValid).toBe(true);
      expect(result.errorCells).toHaveLength(0);
      expect(result.conflictSources).toBeUndefined();
      expect(result.errorMessages).toBeUndefined();
    });
    
    it('应正确处理重复的单元格和冲突源', () => {
      // 创建包含重复坐标的验证结果
      const result1: ValidationResult = {
        isValid: false,
        errorCells: [[0, 1], [0, 2]],
        conflictSources: [[0, 1]]
      };
      
      const result2: ValidationResult = {
        isValid: false,
        errorCells: [[0, 1], [1, 1]],  // [0,1]重复
        conflictSources: [[0, 1]]      // [0,1]重复
      };
      
      // 合并验证结果
      const mergedResult = mergeValidationResults(result1, result2);
      
      // 应去除重复的单元格和冲突源
      expect(mergedResult.errorCells).toHaveLength(3);
      expect(mergedResult.conflictSources).toHaveLength(1);
    });
  });
  
  describe('全部区域验证', () => {
    it('应验证所有区域并合并结果', () => {
      // 创建测试网格，有两个重复
      const grid = createTestGrid([
        [1, 2, 1], // 行上有重复的1
        [2, 3, 4], 
        [5, 6, 7]
      ]);
      
      // 定义区域
      const regions: Region[] = [
        // 第一行
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2]] },
        // 第一列 (有重复的2)
        { id: 'col-0', type: 'column', cells: [[0, 0], [1, 0], [2, 0]] }
      ];
      
      // 验证所有区域
      const result = validateAllRegions(grid, regions);
      
      // 应检测到两个区域的错误
      expect(result.isValid).toBe(false);
      expect(result.errorCells.length).toBeGreaterThan(0);
      
      // 应包含行和列的错误
      const errorCellStrings = result.errorCells.map(([r, c]) => `${r},${c}`);
      expect(errorCellStrings).toContain('0,0');
      expect(errorCellStrings).toContain('0,2');
    });
    
    it('应正确处理多种类型的区域规则', () => {
      // 创建测试网格
      const grid = createTestGrid([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
      
      // 定义区域，包括一个杀手数独笼子
      const regions: Region[] = [
        // 标准行
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2]] },
        // 对角线
        { id: 'diag', type: 'diagonal', cells: [[0, 0], [1, 1], [2, 2]] },
        // 杀手数独笼子，总和应为15
        { 
          id: 'cage-1', 
          type: 'cage', 
          cells: [[0, 0], [1, 1], [2, 2]],
          properties: { sum: 15 }
        }
      ];
      
      // 验证所有区域
      const result = validateAllRegions(grid, regions);
      
      // 应全部通过验证
      expect(result.isValid).toBe(true);
      expect(result.errorCells).toHaveLength(0);
      
      // 修改网格使笼子总和错误
      const invalidGrid = createTestGrid([
        [2, 2, 3], // 修改[0,0]从1到2
        [4, 5, 6],
        [7, 8, 9]
      ]);
      
      // 重新验证
      const invalidResult = validateAllRegions(invalidGrid, regions);
      
      // 应检测到总和错误
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errorCells.length).toBeGreaterThan(0);
    });
  });
  
  describe('网格完成检查', () => {
    it('应正确检测完成的有效网格', () => {
      // 创建完整且有效的网格
      const grid = createTestGrid([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
      
      // 定义区域
      const regions: Region[] = [
        // 行
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2]] },
        { id: 'row-1', type: 'row', cells: [[1, 0], [1, 1], [1, 2]] },
        { id: 'row-2', type: 'row', cells: [[2, 0], [2, 1], [2, 2]] },
        // 列
        { id: 'col-0', type: 'column', cells: [[0, 0], [1, 0], [2, 0]] },
        { id: 'col-1', type: 'column', cells: [[0, 1], [1, 1], [2, 1]] },
        { id: 'col-2', type: 'column', cells: [[0, 2], [1, 2], [2, 2]] }
      ];
      
      // 检查网格是否完成
      expect(isGridComplete(grid, regions)).toBe(true);
    });
    
    it('应正确检测未完成的网格', () => {
      // 创建未完成的网格（有空格）
      const grid = createTestGrid([
        [1, 2, 3],
        [4, 0, 6], // 有一个空格
        [7, 8, 9]
      ]);
      
      // 定义区域
      const regions: Region[] = [
        // 行
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2]] },
        { id: 'row-1', type: 'row', cells: [[1, 0], [1, 1], [1, 2]] },
        { id: 'row-2', type: 'row', cells: [[2, 0], [2, 1], [2, 2]] }
      ];
      
      // 检查网格是否完成
      expect(isGridComplete(grid, regions)).toBe(false);
    });
    
    it('应正确检测完成但无效的网格', () => {
      // 创建完整但有冲突的网格
      const grid = createTestGrid([
        [1, 2, 3],
        [4, 5, 6],
        [7, 5, 9] // 第二列有重复的5
      ]);
      
      // 定义区域
      const regions: Region[] = [
        // 行
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2]] },
        { id: 'row-1', type: 'row', cells: [[1, 0], [1, 1], [1, 2]] },
        { id: 'row-2', type: 'row', cells: [[2, 0], [2, 1], [2, 2]] },
        // 列
        { id: 'col-0', type: 'column', cells: [[0, 0], [1, 0], [2, 0]] },
        { id: 'col-1', type: 'column', cells: [[0, 1], [1, 1], [2, 1]] }, // 这一列有冲突
        { id: 'col-2', type: 'column', cells: [[0, 2], [1, 2], [2, 2]] }
      ];
      
      // 检查网格是否完成
      expect(isGridComplete(grid, regions)).toBe(false);
    });
  });
}); 