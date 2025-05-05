import { useCallback, useEffect, useState } from "react";
import type { CellPosition, Grid, NoteMode } from "../types";
import { cloneGrid, createEmptyGrid } from "../utils/boardUtils";
import { isValidPlacement } from "../utils/validationUtils";

interface UseSudokuBoardProps {
  initialSize?: number;
  editMode: "puzzle" | "solve";
  noteMode: NoteMode;
  boxWidth: number;
  boxHeight: number;
  enableDiagonal: boolean;
}

/**
 * 管理数独网格状态和基础操作
 */
export function useSudokuBoard({
  initialSize = 9,
  editMode,
  noteMode,
  boxWidth,
  boxHeight,
  enableDiagonal,
}: UseSudokuBoardProps) {
  // 网格状态
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid(initialSize));

  // 选中单元格
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);

  // 网格尺寸
  const [size, setSize] = useState<number>(initialSize);

  // 当尺寸变化时重置网格和选中状态
  useEffect(() => {
    // 安全创建新尺寸的空网格
    const newGrid = createEmptyGrid(size);

    // 更新网格状态
    setGrid(newGrid);

    // 清除选中状态
    setSelectedCell(null);
  }, [size]);

  // 当编辑模式变化时更新题目状态
  useEffect(() => {
    if (editMode === "puzzle") {
      // 切换到出题模式，不做特殊处理
    } else {
      // 切换到解题模式，将所有非零值标记为题目
      setGrid((prevGrid) => {
        const newGrid = cloneGrid(prevGrid);
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (newGrid[r]?.[c]?.value > 0) {
              newGrid[r][c].isPuzzle = true;
            }
          }
        }
        return newGrid;
      });
    }
  }, [editMode, size]);

  // 处理单元格点击
  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell((prev) => {
      // 如果点击已选中的单元格，取消选中
      if (prev && prev.row === row && prev.col === col) {
        return null;
      }
      return { row, col };
    });
  }, []);

  // 处理数字输入
  const handleNumberInput = useCallback(
    (num: number) => {
      if (!selectedCell || num < 0 || num > size) {
        return;
      }

      const { row, col } = selectedCell;
      if (!grid?.[row]?.[col]) {
        return;
      }

      const cell = grid[row][col];

      // 题目单元格不能修改（只在解题模式下限制）
      if (editMode === "solve" && cell.isPuzzle) {
        return;
      }

      setGrid((prev) => {
        const newGrid = [...prev];
        if (!newGrid[row]) {
          newGrid[row] = Array(size)
            .fill(null)
            .map(() => ({
              value: 0,
              isPuzzle: false,
              notes: new Set<number>(),
              error: false,
            }));
        }

        const newRow = [...newGrid[row]];
        if (!newRow[col]) {
          newRow[col] = {
            value: 0,
            isPuzzle: false,
            notes: new Set<number>(),
            error: false,
          };
        }

        // 安全地处理笔记集合
        const safeCell = {
          ...newRow[col],
          notes: new Set<number>(),
        };

        // 如果原始笔记存在且是Set，则复制它
        if (cell.notes instanceof Set) {
          for (const note of cell.notes) {
            safeCell.notes.add(note);
          }
        }

        // 笔记模式下，更新笔记
        if (noteMode) {
          // 切换笔记状态
          if (safeCell.notes.has(num)) {
            safeCell.notes.delete(num);
          } else {
            safeCell.notes.add(num);
          }

          newRow[col] = safeCell;
        } else {
          // 正常模式下，如果输入与当前值相同，清空
          const newValue = cell.value === num ? 0 : num;

          // 检查填入的数字是否有效 (仅解题模式检查)
          let hasError = false;
          if (
            editMode === "solve" &&
            newValue !== 0 &&
            !isValidPlacement(
              newGrid,
              row,
              col,
              newValue,
              size,
              boxWidth,
              boxHeight,
              enableDiagonal,
            )
          ) {
            hasError = true;
          }

          // 出题模式下标记为非题目，解题模式下维持题目状态
          const isPuzzleValue = editMode === "puzzle" ? false : cell.isPuzzle;

          newRow[col] = {
            ...safeCell,
            value: newValue,
            notes: new Set(),
            error: hasError,
            isPuzzle: isPuzzleValue,
          };
        }

        newGrid[row] = newRow;
        return newGrid;
      });
    },
    [
      selectedCell,
      grid,
      size,
      editMode,
      noteMode,
      boxWidth,
      boxHeight,
      enableDiagonal,
    ],
  );

  // 清除选中单元格
  const clearSelectedCell = useCallback(() => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    if (!grid?.[row]?.[col]) return;

    const cell = grid[row][col];

    // 题目单元格不能清除（只在解题模式下限制）
    if (editMode === "solve" && cell.isPuzzle) return;

    setGrid((prev) => {
      const newGrid = [...prev];
      const newRow = [...newGrid[row]];

      newRow[col] = {
        ...cell,
        value: 0,
        notes: new Set(),
        error: false,
      };

      newGrid[row] = newRow;
      return newGrid;
    });
  }, [selectedCell, grid, editMode]);

  // 完全重置网格（清空所有内容）
  const resetGrid = useCallback(() => {
    setGrid(createEmptyGrid(size));
    setSelectedCell(null);
  }, [size]);

  // 清空网格（保留题目单元格）
  const clearGrid = useCallback(() => {
    setGrid((prev) =>
      prev.map((row) => {
        if (!row)
          return Array(size)
            .fill(null)
            .map(() => ({
              value: 0,
              isPuzzle: false,
              notes: new Set<number>(),
              error: false,
            }));

        return row.map((cell) => {
          if (!cell)
            return {
              value: 0,
              isPuzzle: false,
              notes: new Set<number>(),
              error: false,
            };

          return {
            ...cell,
            value: cell.isPuzzle ? cell.value : 0,
            notes: new Set(),
            error: false,
          };
        });
      }),
    );
    setSelectedCell(null);
  }, [size]);

  // 更新题目标记 - 将所有非零值标记为题目
  const markGridAsPuzzle = useCallback(() => {
    setGrid((currentGrid) => {
      return currentGrid.map((row) => {
        if (!row)
          return Array(size)
            .fill(null)
            .map(() => ({
              value: 0,
              isPuzzle: false,
              notes: new Set<number>(),
              error: false,
            }));

        return row.map((cell) => {
          if (!cell)
            return {
              value: 0,
              isPuzzle: false,
              notes: new Set<number>(),
              error: false,
            };

          return {
            ...cell,
            isPuzzle: cell.value > 0,
          };
        });
      });
    });
  }, [size]);

  return {
    grid,
    setGrid,
    selectedCell,
    setSelectedCell,
    size,
    setSize,
    handleCellClick,
    handleNumberInput,
    clearSelectedCell,
    resetGrid,
    clearGrid,
    markGridAsPuzzle,
  };
}
