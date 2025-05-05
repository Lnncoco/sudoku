import classNames from "classnames";
import { useMemo } from "react";
import type { CellPosition, CellState, CellStatus } from "../types";
import {
  getCellBackgroundClasses,
  getCellBorderClasses,
  getCellValueClasses,
  getDiagonalStyles,
} from "../utils/styleUtils";

interface SudokuCellProps {
  cellData: CellState;
  status: CellStatus;
  position: CellPosition;
  size: number;
  boxWidth: number;
  boxHeight: number;
  isRegularSudoku: boolean;
  enableDiagonal: boolean;
  candidates: number[];
  showCandidates: boolean;
  onClick: (row: number, col: number) => void;
}

/**
 * 数独单元格组件
 * 渲染单个数独单元格及其内容
 */
const SudokuCell = ({
  cellData,
  status,
  position,
  size,
  boxWidth,
  boxHeight,
  isRegularSudoku,
  enableDiagonal,
  candidates,
  showCandidates,
  onClick,
}: SudokuCellProps) => {
  const { row, col } = position;
  const { value, isPuzzle, notes, error } = cellData;

  // 确保notes是一个Set并转为数组
  const notesArray = useMemo(() => {
    // 防御性代码：确保笔记是一个有效的Set对象
    if (notes instanceof Set) {
      return Array.from(notes);
    }
    // 如果不是Set或者是null/undefined，返回空数组
    return [];
  }, [notes]);
  const hasNotes = notesArray.length > 0;

  // --- 样式计算 ---
  // 基础单元格类和边框样式
  const baseClasses =
    "flex items-center justify-center cursor-pointer transition-colors relative";
  const borderClasses = getCellBorderClasses(
    row,
    col,
    size,
    boxWidth,
    boxHeight,
  );

  // 背景样式 - 使用工具函数
  const backgroundClasses = getCellBackgroundClasses(status, !!error);

  // 单元格完整类名
  const cellClassNames = classNames(
    baseClasses,
    borderClasses,
    backgroundClasses,
  );

  // 数字样式 - 使用工具函数
  const valueClassNames = getCellValueClasses(status, !!error, !!isPuzzle);

  // 笔记和候选数样式
  const noteTextClass = "text-blue-500 font-normal";
  const candidateTextClass = "text-blue-400 font-normal";

  // 对角线样式 - 使用工具函数
  const diagonalStyles = getDiagonalStyles(row, col, size, !!enableDiagonal);

  // --- 笔记和候选数布局 ---

  // 渲染4x4特殊笔记布局
  const render4x4Notes = () => (
    <div className="grid grid-cols-2 grid-rows-2 w-full h-full p-0.5 text-xs pointer-events-none">
      {[1, 2, 3, 4].map((num) => (
        <div
          key={`note-${row}-${col}-${num}`}
          className={classNames("flex items-center justify-center", {
            "row-start-1 col-start-1": num === 1,
            "row-start-1 col-start-2": num === 2,
            "row-start-2 col-start-1": num === 3,
            "row-start-2 col-start-2": num === 4,
          })}
        >
          {notesArray.includes(num) && (
            <span className={noteTextClass}>{num}</span>
          )}
        </div>
      ))}
    </div>
  );

  // 渲染标准笔记布局
  const renderStandardNotes = () => {
    const cols = 3; // 使用3x3布局

    return (
      <div
        className="w-full h-full p-0.5 text-xs pointer-events-none"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${cols}, 1fr)`,
        }}
      >
        {Array.from({ length: Math.min(size, 9) }, (_, i) => i + 1).map(
          (num) => {
            const rowIndex = Math.floor((num - 1) / cols);
            const colIndex = (num - 1) % cols;

            return (
              <div
                key={`note-${row}-${col}-${num}`}
                style={{
                  gridRow: rowIndex + 1,
                  gridColumn: colIndex + 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {notesArray.includes(num) && (
                  <span className={noteTextClass}>{num}</span>
                )}
              </div>
            );
          },
        )}
      </div>
    );
  };

  // 渲染4x4特殊候选数布局
  const render4x4Candidates = () => (
    <div className="grid grid-cols-2 grid-rows-2 w-full h-full p-0.5 text-xs">
      {[1, 2, 3, 4].map((num) => (
        <div
          key={`candidate-${row}-${col}-${num}`}
          className={classNames("flex items-center justify-center", {
            "row-start-1 col-start-1": num === 1,
            "row-start-1 col-start-2": num === 2,
            "row-start-2 col-start-1": num === 3,
            "row-start-2 col-start-2": num === 4,
          })}
        >
          {candidates.includes(num) && (
            <span className={candidateTextClass}>{num}</span>
          )}
        </div>
      ))}
    </div>
  );

  // 渲染标准候选数布局
  const renderStandardCandidates = () => {
    const cols = 3; // 使用3x3布局

    return (
      <div
        className="w-full h-full p-0.5 text-xs"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${cols}, 1fr)`,
        }}
      >
        {Array.from({ length: Math.min(size, 9) }, (_, i) => i + 1).map(
          (num) => {
            const rowIndex = Math.floor((num - 1) / cols);
            const colIndex = (num - 1) % cols;

            return (
              <div
                key={`candidate-${row}-${col}-${num}`}
                style={{
                  gridRow: rowIndex + 1,
                  gridColumn: colIndex + 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {candidates.includes(num) && (
                  <span className={candidateTextClass}>{num}</span>
                )}
              </div>
            );
          },
        )}
      </div>
    );
  };

  // --- 主渲染逻辑 ---
  return (
    <div
      className={cellClassNames}
      onClick={() => onClick(row, col)}
      style={{ width: "100%", height: "100%" }}
    >
      {/* 对角线效果层 */}
      {enableDiagonal && (row === col || row + col === size - 1) && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={diagonalStyles}
        />
      )}

      {/* 内容层 */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {value > 0 ? (
          // 渲染数字
          <span className={valueClassNames}>{value}</span>
        ) : (
          // 渲染笔记或候选数
          <>
            {/* 角笔记 */}
            {hasNotes &&
              (size === 4 ? render4x4Notes() : renderStandardNotes())}

            {/* 候选数 */}
            {showCandidates &&
              !hasNotes &&
              (size === 4 ? render4x4Candidates() : renderStandardCandidates())}
          </>
        )}
      </div>
    </div>
  );
};

export default SudokuCell;
