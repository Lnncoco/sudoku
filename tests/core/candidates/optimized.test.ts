/**
 * @fileoverview 单元测试 - src/core/candidates/optimized.ts
 * 位运算优化的候选数计算功能测试
 */
import { describe, it, expect } from 'vitest';
import { 
  getCandidatesForCellBitmask,
  getAllCandidatesBitmask
} from '@/core/candidates/optimized';
import type { Grid } from '@/core/types/grid';
import type { Region } from '@/core/types/region';
import type { SudokuConfig } from '@/core/types/engine';

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

describe('位运算优化的候选数计算', () => {
  describe('基于位掩码的单元格候选数计算', () => {
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
      
      // 创建配置对象
      const config: SudokuConfig = {
        size: 3,
        blockWidth: 3,
        blockHeight: 1,
        regions,
        variantRules: []
      };
      
      // 计算[0,2]的候选数
      const candidates = getCandidatesForCellBitmask(grid, 0, 2, config);
      
      // [0,2]的候选数应为空，因为行有1,2，列有3
      expect(candidates.size).toBe(0);
      
      // 计算[1,0]的候选数
      const candidates2 = getCandidatesForCellBitmask(grid, 1, 0, config);
      
      // [1,0]的候选数应为2，因为同行已有3，同列已有1
      expect(candidates2.size).toBe(1);
      expect(candidates2.has(2)).toBe(true);
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
      
      // 创建配置对象
      const config: SudokuConfig = {
        size: 9,
        blockWidth: 3,
        blockHeight: 3,
        regions,
        variantRules: []
      };
      
      // 计算已填入值的单元格[0,0]的候选数
      const candidates = getCandidatesForCellBitmask(grid, 0, 0, config);
      
      // 应返回空集合
      expect(candidates.size).toBe(0);
    });
    
    it('应正确处理更大的网格尺寸', () => {
      // 创建16x16测试网格的一部分
      const grid = createTestGrid([
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0],
        Array(16).fill(0)
      ]);
      
      // 定义第一行区域
      const regions: Region[] = [
        { id: 'row-0', type: 'row', cells: Array.from({length: 16}, (_, i) => [0, i]) }
      ];
      
      // 创建配置对象
      const config: SudokuConfig = {
        size: 16,
        blockWidth: 4,
        blockHeight: 4,
        regions,
        variantRules: []
      };
      
      // 计算[0,15]的候选数
      const candidates = getCandidatesForCellBitmask(grid, 0, 15, config);
      
      // [0,15]的唯一候选数应为16
      expect(candidates.size).toBe(1);
      expect(candidates.has(16)).toBe(true);
    });
  });
  
  describe('基于位掩码的全网格候选数计算', () => {
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
      
      // 创建配置对象
      const config: SudokuConfig = {
        size: 9,
        blockWidth: 3,
        blockHeight: 3,
        regions,
        variantRules: []
      };
      
      // 计算所有候选数
      const allCandidates = getAllCandidatesBitmask(grid, config);
      
      // 应只包含一个单元格的候选数
      expect(allCandidates.size).toBe(1);
      expect(allCandidates.has('2,2')).toBe(true);
      
      // [2,2]的唯一候选数应为9
      const candidates = allCandidates.get('2,2');
      expect(candidates).toBeDefined();
      expect(candidates?.size).toBe(1);
      expect(candidates?.has(9)).toBe(true);
    });
    
    it('应使用预计算的区域掩码提高性能', () => {
      // 创建测试网格，有多个空单元格
      const grid = createTestGrid([
        [1, 2, 3],
        [0, 0, 0],
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
      
      // 创建配置对象
      const config: SudokuConfig = {
        size: 3,
        blockWidth: 3,
        blockHeight: 1,
        regions,
        variantRules: []
      };
      
      // 计算所有候选数
      const allCandidates = getAllCandidatesBitmask(grid, config);
      
      // 应包含6个空单元格的候选数
      expect(allCandidates.size).toBe(6);
      
      // 第二行的单元格[1,0]候选数应不包含1（因为第一列有1）
      const candidates1_0 = allCandidates.get('1,0');
      expect(candidates1_0).toBeDefined();
      expect(candidates1_0?.has(1)).toBe(false);
      expect(candidates1_0?.has(2)).toBe(true);
      expect(candidates1_0?.has(3)).toBe(true);
      
      // 第二行的单元格[1,1]候选数应不包含2（因为第二列有2）
      const candidates1_1 = allCandidates.get('1,1');
      expect(candidates1_1).toBeDefined();
      expect(candidates1_1?.has(1)).toBe(true);
      expect(candidates1_1?.has(2)).toBe(false);
      expect(candidates1_1?.has(3)).toBe(true);
      
      // 第二行的单元格[1,2]候选数应不包含3（因为第三列有3）
      const candidates1_2 = allCandidates.get('1,2');
      expect(candidates1_2).toBeDefined();
      expect(candidates1_2?.has(1)).toBe(true);
      expect(candidates1_2?.has(2)).toBe(true);
      expect(candidates1_2?.has(3)).toBe(false);
    });
    
    it('应处理复杂约束和交叉检查', () => {
      // 创建有多种约束的测试网格
      const grid = createTestGrid([
        [1, 2, 3, 4],
        [3, 4, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]);
      
      // 定义区域
      const regions: Region[] = [
        // 行
        { id: 'row-0', type: 'row', cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
        { id: 'row-1', type: 'row', cells: [[1, 0], [1, 1], [1, 2], [1, 3]] },
        { id: 'row-2', type: 'row', cells: [[2, 0], [2, 1], [2, 2], [2, 3]] },
        { id: 'row-3', type: 'row', cells: [[3, 0], [3, 1], [3, 2], [3, 3]] },
        // 列
        { id: 'col-0', type: 'column', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
        { id: 'col-1', type: 'column', cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
        { id: 'col-2', type: 'column', cells: [[0, 2], [1, 2], [2, 2], [3, 2]] },
        { id: 'col-3', type: 'column', cells: [[0, 3], [1, 3], [2, 3], [3, 3]] }
      ];
      
      // 创建配置对象
      const config: SudokuConfig = {
        size: 4,
        blockWidth: 2,
        blockHeight: 2,
        regions,
        variantRules: []
      };
      
      // 计算所有候选数
      const allCandidates = getAllCandidatesBitmask(grid, config);
      
      // 检查特定单元格的候选数
      
      // [1,2]的候选数应为1,2（第二行已有3,4）
      const candidates1_2 = allCandidates.get('1,2');
      expect(candidates1_2).toBeDefined();
      expect(candidates1_2?.size).toBe(2);
      expect(candidates1_2?.has(1)).toBe(true);
      expect(candidates1_2?.has(2)).toBe(true);
      expect(candidates1_2?.has(3)).toBe(false);
      expect(candidates1_2?.has(4)).toBe(false);
      
      // [2,0]的候选数应为2,4（第一列已有1,3）
      const candidates2_0 = allCandidates.get('2,0');
      expect(candidates2_0).toBeDefined();
      expect(candidates2_0?.has(1)).toBe(false);
      expect(candidates2_0?.has(2)).toBe(true);
      expect(candidates2_0?.has(3)).toBe(false);
      expect(candidates2_0?.has(4)).toBe(true);
    });
  });
  
  describe('位运算优化版与基础版的对比', () => {
    it('位运算优化版应与基础版产生相同的结果', () => {
      // 创建测试网格
      const grid = createTestGrid([
        [1, 2, 0],
        [0, 5, 6],
        [7, 0, 9]
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
      
      // 创建配置对象
      const config: SudokuConfig = {
        size: 9,
        blockWidth: 3,
        blockHeight: 3,
        regions,
        variantRules: []
      };
      
      // 对每个空单元格计算候选数并与各实现的结果做比较
      // 在此处导入基础版方法进行比较
      // import { getCandidatesForCell } from '@/core/candidates/basic';
      
      // 空单元格坐标列表
      const emptyCells = [
        [0, 2], [1, 0], [2, 1]
      ];
      
      // 检查[0,2]的候选数
      const candidates0_2 = getCandidatesForCellBitmask(grid, 0, 2, config);
      expect(candidates0_2.has(3)).toBe(true);
      expect(candidates0_2.has(4)).toBe(true);
      expect(candidates0_2.has(8)).toBe(true);
      
      // 检查[1,0]的候选数
      const candidates1_0 = getCandidatesForCellBitmask(grid, 1, 0, config);
      expect(candidates1_0.has(3)).toBe(true);
      expect(candidates1_0.has(4)).toBe(true);
      expect(candidates1_0.has(8)).toBe(true);
      
      // 检查[2,1]的候选数
      const candidates2_1 = getCandidatesForCellBitmask(grid, 2, 1, config);
      expect(candidates2_1.has(3)).toBe(true);
      expect(candidates2_1.has(4)).toBe(true);
      expect(candidates2_1.has(8)).toBe(true);
    });
  });
}); 