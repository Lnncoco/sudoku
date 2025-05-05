/**
 * @fileoverview 数独生成器测试
 */
import { createStandardSudokuConfig } from "@/core/engine";
import { CoreLoggers } from "@/core/logger";
import { generators } from "@/core";
import { DifficultyLevel } from "@/core/types/solver";

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
    not: {
      toBeNull(): void;
    };
  };
}

describe("数独生成器", () => {
  test("生成一个有效的数独谜题", () => {
    // 创建一个标准9x9数独配置
    const config = createStandardSudokuConfig();
    
    // 使用生成器生成谜题
    const result = generators.generateSudoku(config, {
      difficulty: DifficultyLevel.MEDIUM,
      timeoutMs: 60000, // 给生成器足够的时间
    });
    
    // 验证结果
    expect(result.success).toBe(true);
    expect(result.puzzle).not.toBeNull();
    expect(result.solution).not.toBeNull();
    expect(result.finishReason).toBe("success");
    
    // 验证谜题的基本属性
    if (result.puzzle && result.solution) {
      // 验证尺寸
      expect(result.puzzle.length).toBe(9);
      expect(result.puzzle[0].length).toBe(9);
      
      // 验证给定数字数量在合理范围内 (中等难度)
      const givensCount = result.givensCount || 0;
      expect(givensCount).toBeGreaterThan(20); // 至少20个给定数字
      expect(givensCount).toBeLessThan(50); // 不超过50个给定数字
      
      // 验证完整解的有效性 (没有0)
      for (const row of result.solution) {
        for (const cell of row) {
          expect(cell.value).toBeGreaterThan(0);
          expect(cell.value).toBeLessThanOrEqual(9);
        }
      }
    }
  });
  
  test("生成带对称性的数独谜题", () => {
    // 创建一个标准9x9数独配置
    const config = createStandardSudokuConfig();
    
    // 使用生成器生成对称谜题
    const result = generators.generateSudoku(config, {
      difficulty: DifficultyLevel.EASY,
      symmetrical: true,
      symmetryType: "rotational",
      timeoutMs: 60000,
    });
    
    // 验证结果
    expect(result.success).toBe(true);
    expect(result.puzzle).not.toBeNull();
    
    // 验证谜题的对称性
    if (result.puzzle) {
      const grid = result.puzzle;
      const size = grid.length;
      
      // 检查旋转对称性
      let symmetryCount = 0;
      let assymetryCount = 0;
      
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          // 找到对称位置
          const symRow = size - 1 - row;
          const symCol = size - 1 - col;
          
          // 如果两个位置的填充状态不同，则对称性被破坏
          const hasValue = grid[row][col].value !== 0;
          const symHasValue = grid[symRow][symCol].value !== 0;
          
          if (hasValue === symHasValue) {
            symmetryCount++;
          } else {
            assymetryCount++;
          }
        }
      }
      
      // 检查对称性是否占主导
      expect(symmetryCount).toBeGreaterThan(assymetryCount);
    }
  });
}); 