/**
 * @fileoverview 单元测试 - src/core/regions/standard.ts
 * 测试标准区域生成相关函数
 */
import { describe, it, expect } from 'vitest';
import { 
  generateRowRegions, 
  generateColumnRegions, 
  generateBlockRegions,
  generateDiagonalRegions
} from '@/core';

describe('标准区域生成函数', () => {
  it('应生成正确的行区域', () => {
    // 测试不同尺寸的网格
    const rowRegions4 = generateRowRegions(4);
    const rowRegions9 = generateRowRegions(9);
    
    // 断言：检查行数
    expect(rowRegions4.length).toBe(4);
    expect(rowRegions9.length).toBe(9);
    
    // 断言：检查行区域的内容（以4x4为例）
    for (let row = 0; row < 4; row++) {
      const region = rowRegions4[row];
      
      // 检查区域ID和类型
      expect(region.id).toBe(`row-${row}`);
      expect(region.type).toBe('row');
      
      // 检查区域包含的单元格
      expect(region.cells.length).toBe(4);
      
      for (let col = 0; col < 4; col++) {
        expect(region.cells).toContainEqual([row, col]);
      }
    }
  });
  
  it('应生成正确的列区域', () => {
    // 测试不同尺寸的网格
    const colRegions4 = generateColumnRegions(4);
    const colRegions9 = generateColumnRegions(9);
    
    // 断言：检查列数
    expect(colRegions4.length).toBe(4);
    expect(colRegions9.length).toBe(9);
    
    // 断言：检查列区域的内容（以4x4为例）
    for (let col = 0; col < 4; col++) {
      const region = colRegions4[col];
      
      // 检查区域ID和类型
      expect(region.id).toBe(`column-${col}`);
      expect(region.type).toBe('column');
      
      // 检查区域包含的单元格
      expect(region.cells.length).toBe(4);
      
      for (let row = 0; row < 4; row++) {
        expect(region.cells).toContainEqual([row, col]);
      }
    }
  });
  
  it('应生成正确的宫区域', () => {
    // 测试不同尺寸和宫形状的网格
    const blockRegions9 = generateBlockRegions(9, 3, 3); // 9x9网格，3x3宫
    const blockRegions6 = generateBlockRegions(6, 3, 2); // 6x6网格，3x2宫
    
    // 断言：检查宫数量
    expect(blockRegions9.length).toBe(9);
    expect(blockRegions6.length).toBe(6);
    
    // 断言：检查9x9网格的宫区域
    // 检查第一个宫（左上角）
    const topLeftBlock = blockRegions9[0];
    expect(topLeftBlock.id).toBe('block-0');
    expect(topLeftBlock.type).toBe('block');
    expect(topLeftBlock.cells.length).toBe(9);
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        expect(topLeftBlock.cells).toContainEqual([row, col]);
      }
    }
    
    // 检查第5个宫（中间）
    const middleBlock = blockRegions9[4];
    expect(middleBlock.id).toBe('block-4');
    expect(middleBlock.cells.length).toBe(9);
    
    for (let row = 3; row < 6; row++) {
      for (let col = 3; col < 6; col++) {
        expect(middleBlock.cells).toContainEqual([row, col]);
      }
    }
    
    // 断言：检查6x6网格的宫区域
    // 检查第一个宫（左上角）
    const topLeftBlock6 = blockRegions6[0];
    expect(topLeftBlock6.cells.length).toBe(6); // 3x2宫有6个单元格
    
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        expect(topLeftBlock6.cells).toContainEqual([row, col]);
      }
    }
  });
  
  it('应生成正确的对角线区域', () => {
    // 测试不同尺寸的网格
    const diagonalRegions4 = generateDiagonalRegions(4);
    const diagonalRegions9 = generateDiagonalRegions(9);
    
    // 断言：检查返回的对角线数量（应为2条）
    expect(diagonalRegions4.length).toBe(2);
    expect(diagonalRegions9.length).toBe(2);
    
    // 断言：检查主对角线（左上至右下）
    const mainDiagonal9 = diagonalRegions9[0];
    expect(mainDiagonal9.id).toBe('diagonal-main');
    expect(mainDiagonal9.type).toBe('diagonal');
    expect(mainDiagonal9.cells.length).toBe(9);
    
    for (let i = 0; i < 9; i++) {
      expect(mainDiagonal9.cells).toContainEqual([i, i]);
    }
    
    // 断言：检查副对角线（右上至左下）
    const antiDiagonal9 = diagonalRegions9[1];
    expect(antiDiagonal9.id).toBe('diagonal-anti');
    expect(antiDiagonal9.type).toBe('diagonal');
    expect(antiDiagonal9.cells.length).toBe(9);
    
    for (let i = 0; i < 9; i++) {
      expect(antiDiagonal9.cells).toContainEqual([i, 8 - i]);
    }
    
    // 测试4x4的对角线
    const mainDiagonal4 = diagonalRegions4[0];
    expect(mainDiagonal4.cells.length).toBe(4);
    for (let i = 0; i < 4; i++) {
      expect(mainDiagonal4.cells).toContainEqual([i, i]);
    }
  });
}); 