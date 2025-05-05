import { createEmptyGrid } from "@/core";
import { getCandidatesForCellBitmask } from "@/core/candidates/optimized";
import type { CellPosition, CellState, Grid } from "@/core/types/grid";
import type { Region, RegionType } from "@/core/types/region";
import { DifficultyLevel } from "@/core/types/solver";
import { checkDuplicatesBitmask } from "@/core/validation/standard";
import * as R from "ramda";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { calculateBoxDimensions } from "../utils/boardUtils";
import { useSudokuBoard } from "./useSudokuBoard";
import { useSudokuGame } from "./useSudokuGame";
import { useSudokuUI } from "./useSudokuUI";

// 预定义的数独谜题 (保留在Hook内部或作为参数传入)
const SAMPLE_PUZZLES = {
  "4x4": [
    [0, 0, 0, 4],
    [0, 3, 0, 0],
    [4, 0, 0, 2],
    [0, 0, 3, 0],
  ],
  "6x6": [
    [0, 0, 3, 0, 0, 6],
    [0, 0, 0, 0, 0, 0],
    [0, 5, 0, 0, 6, 0],
    [0, 0, 4, 0, 3, 0],
    [0, 0, 0, 0, 0, 0],
    [2, 0, 0, 5, 0, 0],
  ],
  "9x9": [
    [0, 8, 9, 6, 0, 0, 4, 0, 0],
    [4, 0, 9, 0, 0, 0, 0, 3, 0],
    [5, 6, 1, 3, 7, 0, 0, 9, 8],
    [1, 9, 6, 7, 5, 3, 8, 2, 4],
    [0, 0, 0, 2, 1, 0, 5, 0, 7],
    [9, 8, 4, 5, 0, 0, 7, 6, 0],
    [0, 0, 0, 0, 4, 9, 0, 8, 0],
    [0, 1, 3, 8, 2, 0, 4, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0], // 确保9x9完整
  ],
};

// 编辑模式类型
export type EditMode = "puzzle" | "solve";

// 笔记模式类型
export type NoteMode = boolean;

// 支持的网格尺寸
export const SUPPORTED_SIZES = [4, 6, 9, 16] as const;

// 定义宫格尺寸类型
interface BoxDimensions {
  width: number;
  height: number;
}

// 创建行区域
function createRowRegions(size: number): Region[] {
  return Array.from({ length: size }, (_, row) => ({
    id: `row-${row}`,
    type: "row" as RegionType,
    cells: Array.from(
      { length: size },
      (_, col) => [row, col] as [number, number],
    ),
    properties: {},
  }));
}

// 创建列区域
function createColRegions(size: number): Region[] {
  return Array.from({ length: size }, (_, col) => ({
    id: `col-${col}`,
    type: "column" as RegionType,
    cells: Array.from(
      { length: size },
      (_, row) => [row, col] as [number, number],
    ),
    properties: {},
  }));
}

// 创建宫格区域 - 使用宽度和高度
function createBoxRegions(
  size: number,
  boxWidth: number,
  boxHeight: number,
): Region[] {
  const regions: Region[] = [];

  // 确保尺寸可以被宫格尺寸整除
  if (size % boxWidth !== 0 || size % boxHeight !== 0) {
    console.error(
      `无法为 ${size}x${size} 网格创建 ${boxWidth}x${boxHeight} 的宫格`,
    );
    return [];
  }

  for (let boxRow = 0; boxRow < size / boxHeight; boxRow++) {
    for (let boxCol = 0; boxCol < size / boxWidth; boxCol++) {
      const cells: [number, number][] = [];
      for (let r = 0; r < boxHeight; r++) {
        for (let c = 0; c < boxWidth; c++) {
          const row = boxRow * boxHeight + r;
          const col = boxCol * boxWidth + c;
          cells.push([row, col]);
        }
      }
      regions.push({
        id: `box-${boxRow}-${boxCol}`,
        type: "block" as RegionType,
        cells,
        properties: {},
      });
    }
  }
  return regions;
}

// 创建对角线区域
function createDiagonalRegions(size: number): Region[] {
  // 主对角线
  const mainDiagonal: Region = {
    id: "diagonal-main",
    type: "diagonal" as RegionType,
    cells: Array.from({ length: size }, (_, i) => [i, i] as [number, number]),
    properties: {},
  };

  // 副对角线
  const antiDiagonal: Region = {
    id: "diagonal-anti",
    type: "diagonal" as RegionType,
    cells: Array.from(
      { length: size },
      (_, i) => [i, size - 1 - i] as [number, number],
    ),
    properties: {},
  };

  return [mainDiagonal, antiDiagonal];
}

// 为网格创建所有区域 - 接受宽度和高度
function createRegions(
  size: number,
  boxWidth: number,
  boxHeight: number,
  enableDiagonal: boolean,
): Region[] {
  const regions: Region[] = [
    ...createRowRegions(size),
    ...createColRegions(size),
    ...createBoxRegions(size, boxWidth, boxHeight),
  ];

  if (enableDiagonal) {
    regions.push(...createDiagonalRegions(size));
  }

  return regions;
}

// 检查数字填入是否有效 - 使用 boxWidth/boxHeight
function isValidPlacement(
  grid: Grid,
  row: number,
  col: number,
  num: number,
  size: number,
  boxWidth: number,
  boxHeight: number,
  enableDiagonal: boolean,
): boolean {
  // 安全检查
  if (!grid || !grid[row] || !grid[row][col]) {
    return false;
  }

  try {
    // 创建临时网格
    const tempGrid = JSON.parse(JSON.stringify(grid));
    tempGrid[row][col].value = 0; // 清除当前值

    // 获取候选数
    const regions = createRegions(size, boxWidth, boxHeight, enableDiagonal);
    // 创建完整的配置对象
    const config = {
      size,
      regions,
      blockWidth: boxWidth,
      blockHeight: boxHeight,
      variantRules: [], // 空数组，因为variant规则在createRegions中已经考虑
    };

    // 使用优化版本的候选数计算函数
    const candidates = getCandidatesForCellBitmask(tempGrid, row, col, config);

    // 检查数字是否在候选数中
    return candidates.has(num);
  } catch (error) {
    console.error("Error validating placement:", error);
    return false; // 出错时，视为无效
  }
}

// 检查整个网格是否有效 - 使用 boxWidth/boxHeight
function checkGrid(
  grid: Grid,
  enableDiagonal: boolean,
  boxWidth: number,
  boxHeight: number,
): boolean {
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    console.warn("无效的网格结构: 网格为空或非数组");
    return true; // 如果网格不存在或为空，视为有效
  }

  const size = grid.length;

  // 安全检查：确保网格是一个有效的二维数组，且每个单元格都有正确的属性
  for (let row = 0; row < size; row++) {
    if (!grid[row] || !Array.isArray(grid[row]) || grid[row].length !== size) {
      console.warn(`无效的网格结构: 行 ${row} 结构错误`);
      return false; // 网格结构无效
    }

    for (let col = 0; col < size; col++) {
      // 增强的安全检查，确保单元格和value属性存在
      if (!grid[row][col]) {
        console.warn(`无效的网格结构: 单元格 (${row},${col}) 不存在`);
        return false;
      }

      if (typeof grid[row][col].value !== "number") {
        console.warn(
          `无效的网格结构: 单元格 (${row},${col}) 的value属性不是数字`,
        );
        return false; // 单元格结构无效
      }
    }
  }

  try {
    const regions = createRegions(size, boxWidth, boxHeight, enableDiagonal);

    // 检查每个区域是否有重复值
    for (const region of regions) {
      // 安全检查region.cells
      if (
        !region.cells ||
        !Array.isArray(region.cells) ||
        region.cells.length === 0
      ) {
        console.warn(`无效的区域结构: 区域 ${region.id} 的cells属性无效`);
        continue; // 跳过无效的区域
      }

      // 检查每个单元格坐标是否有效
      let invalidCellFound = false;
      for (const [r, c] of region.cells) {
        if (
          r < 0 ||
          r >= size ||
          c < 0 ||
          c >= size ||
          !grid[r] ||
          !grid[r][c]
        ) {
          console.warn(`区域 ${region.id} 包含无效坐标: (${r},${c})`);
          invalidCellFound = true;
          break;
        }
      }

      if (invalidCellFound) continue;

      // 现在安全地进行重复检查
      try {
        const { duplicates } = checkDuplicatesBitmask(grid, region.cells);
        if (duplicates.length > 0) {
          return false;
        }
      } catch (regionError) {
        console.error(`检查区域 ${region.id} 重复值时出错:`, regionError);
      }
    }

    return true;
  } catch (error) {
    console.error("检查网格有效性时出错:", error);
    return false; // 出现错误时，视为无效
  }
}

// 模拟生成数独题目函数 - 使用 boxWidth/boxHeight
function generateSudoku(
  size: number,
  boxWidth: number,
  boxHeight: number,
): Grid {
  const grid = createEmptyGrid(size);
  const nums = Array.from({ length: size }, (_, i) => i + 1);
  const cellCount = size * size;
  const givensCount = Math.floor(cellCount * 0.3);
  let filledCount = 0;

  while (filledCount < givensCount) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    if (grid[row]?.[col]?.value !== 0) continue; // 简化检查

    const shuffledNums = [...nums].sort(() => Math.random() - 0.5);

    for (const num of shuffledNums) {
      let canPlace = true;

      // 检查行
      for (let c = 0; c < size; c++) {
        if (grid[row]?.[c]?.value === num) {
          canPlace = false;
          break;
        }
      }
      if (!canPlace) continue;

      // 检查列
      for (let r = 0; r < size; r++) {
        if (grid[r]?.[col]?.value === num) {
          canPlace = false;
          break;
        }
      }
      if (!canPlace) continue;

      // 检查宫格
      const boxRowStart = Math.floor(row / boxHeight) * boxHeight;
      const boxColStart = Math.floor(col / boxWidth) * boxWidth;
      for (let r = boxRowStart; r < boxRowStart + boxHeight; r++) {
        for (let c = boxColStart; c < boxColStart + boxWidth; c++) {
          if (grid[r]?.[c]?.value === num) {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }

      if (canPlace) {
        // 安全性检查
        if (grid[row]?.[col]) {
          grid[row][col] = {
            ...grid[row][col],
            value: num,
            isPuzzle: true,
          };
          filledCount++;
        } else {
          console.error(`尝试写入无效位置 (${row}, ${col})`);
        }
        break; // 跳出内层 for 循环，继续外层 while
      }
    }
  }
  return grid;
}

/**
 * 数独核心状态与逻辑的Facade
 * 组合各子Hook，提供统一接口
 */
export function useSudokuCore() {
  // 网格尺寸和宫格尺寸
  const initialSize = 9;
  const [boxDimensions, setBoxDimensions] = useState(() =>
    calculateBoxDimensions(initialSize),
  );

  // -------- 新增状态 --------
  const [displayedDifficulty, setDisplayedDifficulty] = useState<
    DifficultyLevel | "自定义"
  >("自定义");
  const [wasEditedInEditMode, setWasEditedInEditMode] =
    useState<boolean>(false);
  const [gridSnapshotOnEditStart, setGridSnapshotOnEditStart] =
    useState<Grid | null>(null);
  const [generatedDifficulty, setGeneratedDifficulty] = useState<
    DifficultyLevel | "自定义"
  >("自定义");
  // -------- /新增状态 --------

  // UI状态管理
  const ui = useSudokuUI({
    initialEditMode: "solve",
    initialNoteMode: false,
    initialShowCandidates: false,
    initialErrorHighlighting: true,
    initialEnableDiagonal: false,
  });

  // 棋盘状态管理
  const board = useSudokuBoard({
    initialSize,
    editMode: ui.editMode,
    noteMode: ui.noteMode,
    boxWidth: boxDimensions.width,
    boxHeight: boxDimensions.height,
    enableDiagonal: ui.enableDiagonal,
  });

  // 当尺寸变化时重新计算宫格尺寸
  useEffect(() => {
    try {
      const newDimensions = calculateBoxDimensions(board.size);
      console.log(
        `尺寸变更: ${board.size}x${board.size}, 宫格: ${newDimensions.width}x${newDimensions.height}`,
      );
      setBoxDimensions(newDimensions);
    } catch (error) {
      console.error("计算宫格尺寸出错:", error);
    }
  }, [board.size]);

  // 游戏逻辑管理
  const game = useSudokuGame({
    grid: board.grid,
    setGrid: board.setGrid,
    size: board.size,
    boxDimensions,
    enableDiagonal: ui.enableDiagonal,
    enableErrorHighlighting: ui.enableErrorHighlighting,
  });

  // 难度级别映射: 从 DifficultyLevel 枚举值 (string) 到显示文本 (string)
  const difficultyToStringMap: Record<DifficultyLevel, string> = useMemo(
    () => ({
      [DifficultyLevel.EASY]: "简单",
      [DifficultyLevel.MEDIUM]: "中等",
      [DifficultyLevel.HARD]: "困难",
      [DifficultyLevel.EXPERT]: "专家",
    }),
    [],
  );

  // 包装 generatePuzzle
  const generatePuzzleWrapper = useCallback(async () => {
    try {
      await game.generatePuzzle(); // 调用原始函数
      const generatedLevel = game.difficulty; // 类型是 DifficultyLevel (string enum)
      setDisplayedDifficulty(generatedLevel); // 直接设置枚举值
      setGeneratedDifficulty(generatedLevel); // 存储生成难度
      setWasEditedInEditMode(false);
      setGridSnapshotOnEditStart(null);
      return { success: true };
    } catch (error) {
      console.error("生成题目出错:", error);
      setDisplayedDifficulty("自定义");
      setGeneratedDifficulty("自定义");
      toast.error("生成题目失败！");
      return { success: false }; // 返回失败状态
    }
  }, [game]);

  // 包装 toggleEditMode
  const toggleEditModeWrapper = useCallback(() => {
    const currentMode = ui.editMode;
    if (currentMode === "solve") {
      setGridSnapshotOnEditStart(R.clone(board.grid)); // 保存快照
      setWasEditedInEditMode(false); // 重置编辑标记
    } else {
      if (wasEditedInEditMode) {
        setDisplayedDifficulty("自定义");
      }
      setGridSnapshotOnEditStart(null); // 清除快照
    }
    ui.toggleEditMode(); // 调用原始UI切换函数
  }, [ui, board.grid, wasEditedInEditMode]);

  // 标记编辑的辅助函数
  const markEdited = useCallback(() => {
    if (ui.editMode === "puzzle" && !wasEditedInEditMode) {
      setWasEditedInEditMode(true);
    }
  }, [ui.editMode, wasEditedInEditMode]);

  // 包装 handleNumberInput
  const handleNumberInputWrapper = useCallback(
    (num: number | null) => {
      if (ui.editMode === "puzzle") {
        markEdited();
      }
      if (num !== null) {
        board.handleNumberInput(num); // 调用原始函数
      } else {
        console.warn("handleNumberInputWrapper received null");
      }
    },
    [board.handleNumberInput, ui.editMode, markEdited],
  );

  // 包装 clearSelectedCell
  const clearSelectedCellWrapper = useCallback(() => {
    if (ui.editMode === "puzzle" && board.selectedCell) {
      const { row, col } = board.selectedCell;
      const cell = board.grid[row]?.[col];
      if (cell && (cell.value !== 0 || (cell.notes && cell.notes.size > 0))) {
        markEdited();
      }
    }
    board.clearSelectedCell(); // 调用原始函数
  }, [
    board.clearSelectedCell,
    board.selectedCell,
    board.grid,
    ui.editMode,
    markEdited,
  ]);

  // 包装 resetGrid
  const resetGridWrapper = useCallback(() => {
    board.resetGrid(); // 调用原始函数
    setDisplayedDifficulty(generatedDifficulty); // 恢复生成时的难度
    setWasEditedInEditMode(false);
    setGridSnapshotOnEditStart(null);
  }, [board.resetGrid, generatedDifficulty]);

  // 包装 clearGrid
  const clearGridWrapper = useCallback(() => {
    board.clearGrid(); // 调用原始函数
    setDisplayedDifficulty("自定义");
    setGeneratedDifficulty("自定义"); // 清空后没有原始难度了
    setWasEditedInEditMode(false);
    setGridSnapshotOnEditStart(null);
  }, [board.clearGrid]);

  // 监听键盘输入
  useEffect(() => {
    if (!board.selectedCell) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();

      if (e.key >= "1" && e.key <= "9") {
        const num = Number.parseInt(e.key, 10);
        if (num <= board.size) {
          handleNumberInputWrapper(num);
        }
      } else if (e.key >= "Numpad1" && e.key <= "Numpad9") {
        const num = Number.parseInt(e.key.replace("Numpad", ""), 10);
        if (num <= board.size) {
          handleNumberInputWrapper(num);
        }
      } else if (e.key === "Backspace" || e.key === "Delete") {
        clearSelectedCellWrapper();
      } else if (e.key === "n" || e.key === "N") {
        ui.toggleNoteMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    board.selectedCell,
    board.size,
    handleNumberInputWrapper,
    clearSelectedCellWrapper,
    ui.toggleNoteMode,
  ]);

  // 错误高亮或对角线变化时重新验证网格
  useEffect(() => {
    if (!game.isLoading && !game.isSolving) {
      game.validateAndUpdateGrid();
    }
  }, [game.validateAndUpdateGrid, game.isLoading, game.isSolving]);

  // 返回组合后的接口
  return {
    // 棋盘状态 & 操作
    grid: board.grid,
    size: board.size,
    selectedCell: board.selectedCell,
    setSize: board.setSize,
    handleCellClick: board.handleCellClick,
    handleNumberInput: handleNumberInputWrapper,
    clearSelectedCell: clearSelectedCellWrapper,
    resetGrid: resetGridWrapper,
    clearGrid: clearGridWrapper,

    // 游戏逻辑状态 & 操作
    boxWidth: boxDimensions.width,
    boxHeight: boxDimensions.height,
    isValid: game.isValid,
    isGridFull: game.isGridFull,
    isRegularSudoku: game.isRegularSudoku,
    disabledNumbers: game.disabledNumbers,
    candidates: game.candidates,
    getCandidates: game.getCandidates,
    generatePuzzle: generatePuzzleWrapper,
    autoSolve: game.autoSolve,
    difficulty: game.difficulty,
    setDifficulty: game.setDifficulty,
    isLoading: game.isLoading,
    isSolving: game.isSolving,
    validateAndUpdateGrid: game.validateAndUpdateGrid,

    // UI 状态 & 操作
    noteMode: ui.noteMode,
    editMode: ui.editMode,
    showCandidates: ui.showCandidates,
    enableDiagonal: ui.enableDiagonal,
    enableErrorHighlighting: ui.enableErrorHighlighting,
    toggleNoteMode: ui.toggleNoteMode,
    toggleEditMode: toggleEditModeWrapper,
    toggleShowCandidates: ui.toggleShowCandidates,
    toggleEnableDiagonal: ui.toggleEnableDiagonal,
    toggleErrorHighlighting: ui.toggleErrorHighlighting,
    getNoteButtonLabel: ui.getNoteButtonLabel,
    getModeButtonLabel: ui.getModeButtonLabel,

    // 新增返回状态
    displayedDifficulty,
  };
}
