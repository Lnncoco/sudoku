/**
 * @fileoverview 数独生成器类型定义
 * 包含生成器接口、选项和结果等类型
 */

import type { SudokuConfig } from "./engine";
import type { Grid } from "./grid";
import type { DifficultyLevel } from "./solver";

/**
 * 数独生成过程中的回调函数
 * @param phase 生成阶段: 'grid' (完整解), 'puzzle' (谜题)
 * @param data 当前阶段的网格数据
 * @returns 如果返回 false，则中断生成过程
 */
export type GeneratorCallback = (
  phase: "grid" | "puzzle",
  data: Grid,
) => boolean | undefined;

/**
 * 生成器选项配置
 */
export interface GeneratorOptions {
  /** 目标难度级别 */
  difficulty?: DifficultyLevel;

  /** 是否拥有唯一解 (默认为true) */
  uniqueSolution?: boolean;

  /** 最少给定数字数量 (保证谜题的最少初始数字) */
  minGivens?: number;

  /** 最多给定数字数量 (保证谜题的最多初始数字) */
  maxGivens?: number;

  /** 是否对称放置初始数字 (默认为false) */
  symmetrical?: boolean;

  /** 对称类型 (当symmetrical为true时有效) */
  symmetryType?: "rotational" | "mirror" | "diagonal";

  /** 生成超时时间(毫秒) */
  timeoutMs?: number;

  /** 生成过程回调 */
  onProgress?: GeneratorCallback;

  /** 随机种子 (用于生成可重现的谜题) */
  seed?: string;
}

/**
 * 生成器统计信息
 */
export interface GeneratorStats {
  /** 生成耗时(毫秒) */
  timeMs: number;

  /** 尝试的网格数量 */
  attempts: number;

  /** 生成的完整解数量 */
  fullGridsGenerated: number;

  /** 挖洞次数 */
  digAttempts: number;

  /** 回填次数 (验证唯一解时) */
  refillAttempts: number;
}

/**
 * 生成器结果
 */
export interface GeneratorResult {
  /** 生成是否成功 */
  success: boolean;

  /** 生成的谜题 */
  puzzle: Grid | null;

  /** 完整解 */
  solution: Grid | null;

  /** 统计信息 */
  stats: GeneratorStats;

  /** 结束原因 */
  finishReason: "success" | "timeout" | "interrupted" | "error" | "no_solution";

  /** 错误信息 (如果有) */
  errorMessage?: string;

  /** 给定数字数量 */
  givensCount?: number;

  /** 难度级别 */
  difficulty?: DifficultyLevel;
}
