/**
 * @fileoverview 单元测试 - src/core/candidates/basic.ts
 * 基础候选数计算功能测试
 */
import { describe, it, expect } from 'vitest';
import { 
  getCandidatesForCell,
  getAllCandidates
} from '@/core/candidates/basic';
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

describe('基础候选数计算', () => {
  describe('单元格候选数计算', () => {
    it('应正确计算单元格候选数', () => {
      // 创建测试网格 (3x3)
      const grid = createTestGrid([
        [1, 2, 0],
        [0, 0, 3],
        [0, 0, 0]
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
      
      // 计算[0,2]的候选数
      const candidates = getCandidatesForCell(grid, 0, 2, 3, regions);
      
      // [0,2]的候选数应为3，因为同行已有1和2
      expect(candidates.size).toBe(0);
      
      // 计算[1,0]的候选数
      const candidates2 = getCandidatesForCell(grid, 1, 0, 3, regions);
      
      // [1,0]的候选数应为2，因为同行已有3，同列已有1
      expect(candidates2.size).toBe(1);
      expect(candidates2.has(2)).toBe(true);
      
      // 计算[2,2]的候选数
      const candidates3 = getCandidatesForCell(grid, 2, 2, 3, regions);
      
      // [2,2]的候选数应为1和2，因为同列已有3
      expect(candidates3.size).toBe(2);
      expect(candidates3.has(1)).toBe(true);
      expect(candidates3.has(2)).toBe(true);
    });
    
    it('应对已填入值的单元格返回空候选数集合', () => {
      // 创建测试网格
      const grid = createTestGrid([
        [1, 2, 3],
        [4, 5, 6],
        [0, 0, 0]
      ]);
      
      // 定义区域
      const regions: Region[] = [
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2]] }
      ];
      
      // 计算已填入值的单元格[0,0]的候选数
      const candidates = getCandidatesForCell(grid, 0, 0, 9, regions);
      
      // 应返回空集合
      expect(candidates.size).toBe(0);
    });
    
    it('应考虑所有相关区域的约束', () => {
      // 创建测试网格 (9x9)
      const grid = createTestGrid([
        [0, 2, 3, 0, 0, 0, 0, 0, 0],
        [4, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 5, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 9],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
      ]);
      
      // 定义区域 (仅包含行、列和一个宫)
      const regions: Region[] = [
        // 第一行
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8]] },
        // 第一列
        { id: 'col-0', type: 'column', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0]] },
        // 左上宫(3x3)
        { id: 'block-0', type: 'block', cells: [
          [0, 0], [0, 1], [0, 2],
          [1, 0], [1, 1], [1, 2],
          [2, 0], [2, 1], [2, 2]
        ]}
      ];
      
      // 计算[0,0]的候选数
      const candidates = getCandidatesForCell(grid, 0, 0, 9, regions);
      
      // [0,0]的候选数不应包含2,3,4，因为这些数字在相关区域中存在
      // 但是数字 1 不在任何相关区域，所以它应该是候选数
      expect(candidates.has(1)).toBe(true);
      expect(candidates.has(2)).toBe(false);
      expect(candidates.has(3)).toBe(false);
      expect(candidates.has(4)).toBe(false);
      
      // 应包含其他数字5-9
      expect(candidates.has(5)).toBe(true);
      expect(candidates.has(6)).toBe(true);
      expect(candidates.has(7)).toBe(true);
      expect(candidates.has(8)).toBe(true);
      expect(candidates.has(9)).toBe(true);
    });
  });
  
  describe('全网格候选数计算', () => {
    it('应正确计算所有空单元格的候选数', () => {
      // 创建测试网格 (3x3，只有[2,2]是空的)
      const grid = createTestGrid([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 0]
      ]);
      
      // 定义区域 (添加宫区域)
      const regions: Region[] = [
        // 行
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2]] },
        { id: 'row-1', type: 'row', cells: [[1, 0], [1, 1], [1, 2]] },
        { id: 'row-2', type: 'row', cells: [[2, 0], [2, 1], [2, 2]] },
        // 列
        { id: 'col-0', type: 'column', cells: [[0, 0], [1, 0], [2, 0]] },
        { id: 'col-1', type: 'column', cells: [[0, 1], [1, 1], [2, 1]] },
        { id: 'col-2', type: 'column', cells: [[0, 2], [1, 2], [2, 2]] },
        // 宫 (3x3 只有一个宫)
        { id: 'block-0', type: 'block', cells: [
          [0, 0], [0, 1], [0, 2],
          [1, 0], [1, 1], [1, 2],
          [2, 0], [2, 1], [2, 2]
        ]}
      ];
      
      // 计算所有候选数 (确保 size 是 9)
      const allCandidates = getAllCandidates(grid, 9, regions);
      
      // 应只包含一个单元格的候选数
      expect(allCandidates.size).toBe(1);
      expect(allCandidates.has('2,2')).toBe(true);
      
      // [2,2]的唯一候选数应为9
      const candidates = allCandidates.get('2,2');
      expect(candidates).toBeDefined();
      expect(candidates?.size).toBe(1);
      expect(candidates?.has(9)).toBe(true);
    });
    
    it('应跳过非空单元格', () => {
      // 创建测试网格
      const grid = createTestGrid([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
      
      // 定义区域
      const regions: Region[] = [
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2]] }
      ];
      
      // 计算所有候选数
      const allCandidates = getAllCandidates(grid, 9, regions);
      
      // 所有单元格都有值，应返回空Map
      expect(allCandidates.size).toBe(0);
    });
    
    it('应正确处理复杂约束场景', () => {
      // 创建测试网格，只有中间一行是空的
      const grid = createTestGrid([
        [1, 2, 3],
        [0, 0, 0],
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
      
      // 计算所有候选数
      const allCandidates = getAllCandidates(grid, 9, regions);
      
      // 应包含中间行的3个单元格
      expect(allCandidates.size).toBe(3);
      
      // [1,0]的候选数应为4,5,6 (因为列上有1,7)
      const candidates1_0 = allCandidates.get('1,0');
      expect(candidates1_0?.size).toBe(7); // 不考虑宫的约束，只有行列约束
      expect(candidates1_0?.has(4)).toBe(true);
      expect(candidates1_0?.has(5)).toBe(true);
      expect(candidates1_0?.has(6)).toBe(true);
      
      // [1,1]的候选数应为4,5,6 (因为列上有2,8)
      const candidates1_1 = allCandidates.get('1,1');
      expect(candidates1_1?.size).toBe(7);
      expect(candidates1_1?.has(4)).toBe(true);
      expect(candidates1_1?.has(5)).toBe(true);
      expect(candidates1_1?.has(6)).toBe(true);
      
      // [1,2]的候选数应为4,5,6 (因为列上有3,9)
      const candidates1_2 = allCandidates.get('1,2');
      expect(candidates1_2?.size).toBe(7);
      expect(candidates1_2?.has(4)).toBe(true);
      expect(candidates1_2?.has(5)).toBe(true);
      expect(candidates1_2?.has(6)).toBe(true);
    });
  });
}); 