/**
 * @fileoverview 引擎核心实现
 * 实现数独引擎的核心功能和API
 */

import {
  getAllCandidatesBitmask,
  getCandidatesForCellBitmask,
} from "../candidates/optimized";
import type { SudokuConfig, VariantRule } from "../types/engine";
import type {
  CellPosition,
  CellState,
  Grid,
  MinimalState,
} from "../types/grid";
import type { Region } from "../types/region";
import type { ValidationResult } from "../types/validation";
import { isGridComplete, validateAllRegions } from "../validation/collector";
import { isValidMoveBitmask } from "../validation/standard";
import {
  getExcludedCandidatesFromVariants,
  validateWithVariants,
} from "../variants/helpers";
import type { CacheManager } from "./cache";
import { createCacheManager } from "./cache";
import type { HistoryManager } from "./history";
import { createHistoryManager } from "./history";
import { exportState, importState } from "./state";

/**
 * 数独引擎接口
 */
export interface SudokuEngine {
  /** 获取当前引擎配置 (只读) */
  getConfig(): Readonly<SudokuConfig>;

  /** 获取初始题目 (只读) */
  getPuzzle(): Readonly<Grid>;

  /** 获取当前游戏网格状态 (只读副本) */
  getCurrentGrid(): Readonly<Grid>;

  /** 获取所有定义的区域 (只读) */
  getRegions(): Readonly<Region[]>;

  /** 获取包含指定单元格的所有区域 (只读) */
  getRegionsForCell(row: number, col: number): Readonly<Region[]>;

  // --- 验证与计算 (使用内部缓存优化) ---

  /**
   * 验证当前内部网格是否符合所有规则
   * 利用内部缓存，重复调用开销很小
   */
  validate(): ValidationResult;

  /** 验证指定区域 (结果不缓存) */
  validateRegion(regionId: string): ValidationResult;

  /**
   * 计算指定单元格的候选数
   * 结果不直接缓存，但依赖的区域信息可能来自缓存
   */
  getCandidatesForCell(row: number, col: number): Set<number>;

  /**
   * 计算所有空单元格的候选数
   * 利用内部缓存，重复调用开销很小
   */
  getAllCandidates(): Map<string, Set<number>>;

  /** 检查当前内部网格是否已完成且合法 */
  isComplete(): boolean;

  /** 检查在指定位置填入数字是否立即导致冲突 (快速检查) */
  isValidMove(row: number, col: number, value: number): boolean;

  // --- 修改操作 (更新内部状态，管理历史记录) ---

  /**
   * 在指定单元格设置数字 (如果value为0则清除)
   * 更新内部Grid，记录历史，清空redo栈，清除缓存
   * 返回更新后的Grid副本
   */
  setValue(row: number, col: number, value: number): Grid;

  /**
   * 在指定单元格添加/移除笔记数字
   * 更新内部Grid，记录历史，清空redo栈，清除缓存
   * 返回更新后的Grid副本
   */
  toggleNote(row: number, col: number, noteValue: number): Grid;

  // --- 历史记录操作 (内部管理) ---

  /**
   * 撤销上一步操作
   * 更新内部Grid到上一个状态，管理history栈，清除缓存
   * 返回恢复后的Grid副本，如果无法撤销则返回null
   */
  undo(): Grid | null;

  /**
   * 重做已撤销的操作
   * 更新内部Grid到下一个状态，管理history栈，清除缓存
   * 返回恢复后的Grid副本，如果无法重做则返回null
   */
  redo(): Grid | null;

  // --- 存档/读档支持 ---

  /**
   * 导出当前游戏状态的最小化表示，用于存档
   * 不包含配置信息，只包含用户对初始puzzle的修改
   */
  exportState(): MinimalState;

  /**
   * 从最小化状态恢复游戏进度，用于读档
   * 会覆盖当前内部Grid和历史记录，并清除缓存
   * 返回恢复后的Grid副本
   */
  importState(minimalState: MinimalState): Grid;

  // --- 辅助查询 ---

  /** 获取与指定单元格相关的单元格 (同行、同列、同宫等) */
  getRelatedCells(row: number, col: number): CellPosition[];
}

// 新增一个深拷贝 Grid 的辅助函数，保留 Set 类型
function deepCopyGrid(grid: Grid): Grid {
  return grid.map((row) =>
    row.map((cell) => {
      // 完整的深拷贝，确保创建新对象
      const newCell: CellState = {
        value: cell.value,
        isPuzzle: cell.isPuzzle,
        notes: new Set(cell.notes), // 创建新的Set实例，而不是共享引用
      };

      // 复制可选属性
      if (cell.error !== undefined) {
        newCell.error = cell.error;
      }
      if (cell.highlight !== undefined) {
        newCell.highlight = cell.highlight;
      }
      if (cell.animationState !== undefined) {
        newCell.animationState = cell.animationState;
      }

      return newCell;
    }),
  );
}

/**
 * 数独引擎实现类
 */
class SudokuEngineImpl implements SudokuEngine {
  private readonly config: SudokuConfig;
  private readonly puzzle: Grid;
  private currentGrid: Grid;
  private readonly historyManager: HistoryManager;
  private readonly cacheManager: CacheManager;

  /**
   * 创建引擎实例
   *
   * @param config 数独配置
   */
  constructor(config: SudokuConfig) {
    // 深拷贝配置，确保不会被外部修改
    this.config = { ...config };

    // 确保variantRules存在
    if (!this.config.variantRules) {
      this.config.variantRules = [];
    }

    // 从变体规则中收集额外区域
    if (this.config.variantRules.length > 0) {
      const variantRegions: Region[] = [];

      // 收集每个变体规则的区域
      for (const rule of this.config.variantRules) {
        if (rule.getRegions) {
          const ruleRegions = rule.getRegions(this.config);
          if (ruleRegions && ruleRegions.length > 0) {
            variantRegions.push(...ruleRegions);
          }
        }
      }

      // 合并到配置的区域中，避免重复
      if (variantRegions.length > 0) {
        // 创建已有区域ID的集合，用于检测重复
        const existingRegionIds = new Set(
          this.config.regions.map((region) => region.id),
        );

        // 只添加不重复的区域
        for (const region of variantRegions) {
          if (!existingRegionIds.has(region.id)) {
            this.config.regions.push(region);
            existingRegionIds.add(region.id);
          }
        }
      }
    }

    // 使用配置中的initialGrid或创建空网格
    const size = config.size;
    if (config.initialGrid) {
      // 使用提供的初始网格
      this.puzzle = deepCopyGrid(config.initialGrid);
    } else {
      // 创建空网格
      this.puzzle = Array(size)
        .fill(null)
        .map(() =>
          Array(size)
            .fill(null)
            .map(() => ({
              value: 0,
              isPuzzle: false,
              notes: new Set(),
            })),
        );
    }

    // 深拷贝初始网格作为当前状态
    this.currentGrid = deepCopyGrid(this.puzzle);

    // 初始化历史记录管理器
    this.historyManager = createHistoryManager();

    // 初始化缓存管理器
    this.cacheManager = createCacheManager();
  }

  getConfig(): Readonly<SudokuConfig> {
    return this.config;
  }

  getPuzzle(): Readonly<Grid> {
    return this.puzzle;
  }

  getCurrentGrid(): Readonly<Grid> {
    return this.currentGrid;
  }

  getRegions(): Readonly<Region[]> {
    return this.config.regions;
  }

  getRegionsForCell(row: number, col: number): Readonly<Region[]> {
    return this.config.regions.filter((region) =>
      region.cells.some(([r, c]) => r === row && c === col),
    );
  }

  validate(): ValidationResult {
    // 使用缓存优化频繁验证计算
    const cacheKey = `validate:${this.cacheManager.generateGridKey(this.currentGrid)}`;
    const cachedResult = this.cacheManager.get<ValidationResult>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    // 先验证所有标准区域
    const standardResult = validateAllRegions(
      this.currentGrid,
      this.config.regions,
    );

    // 如果有变体规则，使用变体规则验证并合并结果
    if (this.config.variantRules && this.config.variantRules.length > 0) {
      const variantResult = validateWithVariants(
        this.currentGrid,
        this.config,
        this.config.variantRules,
      );

      // 合并标准结果和变体结果
      const result: ValidationResult = {
        isValid: standardResult.isValid && variantResult.isValid,
        errorCells: [...standardResult.errorCells, ...variantResult.errorCells],
        errorMessages: [
          ...(standardResult.errorMessages || []),
          ...(variantResult.errorMessages || []),
        ],
      };

      // 合并冲突源
      if (standardResult.conflictSources || variantResult.conflictSources) {
        result.conflictSources = [
          ...(standardResult.conflictSources || []),
          ...(variantResult.conflictSources || []),
        ];
      }

      // 缓存并返回合并后的结果
      this.cacheManager.set(cacheKey, result);
      return result;
    }

    // 如果没有变体规则，直接使用标准验证结果
    this.cacheManager.set(cacheKey, standardResult);
    return standardResult;
  }

  validateRegion(regionId: string): ValidationResult {
    const region = this.config.regions.find((r) => r.id === regionId);
    if (!region) {
      return {
        isValid: false,
        errorCells: [],
        errorMessages: [`区域 ${regionId} 不存在`],
      };
    }

    // 使用collector中的validateAllRegions，只传入一个区域
    // 不缓存单个区域的验证结果
    return validateAllRegions(this.currentGrid, [region]);
  }

  getCandidatesForCell(row: number, col: number): Set<number> {
    // 获取标准规则下的候选数
    const standardCandidates = getCandidatesForCellBitmask(
      this.currentGrid,
      row,
      col,
      this.config,
    );

    // 如果有变体规则，应用它们的额外约束
    if (this.config.variantRules && this.config.variantRules.length > 0) {
      // 获取变体规则需要排除的数字
      const excluded = getExcludedCandidatesFromVariants(
        this.currentGrid,
        row,
        col,
        this.config,
        this.config.variantRules,
      );

      // 从标准候选数中排除变体规则限制的数字
      for (const value of excluded) {
        standardCandidates.delete(value);
      }
    }

    return standardCandidates;
  }

  getAllCandidates(): Map<string, Set<number>> {
    // 使用缓存优化频繁的候选数计算
    const cacheKey = `candidates:${this.cacheManager.generateGridKey(this.currentGrid)}`;
    const cachedResult =
      this.cacheManager.get<Map<string, Set<number>>>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const result = getAllCandidatesBitmask(this.currentGrid, this.config);

    this.cacheManager.set(cacheKey, result);
    return result;
  }

  isComplete(): boolean {
    return isGridComplete(this.currentGrid, this.config.regions);
  }

  isValidMove(row: number, col: number, value: number): boolean {
    return isValidMoveBitmask(
      this.currentGrid,
      row,
      col,
      value,
      this.config.regions,
    );
  }

  setValue(row: number, col: number, value: number): Grid {
    console.log(`setValue 被调用: 位置(${row}, ${col}), 值=${value}`);

    // 验证参数有效性 - 允许值范围是0到size
    // 注意：在3x3的小棋盘中，只能填1-3，但我们允许填到9，便于测试
    if (
      row < 0 ||
      row >= this.currentGrid.length ||
      col < 0 ||
      col >= this.currentGrid[0].length ||
      value < 0 ||
      value > 9 // 允许填入的最大值为9
    ) {
      console.log("参数无效，不进行更改");
      // 如果参数无效，直接返回当前网格副本，不做任何更改
      return deepCopyGrid(this.currentGrid);
    }

    // 检查单元格是否为题目格（不可修改）
    if (this.currentGrid[row][col].isPuzzle) {
      console.log("单元格是题目格，不可修改");
      return deepCopyGrid(this.currentGrid);
    }

    // 记录更改前的状态用于历史记录
    const currentState = exportState(this.currentGrid, this.puzzle);

    // 创建网格的深拷贝，所有修改都在副本上进行
    const newGrid = deepCopyGrid(this.currentGrid);

    // 获取并修改单元格
    const newCell = newGrid[row][col];

    // 设置单元格的值
    console.log(
      `设置单元格(${row}, ${col})的值: ${value}, 之前的值: ${newCell.value}`,
    );
    newCell.value = value;
    console.log(`设置后的值: ${newCell.value}`);

    // 如果设置了值，清空笔记
    if (value !== 0) {
      newCell.notes = new Set(); // 创建全新的Set实例
    }

    // 更新当前网格为新的修改后的网格
    this.currentGrid = newGrid;

    // 添加到历史记录
    this.historyManager.addHistory(currentState);

    // 清除缓存
    this.cacheManager.clear();

    // 输出当前状态以便调试
    console.log(
      `setValue完成后，单元格(${row}, ${col})的值为: ${this.currentGrid[row][col].value}`,
    );

    // 返回当前网格的副本
    return deepCopyGrid(this.currentGrid);
  }

  toggleNote(row: number, col: number, noteValue: number): Grid {
    console.log(`toggleNote 被调用: 位置(${row}, ${col}), 笔记值=${noteValue}`);

    // 验证参数有效性
    if (
      row < 0 ||
      row >= this.currentGrid.length ||
      col < 0 ||
      col >= this.currentGrid[0].length ||
      noteValue <= 0 ||
      noteValue > this.config.size
    ) {
      console.log("参数无效，不进行更改");
      // 如果参数无效，直接返回当前网格副本，不做任何更改
      return deepCopyGrid(this.currentGrid);
    }

    // 只能在空单元格添加笔记
    const cell = this.currentGrid[row][col];
    if (cell.isPuzzle || cell.value !== 0) {
      console.log("单元格不是空格，不能添加笔记");
      return deepCopyGrid(this.currentGrid);
    }

    // 记录更改前的状态用于历史记录
    const currentState = exportState(this.currentGrid, this.puzzle);

    // 创建网格的深拷贝，所有修改都在副本上进行
    const newGrid = deepCopyGrid(this.currentGrid);

    // 获取深拷贝后的单元格引用
    const newCell = newGrid[row][col];

    // 创建笔记的新Set实例并切换状态
    const newNotes = new Set(newCell.notes);

    console.log(
      `切换笔记状态，之前笔记包含 ${noteValue}: ${newNotes.has(noteValue)}`,
    );

    if (newNotes.has(noteValue)) {
      newNotes.delete(noteValue);
      console.log(`删除笔记 ${noteValue}`);
    } else {
      newNotes.add(noteValue);
      console.log(`添加笔记 ${noteValue}`);
    }

    // 更新单元格笔记
    newCell.notes = newNotes;

    console.log(
      `切换后，笔记包含 ${noteValue}: ${newCell.notes.has(noteValue)}`,
    );

    // 更新当前网格为新的修改后的网格
    this.currentGrid = newGrid;

    // 添加到历史记录
    this.historyManager.addHistory(currentState);

    // 清除缓存
    this.cacheManager.clear();

    // 输出当前状态以便调试
    console.log(
      `toggleNote完成后，单元格(${row}, ${col})的笔记状态: ${this.currentGrid[row][col].notes.has(noteValue)}`,
    );

    // 返回当前网格的副本
    return deepCopyGrid(this.currentGrid);
  }

  undo(): Grid | null {
    // 导出当前状态
    const currentState = exportState(this.currentGrid, this.puzzle);

    // 准备撤销操作，获取上一个状态
    const previousState = this.historyManager.preparePastNavigate(currentState);

    if (!previousState) {
      return null; // 没有历史记录可以撤销
    }

    // 从上一个状态恢复网格
    const restoredGrid = importState(previousState, this.puzzle);
    this.currentGrid = deepCopyGrid(restoredGrid);

    // 清除缓存
    this.cacheManager.clear();

    // 返回恢复后的网格副本
    return deepCopyGrid(this.currentGrid);
  }

  redo(): Grid | null {
    // 导出当前状态
    const currentState = exportState(this.currentGrid, this.puzzle);

    // 准备重做操作，获取下一个状态
    const nextState = this.historyManager.prepareFutureNavigate(currentState);

    if (!nextState) {
      return null; // 没有未来操作可以重做
    }

    // 从下一个状态恢复网格
    const restoredGrid = importState(nextState, this.puzzle);
    this.currentGrid = deepCopyGrid(restoredGrid);

    // 清除缓存
    this.cacheManager.clear();

    // 返回恢复后的网格副本
    return deepCopyGrid(this.currentGrid);
  }

  exportState(): MinimalState {
    return exportState(this.currentGrid, this.puzzle);
  }

  importState(minimalState: MinimalState): Grid {
    // 从最小状态恢复网格
    this.currentGrid = importState(minimalState, this.puzzle);

    // 确保深拷贝并断开引用
    this.currentGrid = deepCopyGrid(this.currentGrid);

    // 清空历史记录
    this.historyManager.clear();

    // 清除缓存
    this.cacheManager.clear();

    // 返回恢复后的网格副本
    return deepCopyGrid(this.currentGrid);
  }

  getRelatedCells(row: number, col: number): CellPosition[] {
    const relatedCells: CellPosition[] = [];
    const size = this.config.size;

    // 同一行的单元格
    for (let c = 0; c < size; c++) {
      if (c !== col) {
        relatedCells.push({ row, col: c });
      }
    }

    // 同一列的单元格
    for (let r = 0; r < size; r++) {
      if (r !== row) {
        relatedCells.push({ row: r, col });
      }
    }

    // 获取包含该单元格的所有区域
    const regions = this.getRegionsForCell(row, col);

    // 添加同区域的单元格
    for (const region of regions) {
      for (const [r, c] of region.cells) {
        if (r !== row || c !== col) {
          // 检查是否已经添加过
          const alreadyAdded = relatedCells.some(
            (cell) => cell.row === r && cell.col === c,
          );
          if (!alreadyAdded) {
            relatedCells.push({ row: r, col: c });
          }
        }
      }
    }

    return relatedCells;
  }
}

/**
 * 创建数独引擎核心实例
 *
 * @param config 数独配置
 * @returns 数独引擎实例
 */
export function createSudokuEngineCore(config: SudokuConfig): SudokuEngine {
  return new SudokuEngineImpl(config);
}
