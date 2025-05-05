import { generateSudoku as generateCoreSudoku } from "@/core/generators";
import { solveSudoku } from "@/core/solvers";
import { validateAllRegions } from "@/core/validation/collector";
import { DiagonalVariant } from "@/core/variants/diagonal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import type { BoxDimensions, Grid } from "../types";
import { DifficultyLevel } from "../types";
import {
  isGridFull as checkGridFull,
  createEmptyGrid,
  getCellKey,
} from "../utils/boardUtils";
import { createRegions } from "../utils/regionUtils";
import {
  calculateCandidatesForCell,
  checkGrid,
  isGridMostlyEmpty,
  validateAllCells,
} from "../utils/validationUtils";

interface UseSudokuGameProps {
  grid: Grid;
  setGrid: React.Dispatch<React.SetStateAction<Grid>>;
  size: number;
  boxDimensions: BoxDimensions;
  enableDiagonal: boolean;
  enableErrorHighlighting: boolean;
}

/**
 * 管理数独游戏核心逻辑和规则
 */
export function useSudokuGame({
  grid,
  setGrid,
  size,
  boxDimensions,
  enableDiagonal,
  enableErrorHighlighting,
}: UseSudokuGameProps) {
  // 游戏状态
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    DifficultyLevel.MEDIUM,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSolving, setIsSolving] = useState<boolean>(false);

  // 宫格尺寸
  const { width: boxWidth, height: boxHeight } = boxDimensions;

  // 网格是否有效
  const isValid = useMemo(() => {
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      return true; // 网格尚未初始化时视为有效
    }

    try {
      return checkGrid(grid, enableDiagonal, boxWidth, boxHeight);
    } catch (error) {
      console.error("验证网格有效性时出现未捕获的错误:", error);
      return false;
    }
  }, [grid, enableDiagonal, boxWidth, boxHeight]);

  // 网格是否已满
  const isGridFull = useMemo(() => {
    return checkGridFull(grid, size);
  }, [grid, size]);

  // 已经用完的数字（每个数字在网格中的出现次数已达到最大值）
  const disabledNumbers = useMemo(() => {
    const countMap = new Map<number, number>();
    const result = new Set<number>();

    // 初始化计数器
    for (let num = 1; num <= size; num++) {
      countMap.set(num, 0);
    }

    // 统计每个数字出现的次数
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!grid[row] || !grid[row][col]) continue;

        const value = grid[row][col].value;
        if (value > 0) {
          countMap.set(value, (countMap.get(value) || 0) + 1);
        }
      }
    }

    // 找出已达到最大次数的数字
    for (const [num, count] of countMap.entries()) {
      if (count >= size) {
        result.add(num);
      }
    }

    return result;
  }, [grid, size]);

  // 计算并缓存所有单元格候选数
  const candidates = useMemo(() => {
    const candidatesMap = new Map<string, number[]>();

    // 如果网格几乎为空，跳过大部分候选数的计算，提高性能
    if (isGridMostlyEmpty(grid, 0.05)) {
      return candidatesMap;
    }

    try {
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (!grid[row] || !grid[row][col]) continue;

          if (grid[row][col].value === 0) {
            const cellCandidates = calculateCandidatesForCell(
              grid,
              row,
              col,
              size,
              boxWidth,
              boxHeight,
              enableDiagonal,
            );

            candidatesMap.set(getCellKey(row, col), cellCandidates);
          }
        }
      }
    } catch (error) {
      console.error("计算候选数时出错:", error);
    }

    return candidatesMap;
  }, [grid, size, boxWidth, boxHeight, enableDiagonal]);

  // 获取单元格候选数并设置为笔记
  const getCandidates = useCallback(
    (row: number, col: number) => {
      if (!grid?.[row]?.[col] || grid[row][col].value > 0) {
        return;
      }

      try {
        const calculatedCandidates = calculateCandidatesForCell(
          grid,
          row,
          col,
          size,
          boxWidth,
          boxHeight,
          enableDiagonal,
        );

        // 将候选数设为笔记
        setGrid((prev) => {
          const newGrid = [...prev];
          const newRow = [...newGrid[row]];

          newRow[col] = {
            ...newGrid[row][col],
            notes: new Set(calculatedCandidates),
          };

          newGrid[row] = newRow;
          return newGrid;
        });
      } catch (error) {
        console.error("获取候选数过程中出错:", error);
      }
    },
    [grid, size, boxWidth, boxHeight, enableDiagonal, setGrid],
  );

  // 模拟（回退）生成数独函数
  const fallbackGeneratePuzzle = useCallback(() => {
    try {
      // 简单模拟数独生成
      const newGrid = createEmptyGrid(size);
      const nums = Array.from({ length: size }, (_, i) => i + 1);
      const cellCount = size * size;
      const givensCount = Math.floor(cellCount * 0.3);
      let filledCount = 0;

      while (filledCount < givensCount) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);

        if (newGrid[row]?.[col]?.value !== 0) continue;

        const shuffledNums = [...nums].sort(() => Math.random() - 0.5);

        for (const num of shuffledNums) {
          // 简单检查行列宫格是否有冲突
          let canPlace = true;

          // 检查行
          for (let c = 0; c < size; c++) {
            if (newGrid[row]?.[c]?.value === num) {
              canPlace = false;
              break;
            }
          }
          if (!canPlace) continue;

          // 检查列
          for (let r = 0; r < size; r++) {
            if (newGrid[r]?.[col]?.value === num) {
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
              if (newGrid[r]?.[c]?.value === num) {
                canPlace = false;
                break;
              }
            }
            if (!canPlace) break;
          }

          if (canPlace) {
            if (newGrid[row]?.[col]) {
              newGrid[row][col] = {
                ...newGrid[row][col],
                value: num,
                isPuzzle: true,
              };
              filledCount++;
            }
            break;
          }
        }
      }

      setGrid(newGrid);
    } catch (error) {
      console.error("回退生成数独时出错:", error);
      setGrid(createEmptyGrid(size));
    }
  }, [size, boxWidth, boxHeight, setGrid]);

  // 缓存上次验证的网格字符串表示和结果
  const lastValidationRef = useRef<{
    gridString: string;
    result: ReturnType<typeof validateAllRegions> | null;
  }>({ gridString: "", result: null });

  // 验证全部单元格
  const validateAndUpdateGrid = useCallback(() => {
    // 仅在启用错误高亮时执行验证
    if (enableErrorHighlighting) {
      try {
        // 为了性能，检查网格是否实际变化
        const gridString = JSON.stringify(grid);
        if (
          gridString === lastValidationRef.current.gridString &&
          lastValidationRef.current.result
        ) {
          // 如果网格未变化且有缓存的验证结果，重用结果
          const validationResult = lastValidationRef.current.result;

          // 应用错误标记
          setGrid((prevGrid) => {
            // 深拷贝当前网格
            const newGrid = JSON.parse(JSON.stringify(prevGrid));

            // 先清除所有单元格的错误状态
            for (let r = 0; r < size; r++) {
              for (let c = 0; c < size; c++) {
                if (newGrid[r]?.[c]) {
                  newGrid[r][c].error = false;
                }
              }
            }

            // 标记所有冲突单元格
            if (!validationResult.isValid) {
              for (const [errRow, errCol] of validationResult.errorCells) {
                if (newGrid[errRow]?.[errCol]) {
                  newGrid[errRow][errCol].error = true;
                }
              }
            }

            return newGrid;
          });

          return; // 提前返回，避免重复验证
        }

        // 创建区域定义
        const regions = createRegions(
          size,
          boxWidth,
          boxHeight,
          enableDiagonal,
        );

        // 使用 validateAllRegions 获取所有冲突单元格
        const validationResult = validateAllRegions(grid, regions);

        // 缓存验证结果
        lastValidationRef.current = {
          gridString,
          result: validationResult,
        };

        // 更新网格，标记所有错误单元格
        setGrid((prevGrid) => {
          // 深拷贝当前网格
          const newGrid = JSON.parse(JSON.stringify(prevGrid));

          // 先清除所有单元格的错误状态
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              if (newGrid[r]?.[c]) {
                newGrid[r][c].error = false;
              }
            }
          }

          // 标记所有冲突单元格
          if (!validationResult.isValid) {
            for (const [errRow, errCol] of validationResult.errorCells) {
              if (newGrid[errRow]?.[errCol]) {
                newGrid[errRow][errCol].error = true;
              }
            }
          }

          return newGrid;
        });
      } catch (error) {
        console.error("验证网格时出错:", error);
      }
    }
  }, [
    size,
    boxWidth,
    boxHeight,
    enableDiagonal,
    enableErrorHighlighting,
    grid,
    setGrid,
  ]);

  // 我们可以移除之前的 grid 变化检测的 useEffect，因为 validateAndUpdateGrid 现在已经依赖 grid
  // 或者保留一个简化版本，用于在网格变化时触发验证（但不重复 grid 依赖）
  useEffect(() => {
    // 当 enableErrorHighlighting 状态变化时处理
    if (enableErrorHighlighting) {
      validateAndUpdateGrid();
    } else {
      // 禁用时，清除所有错误高亮
      setGrid((prevGrid) => {
        if (!prevGrid || prevGrid.length === 0) {
          return prevGrid;
        }
        return prevGrid.map((row) =>
          row
            ? row.map((cell) => (cell ? { ...cell, error: false } : cell))
            : row,
        );
      });

      // 清除验证缓存
      lastValidationRef.current = { gridString: "", result: null };
    }
  }, [enableErrorHighlighting, validateAndUpdateGrid, setGrid]);

  // 生成数独函数
  const generatePuzzle = useCallback(() => {
    setIsLoading(true);
    try {
      const regions = createRegions(size, boxWidth, boxHeight, enableDiagonal);
      const config = {
        size,
        regions,
        blockWidth: boxWidth,
        blockHeight: boxHeight,
        variantRules: [],
      };

      // 核心生成配置
      const generatorOptions = {
        difficulty,
        uniqueSolution: true,
        symmetrical: true,
        minGivens: Math.floor(size * size * 0.2),
        maxGivens: Math.floor(size * size * 0.4),
        timeoutMs: 10000,
      };

      try {
        // 直接使用主线程调用生成器
        const result = generateCoreSudoku(config, generatorOptions);

        if (result?.success && result?.puzzle) {
          setGrid(result.puzzle);
          console.info("成功生成数独题目！", {
            difficulty: result.difficulty,
            givensCount: result.givensCount,
            timeMs: result.stats?.timeMs,
          });

          // 验证生成的网格
          setTimeout(() => {
            validateAndUpdateGrid();
          }, 50);
        } else {
          console.error(
            "生成题目失败",
            result?.finishReason,
            result?.errorMessage,
          );
          fallbackGeneratePuzzle();
        }
      } catch (generationError) {
        console.error("Core 生成函数抛出错误", generationError);
        fallbackGeneratePuzzle();
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("生成题目初始化失败", error);
      fallbackGeneratePuzzle();
      setIsLoading(false);
    }
  }, [
    size,
    boxWidth,
    boxHeight,
    enableDiagonal,
    difficulty,
    fallbackGeneratePuzzle,
    setGrid,
    validateAndUpdateGrid,
  ]);

  // 重置网格
  const resetGrid = useCallback(() => {
    setGrid(createEmptyGrid(size));
    // 保持调用验证，以防 enableErrorHighlighting 为 true
    validateAndUpdateGrid(); // 直接调用，内部会判断 enableErrorHighlighting
  }, [size, setGrid, validateAndUpdateGrid]); // 移除 enableErrorHighlighting 依赖

  // 清空网格
  const clearGrid = useCallback(() => {
    setGrid(createEmptyGrid(size));
    // 保持调用验证
    validateAndUpdateGrid();
  }, [size, setGrid, validateAndUpdateGrid]); // 移除 enableErrorHighlighting 依赖

  // 计算候选数并应用到所有单元格笔记
  const calculateAndApplyAllCandidates = useCallback(() => {
    // TODO: 检查此函数实现，确认是否真的不需要依赖项
    // Linter 提示可能不需要 grid, size, boxWidth, boxHeight, enableDiagonal, setGrid
    console.log("计算并应用所有候选数...");
    // 实际实现...
    // 假设实现如下：
    setGrid((prevGrid) => {
      const newGrid = JSON.parse(JSON.stringify(prevGrid));
      try {
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (newGrid[r]?.[c]?.value === 0) {
              const candidates = calculateCandidatesForCell(
                newGrid, // 使用当前循环中的 newGrid
                r,
                c,
                size,
                boxWidth,
                boxHeight,
                enableDiagonal,
              );
              newGrid[r][c].notes = new Set(candidates);
            }
          }
        }
      } catch (error) {
        console.error("计算全部候选数时出错:", error);
      }
      return newGrid;
    });
  }, [size, boxWidth, boxHeight, enableDiagonal, setGrid]); // 根据假设的实现，添加必要依赖

  // 自动解题函数
  const autoSolve = useCallback(async () => {
    setIsLoading(true);
    setIsSolving(true);
    try {
      // 创建完整区域定义，确保包含所有约束
      const regions = createRegions(size, boxWidth, boxHeight, enableDiagonal);

      // 确保配置参数命名与 core 接口一致
      const config = {
        size,
        regions,
        // 使用和 core 接口一致的参数名
        blockWidth: boxWidth,
        blockHeight: boxHeight,
        // 如果启用对角线，使用正确的 DiagonalVariant 类创建实例
        variantRules: enableDiagonal ? [new DiagonalVariant()] : [],
      };

      console.info("解题配置:", {
        size,
        regions: regions.length,
        regionTypes: [...new Set(regions.map((r) => r.type))].join(", "),
        enableDiagonal,
        boxDimensions: `${boxWidth}x${boxHeight}`,
        hasDiagonalRule: enableDiagonal,
      });

      // 根据数独大小动态调整超时时间
      const getTimeoutBySize = (size: number): number => {
        // 4x4: 15秒, 6x6: 60秒, 9x9: 120秒, 其他尺寸按比例计算
        const baseTimeouts: Record<number, number> = {
          4: 15000, // 15秒
          6: 60000, // 1分钟
          9: 120000, // 2分钟
          16: 300000, // 5分钟
        };
        return baseTimeouts[size] || Math.min(size * size * 1500, 600000); // 最长10分钟
      };

      // 解题器配置
      const solverOptions = {
        findAllSolutions: false,
        timeoutMs: getTimeoutBySize(size), // 根据尺寸调整超时时间
        strategy: "fastest" as const,
        onProgress: (type: string, data: Grid | unknown) => {
          // 找到解决方案后停止，但解题器可能会标记为"interrupted"
          if (type === "solution") {
            console.info("解题器找到了解决方案，中断继续搜索");
            return false; // 找到解后停止
          }
          return true; // 继续解题
        },
      };

      // 使用 core 模块的解题器解题
      const solveResult = solveSudoku(grid, config, solverOptions);

      // 打印详细的解题结果，帮助调试
      console.info("完整解题结果:", solveResult);

      // 检查结果 - 即使被中断，只要有解就处理
      if (
        solveResult.solutions &&
        solveResult.solutions.length > 0 &&
        (solveResult.success ||
          solveResult.finishReason === "interrupted_with_solution")
      ) {
        console.info("找到有效解决方案，准备应用");
        const solution = solveResult.solutions[0];

        // 直接应用解题器的解，此时我们信任解题器返回的结果
        // core已经确保返回的解是有效的
        setGrid((prevGrid) => {
          const newGrid = prevGrid.map((row) =>
            row.map((cell) => ({ ...cell })),
          );

          // 精确地应用解题器的解
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              const prevCell = prevGrid[r]?.[c];
              // 确保该单元格存在
              if (prevCell) {
                // 获取解题器给出的解决方案中该位置的值
                const solutionCell = solution[r]?.[c];
                const solutionValue = solutionCell?.value || 0;

                // 如果是空格或原值有误，使用解题器的值
                if (prevCell.value === 0 || prevCell.error) {
                  newGrid[r][c] = {
                    ...newGrid[r][c],
                    value: solutionValue,
                    error: false, // 解题器的值不应该有错误
                    isPuzzle: false, // 不是题目给出的
                    notes: new Set(), // 清空候选数
                  };
                }
              }
            }
          }

          return newGrid;
        });

        // 解题成功，更新界面并验证
        validateAndUpdateGrid();
        toast.success("自动解题成功!");
      } else {
        // 处理各种解题失败情况
        const reason = solveResult.failReason || "未知原因";
        let errorMessage: string;

        if (solveResult.finishReason === "no_solution") {
          errorMessage = "当前数独无解！";
        } else if (solveResult.finishReason === "timeout") {
          errorMessage = "解题超时，请尝试简化数独或调整配置";
        } else if (solveResult.finishReason === "error") {
          errorMessage = `解题过程出错: ${reason}`;
        } else if (solveResult.finishReason === "interrupted") {
          errorMessage = `解题过程被中断: ${reason}`;
        } else {
          errorMessage = `无法解决当前数独！${reason}`;
        }

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("解题过程中发生错误", error);
      toast.error(
        `解题过程中发生错误: ${error instanceof Error ? error.message : String(error)}`,
        {
          duration: 3000,
          position: "top-center",
        },
      );
    } finally {
      setIsLoading(false);
      setIsSolving(false);
      // 解题完成后，调用验证（内部会检查 enableErrorHighlighting）
      validateAndUpdateGrid();
    }
  }, [
    grid, // 解题函数需要初始 grid
    size,
    boxWidth,
    boxHeight,
    enableDiagonal,
    setGrid,
    validateAndUpdateGrid, // 需要调用验证
    // 移除 enableErrorHighlighting，因为 validateAndUpdateGrid 内部处理
  ]);

  // 常规数独检测
  const isRegularSudoku = useMemo(() => {
    return size === 4 || size === 9 || size === 16;
  }, [size]);

  // 恢复处理单元格值变化的函数
  const handleCellChange = useCallback(
    (row: number, col: number, value: number | null) => {
      setGrid((prevGrid) => {
        // 创建新网格以避免直接修改状态
        const newGrid = JSON.parse(JSON.stringify(prevGrid));
        if (newGrid[row]?.[col]) {
          newGrid[row][col] = {
            ...newGrid[row][col],
            value: value ?? 0, // 使用 nullish coalescing
            notes: new Set<number>(), // 清除笔记
            error: false, // 先清除当前单元格的错误状态，等待验证
          };
        }
        return newGrid;
      });
      // 无需显式调用验证，validateAndUpdateGrid 已经依赖 grid 会自动触发
    },
    [setGrid],
  );

  return {
    difficulty,
    setDifficulty,
    isLoading,
    isSolving,
    isValid,
    isGridFull,
    isRegularSudoku,
    disabledNumbers,
    candidates,
    getCandidates,
    generatePuzzle,
    resetGrid,
    clearGrid,
    handleCellChange,
    autoSolve,
    calculateAndApplyAllCandidates,
    validateAndUpdateGrid,
  };
}

// 在这里定义辅助函数
// function createEmptyGrid(size: number): Grid {
//   return Array(size)
//     .fill(null)
//     .map(() =>
//       Array(size)
//         .fill(null)
//         .map(() => ({ value: 0, isPuzzle: false, notes: new Set(), error: false }))
//     );
// }
