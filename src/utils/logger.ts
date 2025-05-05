import dayjs from "dayjs";
import log from "loglevel";
// 重新引入 loglevel-plugin-prefix
import prefix from "loglevel-plugin-prefix";

// 日志级别类型
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

// 配置 loglevel-plugin-prefix
prefix.reg(log);
prefix.apply(log, {
  // 自定义格式化函数
  format(level, name, timestamp) {
    // 格式: LEVEL [TIME] [MODULE]:
    return `${level.padEnd(5)} [${timestamp}] [${name}]`;
  },
  // 级别格式化: 转大写并补齐空格
  levelFormatter(level) {
    return level.toUpperCase();
  },
  // 模块名格式化
  nameFormatter(name) {
    return name || "root";
  },
  // 时间戳格式化: HH:mm:ss
  timestampFormatter(date) {
    return dayjs(date).format("HH:mm:ss");
  },
});

// 默认设置为INFO级别
log.setDefaultLevel("info");

// 判断是否为开发环境，开发环境可以设置为更详细的级别
if (import.meta.env.DEV) {
  log.setLevel("debug");
}

/**
 * 获取指定模块的日志记录器
 * 返回原始的 loglevel 记录器实例以保留堆栈信息。
 * 格式化由 loglevel-plugin-prefix 处理。
 *
 * @param moduleName 模块名称
 * @returns 日志记录器对象 (loglevel.Logger)
 */
export function getLogger(moduleName: string): log.Logger {
  return log.getLogger(moduleName);
}

/**
 * 配置全局日志级别
 *
 * @param level 日志级别
 */
export function setGlobalLogLevel(level: LogLevel): void {
  log.setLevel(level);
}

/**
 * 获取当前全局日志级别
 *
 * @returns 当前的日志级别字符串
 */
export function getGlobalLogLevel(): LogLevel {
  const level = log.getLevel();
  // 将数字级别转换为字符串级别
  switch (level) {
    case 0:
      return "trace";
    case 1:
      return "debug";
    case 2:
      return "info";
    case 3:
      return "warn";
    case 4:
      return "error";
    default:
      return "info"; // 默认返回 info
  }
}

// 默认导出
export default {
  getLogger,
  setGlobalLogLevel,
  getGlobalLogLevel,
};
