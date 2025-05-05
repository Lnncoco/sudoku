/**
 * @fileoverview 网格相关类型定义
 * 定义数独网格的基础类型，包括单元格状态和网格
 */

/**
 * 单元格的高亮类型
 */
export type HighlightType =
  | "selected" // 当前选中的单元格
  | "related-peer" // 与选中单元格相关的同行/同列/同宫的单元格
  | "related-value" // 与选中单元格值相同的单元格
  | "error" // 验证错误的单元格
  | "error-source" // 导致其他单元格错误的源头 (例如重复数字中的一个)
  | "region" // 特定区域高亮（如笼子等）
  | "hint"; // 提示高亮

/**
 * 单元格状态
 */
export interface CellState {
  /** 单元格的值，0表示空 */
  value: number;
  /** 是否为初始题目数字（只读） */
  isPuzzle: boolean;
  /** 用户笔记，与候选数区分 */
  notes: Set<number>;
  /** 标记当前单元格是否违反规则 */
  error?: boolean;
  /** 单元格的高亮类型 */
  highlight?: HighlightType;
  /** 用于控制数字输入或更新的动画效果 */
  animationState?: "changed" | "cleared";
}

/**
 * 单元格坐标位置
 */
export interface CellPosition {
  /** 行索引 */
  row: number;
  /** 列索引 */
  col: number;
}

/**
 * 数独网格，二维单元格数组
 */
export type Grid = CellState[][];

/**
 * 最小化状态，用于导入导出和历史记录
 */
export interface MinimalState {
  /** 存储单元格状态的记录，键为"row,col"格式 */
  cells: Record<string, { value?: number; notes?: number[] }>;
  /** 可选元数据，如时间戳等 */
  meta?: { timestamp: number; [key: string]: unknown };
}
