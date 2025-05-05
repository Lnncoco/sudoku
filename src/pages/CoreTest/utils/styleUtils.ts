import type { CellStatus, Grid } from "../types";
import { getCellKey } from "./boardUtils";

/**
 * 计算单元格边框样式类名
 * @param row 行
 * @param col 列
 * @param size 网格大小
 * @param boxWidth 宫格宽度
 * @param boxHeight 宫格高度
 * @returns 边框样式类名
 */
export function getCellBorderClasses(
  row: number,
  col: number,
  size: number,
  boxWidth: number,
  boxHeight: number,
): string {
  let borderStyles = "border-t border-l border-gray-300";

  // 右边框：如果是宫格的右边界且不是整个网格的最右列，加粗
  if ((col + 1) % boxWidth === 0 && col !== size - 1) {
    borderStyles += " border-r-2 border-r-gray-400";
  }

  // 下边框：如果是宫格的下边界且不是整个网格的最下行，加粗
  if ((row + 1) % boxHeight === 0 && row !== size - 1) {
    borderStyles += " border-b-2 border-b-gray-400";
  }

  return borderStyles;
}

/**
 * 计算单元格背景样式类名
 * @param status 单元格状态
 * @param error 是否有错误
 * @returns 背景样式类名
 */
export function getCellBackgroundClasses(
  status: CellStatus,
  error: boolean,
): string {
  // 优先级：错误 > 选中 > 相同值 > 相关 > 题目 > 正常
  if (error || status === "invalid") {
    return "bg-red-200";
  }

  switch (status) {
    case "selected":
      return "bg-blue-200/80";
    case "sameValue":
      return "bg-blue-100/80";
    case "related":
      return "bg-blue-50/60";
    case "puzzle":
      return "bg-gray-100";
    default:
      return "bg-white";
  }
}

/**
 * 计算单元格数字样式类名
 * @param status 单元格状态
 * @param error 是否有错误
 * @param isPuzzle 是否是题目
 * @returns 数字样式类名
 */
export function getCellValueClasses(
  status: CellStatus,
  error: boolean,
  isPuzzle: boolean,
): string {
  const classes = "flex items-center justify-center w-full h-full";

  // 错误单元格文字为红色
  if (error || status === "invalid") {
    return `${classes} text-red-700 text-lg font-medium`;
  }

  // 选中的非错误单元格文字为深蓝色
  if (status === "selected") {
    return `${classes} text-blue-800 text-lg font-medium`;
  }

  // 题目数字为黑色，更粗、更大
  if (isPuzzle) {
    return `${classes} text-gray-900 text-lg font-medium`;
  }

  // 用户输入为蓝色
  return `${classes} text-blue-700 text-lg font-medium`;
}

/**
 * 计算对角线样式
 * @param row 行
 * @param col 列
 * @param size 网格大小
 * @param enableDiagonal 是否启用对角线
 * @returns 对角线CSS样式对象
 */
export function getDiagonalStyles(
  row: number,
  col: number,
  size: number,
  enableDiagonal: boolean,
): React.CSSProperties {
  if (!enableDiagonal) {
    return {};
  }

  const isOnMainDiagonal = row === col;
  const isOnAntiDiagonal = row + col === size - 1;
  const styles: React.CSSProperties = {};

  // 仅在启用对角线规则时添加对角线样式
  if (isOnMainDiagonal && isOnAntiDiagonal) {
    // 同时在两条对角线上 - 显示十字虚线
    styles.backgroundImage = `
      linear-gradient(45deg, transparent calc(50% - 0.5px), rgba(107, 114, 128, 0.4) calc(50% - 0.5px), rgba(107, 114, 128, 0.4) calc(50% + 0.5px), transparent calc(50% + 0.5px)),
      linear-gradient(135deg, transparent calc(50% - 0.5px), rgba(107, 114, 128, 0.4) calc(50% - 0.5px), rgba(107, 114, 128, 0.4) calc(50% + 0.5px), transparent calc(50% + 0.5px))
    `;
  } else if (isOnMainDiagonal) {
    // 主对角线 - 从左上到右下
    styles.backgroundImage = `
      linear-gradient(45deg, transparent calc(50% - 0.5px), rgba(107, 114, 128, 0.4) calc(50% - 0.5px), rgba(107, 114, 128, 0.4) calc(50% + 0.5px), transparent calc(50% + 0.5px))
    `;
  } else if (isOnAntiDiagonal) {
    // 副对角线 - 从右上到左下
    styles.backgroundImage = `
      linear-gradient(135deg, transparent calc(50% - 0.5px), rgba(107, 114, 128, 0.4) calc(50% - 0.5px), rgba(107, 114, 128, 0.4) calc(50% + 0.5px), transparent calc(50% + 0.5px))
    `;
  }

  return styles;
}

/**
 * 计算单元格相关状态
 * @param grid 网格
 * @param selectedCell 选中的单元格
 * @param size 网格大小
 * @param boxWidth 宫格宽度
 * @param boxHeight 宫格高度
 * @param enableDiagonal 是否启用对角线
 * @returns 相关和相同值的单元格键集合
 */
export function calculateRelatedCells(
  grid: Grid,
  selectedCell: { row: number; col: number } | null,
  size: number,
  boxWidth: number,
  boxHeight: number,
  enableDiagonal: boolean,
): { relatedCells: Set<string>; sameValueCells: Set<string> } {
  const related = new Set<string>();
  const sameValue = new Set<string>();

  if (!selectedCell || !grid?.[selectedCell.row]?.[selectedCell.col]) {
    return { relatedCells: related, sameValueCells: sameValue };
  }

  const { row, col } = selectedCell;
  const selectedValue = grid[row]?.[col]?.value || 0;

  // 添加同行同列单元格
  for (let i = 0; i < size; i++) {
    if (i !== col) related.add(getCellKey(row, i));
    if (i !== row) related.add(getCellKey(i, col));
  }

  // 添加同一宫格内单元格
  const boxRowStart = Math.floor(row / boxHeight) * boxHeight;
  const boxColStart = Math.floor(col / boxWidth) * boxWidth;

  for (let r = boxRowStart; r < Math.min(boxRowStart + boxHeight, size); r++) {
    for (let c = boxColStart; c < Math.min(boxColStart + boxWidth, size); c++) {
      if (r !== row || c !== col) related.add(getCellKey(r, c));
    }
  }

  // 添加对角线单元格（如果启用）
  if (enableDiagonal) {
    // 主对角线
    if (row === col) {
      for (let i = 0; i < size; i++) {
        if (i !== row) related.add(getCellKey(i, i));
      }
    }
    // 副对角线
    if (row + col === size - 1) {
      for (let i = 0; i < size; i++) {
        if (i !== row) related.add(getCellKey(i, size - 1 - i));
      }
    }
  }

  // 添加相同值单元格
  if (selectedValue > 0) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r !== row || c !== col) && grid[r]?.[c]?.value === selectedValue) {
          sameValue.add(getCellKey(r, c));
        }
      }
    }
  }

  return { relatedCells: related, sameValueCells: sameValue };
}
