/**
 * @fileoverview 单元测试 - src/core/grid/access.ts
 * 测试网格访问相关函数
 */
import { describe, it, expect } from 'vitest';
import { 
  getCellState, 
  getCellValue, 
  isValidPosition,
  setCellValue, 
  toggleCellNote, 
  setCellHighlight,
  cellToKey,
  keyToCell,
  createGridFromValues
} from '@/core';

describe('网格访问函数', () => {
  it('应正确获取单元格状态', () => {
    // 准备测试数据
    const grid = createGridFromValues([
      [5, 3, 0],
      [6, 0, 0],
      [0, 9, 8]
    ]);
    
    // 测试有效坐标
    const cell1 = getCellState(grid, 0, 0);
    expect(cell1).not.toBeNull();
    expect(cell1?.value).toBe(5);
    expect(cell1?.isPuzzle).toBe(true);
    
    const cell2 = getCellState(grid, 1, 1);
    expect(cell2).not.toBeNull();
    expect(cell2?.value).toBe(0);
    expect(cell2?.isPuzzle).toBe(false);
    
    // 测试无效坐标
    const invalidCell1 = getCellState(grid, -1, 0);
    expect(invalidCell1).toBeNull();
    
    const invalidCell2 = getCellState(grid, 0, 3);
    expect(invalidCell2).toBeNull();
    
    const invalidCell3 = getCellState(grid, 3, 0);
    expect(invalidCell3).toBeNull();
  });
  
  it('应正确获取单元格值', () => {
    // 准备测试数据
    const grid = createGridFromValues([
      [5, 3, 0],
      [6, 0, 0],
      [0, 9, 8]
    ]);
    
    // 测试获取值
    expect(getCellValue(grid, 0, 0)).toBe(5);
    expect(getCellValue(grid, 0, 2)).toBe(0);
    expect(getCellValue(grid, 2, 1)).toBe(9);
    
    // 测试无效位置
    expect(getCellValue(grid, -1, 0)).toBe(-1);
    expect(getCellValue(grid, 0, 5)).toBe(-1);
    expect(getCellValue(grid, 5, 0)).toBe(-1);
  });
  
  it('应正确检查位置是否有效', () => {
    // 准备测试数据
    const grid = createGridFromValues([
      [5, 3, 0],
      [6, 0, 0],
      [0, 9, 8]
    ]);
    
    // 测试有效位置
    expect(isValidPosition(grid, 0, 0)).toBe(true);
    expect(isValidPosition(grid, 1, 2)).toBe(true);
    expect(isValidPosition(grid, 2, 2)).toBe(true);
    
    // 测试无效位置
    expect(isValidPosition(grid, -1, 0)).toBe(false);
    expect(isValidPosition(grid, 0, -1)).toBe(false);
    expect(isValidPosition(grid, 3, 0)).toBe(false);
    expect(isValidPosition(grid, 0, 3)).toBe(false);
  });
  
  it('应正确设置单元格值', () => {
    // 准备测试数据
    const grid = createGridFromValues([
      [5, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]);
    
    // 测试设置非题目单元格的值
    const newGrid1 = setCellValue(grid, 1, 1, 7);
    expect(newGrid1[1][1].value).toBe(7);
    expect(newGrid1[1][1].isPuzzle).toBe(false);
    
    // 测试清除值（设置为0）
    const newGrid2 = setCellValue(newGrid1, 1, 1, 0);
    expect(newGrid2[1][1].value).toBe(0);
    
    // 测试不应修改题目单元格
    const newGrid3 = setCellValue(grid, 0, 0, 9);
    expect(newGrid3[0][0].value).toBe(5); // 仍然是原始值
    
    // 测试编辑模式应该能修改题目单元格
    const newGrid4 = setCellValue(grid, 0, 0, 9, true);
    expect(newGrid4[0][0].value).toBe(9);
    expect(newGrid4[0][0].isPuzzle).toBe(true);
    
    // 测试无效位置
    const newGrid5 = setCellValue(grid, -1, 0, 6);
    expect(newGrid5).toBe(grid); // 应返回原始网格
  });
  
  it('应正确切换单元格笔记', () => {
    // 准备测试数据
    const grid = createGridFromValues([
      [5, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]);
    
    // 测试添加笔记
    let newGrid = toggleCellNote(grid, 0, 1, 1);
    expect(newGrid[0][1].notes.has(1)).toBe(true);
    
    // 测试添加另一个笔记
    newGrid = toggleCellNote(newGrid, 0, 1, 3);
    expect(newGrid[0][1].notes.has(1)).toBe(true);
    expect(newGrid[0][1].notes.has(3)).toBe(true);
    
    // 测试移除笔记
    newGrid = toggleCellNote(newGrid, 0, 1, 1);
    expect(newGrid[0][1].notes.has(1)).toBe(false);
    expect(newGrid[0][1].notes.has(3)).toBe(true);
    
    // 测试不应修改题目单元格的笔记
    newGrid = toggleCellNote(grid, 0, 0, 2);
    expect(newGrid[0][0].notes.size).toBe(0);
    
    // 测试无效位置
    newGrid = toggleCellNote(grid, -1, 0, 3);
    expect(newGrid).toBe(grid); // 应返回原始网格
  });
  
  it('应正确转换单元格坐标和键', () => {
    // 测试坐标到键
    expect(cellToKey(1, 2)).toBe('1,2');
    expect(cellToKey(0, 0)).toBe('0,0');
    expect(cellToKey(9, 8)).toBe('9,8');
    
    // 测试键到坐标
    expect(keyToCell('1,2')).toEqual([1, 2]);
    expect(keyToCell('0,0')).toEqual([0, 0]);
    expect(keyToCell('9,8')).toEqual([9, 8]);
  });

  it('应正确设置单元格高亮状态', () => {
    // 准备测试数据
    const grid = createGridFromValues([
      [5, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]);

    // 测试设置高亮类型
    let newGrid = setCellHighlight(grid, 1, 1, 'selected');
    expect(newGrid[1][1].highlight).toBe('selected');
    expect(newGrid[0][0].highlight).toBeUndefined(); // 其他单元格不受影响

    // 测试设置另一种高亮类型
    newGrid = setCellHighlight(newGrid, 1, 1, 'error');
    expect(newGrid[1][1].highlight).toBe('error');

    // 测试清除高亮（设置为 undefined）
    newGrid = setCellHighlight(newGrid, 1, 1, undefined);
    expect(newGrid[1][1].highlight).toBeUndefined();

    // 测试设置题目单元格高亮
    newGrid = setCellHighlight(grid, 0, 0, 'error');
    expect(newGrid[0][0].highlight).toBe('error');

    // 测试无效位置
    const newGridInvalid = setCellHighlight(grid, -1, 0, 'selected');
    expect(newGridInvalid).toBe(grid); // 应返回原始网格

    // 测试其他单元格不受影响
    const grid2 = setCellHighlight(grid, 1, 2, 'selected');
    expect(grid2[1][1].highlight).toBeUndefined();
    expect(grid2[0][0].highlight).toBeUndefined();
  });
}); 