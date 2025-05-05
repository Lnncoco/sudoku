/**
 * @fileoverview 单元测试 - src/core/validation/bitmask.ts
 * 位运算优化的核心实现测试
 */
import { describe, it, expect } from 'vitest';
import { 
  valueToBitmask, 
  valuesFromBitmask,
  hasBit,
  addBit, 
  removeBit,
  countBits,
  createFullBitmask
} from '@/core/validation/bitmask';

describe('位掩码操作功能', () => {
  it('应正确将数字转换为位掩码', () => {
    // 测试正常情况
    expect(valueToBitmask(1)).toBe(2);      // 二进制: 10
    expect(valueToBitmask(3)).toBe(8);      // 二进制: 1000
    expect(valueToBitmask(5)).toBe(32);     // 二进制: 100000
    
    // 测试边界情况
    expect(valueToBitmask(0)).toBe(0);      // 无效输入
    expect(valueToBitmask(-1)).toBe(0);     // 无效输入
    expect(valueToBitmask(32)).toBe(0);     // 超出范围
  });

  it('应正确从位掩码中获取所有设置的值', () => {
    // 测试无设置值的情况
    expect(valuesFromBitmask(0)).toEqual([]);
    
    // 测试单个值
    expect(valuesFromBitmask(2)).toEqual([1]);       // 二进制: 10, 表示值1
    expect(valuesFromBitmask(8)).toEqual([3]);       // 二进制: 1000, 表示值3
    
    // 测试多个值
    const mask = (1 << 2) | (1 << 5) | (1 << 9);     // 包含值2,5,9
    expect(valuesFromBitmask(mask)).toEqual([2, 5, 9]);
    
    // 测试完整掩码
    const fullMask = createFullBitmask(9);           // 1-9的所有值
    expect(valuesFromBitmask(fullMask).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('应正确检查位掩码中是否设置了特定值', () => {
    const mask = (1 << 2) | (1 << 5) | (1 << 9);     // 包含值2,5,9
    
    // 测试包含的值
    expect(hasBit(mask, 2)).toBe(true);
    expect(hasBit(mask, 5)).toBe(true);
    expect(hasBit(mask, 9)).toBe(true);
    
    // 测试不包含的值
    expect(hasBit(mask, 1)).toBe(false);
    expect(hasBit(mask, 3)).toBe(false);
    expect(hasBit(mask, 4)).toBe(false);
    
    // 测试边界情况
    expect(hasBit(mask, 0)).toBe(false);     // 无效值
    expect(hasBit(mask, 32)).toBe(false);    // 超出范围
    expect(hasBit(0, 5)).toBe(false);        // 空掩码
  });

  it('应正确向位掩码添加值', () => {
    // 测试空掩码添加值
    expect(addBit(0, 3)).toBe(8);            // 添加值3
    
    // 测试向已有掩码添加新值
    let mask = (1 << 1) | (1 << 5);          // 包含值1,5
    mask = addBit(mask, 7);
    expect(valuesFromBitmask(mask).sort()).toEqual([1, 5, 7]);
    
    // 测试添加已有的值
    mask = addBit(mask, 5);
    expect(valuesFromBitmask(mask).sort()).toEqual([1, 5, 7]);  // 不应改变
    
    // 测试添加无效值
    expect(addBit(mask, 0)).toBe(mask);      // 无效值，掩码不变
    expect(addBit(mask, 32)).toBe(mask);     // 超出范围，掩码不变
  });

  it('应正确从位掩码移除值', () => {
    // 创建包含多个值的掩码
    let mask = (1 << 2) | (1 << 4) | (1 << 6) | (1 << 8);   // 包含值2,4,6,8
    
    // 测试移除存在的值
    mask = removeBit(mask, 4);
    expect(valuesFromBitmask(mask).sort()).toEqual([2, 6, 8]);
    
    // 测试移除不存在的值
    mask = removeBit(mask, 5);
    expect(valuesFromBitmask(mask).sort()).toEqual([2, 6, 8]);  // 不应改变
    
    // 测试移除无效值
    expect(removeBit(mask, 0)).toBe(mask);       // 无效值，掩码不变
    expect(removeBit(mask, 32)).toBe(mask);      // 超出范围，掩码不变
    
    // 测试清空掩码
    mask = removeBit(mask, 2);
    mask = removeBit(mask, 6);
    mask = removeBit(mask, 8);
    expect(mask).toBe(0);                         // 应为空掩码
  });

  it('应正确计算位掩码中设置的位数量', () => {
    // 测试空掩码
    expect(countBits(0)).toBe(0);
    
    // 测试单个位
    expect(countBits(1 << 3)).toBe(1);
    expect(countBits(1 << 9)).toBe(1);
    
    // 测试多个位
    const mask1 = (1 << 2) | (1 << 5) | (1 << 9);   // 3个位
    expect(countBits(mask1)).toBe(3);
    
    const mask2 = createFullBitmask(9);             // 9个位(1-9)
    expect(countBits(mask2)).toBe(9);
  });

  it('应正确创建包含1到size所有数字的位掩码', () => {
    // 测试对不同尺寸的掩码创建
    const mask4 = createFullBitmask(4);    // 1-4
    expect(valuesFromBitmask(mask4).sort()).toEqual([1, 2, 3, 4]);
    
    const mask9 = createFullBitmask(9);    // 1-9
    expect(valuesFromBitmask(mask9).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    
    // 测试最大支持尺寸
    const mask31 = createFullBitmask(31);  // 1-31
    expect(valuesFromBitmask(mask31).length).toBe(31);
    expect(valuesFromBitmask(mask31)[0]).toBe(1);
    expect(valuesFromBitmask(mask31)[30]).toBe(31);
    
    // 测试边界情况
    expect(() => createFullBitmask(0)).toThrow();    // 无效尺寸
    expect(() => createFullBitmask(32)).toThrow();   // 超出最大支持尺寸
    expect(() => createFullBitmask(-1)).toThrow();   // 无效尺寸
  });
}); 