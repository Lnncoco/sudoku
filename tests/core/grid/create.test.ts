/**
 * @fileoverview 单元测试 - src/core/grid/create.ts
 * 测试网格创建相关函数
 */
import { describe, it, expect } from 'vitest';
import { createEmptyCell, createEmptyGrid, createGridFromValues, cloneGrid } from '@/core';

describe('网格创建函数', () => {
  it('应正确创建空单元格', () => {
    // 创建空单元格
    const cell = createEmptyCell();
    
    // 断言：检查单元格属性是否符合预期
    expect(cell.value).toBe(0);
    expect(cell.isPuzzle).toBe(false);
    expect(cell.notes).toBeInstanceOf(Set);
    expect(cell.notes.size).toBe(0);
    expect(cell.error).toBe(false);
  });

  it('应创建指定尺寸的空网格', () => {
    // 创建不同尺寸的网格
    const grid4x4 = createEmptyGrid(4);
    const grid9x9 = createEmptyGrid(9);
    
    // 断言：检查网格尺寸
    expect(grid4x4.length).toBe(4);
    expect(grid4x4[0].length).toBe(4);
    expect(grid9x9.length).toBe(9);
    expect(grid9x9[0].length).toBe(9);
    
    // 断言：检查网格中的每个单元格都是空的
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (row < 4 && col < 4) {
          // 同时检查4x4网格
          expect(grid4x4[row][col].value).toBe(0);
          expect(grid4x4[row][col].isPuzzle).toBe(false);
        }
        // 检查9x9网格
        expect(grid9x9[row][col].value).toBe(0);
        expect(grid9x9[row][col].isPuzzle).toBe(false);
      }
    }
  });

  it('应从数字数组创建网格', () => {
    // 准备测试数据
    const values = [
      [5, 3, 0, 0],
      [6, 0, 0, 1],
      [0, 9, 8, 0],
      [0, 0, 0, 0]
    ];
    
    // 从数据创建网格
    const grid = createGridFromValues(values);
    
    // 断言：检查网格尺寸
    expect(grid.length).toBe(4);
    expect(grid[0].length).toBe(4);
    
    // 断言：检查值是否正确设置
    expect(grid[0][0].value).toBe(5);
    expect(grid[0][0].isPuzzle).toBe(true);
    
    expect(grid[0][2].value).toBe(0);
    expect(grid[0][2].isPuzzle).toBe(false);
    
    expect(grid[1][3].value).toBe(1);
    expect(grid[1][3].isPuzzle).toBe(true);
    
    expect(grid[3][3].value).toBe(0);
    expect(grid[3][3].isPuzzle).toBe(false);
  });

  it('应创建网格的深度副本', () => {
    // 准备原始网格
    const originalGrid = createGridFromValues([
      [5, 3, 0],
      [6, 0, 0],
      [0, 9, 8]
    ]);
    
    // 添加一些笔记
    originalGrid[0][2].notes.add(1);
    originalGrid[0][2].notes.add(2);
    
    // 克隆网格
    const clonedGrid = cloneGrid(originalGrid);
    
    // 断言：检查克隆后的网格与原始网格值相同
    expect(clonedGrid[0][0].value).toBe(originalGrid[0][0].value);
    expect(clonedGrid[2][2].value).toBe(originalGrid[2][2].value);
    
    // 断言：检查笔记是否正确克隆
    expect(clonedGrid[0][2].notes.has(1)).toBe(true);
    expect(clonedGrid[0][2].notes.has(2)).toBe(true);
    
    // 断言：克隆的网格应该是独立的（深拷贝）
    // 修改原始网格不应影响克隆的网格
    originalGrid[0][0].value = 7;
    originalGrid[0][2].notes.add(3);
    
    expect(clonedGrid[0][0].value).toBe(5); // 仍然是原始值
    expect(clonedGrid[0][2].notes.has(3)).toBe(false); // 不应包含新添加的笔记
  });
}); 