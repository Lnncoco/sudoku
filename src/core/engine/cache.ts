/**
 * @fileoverview 缓存管理模块
 * 实现引擎内部缓存，用于优化频繁计算的性能
 */

import type { Grid } from "../types/grid";

/**
 * 缓存管理器接口
 */
export interface CacheManager {
  /** 获取缓存的值 */
  get<T>(key: string): T | undefined;

  /** 设置缓存值 */
  set<T>(key: string, value: T): void;

  /** 清除所有缓存 */
  clear(): void;

  /**
   * 生成网格的缓存键
   * 创建一个基于当前网格状态的唯一字符串，用于缓存查找
   */
  generateGridKey(grid: Grid): string;
}

// 工具函数：深拷贝复杂对象（包括Set、Map等）
function deepCloneObject<T>(obj: T): T {
  // 如果是基本类型或为 null/undefined，直接返回
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map((item) => deepCloneObject(item)) as unknown as T;
  }

  // 处理 Set
  if (obj instanceof Set) {
    // 确保正确深拷贝Set元素
    return new Set(
      Array.from(obj).map((item) => deepCloneObject(item)),
    ) as unknown as T;
  }

  // 处理 Map
  if (obj instanceof Map) {
    const entries = Array.from(obj.entries()).map(
      ([key, value]) =>
        [deepCloneObject(key), deepCloneObject(value)] as [unknown, unknown],
    );
    return new Map(entries) as unknown as T;
  }

  // 处理普通对象
  const result = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepCloneObject(obj[key]);
    }
  }
  return result;
}

/**
 * 缓存管理器实现
 */
class CacheManagerImpl implements CacheManager {
  private cache: Map<string, unknown> = new Map();

  get<T>(key: string): T | undefined {
    const cached = this.cache.get(key);
    if (cached === undefined) {
      return undefined;
    }

    // 返回深拷贝，避免缓存值被修改
    return this.deepCloneWithPreservation(cached as T);
  }

  set<T>(key: string, value: T): void {
    // 存储副本，避免外部引用改变缓存内容
    this.cache.set(key, this.deepCloneWithPreservation(value));
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * 深拷贝对象，同时保留特殊类型（Set, Map）
   * 内部方法，确保缓存的对象完全独立
   */
  private deepCloneWithPreservation<T>(obj: T): T {
    return deepCloneObject(obj);
  }

  /**
   * 为网格生成一个缓存键
   * 使用轻量级序列化方法，避免JSON.stringify的性能和规范性问题
   *
   * @param grid 数独网格
   * @returns 唯一的缓存键字符串
   */
  generateGridKey(grid: Grid): string {
    const parts: string[] = [];

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = grid[row][col];

        // 只包含必要信息：值和笔记
        const cellParts: string[] = [];

        // 添加值信息
        if (cell.value !== 0) {
          cellParts.push(`v${cell.value}`);
        }

        // 添加笔记信息（如果有）
        if (cell.notes.size > 0) {
          const noteValues = Array.from(cell.notes).sort((a, b) => a - b);
          cellParts.push(`n${noteValues.join(",")}`);
        }

        // 只有当单元格有值或笔记时才添加到键中
        if (cellParts.length > 0) {
          parts.push(`${row},${col}:${cellParts.join(";")}`);
        }
      }
    }

    return parts.join("|");
  }
}

/**
 * 创建缓存管理器实例
 *
 * @returns 缓存管理器实例
 */
export function createCacheManager(): CacheManager {
  return new CacheManagerImpl();
}
