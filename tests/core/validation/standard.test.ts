/**
 * @fileoverview 单元测试 - src/core/validation/standard.ts
 * 标准数独规则验证功能测试
 */
import { describe, it, expect } from 'vitest';
import { 
  checkDuplicatesBitmask,
  validateRegionBitmask,
  validateSum,
  isValidMoveBitmask
} from '@/core/validation/standard';
import type { Grid } from '@/core/types/grid';
import type { Region } from '@/core/types/region';

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

describe('标准数独规则验证', () => {
  describe('重复数字检查', () => {
    it('应正确检测无重复的情况', () => {
      // 创建测试网格
      const grid = createTestGrid([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
      
      // 检查行
      const row0 = [[0, 0], [0, 1], [0, 2]];
      const { duplicates: rowDups, sources: rowSources } = checkDuplicatesBitmask(grid, row0);
      expect(rowDups).toHaveLength(0);
      expect(rowSources).toHaveLength(0);
      
      // 检查列
      const col0 = [[0, 0], [1, 0], [2, 0]];
      const { duplicates: colDups, sources: colSources } = checkDuplicatesBitmask(grid, col0);
      expect(colDups).toHaveLength(0);
      expect(colSources).toHaveLength(0);
    });
    
    it('应正确检测并收集重复数字', () => {
      // 创建有重复的测试网格
      const grid = createTestGrid([
        [1, 2, 1], // 有重复的1
        [4, 4, 6], // 有重复的4
        [7, 8, 9]
      ]);
      
      // 检查第一行（有重复的1）
      const row0 = [[0, 0], [0, 1], [0, 2]];
      const { duplicates: rowDups, sources: rowSources } = checkDuplicatesBitmask(grid, row0);
      
      // 预期找到2个位置，分别是[0,0]和[0,2]
      expect(rowDups).toHaveLength(2);
      expect(rowDups).toContainEqual([0, 0]);
      expect(rowDups).toContainEqual([0, 2]);
      
      // 预期有1个冲突源
      expect(rowSources).toHaveLength(1);
      expect(rowSources[0]).toEqual([0, 0]); // 第一个出现的位置是冲突源
      
      // 检查第二行（有重复的4）
      const row1 = [[1, 0], [1, 1], [1, 2]];
      const { duplicates: row1Dups } = checkDuplicatesBitmask(grid, row1);
      expect(row1Dups).toHaveLength(2);
      expect(row1Dups).toContainEqual([1, 0]);
      expect(row1Dups).toContainEqual([1, 1]);
    });
    
    it('应正确处理包含空格的情况', () => {
      // 创建包含空格(0)的测试网格
      const grid = createTestGrid([
        [1, 0, 3],
        [0, 2, 0],
        [3, 0, 1]
      ]);
      
      // 检查第一行
      const row0 = [[0, 0], [0, 1], [0, 2]];
      const { duplicates: rowDups } = checkDuplicatesBitmask(grid, row0);
      expect(rowDups).toHaveLength(0); // 不应有重复
      
      // 检查对角线（有重复的3） - 注意源码实现会检测[0,0]和[2,2]为重复
      const diagonal = [[0, 0], [1, 1], [2, 2]];
      const { duplicates: diagDups } = checkDuplicatesBitmask(grid, diagonal);
      expect(diagDups).toHaveLength(2);
      
      // 检查第一列和第三列（有重复的3和1）
      const col0 = [[0, 0], [1, 0], [2, 0]];
      const { duplicates: col0Dups } = checkDuplicatesBitmask(grid, col0);
      expect(col0Dups).toHaveLength(0); // 因为[1,0]是0，所以不应有重复
      
      const col2 = [[0, 2], [1, 2], [2, 2]];
      const { duplicates: col2Dups } = checkDuplicatesBitmask(grid, col2);
      expect(col2Dups).toHaveLength(0); // 因为[1,2]是0，所以不应有重复
    });
  });
  
  describe('区域验证', () => {
    it('应正确验证没有冲突的区域', () => {
      // 创建测试网格
      const grid = createTestGrid([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
      
      // 定义行区域
      const rowRegion: Region = {
        id: 'row-0',
        type: 'row',
        cells: [[0, 0], [0, 1], [0, 2]]
      };
      
      // 验证行区域
      const result = validateRegionBitmask(grid, rowRegion);
      expect(result.isValid).toBe(true);
      expect(result.errorCells).toHaveLength(0);
      expect(result.conflictSources).toHaveLength(0); // 更正：空数组而不是undefined
    });
    
    it('应正确验证并收集有冲突的区域错误', () => {
      // 创建有冲突的测试网格
      const grid = createTestGrid([
        [1, 2, 1], // 第一行有重复的1
        [4, 5, 6],
        [7, 8, 9]
      ]);
      
      // 定义行区域
      const rowRegion: Region = {
        id: 'row-0',
        type: 'row',
        cells: [[0, 0], [0, 1], [0, 2]]
      };
      
      // 验证行区域
      const result = validateRegionBitmask(grid, rowRegion);
      expect(result.isValid).toBe(false);
      expect(result.errorCells).toHaveLength(2);
      expect(result.errorCells).toContainEqual([0, 0]);
      expect(result.errorCells).toContainEqual([0, 2]);
      
      // 检查错误消息
      expect(result.errorMessages).toBeDefined();
      expect(result.errorMessages?.[0]).toContain('2 个重复单元格');
    });
  });
  
  describe('区域总和验证', () => {
    it('应正确验证笼子总和', () => {
      // 创建测试网格
      const grid = createTestGrid([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
      
      // 定义笼子区域，总和为6 (1+2+3)
      const cageRegion: Region = {
        id: 'cage-1',
        type: 'cage',
        cells: [[0, 0], [0, 1], [0, 2]],
        properties: { sum: 6 }
      };
      
      // 验证笼子
      const result = validateSum(grid, cageRegion);
      expect(result.isValid).toBe(true); // 更正：源码实现中1+2+3=6，等于期望的6，所以结果为true
      expect(result.errorCells).toHaveLength(0); // 更正：没有错误单元格
      
      // 定义另一个笼子，总和为15 (1+5+9)
      const diagonalCage: Region = {
        id: 'cage-2',
        type: 'cage',
        cells: [[0, 0], [1, 1], [2, 2]],
        properties: { sum: 15 }
      };
      
      // 验证对角线笼子
      const result2 = validateSum(grid, diagonalCage);
      expect(result2.isValid).toBe(true); // 总和为1+5+9=15，与期望相符
      expect(result2.errorCells).toHaveLength(0);
    });
    
    it('应跳过未完全填写的笼子验证', () => {
      // 创建包含空格的测试网格
      const grid = createTestGrid([
        [1, 0, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
      
      // 定义包含空格的笼子
      const cageRegion: Region = {
        id: 'cage-1',
        type: 'cage',
        cells: [[0, 0], [0, 1], [0, 2]],
        properties: { sum: 10 }
      };
      
      // 验证笼子
      const result = validateSum(grid, cageRegion);
      expect(result.isValid).toBe(true); // 未完全填写，应跳过验证
      expect(result.errorCells).toHaveLength(0);
    });
    
    it('应处理没有sum属性的区域', () => {
      // 创建测试网格
      const grid = createTestGrid([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
      
      // 定义没有sum属性的区域
      const region: Region = {
        id: 'row-0',
        type: 'row',
        cells: [[0, 0], [0, 1], [0, 2]]
      };
      
      // 验证区域
      const result = validateSum(grid, region);
      expect(result.isValid).toBe(true); // 没有sum属性，应直接返回有效
      expect(result.errorCells).toHaveLength(0);
    });
  });
  
  describe('有效移动检查', () => {
    it('应正确检测有效移动', () => {
      // 创建测试网格
      const grid = createTestGrid([
        [1, 0, 3],
        [0, 0, 0],
        [0, 0, 0]
      ]);
      
      // 定义区域
      const regions: Region[] = [
        // 第一行
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2]] },
        // 第一列
        { id: 'col-0', type: 'column', cells: [[0, 0], [1, 0], [2, 0]] },
        // 第一个3x3宫
        { id: 'block-0', type: 'block', cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] }
      ];
      
      // 测试有效移动
      expect(isValidMoveBitmask(grid, 1, 1, 2, regions)).toBe(true); // 在[1,1]填入2是有效的
      expect(isValidMoveBitmask(grid, 1, 1, 5, regions)).toBe(true); // 在[1,1]填入5是有效的
      expect(isValidMoveBitmask(grid, 0, 1, 2, regions)).toBe(true); // 在[0,1]填入2是有效的
      
      // 测试清除单元格总是有效的
      expect(isValidMoveBitmask(grid, 0, 0, 0, regions)).toBe(true); // 清除[0,0]是有效的
    });
    
    it('应正确检测无效移动', () => {
      // 创建测试网格
      const grid = createTestGrid([
        [1, 0, 3],
        [0, 0, 0],
        [0, 0, 0]
      ]);
      
      // 定义区域
      const regions: Region[] = [
        // 第一行
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2]] },
        // 第一列
        { id: 'col-0', type: 'column', cells: [[0, 0], [1, 0], [2, 0]] },
        // 第一个3x3宫
        { id: 'block-0', type: 'block', cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] }
      ];
      
      // 测试无效移动
      expect(isValidMoveBitmask(grid, 0, 1, 1, regions)).toBe(false); // 在[0,1]填入1冲突，因为第一行已有1
      expect(isValidMoveBitmask(grid, 0, 1, 3, regions)).toBe(false); // 在[0,1]填入3冲突，因为第一行已有3
      expect(isValidMoveBitmask(grid, 1, 0, 1, regions)).toBe(false); // 在[1,0]填入1冲突，因为第一列已有1
    });
  });
}); 