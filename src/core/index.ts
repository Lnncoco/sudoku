/**
 * @fileoverview 数独核心模块入口
 * 导出所有核心模块的功能
 */

// 导出类型定义
import * as types from "./types";
export { types };

// 导出网格操作函数
export * from "./grid";

// 导出区域操作函数
export * from "./regions";

// 导出验证相关函数
export * from "./validation";

// 导出候选数计算函数
export * from "./candidates";

// 导出引擎相关函数
export * from "./engine";

// 导出变体规则
export * from "./variants";

// 导出日志功能
export * from "./logger";

// 导出预设配置
// export * from './presets'; // 暂未实现

// 导出解题器模块
export * as solvers from "./solvers";

// 导出生成器模块
export * as generators from "./generators";

// 注: 解题器和生成器模块现在位于 src/solvers 和 src/generators 目录中
// 不在核心模块中直接导出，需要单独导入使用
