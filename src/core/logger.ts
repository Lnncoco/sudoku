/**
 * @fileoverview 数独核心模块的日志配置
 * 为core模块定制的日志管理，基于通用的logger工具
 */

import type { Logger as LoglevelLogger } from "loglevel";
import { getLogger } from "../utils/logger";
import type { LogLevel } from "../utils/logger";

// 使用loglevel的Logger类型
type Logger = LoglevelLogger;

/**
 * 核心模块各部分对应的日志记录器
 */
export const CoreLoggers = {
  // 网格操作相关日志
  grid: getLogger("core.grid"),

  // 区域操作相关日志
  regions: getLogger("core.regions"),

  // 验证相关日志
  validation: getLogger("core.validation"),

  // 候选数计算相关日志
  candidates: getLogger("core.candidates"),

  // 引擎相关日志
  engine: getLogger("core.engine"),

  // 变体规则相关日志
  variants: getLogger("core.variants"),

  // 解题器相关日志
  solvers: getLogger("core.solvers"),

  // 生成器相关日志
  generators: getLogger("core.generators"),

  // 根日志记录器
  root: getLogger("core"),

  /**
   * 按命名空间获取日志记录器
   * @param namespace 命名空间，例如: "solver:backtracking"
   * @returns 对应命名空间的日志记录器
   */
  get(namespace: string): Logger {
    const fullNamespace = `core.${namespace}`;
    return getLogger(fullNamespace);
  },
};

/**
 * 统一设置所有核心模块日志级别
 * @param level 日志级别
 */
export function setCoreLoggingLevel(level: LogLevel): void {
  for (const key of Object.keys(CoreLoggers)) {
    if (typeof CoreLoggers[key as keyof typeof CoreLoggers] !== "function") {
      (CoreLoggers[key as keyof typeof CoreLoggers] as Logger).setLevel(level);
    }
  }
}

export default CoreLoggers;
