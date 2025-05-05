/**
 * @fileoverview 引擎模块入口
 * 导出数独引擎的核心接口和工厂函数
 */

export type { SudokuEngine } from "./core";
export { createSudokuEngine } from "./factory";
export type { HistoryManager } from "./history";
export type { CacheManager } from "./cache";
export { exportState, importState } from "./state";
export { createStandardSudokuConfig } from "./standard";
