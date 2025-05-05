/**
 * @fileoverview 数独解题器类型定义
 * 包含解题器回调、选项、统计信息和结果等类型定义
 */

import type { SudokuConfig } from "./engine";
import type { Grid } from "./grid";

/**
 * 难度级别枚举
 */
export enum DifficultyLevel {
  EASY = "easy", // 简单
  MEDIUM = "medium", // 中等
  HARD = "hard", // 困难
  EXPERT = "expert", // 专家
}

/**
 * 解题步骤信息
 * 表示解题器确定的一个单元格值
 */
export interface SolveStep {
  /** 行索引 */
  row: number;
  /** 列索引 */
  col: number;
  /** 确定的值 */
  value: number;
  /** 使用的技巧 (humanlike策略下可能有值) */
  technique?: string;
}

/**
 * 解题过程中找到一个解或步骤时的回调函数
 * @param type 回调类型: 'solution' (找到一个完整解), 'step' (确定一个单元格的值)
 * @param data 对应类型的数据: Grid (找到解时), SolveStep (确定步骤时)
 * @returns boolean 如果返回 false，则中断解题过程。不返回值或返回true表示继续解题过程。
 */
export type SolveCallback = (
  type: "solution" | "step",
  data: Grid | SolveStep,
) => boolean | undefined;

/**
 * 数独解题器选项
 */
export interface SolverOptions {
  /** 是否寻找所有解（默认仅寻找一个解） */
  findAllSolutions?: boolean;
  /** 最大解数量限制 (若 findAllSolutions 为 true) */
  maxSolutions?: number;
  /** 计算超时时间(毫秒) */
  timeoutMs?: number;
  /** 是否收集求解过程中的统计信息 */
  collectStats?: boolean;
  /** 求解过程回调函数 */
  onProgress?: SolveCallback;
  /** 求解策略，影响难度评估和步骤输出 */
  strategy?: "fastest" | "humanlike";
}

/**
 * 解题过程统计信息
 */
export interface SolverStats {
  /** 求解耗时(毫秒) */
  timeMs: number;
  /** 回溯次数 */
  backtracks: number;
  /** 分配值的次数 */
  assignments: number;
  /** 单元候选数计算次数 */
  candidateCalculations: number;
  /** 确定步骤数量 (仅在 humanlike 策略下有效) */
  steps: number;
  /** 应用的技巧统计 (仅在 humanlike 策略下有效) */
  techniques?: Record<string, number>;
}

/**
 * 解题器最终返回结果
 */
export interface SolverResult {
  /** 是否成功完成求解过程 (可能找到解，也可能超时或无解) */
  success: boolean;
  /** 找到的所有解 (依赖于 options.findAllSolutions) */
  solutions: Grid[];
  /** 解题过程统计信息 */
  stats?: SolverStats;
  /** 解题结束的原因: 'solved', 'no_solution', 'timeout', 'interrupted', 'interrupted_with_solution', 'error' */
  finishReason:
    | "solved"
    | "no_solution"
    | "timeout"
    | "interrupted"
    | "interrupted_with_solution"
    | "error";
  /** 如果 finishReason 是 'error' 或 'no_solution' (特定情况)，这里提供详细信息 */
  failReason?: string;
  /** 谜题的估计难度 (若成功求解) */
  difficulty?: DifficultyLevel;
}
