/**
 * @fileoverview 数独解题器测试
 */
import { createStandardSudokuConfig } from "@/core/engine";
import { createGridFromValues } from "@/core/grid";
import { CoreLoggers } from "@/core/logger";
import { solvers } from "@/core";

// 设置测试环境下的日志级别
CoreLoggers.root.setLevel("warn");

// 我们需要在测试中使用到的jest类型
declare global {
  function describe(name: string, fn: () => void): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function expect<T>(actual: T): {
    toBe(expected: T): void;
    toBeGreaterThan(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toEqual(expected: T): void;
    not: {
      toBeNull(): void;
    };
  };
}

describe("数独解题器", () => {
  test("解一个有效的数独问题", () => {
    // 创建一个标准9x9数独配置
    const config = createStandardSudokuConfig();
    
    // 创建一个简单的数独问题
    const values = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ];
    const grid = createGridFromValues(values);
    
    // 使用解题器求解
    const result = solvers.solveSudoku(grid, config);
    
    // 验证结果
    expect(result.success).toBe(true);
    expect(result.solutions.length).toBe(1);
    expect(result.finishReason).toBe("solved");
    
    // 验证解的正确性
    if (result.solutions.length > 0) {
      const solution = result.solutions[0];
      // 检查所有单元格是否已填充
      for (const row of solution) {
        for (const cell of row) {
          expect(cell.value).toBeGreaterThan(0);
        }
      }
    }
  });
  
  test("解一个无解的数独问题", () => {
    // 创建一个标准9x9数独配置
    const config = createStandardSudokuConfig();
    
    // 创建一个无解的数独问题 (在同一行放置两个相同的数字)
    const values = [
      [5, 3, 3, 0, 7, 0, 0, 0, 0], // 第一行有两个3，无法求解
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ];
    const grid = createGridFromValues(values);
    
    // 使用解题器求解
    const result = solvers.solveSudoku(grid, config);
    
    // 验证结果
    expect(result.success).toBe(false);
    expect(result.solutions.length).toBe(0);
    expect(result.finishReason).toBe("no_solution");
  });
  
  test("查找数独的多个解", () => {
    // 创建一个标准9x9数独配置
    const config = createStandardSudokuConfig();
    
    // 创建一个有多个解的数独问题 (提示太少)
    const values = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 3, 0, 8, 5],
      [0, 0, 1, 0, 2, 0, 0, 0, 0],
      [0, 0, 0, 5, 0, 7, 0, 0, 0],
      [0, 0, 4, 0, 0, 0, 1, 0, 0],
      [0, 9, 0, 0, 0, 0, 0, 0, 0],
      [5, 0, 0, 0, 0, 0, 0, 7, 3],
      [0, 0, 2, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 4, 0, 0, 0, 9],
    ];
    const grid = createGridFromValues(values);
    
    // 使用解题器求解，设置查找多个解
    const result = solvers.solveSudoku(grid, config, {
      findAllSolutions: true,
      maxSolutions: 5, // 最多找5个解
    });
    
    // 验证结果
    expect(result.success).toBe(true);
    expect(result.solutions.length).toBeGreaterThan(1); // 应该有多个解
    expect(result.finishReason).toBe("solved");
  });
}); 