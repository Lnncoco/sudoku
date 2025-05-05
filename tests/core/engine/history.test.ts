/**
 * @fileoverview 历史记录管理模块测试
 * 验证历史记录管理器的功能是否正确
 */

import { describe, expect, it } from "vitest";
import { createHistoryManager } from "../../../src/core/engine/history";

describe("历史记录管理器", () => {
  it("初始状态应为空记录", () => {
    const historyManager = createHistoryManager();
    
    // 验证初始状态
    expect(historyManager.getPast()).toEqual([]);
    expect(historyManager.getFuture()).toEqual([]);
  });

  it("添加历史记录后应正确存储并清空未来记录", () => {
    const historyManager = createHistoryManager();
    const state1 = { cells: { "0,0": { value: 1, notes: [] } }, meta: { timestamp: 1000 } };
    const state2 = { cells: { "0,1": { value: 2, notes: [] } }, meta: { timestamp: 2000 } };
    
    // 添加第一个状态
    historyManager.addHistory(state1);
    expect(historyManager.getPast()).toEqual([state1]);
    
    // 添加第二个状态
    historyManager.addHistory(state2);
    expect(historyManager.getPast()).toEqual([state1, state2]);
  });

  it("历史记录应遵循最大数量限制", () => {
    // 创建只能保存2条记录的历史管理器
    const historyManager = createHistoryManager({ maxHistorySize: 2 });
    
    const state1 = { cells: { "0,0": { value: 1, notes: [] } }, meta: { timestamp: 1000 } };
    const state2 = { cells: { "0,1": { value: 2, notes: [] } }, meta: { timestamp: 2000 } };
    const state3 = { cells: { "0,2": { value: 3, notes: [] } }, meta: { timestamp: 3000 } };
    
    // 添加三个状态，应该只保留最新的两个
    historyManager.addHistory(state1);
    historyManager.addHistory(state2);
    historyManager.addHistory(state3);
    
    expect(historyManager.getPast()).toEqual([state2, state3]);
    expect(historyManager.getPast().length).toBe(2);
  });

  it("preparePastNavigate应正确处理撤销操作", () => {
    const historyManager = createHistoryManager();
    
    const state1 = { cells: { "0,0": { value: 1, notes: [] } }, meta: { timestamp: 1000 } };
    const state2 = { cells: { "0,1": { value: 2, notes: [] } }, meta: { timestamp: 2000 } };
    const currentState = { cells: { "0,2": { value: 3, notes: [] } }, meta: { timestamp: 3000 } };
    
    // 添加历史记录
    historyManager.addHistory(state1);
    historyManager.addHistory(state2);
    
    // 执行撤销准备
    const previousState = historyManager.preparePastNavigate(currentState);
    
    // 验证结果
    expect(previousState).toEqual(state2);
    expect(historyManager.getPast()).toEqual([state1]);
    expect(historyManager.getFuture()).toEqual([currentState]);
  });

  it("prepareFutureNavigate应正确处理重做操作", () => {
    const historyManager = createHistoryManager();
    
    // 手动设置一个历史状态和一个未来状态
    const state1 = { cells: { "0,0": { value: 1, notes: [] } }, meta: { timestamp: 1000 } };
    const currentState = { cells: { "0,1": { value: 2, notes: [] } }, meta: { timestamp: 2000 } };
    const futureState = { cells: { "0,2": { value: 3, notes: [] } }, meta: { timestamp: 3000 } };
    
    // 添加历史记录
    historyManager.addHistory(state1);
    
    // 模拟已经执行过撤销，现在future中有记录
    const pastState = historyManager.preparePastNavigate(currentState);
    expect(historyManager.getFuture()).toEqual([currentState]);
    
    // 执行重做准备
    const nextState = historyManager.prepareFutureNavigate(state1);
    
    // 验证结果
    expect(nextState).toEqual(currentState);
    expect(historyManager.getPast()).toEqual([state1]);
    expect(historyManager.getFuture()).toEqual([]);
  });

  it("清空历史记录后应恢复初始状态", () => {
    const historyManager = createHistoryManager();
    
    // 添加一些记录
    historyManager.addHistory({ cells: { "0,0": { value: 1, notes: [] } }, meta: { timestamp: 1000 } });
    historyManager.addHistory({ cells: { "0,1": { value: 2, notes: [] } }, meta: { timestamp: 2000 } });
    
    // 清空记录
    historyManager.clear();
    
    // 验证结果
    expect(historyManager.getPast()).toEqual([]);
    expect(historyManager.getFuture()).toEqual([]);
  });

  it("对空历史栈执行撤销应返回null", () => {
    const historyManager = createHistoryManager();
    const currentState = { cells: { "0,0": { value: 1, notes: [] } }, meta: { timestamp: 1000 } };
    
    const result = historyManager.preparePastNavigate(currentState);
    
    expect(result).toBeNull();
    expect(historyManager.getFuture()).toEqual([]);
  });

  it("对空未来栈执行重做应返回null", () => {
    const historyManager = createHistoryManager();
    const currentState = { cells: { "0,0": { value: 1, notes: [] } }, meta: { timestamp: 1000 } };
    
    const result = historyManager.prepareFutureNavigate(currentState);
    
    expect(result).toBeNull();
    expect(historyManager.getPast()).toEqual([]);
  });
}); 