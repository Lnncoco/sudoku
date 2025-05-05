/**
 * @fileoverview 单元测试 - src/core/regions/helpers.ts
 * 测试区域辅助函数
 */
import { describe, it, expect, vi } from 'vitest';
import { 
  findRegionsContainingCell,
  findRegionsByType,
  findRegionById,
  createCageRegion,
  getCellsInRegion,
  getIntersectionCells,
  isValidRegion,
  generateStandardRegions,
  generateRowRegions
} from '@/core';

// Mock nanoid 模块
vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('abc123')
}));

describe('区域辅助函数', () => {
  // 准备一些测试用的区域
  const row0 = {
    id: 'row-0',
    type: 'row' as const,
    cells: [[0, 0], [0, 1], [0, 2]] as [number, number][]
  };
  
  const col0 = {
    id: 'col-0',
    type: 'column' as const,
    cells: [[0, 0], [1, 0], [2, 0]] as [number, number][]
  };
  
  const block0 = {
    id: 'block-0',
    type: 'block' as const,
    cells: [[0, 0], [0, 1], [1, 0], [1, 1]] as [number, number][]
  };
  
  const testRegions = [row0, col0, block0];
  
  it('应找出包含指定单元格的区域', () => {
    // 断言：检查包含单元格(0,0)的区域
    const regionsWithCell00 = findRegionsContainingCell(testRegions, 0, 0);
    expect(regionsWithCell00.length).toBe(3); // 应该在所有区域中
    expect(regionsWithCell00).toContain(row0);
    expect(regionsWithCell00).toContain(col0);
    expect(regionsWithCell00).toContain(block0);
    
    // 断言：检查包含单元格(0,2)的区域
    const regionsWithCell02 = findRegionsContainingCell(testRegions, 0, 2);
    expect(regionsWithCell02.length).toBe(1); // 应该只在row0中
    expect(regionsWithCell02).toContain(row0);
    
    // 断言：检查包含单元格(2,2)的区域
    const regionsWithCell22 = findRegionsContainingCell(testRegions, 2, 2);
    expect(regionsWithCell22.length).toBe(0); // 不应在任何区域中
  });
  
  it('应按类型查找区域', () => {
    // 断言：检查行区域
    const rowRegions = findRegionsByType(testRegions, 'row');
    expect(rowRegions.length).toBe(1);
    expect(rowRegions[0]).toBe(row0);
    
    // 断言：检查列区域
    const colRegions = findRegionsByType(testRegions, 'column');
    expect(colRegions.length).toBe(1);
    expect(colRegions[0]).toBe(col0);
    
    // 断言：检查宫区域
    const blockRegions = findRegionsByType(testRegions, 'block');
    expect(blockRegions.length).toBe(1);
    expect(blockRegions[0]).toBe(block0);
    
    // 断言：检查不存在的区域类型
    const diagonalRegions = findRegionsByType(testRegions, 'diagonal');
    expect(diagonalRegions.length).toBe(0);
  });
  
  it('应按ID查找区域', () => {
    // 断言：检查存在的区域ID
    const foundRegion1 = findRegionById(testRegions, 'row-0');
    expect(foundRegion1).toBe(row0);
    
    const foundRegion2 = findRegionById(testRegions, 'col-0');
    expect(foundRegion2).toBe(col0);
    
    // 断言：检查不存在的区域ID
    const notFoundRegion = findRegionById(testRegions, 'not-exist');
    expect(notFoundRegion).toBeUndefined();
  });
  
  it('应创建笼子区域', () => {
    // 创建笼子区域，不带总和
    const cage1 = createCageRegion([[0, 0], [0, 1], [1, 0]]);
    
    // 断言：检查基本属性
    expect(cage1.id).toBe('cage-abc123');
    expect(cage1.type).toBe('cage');
    expect(cage1.cells).toEqual([[0, 0], [0, 1], [1, 0]]);
    expect(cage1.properties).toBeUndefined();
    
    // 创建带总和的笼子区域
    const cage2 = createCageRegion([[1, 1], [1, 2], [2, 1]], 15);
    
    // 断言：检查带总和的属性
    expect(cage2.properties).toBeDefined();
    expect(cage2.properties?.sum).toBe(15);
  });
  
  it('应获取区域中的单元格', () => {
    // 获取row0中的单元格
    const cells = getCellsInRegion(row0);
    
    // 断言：检查返回的单元格
    expect(cells).toEqual([[0, 0], [0, 1], [0, 2]]);
  });
  
  it('应找出两个区域的交集单元格', () => {
    // 断言：row0和col0的交集应该是(0,0)
    const intersection1 = getIntersectionCells(row0, col0);
    expect(intersection1).toEqual([[0, 0]]);
    
    // 断言：row0和block0的交集应该是(0,0)和(0,1)
    const intersection2 = getIntersectionCells(row0, block0);
    expect(intersection2).toEqual([[0, 0], [0, 1]]);
    
    // 断言：创建没有交集的区域
    const noIntersectionRegion = {
      id: 'test',
      type: 'custom' as const,
      cells: [[5, 5], [5, 6]] as [number, number][]
    };
    
    const intersection3 = getIntersectionCells(row0, noIntersectionRegion);
    expect(intersection3).toEqual([]);
  });
  
  it('应验证区域是否有效', () => {
    // 断言：有效区域（无重复单元格）
    expect(isValidRegion(row0)).toBe(true);
    
    // 断言：无效区域（有重复单元格）
    const invalidRegion = {
      id: 'invalid',
      type: 'custom' as const,
      cells: [[0, 0], [1, 1], [0, 0]] as [number, number][]
    };
    
    expect(isValidRegion(invalidRegion)).toBe(false);
  });
  
  it('应生成标准区域集合', () => {
    // 测试为4x4网格生成标准区域
    const standardRegions = generateStandardRegions(4, 2, 2);
    
    // 断言：应生成12个区域（4行+4列+4宫）
    expect(standardRegions.length).toBe(12);
    
    // 断言：检查行区域
    const rowRegions = findRegionsByType(standardRegions, 'row');
    expect(rowRegions.length).toBe(4);
    
    // 断言：检查列区域
    const colRegions = findRegionsByType(standardRegions, 'column');
    expect(colRegions.length).toBe(4);
    
    // 断言：检查宫区域
    const blockRegions = findRegionsByType(standardRegions, 'block');
    expect(blockRegions.length).toBe(4);
    
    // 断言：检查第一个宫的单元格（应该是2x2宫）
    const firstBlock = blockRegions[0];
    expect(firstBlock.cells.length).toBe(4);
    expect(firstBlock.cells).toContainEqual([0, 0]);
    expect(firstBlock.cells).toContainEqual([0, 1]);
    expect(firstBlock.cells).toContainEqual([1, 0]);
    expect(firstBlock.cells).toContainEqual([1, 1]);
  });
}); 