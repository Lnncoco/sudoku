/**
 * @fileoverview 缓存管理模块测试
 * 验证缓存管理器的功能是否正确
 */

import { describe, expect, it } from "vitest";
import { createCacheManager } from "../../../src/core/engine/cache";
import type { Grid } from "../../../src/core/types/grid";

describe("缓存管理器", () => {
  it("初始状态应为空缓存", () => {
    const cacheManager = createCacheManager();
    
    // 尝试获取不存在的缓存应返回undefined
    expect(cacheManager.get("test-key")).toBeUndefined();
  });

  it("设置和获取缓存值应正常工作", () => {
    const cacheManager = createCacheManager();
    const testValue = { data: "test-data" };
    
    // 设置缓存
    cacheManager.set("test-key", testValue);
    
    // 获取缓存
    const result = cacheManager.get<typeof testValue>("test-key");
    
    // 验证缓存值
    expect(result).toEqual(testValue);
  });

  it("清除缓存后应返回undefined", () => {
    const cacheManager = createCacheManager();
    
    // 设置多个缓存值
    cacheManager.set("key1", "value1");
    cacheManager.set("key2", "value2");
    
    // 清除缓存
    cacheManager.clear();
    
    // 验证缓存已被清除
    expect(cacheManager.get("key1")).toBeUndefined();
    expect(cacheManager.get("key2")).toBeUndefined();
  });

  it("生成网格缓存键应考虑所有必要元素", () => {
    const cacheManager = createCacheManager();
    
    // 创建测试网格
    const grid: Grid = [
      [
        { value: 1, isPuzzle: true, notes: new Set() },
        { value: 0, isPuzzle: false, notes: new Set([1, 2]) },
      ],
      [
        { value: 0, isPuzzle: false, notes: new Set([3]) },
        { value: 2, isPuzzle: false, notes: new Set() },
      ],
    ];
    
    // 生成缓存键
    const key = cacheManager.generateGridKey(grid);
    
    // 验证键包含所有必要信息
    expect(key).toContain("0,0:v1"); // 第一个单元格的值
    expect(key).toContain("0,1:n1,2"); // 第二个单元格的笔记
    expect(key).toContain("1,0:n3"); // 第三个单元格的笔记
    expect(key).toContain("1,1:v2"); // 第四个单元格的值
  });

  it("生成的网格缓存键应对相同内容网格生成相同键", () => {
    const cacheManager = createCacheManager();
    
    // 创建两个内容相同但实例不同的网格
    const grid1: Grid = [
      [
        { value: 1, isPuzzle: true, notes: new Set() },
        { value: 0, isPuzzle: false, notes: new Set([1, 2]) },
      ],
    ];
    
    const grid2: Grid = [
      [
        { value: 1, isPuzzle: false, notes: new Set() }, // isPuzzle不同但不影响键
        { value: 0, isPuzzle: false, notes: new Set([1, 2]) },
      ],
    ];
    
    // 生成缓存键
    const key1 = cacheManager.generateGridKey(grid1);
    const key2 = cacheManager.generateGridKey(grid2);
    
    // 验证键相同
    expect(key1).toEqual(key2);
  });

  it("生成的网格缓存键应对不同内容网格生成不同键", () => {
    const cacheManager = createCacheManager();
    
    // 创建两个内容不同的网格
    const grid1: Grid = [
      [
        { value: 1, isPuzzle: true, notes: new Set() },
        { value: 0, isPuzzle: false, notes: new Set([1, 2]) },
      ],
    ];
    
    const grid2: Grid = [
      [
        { value: 1, isPuzzle: true, notes: new Set() },
        { value: 0, isPuzzle: false, notes: new Set([1, 3]) }, // 笔记不同
      ],
    ];
    
    // 生成缓存键
    const key1 = cacheManager.generateGridKey(grid1);
    const key2 = cacheManager.generateGridKey(grid2);
    
    // 验证键不同
    expect(key1).not.toEqual(key2);
  });

  it("网格缓存键应正确排序笔记数字", () => {
    const cacheManager = createCacheManager();
    
    // 创建两个笔记顺序不同但包含相同数字的网格
    const grid1: Grid = [
      [
        { value: 0, isPuzzle: false, notes: new Set([3, 1, 2]) }, // 笔记添加顺序: 3,1,2
      ],
    ];
    
    const grid2: Grid = [
      [
        { value: 0, isPuzzle: false, notes: new Set([1, 2, 3]) }, // 笔记添加顺序: 1,2,3
      ],
    ];
    
    // 生成缓存键
    const key1 = cacheManager.generateGridKey(grid1);
    const key2 = cacheManager.generateGridKey(grid2);
    
    // 验证键相同（因为笔记被排序了）
    expect(key1).toEqual(key2);
    // 验证排序后的结果是否正确
    expect(key1).toContain("n1,2,3");
  });

  it("空单元格（无值无笔记）不应包含在缓存键中", () => {
    const cacheManager = createCacheManager();
    
    // 创建包含空单元格的网格
    const grid: Grid = [
      [
        { value: 0, isPuzzle: false, notes: new Set() }, // 空单元格
        { value: 1, isPuzzle: true, notes: new Set() },
      ],
    ];
    
    // 生成缓存键
    const key = cacheManager.generateGridKey(grid);
    
    // 验证空单元格不包含在键中
    expect(key).not.toContain("0,0");
    // 但非空单元格应该包含
    expect(key).toContain("0,1:v1");
  });
}); 