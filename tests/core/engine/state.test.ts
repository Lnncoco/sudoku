/**
 * @fileoverview 状态管理模块测试
 * 验证数独状态的导入和导出功能
 */

import { describe, expect, it } from "vitest";
import { exportState, importState } from "../../../src/core/engine/state";
import type { Grid } from "../../../src/core/types/grid";

describe("状态管理模块", () => {
  it("导出状态应只包含用户修改的部分", () => {
    // 创建初始网格
    const initialGrid: Grid = [
      [
        { value: 1, isPuzzle: true, notes: new Set() },
        { value: 0, isPuzzle: false, notes: new Set() },
      ],
      [
        { value: 0, isPuzzle: false, notes: new Set() },
        { value: 2, isPuzzle: true, notes: new Set() },
      ],
    ];
    
    // 创建当前网格（用户已修改）
    const currentGrid: Grid = [
      [
        { value: 1, isPuzzle: true, notes: new Set() }, // 未修改
        { value: 3, isPuzzle: false, notes: new Set() }, // 修改了值
      ],
      [
        { value: 0, isPuzzle: false, notes: new Set([1, 2]) }, // 添加了笔记
        { value: 2, isPuzzle: true, notes: new Set() }, // 未修改
      ],
    ];
    
    // 导出状态
    const state = exportState(currentGrid, initialGrid);
    
    // 验证导出的状态
    expect(Object.keys(state.cells)).toHaveLength(2); // 只有两个单元格被修改
    expect(state.cells["0,1"]).toEqual({ value: 3, notes: [] }); // 修改了值，我们总是包含notes
    expect(state.cells["1,0"]).toEqual({ value: 0, notes: [1, 2] }); // 添加了笔记，我们总是包含value
    expect(state.cells["0,0"]).toBeUndefined(); // 未修改的单元格不应包含
    expect(state.cells["1,1"]).toBeUndefined(); // 未修改的单元格不应包含
    expect(state.meta).toBeDefined(); // 元数据应存在
    expect(state.meta?.timestamp).toBeTypeOf("number"); // 时间戳应该是数字
  });

  it("从导出状态恢复应得到正确的网格", () => {
    // 创建基础网格
    const baseGrid: Grid = [
      [
        { value: 1, isPuzzle: true, notes: new Set() },
        { value: 0, isPuzzle: false, notes: new Set() },
      ],
      [
        { value: 0, isPuzzle: false, notes: new Set() },
        { value: 2, isPuzzle: true, notes: new Set() },
      ],
    ];
    
    // 创建最小状态（模拟导出）
    const minimalState = {
      cells: {
        "0,1": { value: 3, notes: [] }, // 设置值
        "1,0": { value: 0, notes: [1, 2] }, // 添加笔记
      },
      meta: { timestamp: Date.now() },
    };
    
    // 从最小状态恢复网格
    const restoredGrid = importState(minimalState, baseGrid);
    
    // 验证恢复结果
    expect(restoredGrid[0][0].value).toBe(1); // 未修改
    expect(restoredGrid[0][1].value).toBe(3); // 修改了值
    expect(restoredGrid[1][0].value).toBe(0); // 值未修改
    expect(Array.from(restoredGrid[1][0].notes)).toEqual([1, 2]); // 添加了笔记
    expect(restoredGrid[1][1].value).toBe(2); // 未修改
    
    // 验证网格实例是新的（不修改原始网格）
    expect(restoredGrid).not.toBe(baseGrid);
  });

  it("导入状态后应保留原始笔记或值，如果没有指定", () => {
    // 创建基础网格
    const baseGrid: Grid = [
      [
        { value: 1, isPuzzle: true, notes: new Set([3, 4]) },
        { value: 5, isPuzzle: false, notes: new Set() },
      ],
    ];
    
    // 创建部分最小状态
    const minimalState = {
      cells: {
        "0,0": { value: 2, notes: [3, 4] }, // 只修改值，保留原始笔记
        "0,1": { value: 5, notes: [6, 7] }, // 只修改笔记，保留原始值
      },
      meta: { timestamp: Date.now() },
    };
    
    // 从最小状态恢复网格
    const restoredGrid = importState(minimalState, baseGrid);
    
    // 验证恢复结果
    expect(restoredGrid[0][0].value).toBe(2); // 值被修改
    expect(Array.from(restoredGrid[0][0].notes)).toEqual([3, 4]); // 笔记保持不变
    expect(restoredGrid[0][1].value).toBe(5); // 值保持不变
    expect(Array.from(restoredGrid[0][1].notes)).toEqual([6, 7]); // 笔记被修改
  });

  it("如果导入状态包含无效坐标，应忽略该坐标", () => {
    // 创建基础网格
    const baseGrid: Grid = [
      [
        { value: 0, isPuzzle: false, notes: new Set() },
      ],
    ];
    
    // 创建包含无效坐标的最小状态
    const minimalState = {
      cells: {
        "0,0": { value: 5, notes: [] }, // 有效坐标
        "1,0": { value: 6, notes: [] }, // 无效行
        "0,1": { value: 7, notes: [] }, // 无效列
        "-1,0": { value: 8, notes: [] }, // 负坐标
      },
      meta: { timestamp: Date.now() },
    };
    
    // 从最小状态恢复网格
    const restoredGrid = importState(minimalState, baseGrid);
    
    // 验证恢复结果
    expect(restoredGrid[0][0].value).toBe(5); // 有效坐标被应用
    expect(restoredGrid.length).toBe(1); // 网格大小不变
    expect(restoredGrid[0].length).toBe(1); // 网格大小不变
  });

  it("导出应正确处理笔记的差异比较", () => {
    // 创建不同笔记配置的网格
    const initialGrid: Grid = [
      [
        { value: 0, isPuzzle: false, notes: new Set([1, 2]) }, // 初始有笔记
        { value: 0, isPuzzle: false, notes: new Set([3, 4]) }, // 初始有不同笔记
        { value: 0, isPuzzle: false, notes: new Set() }, // 初始无笔记
      ],
    ];
    
    const currentGrid: Grid = [
      [
        { value: 0, isPuzzle: false, notes: new Set([1, 2]) }, // 未改变
        { value: 0, isPuzzle: false, notes: new Set([3, 5]) }, // 改变了一部分
        { value: 0, isPuzzle: false, notes: new Set([6]) }, // 添加了笔记
      ],
    ];
    
    // 导出状态
    const state = exportState(currentGrid, initialGrid);
    
    // 验证导出的状态
    expect(Object.keys(state.cells)).toHaveLength(2); // 只有两个单元格被修改
    expect(state.cells["0,0"]).toBeUndefined(); // 未修改
    expect(state.cells["0,1"]).toBeDefined(); // 修改了笔记
    expect(state.cells["0,1"].value).toBe(0); // 保留原值
    expect(state.cells["0,1"].notes).toEqual([3, 5]); // 新的笔记集合
    expect(state.cells["0,2"]).toBeDefined(); // 添加了笔记
    expect(state.cells["0,2"].value).toBe(0); // 保留原值
    expect(state.cells["0,2"].notes).toEqual([6]); // 新增的笔记
  });
}); 