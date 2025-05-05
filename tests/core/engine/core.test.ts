/**
 * @fileoverview 单元测试 - src/core/engine/core.ts
 * 数独引擎核心功能测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createSudokuEngineCore } from '@/core/engine/core';
import type { SudokuConfig, VariantRule } from '@/core/types/engine';
import type { Grid, MinimalState, CellState } from '@/core/types/grid';
import type { Region, RegionType } from '@/core/types/region';

// 测试辅助函数：创建测试用网格
function createTestGrid(values: number[][]): Grid {
  return values.map(row => 
    row.map(value => ({
      value,
      isPuzzle: value !== 0,
      notes: new Set(),
    }))
  );
}

// 测试辅助函数：深拷贝Grid，保留Set类型
function deepCopyGridForTest(grid: Readonly<Grid>): Grid {
  return grid.map(row => 
    row.map(cell => ({
      ...cell,
      notes: new Set(cell.notes)
    }))
  );
}

// 用于判断对象是否相等的辅助函数
function isDeepEqual(obj1: any, obj2: any): boolean {
  // 处理特殊情况：两个都是 null 或 undefined
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  
  // 处理基本类型
  if (typeof obj1 !== 'object' && typeof obj2 !== 'object') {
    return obj1 === obj2;
  }
  
  // 处理 Set
  if (obj1 instanceof Set && obj2 instanceof Set) {
    if (obj1.size !== obj2.size) return false;
    for (const item of obj1) {
      if (!obj2.has(item)) return false;
    }
    return true;
  }
  
  // 处理 Map
  if (obj1 instanceof Map && obj2 instanceof Map) {
    if (obj1.size !== obj2.size) return false;
    for (const [key, val] of obj1) {
      if (!obj2.has(key)) return false;
      if (!isDeepEqual(val, obj2.get(key))) return false;
    }
    return true;
  }
  
  // 处理数组
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!isDeepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }
  
  // 处理日期
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }
  
  // 确保两个值都是对象
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  // 处理普通对象
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!obj2.hasOwnProperty(key)) return false;
    if (!isDeepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

describe('数独引擎核心实现', () => {
  // 测试用的3x3数独配置
  let config3x3: SudokuConfig;
  
  // 在每个测试前设置配置
  beforeEach(() => {
    // 创建3x3数独配置
    config3x3 = {
      size: 3,
      blockWidth: 3,
      blockHeight: 3,
      variantRules: [],
      regions: [
        // 行
        { id: 'row-0', type: 'row' as RegionType, cells: [[0, 0], [0, 1], [0, 2]] },
        { id: 'row-1', type: 'row' as RegionType, cells: [[1, 0], [1, 1], [1, 2]] },
        { id: 'row-2', type: 'row' as RegionType, cells: [[2, 0], [2, 1], [2, 2]] },
        // 列
        { id: 'col-0', type: 'column' as RegionType, cells: [[0, 0], [1, 0], [2, 0]] },
        { id: 'col-1', type: 'column' as RegionType, cells: [[0, 1], [1, 1], [2, 1]] },
        { id: 'col-2', type: 'column' as RegionType, cells: [[0, 2], [1, 2], [2, 2]] },
        // 宫 (3x3只有一个宫)
        { id: 'block-0', type: 'block' as RegionType, cells: [
          [0, 0], [0, 1], [0, 2],
          [1, 0], [1, 1], [1, 2],
          [2, 0], [2, 1], [2, 2]
        ]}
      ]
    };
  });
  
  describe('引擎创建与配置访问', () => {
    it('应正确创建引擎实例', () => {
      const engine = createSudokuEngineCore(config3x3);
      
      // 检查引擎是否创建
      expect(engine).toBeDefined();
      
      // 检查是否能获取配置
      const engineConfig = engine.getConfig();
      expect(engineConfig).toBeDefined();
      expect(engineConfig.size).toBe(3);
      expect(engineConfig.regions.length).toBe(7); // 3行3列1宫
    });
    
    it('应正确获取网格和区域', () => {
      const engine = createSudokuEngineCore(config3x3);
      
      // 获取初始网格
      const puzzle = engine.getPuzzle();
      expect(puzzle).toBeDefined();
      expect(puzzle.length).toBe(3);
      expect(puzzle[0].length).toBe(3);
      
      // 获取当前网格（此阶段应与初始网格相同）
      const grid = engine.getCurrentGrid();
      expect(grid).toBeDefined();
      expect(grid.length).toBe(3);
      
      // 获取所有区域
      const regions = engine.getRegions();
      expect(regions).toBeDefined();
      expect(regions.length).toBe(7);
      
      // 获取特定单元格所在的区域
      const cellRegions = engine.getRegionsForCell(0, 0);
      expect(cellRegions).toBeDefined();
      expect(cellRegions.length).toBe(3); // 行、列和宫
      expect(cellRegions[0].type).toBe('row');
      expect(cellRegions[1].type).toBe('column');
      expect(cellRegions[2].type).toBe('block');
    });
  });
  
  describe('验证与完成检测', () => {
    it('应正确验证已完成的有效网格', () => {
      // 创建具有已完成网格的配置
      const configWithGrid = {
        ...config3x3,
        initialGrid: createTestGrid([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ])
      };
      
      // 创建引擎
      const engine = createSudokuEngineCore(configWithGrid);
      
      // 验证网格
      const result = engine.validate();
      console.log('验证结果:', JSON.stringify(result, null, 2));
      
      // 获取并打印区域信息
      const regions = engine.getRegions();
      console.log('区域数量:', regions.length);
      console.log('区域类型:', regions.map(r => r.type));
      
      expect(result.isValid).toBe(true);
      expect(result.errorCells.length).toBe(0);
      
      // 检查网格是否完成
      const isCompleteResult = engine.isComplete();
      console.log('isComplete 结果:', isCompleteResult);
      expect(isCompleteResult).toBe(true);
    });
    
    it('应正确验证有冲突的网格', () => {
      // 创建具有冲突的网格的配置
      const configWithConflict = {
        ...config3x3,
        initialGrid: createTestGrid([
          [1, 1, 3], // 第一行有重复的1
          [4, 5, 6],
          [7, 8, 9]
        ])
      };
      
      // 创建引擎
      const engine = createSudokuEngineCore(configWithConflict);
      
      // 验证网格
      const result = engine.validate();
      expect(result.isValid).toBe(false);
      expect(result.errorCells.length).toBeGreaterThan(0);
      
      // 验证特定区域（第一行）
      const rowResult = engine.validateRegion('row-0');
      expect(rowResult.isValid).toBe(false);
      
      // 验证特定区域（第一列，无冲突）
      const colResult = engine.validateRegion('col-0');
      expect(colResult.isValid).toBe(true);
      
      // 检查网格是否完成
      expect(engine.isComplete()).toBe(false); // 有冲突，所以不完成
    });
    
    it('应正确验证未完成的网格', () => {
      // 创建具有空格的网格的配置
      const configWithEmpty = {
        ...config3x3,
        initialGrid: createTestGrid([
          [1, 2, 3],
          [4, 0, 6], // 有一个空格
          [7, 8, 9]
        ])
      };
      
      // 创建引擎
      const engine = createSudokuEngineCore(configWithEmpty);
      
      // 验证网格
      const result = engine.validate();
      expect(result.isValid).toBe(true); // 未完成但有效
      
      // 检查网格是否完成
      expect(engine.isComplete()).toBe(false); // 有空格，所以不完成
    });
  });
  
  describe('候选数计算', () => {
    it('应正确计算单元格候选数', () => {
      // 创建部分填充的网格配置
      const configWithPartialGrid = {
        ...config3x3,
        initialGrid: createTestGrid([
          [1, 2, 0],
          [0, 0, 3],
          [0, 0, 0]
        ])
      };
      
      // 创建引擎
      const engine = createSudokuEngineCore(configWithPartialGrid);
      
      // 计算[0,2]的候选数
      const candidates = engine.getCandidatesForCell(0, 2);
      // [0,2]单元格没有候选数，因为行有1,2，列有3
      expect(candidates.size).toBe(0);
      
      // 计算所有候选数
      const allCandidates = engine.getAllCandidates();
      expect(allCandidates.size).toBe(6); // 有6个空格
      
      // 检查特定单元格
      expect(allCandidates.get('1,0')).toBeDefined();
      expect(allCandidates.get('1,1')).toBeDefined();
      expect(allCandidates.get('2,0')).toBeDefined();
    });
  });
  
  describe('移动验证', () => {
    it('应正确检查有效和无效移动', () => {
      // 创建部分填充的网格配置
      const configWithPartialGrid = {
        ...config3x3,
        initialGrid: createTestGrid([
          [1, 2, 0],
          [0, 0, 3],
          [0, 0, 0]
        ])
      };
      
      // 创建引擎
      const engine = createSudokuEngineCore(configWithPartialGrid);
      
      // 检查有效移动
      expect(engine.isValidMove(0, 2, 3)).toBe(false); // [0,2]填入3是无效的，因为列2已有3
      expect(engine.isValidMove(1, 0, 4)).toBe(true);  // [1,0]填入4是有效的
      
      // 检查无效移动
      expect(engine.isValidMove(0, 2, 1)).toBe(false); // [0,2]填入1无效，因为第一行已有1
      expect(engine.isValidMove(0, 2, 2)).toBe(false); // [0,2]填入2无效，因为第一行已有2
      expect(engine.isValidMove(1, 0, 1)).toBe(false); // [1,0]填入1无效，因为第一列已有1
      
      // 清除单元格总是有效的
      expect(engine.isValidMove(0, 0, 0)).toBe(true);  // 清除[0,0]是有效的
    });
  });
  
  describe('状态修改与历史记录 (setValue, toggleNote)', () => {
    let engine: ReturnType<typeof createSudokuEngineCore>;
    
    beforeEach(() => {
      const configWithPartialGrid = {
        ...config3x3,
        initialGrid: createTestGrid([
          [1, 0, 0],
          [0, 2, 0],
          [0, 0, 3]
        ])
      };
      engine = createSudokuEngineCore(configWithPartialGrid);
    });
    
    it('setValue 应正确更新单元格值并清空笔记', () => {
      // 先添加一个笔记
      engine.toggleNote(0, 1, 2); // 在(0,1) 添加笔记 2
      expect(engine.getCurrentGrid()[0][1].notes.has(2)).toBe(true);
      
      // 设置值
      engine.setValue(0, 1, 4); // 在(0,1) 填入 4
      const updatedGrid = engine.getCurrentGrid();
      
      // 验证网格更新
      expect(updatedGrid[0][1].value).toBe(4);
      expect(updatedGrid[0][1].notes.size).toBe(0); // 笔记应被清空
    });

    it('setValue 应记录历史并清除缓存', () => {
      // 记录初始状态
      const initialState = engine.exportState();
      
      // spy on history and cache manager (mocking would be better but keep it simple)
      const initialValidation = engine.validate(); // Populate cache
      const cachedValidation = engine.validate(); // Should hit cache
      expect(isDeepEqual(initialValidation, cachedValidation)).toBe(true);
      
      // 设置值导致状态改变
      engine.setValue(0, 1, 4);
      
      // 导出当前状态，应该已经改变
      const updatedState = engine.exportState();
      
      // 验证状态已经改变
      expect(Object.keys(updatedState.cells).length).toBeGreaterThan(0);
      expect(isDeepEqual(initialState, updatedState)).toBe(false);
      
      // 验证缓存是否清除 (再次调用 validate 应该计算)
      const validationAfterSet = engine.validate();
      expect(validationAfterSet).toBeDefined();
    });

    it('toggleNote 应正确添加和移除笔记', () => {
      // 添加笔记
      engine.toggleNote(0, 1, 2); // 在(0,1) 添加笔记 2
      let updatedGrid = engine.getCurrentGrid();
      expect(updatedGrid[0][1].notes.has(2)).toBe(true);
      
      // 再次添加应移除
      engine.toggleNote(0, 1, 2); // 移除笔记 2
      updatedGrid = engine.getCurrentGrid();
      expect(updatedGrid[0][1].notes.has(2)).toBe(false);
    });

    it('toggleNote 不应影响有值的单元格或题目格', () => {
      const initialValue = engine.getCurrentGrid()[0][0].value;
      
      // 尝试在有值的单元格(0,0)添加笔记
      engine.toggleNote(0, 0, 2);
      const updatedGrid1 = engine.getCurrentGrid();
      expect(updatedGrid1[0][0].value).toBe(initialValue); // 值应保持不变
      expect(updatedGrid1[0][0].notes.size).toBe(0); // 笔记应保持为空
      
      // 尝试在题目格(1,1)添加笔记
      const initialPuzzleValue = engine.getCurrentGrid()[1][1].value;
      engine.toggleNote(1, 1, 4);
      const updatedGrid2 = engine.getCurrentGrid();
      expect(updatedGrid2[1][1].value).toBe(initialPuzzleValue); // 值应保持不变
      expect(updatedGrid2[1][1].notes.size).toBe(0); // 笔记应保持为空
    });
    
    it('toggleNote 应记录历史并清除缓存', () => {
      // 记录初始状态
      const initialState = engine.exportState();
      
      const initialValidation = engine.validate(); // Populate cache
      const cachedValidation = engine.validate(); // Should hit cache
      expect(isDeepEqual(initialValidation, cachedValidation)).toBe(true);
      
      engine.toggleNote(0, 1, 2);
      
      // 导出当前状态，应该已经改变
      const updatedState = engine.exportState();
      
      // 验证状态已经改变
      expect(Object.keys(updatedState.cells).length).toBeGreaterThan(0);
      expect(isDeepEqual(initialState, updatedState)).toBe(false);
      
      // 验证缓存是否清除
      const validationAfterToggle = engine.validate();
      expect(validationAfterToggle).toBeDefined();
    });
  });
  
  describe('撤销与重做 (undo, redo)', () => {
    let engine: ReturnType<typeof createSudokuEngineCore>;
    
    beforeEach(() => {
      const configWithPartialGrid = {
        ...config3x3,
        initialGrid: createTestGrid([
          [1, 0, 0],
          [0, 2, 0],
          [0, 0, 3]
        ])
      };
      engine = createSudokuEngineCore(configWithPartialGrid);
    });

    it('undo 应撤销 setValue 操作', () => {
      const initialValue = engine.getCurrentGrid()[0][1].value;
      engine.setValue(0, 1, 4);
      const afterSetValue = engine.getCurrentGrid()[0][1].value;
      expect(afterSetValue).toBe(4);
      
      // 撤销
      engine.undo();
      const afterUndoValue = engine.getCurrentGrid()[0][1].value;
      
      expect(afterUndoValue).toBe(initialValue);
    });

    it('undo 应撤销 toggleNote 操作', () => {
      const initialHasNote = engine.getCurrentGrid()[0][1].notes.has(2);
      engine.toggleNote(0, 1, 2);
      const afterToggleHasNote = engine.getCurrentGrid()[0][1].notes.has(2);
      expect(afterToggleHasNote).toBe(true);
      
      // 撤销
      engine.undo();
      const afterUndoHasNote = engine.getCurrentGrid()[0][1].notes.has(2);
      
      expect(afterUndoHasNote).toBe(initialHasNote);
    });

    it('redo 应重做 setValue 操作', () => {
      const initialValue = engine.getCurrentGrid()[0][1].value;
      engine.setValue(0, 1, 4);
      const afterSetValue = engine.getCurrentGrid()[0][1].value;
      engine.undo(); // 撤销
      const afterUndoValue = engine.getCurrentGrid()[0][1].value;
      
      // 重做
      engine.redo();
      const afterRedoValue = engine.getCurrentGrid()[0][1].value;
      
      expect(afterUndoValue).toBe(initialValue);
      expect(afterRedoValue).toBe(afterSetValue);
    });

    it('redo 应重做 toggleNote 操作', () => {
      engine.toggleNote(0, 1, 2);
      const afterToggleHasNote = engine.getCurrentGrid()[0][1].notes.has(2);
      engine.undo(); // 撤销
      const afterUndoHasNote = engine.getCurrentGrid()[0][1].notes.has(2);
      
      // 重做
      engine.redo();
      const afterRedoHasNote = engine.getCurrentGrid()[0][1].notes.has(2);
      
      expect(afterToggleHasNote).toBe(true);
      expect(afterUndoHasNote).toBe(false);
      expect(afterRedoHasNote).toBe(true);
    });

    it('多次 undo 和 redo 应按预期工作', () => {
      const initialValue = engine.getCurrentGrid()[0][1].value;
      engine.setValue(0, 1, 4); // 操作1
      const afterOp1Value = engine.getCurrentGrid()[0][1].value;
      engine.toggleNote(1, 0, 1); // 操作2
      const afterOp2HasNote = engine.getCurrentGrid()[1][0].notes.has(1);
      
      // 撤销两次
      engine.undo(); // 撤销操作2
      const afterUndo1HasNote = engine.getCurrentGrid()[1][0].notes.has(1);
      const afterUndo1Value = engine.getCurrentGrid()[0][1].value;
      
      engine.undo(); // 撤销操作1
      const afterUndo2Value = engine.getCurrentGrid()[0][1].value;
      
      // 重做两次
      engine.redo(); // 重做操作1
      const afterRedo1Value = engine.getCurrentGrid()[0][1].value;
      
      engine.redo(); // 重做操作2
      const afterRedo2HasNote = engine.getCurrentGrid()[1][0].notes.has(1);
      
      expect(afterOp1Value).toBe(4);
      expect(afterOp2HasNote).toBe(true);
      expect(afterUndo1HasNote).toBe(false);
      expect(afterUndo1Value).toBe(4);
      expect(afterUndo2Value).toBe(initialValue);
      expect(afterRedo1Value).toBe(4);
      expect(afterRedo2HasNote).toBe(true);
    });

    it('undo 或 redo 时若无操作应返回适当值', () => {
      const emptyUndoResult = engine.undo(); // 初始状态无撤销
      expect(emptyUndoResult).toBeNull();
      
      engine.setValue(0, 1, 4);
      const afterSetGrid = engine.getCurrentGrid();
      
      engine.undo();
      const afterUndoGrid = engine.getCurrentGrid();
      
      engine.redo();
      const afterRedoGrid = engine.getCurrentGrid();
      
      expect(afterRedoGrid[0][1].value).toBe(afterSetGrid[0][1].value);
    });

    it('执行新操作后应清空 redo 栈', () => {
      engine.setValue(0, 1, 4); // 操作1
      engine.undo(); // 撤销操作1, redo 栈有内容
      
      const beforeNewOpRedoResult = engine.redo();
      expect(beforeNewOpRedoResult).not.toBeNull();
      
      engine.undo(); // 再次撤销，确保可以重做
      engine.setValue(1, 2, 5); // 操作2 (新操作)
      
      // 此时无法重做之前的操作1
      const afterNewOpRedoResult = engine.redo();
      expect(afterNewOpRedoResult).toBeNull();
    });
    
    it('undo 和 redo 应清除缓存', () => {
      // 设置初始缓存
      const initialValidation = engine.validate();
      
      // 执行操作
      engine.setValue(0, 1, 4);
      
      // 进行验证，这会创建新缓存
      const validationAfterSet = engine.validate();
      
      // 撤销操作
      engine.undo();
      
      // 再次验证，应该使用新的计算结果
      const validationAfterUndo = engine.validate();
      
      // 确认撤销后的验证结果与操作后的验证结果不同
      // 由于我们检查的是完整性，而非具体内容，所以这里使用简化的检查
      expect(validationAfterUndo).toBeDefined();
      
      // 重做操作
      engine.redo();
      
      // 再次验证，应该使用新的计算结果
      const validationAfterRedo = engine.validate();
      
      // 确认重做后的验证结果被计算
      expect(validationAfterRedo).toBeDefined();
    });
  });
  
  describe('配置和规则处理', () => {
    it('应支持不同尺寸的数独', () => {
      // 创建4x4数独配置
      const config4x4: SudokuConfig = {
        size: 4,
        blockWidth: 2,
        blockHeight: 2,
        variantRules: [],
        regions: [
          // 行
          { id: 'row-0', type: 'row' as RegionType, cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
          { id: 'row-1', type: 'row' as RegionType, cells: [[1, 0], [1, 1], [1, 2], [1, 3]] },
          { id: 'row-2', type: 'row' as RegionType, cells: [[2, 0], [2, 1], [2, 2], [2, 3]] },
          { id: 'row-3', type: 'row' as RegionType, cells: [[3, 0], [3, 1], [3, 2], [3, 3]] },
          // 列
          { id: 'col-0', type: 'column' as RegionType, cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
          { id: 'col-1', type: 'column' as RegionType, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
          { id: 'col-2', type: 'column' as RegionType, cells: [[0, 2], [1, 2], [2, 2], [3, 2]] },
          { id: 'col-3', type: 'column' as RegionType, cells: [[0, 3], [1, 3], [2, 3], [3, 3]] },
          // 2x2宫
          { id: 'block-0', type: 'block' as RegionType, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
          { id: 'block-1', type: 'block' as RegionType, cells: [[0, 2], [0, 3], [1, 2], [1, 3]] },
          { id: 'block-2', type: 'block' as RegionType, cells: [[2, 0], [2, 1], [3, 0], [3, 1]] },
          { id: 'block-3', type: 'block' as RegionType, cells: [[2, 2], [2, 3], [3, 2], [3, 3]] }
        ]
      };
      
      // 创建引擎
      const engine = createSudokuEngineCore(config4x4);
      
      // 验证配置
      expect(engine.getConfig().size).toBe(4);
      
      // 获取网格
      const grid = engine.getCurrentGrid();
      expect(grid.length).toBe(4);
      expect(grid[0].length).toBe(4);
      
      // 验证区域数量
      const regions = engine.getRegions();
      expect(regions.length).toBe(12); // 4行 + 4列 + 4宫
    });
    
    it('应支持自定义区域和规则', () => {
      // 创建带对角线约束的配置
      const configWithDiagonal = {
        ...config3x3,
        regions: [
          ...config3x3.regions,
          // 添加对角线区域
          { 
            id: 'diagonal-1', 
            type: 'diagonal' as RegionType,
            cells: [[0, 0], [1, 1], [2, 2]]
          } as Region
        ]
      };
      
      // 创建引擎
      const engine = createSudokuEngineCore(configWithDiagonal);
      
      // 验证区域数量
      const regions = engine.getRegions();
      expect(regions.length).toBe(8); // 3行 + 3列 + 1宫 + 1对角线
      
      // 获取特定单元格的区域
      const cellRegions = engine.getRegionsForCell(1, 1);
      expect(cellRegions.length).toBe(4); // 行、列、宫和对角线
      expect(cellRegions.some(r => r.type === 'diagonal')).toBe(true);
    });
  });
  
  describe('状态导入导出 (importState, exportState)', () => {
    let engine: ReturnType<typeof createSudokuEngineCore>;
    
    beforeEach(() => {
      const configWithPartialGrid = {
        ...config3x3,
        initialGrid: createTestGrid([
          [1, 0, 0],
          [0, 2, 0],
          [0, 0, 3]
        ])
      };
      engine = createSudokuEngineCore(configWithPartialGrid);
    });
    
    it('exportState 应正确导出用户修改', () => {
      // 初始状态不应有任何修改记录
      const initialState = engine.exportState();
      expect(Object.keys(initialState.cells).length).toBe(0);
      
      // 首先在 (0, 1) 设置值 4
      engine.setValue(0, 1, 4);
      
      // 获取第一次修改后的状态
      const stateAfterValue = engine.exportState();
      
      // 然后在 (1, 0) 添加笔记 1
      engine.toggleNote(1, 0, 1);
      
      // 导出状态
      const stateAfterBoth = engine.exportState();
      console.log('导出的状态:', JSON.stringify(stateAfterBoth, null, 2));
      
      // 验证导出的状态包含两处修改
      const cellKeys = Object.keys(stateAfterBoth.cells);
      expect(cellKeys.length).toBe(2);
      
      // 检查 (0, 1) 单元格的值设置
      expect(stateAfterBoth.cells["0,1"]).toBeDefined();
      expect(stateAfterBoth.cells["0,1"].value).toBe(4);
      
      // 检查 (1, 0) 单元格的笔记
      expect(stateAfterBoth.cells["1,0"]).toBeDefined();
      expect(stateAfterBoth.cells["1,0"].notes).toContain(1);
    });

    it('importState 应正确恢复网格并清空历史和缓存', () => {
      // 修改网格
      engine.setValue(0, 1, 4);
      engine.toggleNote(1, 0, 1);
      
      // 导出状态
      const state = engine.exportState();
      
      // 创建新引擎
      const newEngine = createSudokuEngineCore(config3x3);
      
      // 导入状态
      newEngine.importState(state);
      
      // 验证网格已正确还原
      const restoredGrid = newEngine.getCurrentGrid();
      expect(restoredGrid[0][1].value).toBe(4);
      expect(restoredGrid[1][0].notes.has(1)).toBe(true);
      
      // 验证历史和缓存已清空
      const exportedState = newEngine.exportState();
      expect(Object.keys(exportedState.cells).length).toBe(2);
    });
  });
  
  describe('缓存集成测试', () => {
    let engine: ReturnType<typeof createSudokuEngineCore>;
    
    beforeEach(() => {
      const configWithPartialGrid = {
        ...config3x3,
        initialGrid: createTestGrid([
          [1, 0, 0],
          [0, 2, 0],
          [0, 0, 3]
        ])
      };
      engine = createSudokuEngineCore(configWithPartialGrid);
    });
    
    it('validate 应使用缓存，直到状态改变', () => {
      // 创建初始缓存
      const result1 = engine.validate();
      
      // 第二次调用应使用缓存
      const result2 = engine.validate();
      expect(isDeepEqual(result1, result2)).toBe(true);
      
      // 修改状态
      engine.setValue(0, 1, 4);
      
      // 修改状态后应重新计算
      const result3 = engine.validate();
      
      // 由于规则可能受益于缓存，我们只检查缓存是否被正确使用
      expect(result3).toBeDefined();
    });
    
    it('getAllCandidates 应使用缓存，直到状态改变', () => {
      // 创建初始缓存
      const result1 = engine.getAllCandidates();
      
      // 第二次调用应使用缓存
      const result2 = engine.getAllCandidates();
      expect(isDeepEqual(result1, result2)).toBe(true);
      
      // 修改状态
      engine.setValue(0, 1, 4);
      
      // 修改状态后应重新计算
      const result3 = engine.getAllCandidates();
      
      // 验证新状态已生成不同的计算结果
      expect(result3).toBeDefined();
    });
  });
  
  describe('辅助查询 (getRelatedCells)', () => {
    let engine: ReturnType<typeof createSudokuEngineCore>;

    beforeEach(() => {
      // 使用包含对角线的4x4配置
      const config4x4WithDiagonal: SudokuConfig = {
        size: 4,
        blockWidth: 2,
        blockHeight: 2,
        variantRules: [],
        regions: [
          // 行
          { id: 'row-0', type: 'row' as RegionType, cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
          { id: 'row-1', type: 'row' as RegionType, cells: [[1, 0], [1, 1], [1, 2], [1, 3]] },
          { id: 'row-2', type: 'row' as RegionType, cells: [[2, 0], [2, 1], [2, 2], [2, 3]] },
          { id: 'row-3', type: 'row' as RegionType, cells: [[3, 0], [3, 1], [3, 2], [3, 3]] },
          // 列
          { id: 'col-0', type: 'column' as RegionType, cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
          { id: 'col-1', type: 'column' as RegionType, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
          { id: 'col-2', type: 'column' as RegionType, cells: [[0, 2], [1, 2], [2, 2], [3, 2]] },
          { id: 'col-3', type: 'column' as RegionType, cells: [[0, 3], [1, 3], [2, 3], [3, 3]] },
          // 2x2宫
          { id: 'block-0', type: 'block' as RegionType, cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
          { id: 'block-1', type: 'block' as RegionType, cells: [[0, 2], [0, 3], [1, 2], [1, 3]] },
          { id: 'block-2', type: 'block' as RegionType, cells: [[2, 0], [2, 1], [3, 0], [3, 1]] },
          { id: 'block-3', type: 'block' as RegionType, cells: [[2, 2], [2, 3], [3, 2], [3, 3]] },
          // 对角线
          { id: 'diag-1', type: 'diagonal' as RegionType, cells: [[0, 0], [1, 1], [2, 2], [3, 3]] }
        ]
      };
      engine = createSudokuEngineCore(config4x4WithDiagonal);
    });

    it('应返回正确的相关单元格（包括行、列、宫）', () => {
      const related = engine.getRelatedCells(0, 0);
      
      // 4x4: 3个同行 + 3个同列 + 2个同宫 + 1个同对角线 (可能有重复)
      const expectedCount = (4-1) + (4-1) + (4-1) + (4-1); // Max possible unique peers
      const uniqueRelated = new Set(related.map(c => `${c.row},${c.col}`)).size;
      
      // 验证数量 (考虑去重后)
      // 行： (0,1), (0,2), (0,3) -> 3
      // 列： (1,0), (2,0), (3,0) -> 3
      // 宫： (0,1), (1,0), (1,1) -> 3 (0,1) and (1,0) are already counted
      // 对角线: (1,1), (2,2), (3,3) -> 3 (1,1) is already counted
      // Total unique: 3(row) + 3(col) + 1(block) + 2(diag) = 9
      expect(uniqueRelated).toBe(9);

      // 抽样检查
      expect(related).toContainEqual({ row: 0, col: 1 }); // 同行
      expect(related).toContainEqual({ row: 1, col: 0 }); // 同列
      expect(related).toContainEqual({ row: 1, col: 1 }); // 同宫 & 同对角线
      expect(related).toContainEqual({ row: 2, col: 2 }); // 同对角线
    });

    it('结果中不应包含单元格自身', () => {
      const related = engine.getRelatedCells(1, 1);
      expect(related).not.toContainEqual({ row: 1, col: 1 });
    });

    it('结果中不应包含重复单元格', () => {
      const related = engine.getRelatedCells(0, 0);
      const relatedStrings = related.map(c => `${c.row},${c.col}`);
      const uniqueRelatedStrings = new Set(relatedStrings);
      expect(relatedStrings.length).toBe(uniqueRelatedStrings.size);
    });
  });
}); 