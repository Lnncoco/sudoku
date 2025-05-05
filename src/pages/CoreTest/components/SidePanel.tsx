import { DifficultyLevel } from "@/core/types/solver";
import type React from "react";
import type { EditMode } from "../hooks/useSudokuCore";
import type { CellPosition, CellState } from "../types";

interface SidePanelProps {
  size: number;
  isValid: boolean;
  mode: EditMode;
  noteMode: boolean;
  enableDiagonal: boolean;
  selectedCell: CellPosition | null;
  cellState: CellState | null;
  difficulty: DifficultyLevel | "自定义";
}

/**
 * 侧边状态信息面板组件
 * 展示游戏状态、当前选择的单元格信息等
 */
const SidePanel: React.FC<SidePanelProps> = ({
  size,
  isValid,
  mode,
  noteMode,
  enableDiagonal,
  selectedCell,
  cellState,
  difficulty,
}) => {
  // 获取难度文本描述
  const getDifficultyText = () => {
    if (difficulty === "自定义") {
      return "自定义";
    }
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return "简单";
      case DifficultyLevel.MEDIUM:
        return "中等";
      case DifficultyLevel.HARD:
        return "困难";
      case DifficultyLevel.EXPERT:
        return "专家";
      default:
        console.warn("未知的难度级别:", difficulty);
        return "未知";
    }
  };

  return (
    <div className="bg-base-200 p-4 rounded-lg text-sm">
      <h3 className="font-semibold mb-2">游戏状态</h3>
      <div className="grid grid-cols-2 gap-1">
        <div className="text-gray-600">网格大小:</div>
        <div className="font-medium">
          {size}×{size}
        </div>

        <div className="text-gray-600">模式:</div>
        <div className="font-medium">
          {mode === "puzzle" ? "出题模式" : "解题模式"}
        </div>

        <div className="text-gray-600">笔记模式:</div>
        <div className="font-medium">{noteMode ? "已开启" : "已关闭"}</div>

        <div className="text-gray-600">对角线规则:</div>
        <div className="font-medium">
          {enableDiagonal ? "已启用" : "已禁用"}
        </div>

        <div className="text-gray-600">难度等级:</div>
        <div className="font-medium">{getDifficultyText()}</div>

        <div className="text-gray-600">网格状态:</div>
        <div
          className={`font-medium ${isValid ? "text-success" : "text-error"}`}
        >
          {isValid ? "有效" : "无效"}
        </div>
      </div>

      {selectedCell && cellState && (
        <div className="mt-3 border-t border-base-300 pt-2">
          <h3 className="font-semibold mb-2">选中单元格</h3>
          <div className="grid grid-cols-2 gap-1">
            <div className="text-gray-600">位置:</div>
            <div className="font-medium">
              ({selectedCell.row + 1}, {selectedCell.col + 1})
            </div>

            <div className="text-gray-600">当前值:</div>
            <div className="font-medium">{cellState.value || "无"}</div>

            <div className="text-gray-600">笔记:</div>
            <div className="font-medium">
              {cellState.notes.size > 0
                ? Array.from(cellState.notes)
                    .sort((a, b) => a - b)
                    .join(", ")
                : "无"}
            </div>

            <div className="text-gray-600">题目:</div>
            <div className="font-medium">
              {cellState.isPuzzle ? "是" : "否"}
            </div>

            <div className="text-gray-600">错误:</div>
            <div
              className={`font-medium ${cellState.error ? "text-error" : "text-success"}`}
            >
              {cellState.error ? "是" : "否"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidePanel;
