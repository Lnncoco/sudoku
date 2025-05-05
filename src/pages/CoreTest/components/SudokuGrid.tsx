import { useEffect, useMemo, useRef, useState } from "react";
import type { CellPosition, Grid } from "../types";
import { getCellKey } from "../utils/boardUtils";
import { calculateRelatedCells } from "../utils/styleUtils";
import SudokuCell from "./SudokuCell";

interface SudokuGridProps {
  gridData: Grid;
  size: number;
  boxWidth: number;
  boxHeight: number;
  enableDiagonal: boolean;
  isRegularSudoku: boolean;
  showCandidates: boolean;
  selectedCell: CellPosition | null;
  handleCellClick: (row: number, col: number) => void;
  candidates: Map<string, number[]>;
}

/**
 * 数独网格组件
 * 渲染整个数独网格和单元格
 */
const SudokuGrid = ({
  gridData,
  size,
  boxWidth,
  boxHeight,
  enableDiagonal,
  isRegularSudoku,
  showCandidates,
  selectedCell,
  handleCellClick,
  candidates,
}: SudokuGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState(0);

  // 安全检查 - 确保网格数据与大小匹配
  const safeGridData = useMemo(() => {
    if (!gridData || gridData.length !== size) {
      console.warn("Grid data size mismatch or missing");
      // 返回空网格
      return Array(size)
        .fill(null)
        .map(() =>
          Array(size)
            .fill(null)
            .map(() => ({
              value: 0,
              isPuzzle: false,
              notes: new Set<number>(),
              error: false,
            })),
        );
    }
    return gridData;
  }, [gridData, size]);

  // 监听容器大小变化
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // 获取容器宽度
        const containerWidth =
          containerRef.current.parentElement?.clientWidth || 0;
        // 获取容器高度约束 - 使用视窗高度的一部分
        const containerHeight = window.innerHeight * 0.65;
        // 取宽高中较小的值作为网格大小的基准，同时确保足够的空间
        const maxSize = Math.min(containerWidth * 0.95, containerHeight);
        setContainerSize(maxSize);
      }
    };

    // 初始调用一次
    handleResize();

    // 添加窗口大小变化监听
    window.addEventListener("resize", handleResize);

    // 清理函数
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 根据尺寸和容器大小计算网格大小
  const gridSize = useMemo(() => {
    // 如果容器大小可用，则使用容器大小，否则使用默认值
    if (containerSize > 0) {
      return containerSize;
    }

    // 默认值（当容器大小不可用时）
    if (size <= 4) return 280;
    if (size <= 6) return 320;
    if (size <= 9) return 360;
    return 400; // 大尺寸网格
  }, [size, containerSize]);

  // 计算每个单元格大小
  const cellSize = useMemo(() => {
    return Math.floor(gridSize / size);
  }, [gridSize, size]);

  // 根据选中单元格，计算相关单元格和相同值单元格
  const { relatedCells, sameValueCells } = useMemo(() => {
    return calculateRelatedCells(
      safeGridData,
      selectedCell,
      size,
      boxWidth,
      boxHeight,
      enableDiagonal,
    );
  }, [selectedCell, safeGridData, size, boxWidth, boxHeight, enableDiagonal]);

  // 计算每个单元格的状态
  const getCellStatus = (row: number, col: number) => {
    if (!safeGridData[row]?.[col]) return "normal";

    // 确保错误单元格优先显示为invalid状态
    if (safeGridData[row][col].error) {
      return "invalid";
    }

    // 其次检查是否为选中单元格
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      return "selected";
    }

    // 再检查是否为具有相同值的单元格
    const cellKey = getCellKey(row, col);
    if (sameValueCells.has(cellKey)) {
      return "sameValue";
    }

    // 然后检查是否为相关单元格
    if (relatedCells.has(cellKey)) {
      return "related";
    }

    // 最后检查是否为题目单元格
    if (safeGridData[row][col].isPuzzle) {
      return "puzzle";
    }

    return "normal";
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex justify-center items-center my-4"
    >
      <div
        className="bg-white rounded-md overflow-hidden mx-auto relative shadow-[0_0_10px_rgba(0,0,0,0.1)] border border-gray-200"
        style={{
          width: `${gridSize}px`,
          height: `${gridSize}px`,
        }}
      >
        {/* 添加最右侧列和最底行边框 */}
        <div
          className="absolute border-r border-gray-300 h-full"
          style={{ right: 0 }}
        />
        <div
          className="absolute border-b border-gray-300 w-full"
          style={{ bottom: 0 }}
        />
        <div className="absolute inset-0">
          {safeGridData.map((row, rowIndex) => {
            // 确保行存在
            if (!row) return null;

            return row.map((cell, colIndex) => {
              // 确保单元格存在
              if (!cell) return null;

              const position = { row: rowIndex, col: colIndex };
              const cellKey = getCellKey(rowIndex, colIndex);
              const cellCandidates = candidates.get(cellKey) || [];

              return (
                <div
                  key={cellKey}
                  className="absolute"
                  style={{
                    top: `${rowIndex * cellSize}px`,
                    left: `${colIndex * cellSize}px`,
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                  }}
                >
                  <SudokuCell
                    cellData={cell}
                    position={position}
                    size={size}
                    boxWidth={boxWidth}
                    boxHeight={boxHeight}
                    isRegularSudoku={isRegularSudoku}
                    enableDiagonal={enableDiagonal}
                    status={getCellStatus(rowIndex, colIndex)}
                    candidates={cellCandidates}
                    showCandidates={showCandidates}
                    onClick={handleCellClick}
                  />
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
};

export default SudokuGrid;
