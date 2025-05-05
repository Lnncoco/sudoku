/**
 * @fileoverview 单元测试 - src/core/grid/transform.ts
 * 测试网格转换相关函数
 */
import { describe, it, expect, vi } from 'vitest';
import { 
  exportGridState, 
  importGridState, 
  gridToHashKey,
  gridToString,
  createGridFromValues,
  toggleCellNote
} from '@/core';

describe('网格转换函数', () => {
  it('应将网格导出为最小状态表示', () => {
    // 准备带有用户修改的网格
    const grid = createGridFromValues([
      [5, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]);
    
    // 设置一些用户填入的值和笔记
    let modifiedGrid = toggleCellNote(grid, 0, 1, 1);
    modifiedGrid = toggleCellNote(modifiedGrid, 0, 1, 2);
    modifiedGrid = toggleCellNote(modifiedGrid, 0, 2, 3);
    
    // 模拟Date.now以获得一致的时间戳
    const mockNow = 1618248000000; // 2021-04-12T12:00:00.000Z
    vi.spyOn(Date, 'now').mockImplementation(() => mockNow);
    
    // 导出状态
    const state = exportGridState(modifiedGrid);
    
    // 断言：检查导出的状态
    expect(state.meta?.timestamp).toBe(mockNow);
    
    // 断言：检查单元格数据
    expect(Object.keys(state.cells).length).toBe(2); // 应该只有两个单元格有修改
    
    // 检查笔记对象
    expect(state.cells['0,1'].notes).toEqual([1, 2]);
    expect(state.cells['0,2'].notes).toEqual([3]);
    
    // 题目单元格(5)不应被包含在导出中
    expect(state.cells['0,0']).toBeUndefined();
    
    // 清理mock
    vi.restoreAllMocks();
  });
  
  it('应将最小状态导入到网格中', () => {
    // 准备空网格
    const grid = createGridFromValues([
      [5, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]);
    
    // 准备要导入的状态
    const state = {
      cells: {
        '0,1': { value: 3 },
        '0,2': { notes: [1, 4, 7] },
        '1,1': { value: 9 },
        '2,0': { notes: [5, 6] }
      },
      meta: {
        timestamp: Date.now()
      }
    };
    
    // 导入状态
    const newGrid = importGridState(grid, state);
    
    // 断言：检查导入后的网格
    // 应设置值
    expect(newGrid[0][1].value).toBe(3);
    expect(newGrid[1][1].value).toBe(9);
    
    // 应设置笔记
    expect(newGrid[0][2].notes.has(1)).toBe(true);
    expect(newGrid[0][2].notes.has(4)).toBe(true);
    expect(newGrid[0][2].notes.has(7)).toBe(true);
    expect(newGrid[0][2].notes.size).toBe(3);
    
    expect(newGrid[2][0].notes.has(5)).toBe(true);
    expect(newGrid[2][0].notes.has(6)).toBe(true);
    expect(newGrid[2][0].notes.size).toBe(2);
    
    // 原始题目单元格不应被改变
    expect(newGrid[0][0].value).toBe(5);
    expect(newGrid[0][0].isPuzzle).toBe(true);
  });
  
  it('应生成网格的哈希键', () => {
    // 准备不同内容的网格
    const gridEmpty = createGridFromValues([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]);
    
    const gridWithValues = createGridFromValues([
      [5, 3, 0],
      [0, 7, 0],
      [0, 0, 9]
    ]);
    
    let gridWithNotes = createGridFromValues([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]);
    gridWithNotes = toggleCellNote(gridWithNotes, 0, 0, 1);
    gridWithNotes = toggleCellNote(gridWithNotes, 0, 0, 2);
    
    // 生成哈希键
    const hashEmpty = gridToHashKey(gridEmpty);
    const hashWithValues = gridToHashKey(gridWithValues);
    const hashWithNotes = gridToHashKey(gridWithNotes);
    
    // 断言：不同内容的网格应有不同的哈希键
    expect(hashEmpty).not.toBe(hashWithValues);
    expect(hashEmpty).not.toBe(hashWithNotes);
    expect(hashWithValues).not.toBe(hashWithNotes);
    
    // 相同内容的网格应有相同的哈希键
    const gridEmpty2 = createGridFromValues([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]);
    expect(gridToHashKey(gridEmpty)).toBe(gridToHashKey(gridEmpty2));
  });
  
  it('应生成网格的字符串表示', () => {
    // 准备测试数据
    const grid = createGridFromValues([
      [5, 3, 0],
      [6, 0, 0],
      [0, 9, 8]
    ]);
    
    // 生成字符串表示
    const str = gridToString(grid);
    
    // 断言：检查字符串格式
    const expectedStr = 
      "+-----+\n" +
      "|5 3 .|\n" +
      "|6 . .|\n" +
      "|. 9 8|\n" +
      "+-----+";
    
    expect(str).toBe(expectedStr);
  });
}); 