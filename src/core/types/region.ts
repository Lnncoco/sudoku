/**
 * @fileoverview 区域相关类型定义
 * 定义数独的区域、单元格关系和区域属性
 */

import type { CellPosition } from "./grid";

/**
 * 区域类型
 */
export type RegionType =
  | "row" // 标准行
  | "column" // 标准列
  | "block" // 标准宫
  | "diagonal" // 对角线
  | "cage" // 笼子(杀手数独)
  | "jigsaw" // 异形宫
  | "window" // 窗口
  | "custom"; // 自定义区域

/**
 * 区域接口，用于描述任意一组单元格集合
 */
export interface Region {
  /** 唯一标识符 */
  id: string;

  /** 区域类型 */
  type: RegionType;

  /** 单元格坐标列表 [row, col] */
  cells: Array<[number, number]>;

  /** 可选属性 */
  properties?: {
    /** 可选，用于杀手数独笼子的总和约束 */
    sum?: number;

    /** 可选，用于区域颜色标记 */
    color?: string;

    /** 可选，区域标签 */
    label?: string;

    /** 其他变体特定属性 */
    [key: string]: unknown;
  };
}

/**
 * 单元格间关系定义，支持连续数独、比较数独等
 */
export interface CellRelation {
  /** 唯一标识符 */
  id: string;

  /** 关系类型 */
  type: "consecutive" | "inequality" | "custom";

  /** 关系涉及的单元格 */
  cells: Array<[number, number]>;

  /** 关系运算符 */
  operator?: "<" | ">" | "=" | "≠" | "consecutive" | string;

  /** 可选的关系值 (如差值) */
  value?: number;

  /** 可选的附加属性 */
  properties?: {
    /** 视觉表示方式 */
    visual?: string;

    /** 其他关系特定属性 */
    [key: string]: unknown;
  };
}
