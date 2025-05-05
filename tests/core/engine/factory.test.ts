/**
 * @fileoverview 单元测试 - src/core/engine/factory.ts
 * 引擎工厂功能测试
 */
import { describe, it, expect } from 'vitest';
import { createSudokuEngine } from '@/core/engine/factory';
import type { SudokuConfig, CompatibilityResult } from '@/core/types/engine';
import type { RegionType } from '@/core/types/region';

describe('数独引擎工厂', () => {
  it('应正确创建引擎实例', () => {
    // 创建基本配置
    const config: SudokuConfig = {
      size: 4,
      blockWidth: 2,
      blockHeight: 2,
      variantRules: [],
      regions: [
        // 行
        { id: 'row-0', type: 'row' as RegionType, cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
        // 列
        { id: 'col-0', type: 'column' as RegionType, cells: [[0, 0], [1, 0], [2, 0], [3, 0]] }
      ]
    };
    
    // 使用工厂创建引擎
    const engine = createSudokuEngine(config);
    
    // 检查引擎是否创建成功
    expect(engine).toBeDefined();
    expect(engine.getConfig().size).toBe(4);
    expect(engine.getConfig().regions.length).toBe(2);
    
    // 检查是否能访问相应方法
    expect(typeof engine.validate).toBe('function');
    expect(typeof engine.getCandidatesForCell).toBe('function');
    expect(typeof engine.isComplete).toBe('function');
  });
  
  it('应能解析并使用复杂配置', () => {
    // 创建带有更多区域和规则的配置
    const config: SudokuConfig = {
      size: 9,
      blockWidth: 3,
      blockHeight: 3,
      variantRules: [
        {
          id: 'anti-knight',
          name: '骑士约束',
          description: '骑士步距离的单元格不能有相同数字',
          supportsConfig: (config: SudokuConfig): CompatibilityResult => ({ compatible: true }),
          isCompatibleWith: (): CompatibilityResult => ({ compatible: true })
        }
      ],
      regions: [
        // 仅包含部分区域作为测试
        { id: 'row-0', type: 'row' as RegionType, cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8]] },
        { id: 'col-0', type: 'column' as RegionType, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0]] }
      ],
      customUI: {
        colorScheme: {
          background: '#f5f5f5',
          highlight: '#e0f7fa'
        }
      }
    };
    
    // 使用工厂创建引擎
    const engine = createSudokuEngine(config);
    
    // 检查引擎是否正确使用配置
    expect(engine).toBeDefined();
    expect(engine.getConfig().size).toBe(9);
    expect(engine.getConfig().variantRules.length).toBe(1);
    expect(engine.getConfig().variantRules[0].id).toBe('anti-knight');
    expect(engine.getConfig().customUI?.colorScheme?.background).toBe('#f5f5f5');
  });
}); 