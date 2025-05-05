import type {
  CellPosition as CoreCellPosition,
  CellState as CoreCellState,
  Grid as CoreGrid,
} from "@/core/types/grid";
import type { Region, RegionType } from "@/core/types/region";
import { DifficultyLevel } from "@/core/types/solver";

// 重新导出核心类型
export type CellPosition = CoreCellPosition;
export type CellState = CoreCellState;
export type Grid = CoreGrid;

// 编辑模式类型
export type EditMode = "puzzle" | "solve";

// 笔记模式类型（简化为布尔值）
export type NoteMode = boolean;

// 单元格状态类型
export type CellStatus =
  | "normal"
  | "puzzle"
  | "valid"
  | "invalid"
  | "selected"
  | "related"
  | "sameValue";

// 宫格尺寸
export interface BoxDimensions {
  width: number;
  height: number;
}

// 导出其他类型
export type { Region, RegionType };
export { DifficultyLevel };

// 支持的网格尺寸
export const SUPPORTED_SIZES = [4, 6, 9, 16] as const;
export type SupportedSize = (typeof SUPPORTED_SIZES)[number];
