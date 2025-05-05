/**
 * @fileoverview 网格转换相关的纯函数
 * 提供网格的导入导出、序列化和压缩等功能
 */

import { CoreLoggers } from "../logger";
import type { Grid, MinimalState } from "../types";
import { cloneGrid } from "./create";

const logger = CoreLoggers.grid;

/**
 * 将网格导出为最小状态表示（仅包含用户修改的单元格）
 *
 * @param grid 网格数据
 * @returns 最小化状态
 */
export function exportGridState(grid: Grid): MinimalState {
  logger.debug(`导出网格状态：尺寸 ${grid.length}×${grid[0].length}`);
  const cells: Record<string, { value?: number; notes?: number[] }> = {};
  let cellCount = 0;

  // 遍历网格，收集有效数据（非空值和非空笔记）
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      const cell = grid[row][col];

      // 如果不是题目单元格
      if (!cell.isPuzzle) {
        const key = `${row},${col}`;
        const cellData: { value?: number; notes?: number[] } = {};

        // 如果有值，添加值
        if (cell.value !== 0) {
          cellData.value = cell.value;
        }

        // 如果有笔记，添加笔记
        if (cell.notes.size > 0) {
          cellData.notes = Array.from(cell.notes).sort((a, b) => a - b);
        }

        // 只有当有值或笔记时才添加到导出数据中
        if (
          cellData.value !== undefined ||
          (cellData.notes && cellData.notes.length > 0)
        ) {
          cells[key] = cellData;
          cellCount++;
        }
      }
    }
  }

  logger.info(`成功导出网格状态：包含 ${cellCount} 个已填写或有笔记的单元格`);

  return {
    cells,
    meta: {
      timestamp: Date.now(),
    },
  };
}

/**
 * 将最小状态导入到网格中
 *
 * @param grid 目标网格
 * @param state 最小化状态
 * @returns 更新后的网格副本
 */
export function importGridState(grid: Grid, state: MinimalState): Grid {
  const cellCount = Object.keys(state.cells).length;
  const timestamp = state.meta?.timestamp
    ? new Date(state.meta.timestamp).toLocaleString()
    : "未知";

  logger.debug(`导入网格状态：包含 ${cellCount} 个单元格，时间戳 ${timestamp}`);

  const newGrid = cloneGrid(grid);
  let appliedCount = 0;
  let skippedCount = 0;

  // 应用导入的状态
  for (const [key, cellData] of Object.entries(state.cells)) {
    const [row, col] = key.split(",").map(Number);

    // 检查坐标是否有效
    if (
      row >= 0 &&
      row < newGrid.length &&
      col >= 0 &&
      col < newGrid[0].length
    ) {
      const cell = newGrid[row][col];

      // 只修改非题目单元格
      if (!cell.isPuzzle) {
        // 设置值
        if (cellData.value !== undefined) {
          cell.value = cellData.value;
        }

        // 设置笔记
        if (cellData.notes && cellData.notes.length > 0) {
          cell.notes = new Set(cellData.notes);
        }

        appliedCount++;
      } else {
        skippedCount++;
        logger.debug(`跳过导入题目单元格 (${row}, ${col})`);
      }
    } else {
      skippedCount++;
      logger.warn(`导入坐标无效: (${row}, ${col})`);
    }
  }

  logger.info(
    `导入网格状态完成：已应用 ${appliedCount} 个单元格，跳过 ${skippedCount} 个`,
  );
  return newGrid;
}

/**
 * 计算网格的轻量级哈希表示，用于缓存键
 *
 * @param grid 网格数据
 * @returns 网格的字符串表示
 */
export function gridToHashKey(grid: Grid): string {
  logger.trace(`生成网格哈希键: 尺寸 ${grid.length}×${grid[0].length}`);

  // 生成紧凑的字符串表示
  const hashKey = grid
    .map((row) =>
      row
        .map((cell) => {
          if (cell.value !== 0) {
            return cell.value.toString();
          }
          if (cell.notes.size > 0) {
            return `n${Array.from(cell.notes).sort().join("")}`;
          }
          return "0";
        })
        .join(""),
    )
    .join("|");

  logger.trace(`网格哈希键长度: ${hashKey.length} 字符`);
  return hashKey;
}

/**
 * 生成网格的字符串表示（用于调试）
 *
 * @param grid 网格数据
 * @returns 网格的可读字符串表示
 */
export function gridToString(grid: Grid): string {
  const size = grid.length;
  logger.trace(`转换网格为字符串: 尺寸 ${size}×${size}`);

  // 增加保护：如果网格大小无效，返回空字符串
  if (size <= 0 || !grid[0] || grid[0].length !== size) {
    logger.warn("无法转换无效或空的网格为字符串");
    return "";
  }

  const lines: string[] = [];

  // 添加水平分隔线
  const createHorizontalLine = () => {
    // 确保 size * 2 - 1 不会是负数，虽然上面的检查已经覆盖了size=0的情况
    const repeatCount = Math.max(0, size * 2 - 1);
    return "+".concat("-".repeat(repeatCount)).concat("+");
  };

  lines.push(createHorizontalLine());

  // 添加每一行
  for (let row = 0; row < size; row++) {
    const rowStr = grid[row]
      .map((cell) => (cell.value === 0 ? "." : String(cell.value)))
      .join(" ");

    lines.push(`|${rowStr}|`);
  }

  lines.push(createHorizontalLine());

  return lines.join("\n");
}
