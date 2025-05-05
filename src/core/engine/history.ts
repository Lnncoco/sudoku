/**
 * @fileoverview 历史记录管理模块
 * 管理数独引擎的历史记录，支持撤销和重做操作
 */

import type { MinimalState } from "../types/grid";

/**
 * 历史记录管理器，跟踪操作历史和可能的未来操作
 */
export interface HistoryManager {
  /** 获取历史记录堆栈（只读） */
  getPast(): readonly MinimalState[];

  /** 获取未来操作堆栈（只读） */
  getFuture(): readonly MinimalState[];

  /** 添加新的操作记录，清空未来操作堆栈 */
  addHistory(state: MinimalState): void;

  /** 添加当前状态到过去堆栈，并从未来堆栈弹出一项 */
  prepareFutureNavigate(currentState: MinimalState): MinimalState | null;

  /** 添加当前状态到未来堆栈，并从过去堆栈弹出一项 */
  preparePastNavigate(currentState: MinimalState): MinimalState | null;

  /** 清空历史记录 */
  clear(): void;
}

/**
 * 历史管理器配置
 */
interface HistoryManagerConfig {
  /** 最大历史记录数量，默认为500 */
  maxHistorySize?: number;
}

/**
 * 对状态对象进行深拷贝，避免引用共享问题
 */
function deepCloneState(state: MinimalState): MinimalState {
  // 创建基本结构
  const clone: MinimalState = {
    cells: {},
    meta: {
      timestamp: state.meta?.timestamp || Date.now(),
      ...(state.meta ? { ...state.meta } : {}),
    },
  };

  // 复制所有单元格状态
  for (const key in state.cells) {
    if (Object.prototype.hasOwnProperty.call(state.cells, key)) {
      const cell = state.cells[key];
      const cellClone: { value?: number; notes?: number[] } = {};

      // 复制值
      if (cell.value !== undefined) {
        cellClone.value = cell.value;
      }

      // 复制笔记数组 - 始终创建新数组实例
      if (cell.notes) {
        cellClone.notes = [...cell.notes];
      } else {
        cellClone.notes = []; // 确保notes始终存在
      }

      clone.cells[key] = cellClone;
    }
  }

  return clone;
}

/**
 * 历史记录管理器实现
 */
export class HistoryManagerImpl implements HistoryManager {
  private past: MinimalState[] = [];
  private future: MinimalState[] = [];
  private readonly maxHistorySize: number;

  /**
   * 创建历史记录管理器实例
   *
   * @param config 历史记录管理器配置
   */
  constructor(config?: HistoryManagerConfig) {
    this.maxHistorySize = config?.maxHistorySize || 500;
  }

  getPast(): readonly MinimalState[] {
    return this.past;
  }

  getFuture(): readonly MinimalState[] {
    return this.future;
  }

  addHistory(state: MinimalState): void {
    // 保存操作会清空未来操作堆栈
    this.future = [];

    // 添加状态的深拷贝到历史记录中
    this.past.push(deepCloneState(state));

    // 如果历史记录超出了最大数量限制，则移除最旧的记录
    if (this.past.length > this.maxHistorySize) {
      this.past.shift();
    }
  }

  preparePastNavigate(currentState: MinimalState): MinimalState | null {
    if (this.past.length === 0) {
      return null; // 没有历史记录可以撤销
    }

    // 当前状态添加到未来堆栈
    this.future.push(deepCloneState(currentState));

    // 从历史记录堆栈中弹出最后一项
    const previousState = this.past.pop();
    if (!previousState) {
      return null; // 安全检查
    }

    // 返回状态的深拷贝
    return deepCloneState(previousState);
  }

  prepareFutureNavigate(currentState: MinimalState): MinimalState | null {
    if (this.future.length === 0) {
      return null; // 没有未来操作可以重做
    }

    // 当前状态添加到历史记录堆栈
    this.past.push(deepCloneState(currentState));

    // 从未来操作堆栈中弹出最后一项
    const nextState = this.future.pop();
    if (!nextState) {
      return null; // 安全检查
    }

    // 返回状态的深拷贝
    return deepCloneState(nextState);
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}

/**
 * 创建历史记录管理器
 *
 * @param config 历史管理器配置
 * @returns 历史记录管理器实例
 */
export function createHistoryManager(
  config?: HistoryManagerConfig,
): HistoryManager {
  return new HistoryManagerImpl(config);
}
