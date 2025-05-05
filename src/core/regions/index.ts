/**
 * @fileoverview 区域模块统一导出
 * 导出所有区域相关的纯函数
 */

// 导出标准区域生成函数
export {
  generateRowRegions,
  generateColumnRegions,
  generateBlockRegions,
  generateDiagonalRegions,
} from "./standard";

// 导出区域辅助函数
export {
  findRegionsContainingCell,
  findRegionsByType,
  findRegionById,
  createCageRegion,
  getCellsInRegion,
  getIntersectionCells,
  isValidRegion,
  generateStandardRegions,
} from "./helpers";
