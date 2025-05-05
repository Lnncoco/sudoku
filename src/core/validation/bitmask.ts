/**
 * @fileoverview 位运算优化的核心实现
 * 使用位运算加速数独验证和候选数计算
 */

/**
 * 将数字转换为位掩码
 * 例如：值为 3 转换为二进制 100 (位索引为 3 的位置是 1)
 *
 * @param value 要转换的数字，范围为 1-31
 * @returns 对应的位掩码
 */
export function valueToBitmask(value: number): number {
  if (value <= 0 || value > 31) {
    return 0; // 超出范围返回空掩码
  }
  return 1 << value; // 将 1 左移 value 位
}

/**
 * 从位掩码中获取所有设置了的值
 *
 * @param bitmask 位掩码
 * @returns 包含所有设置了的值的数组
 */
export function valuesFromBitmask(bitmask: number): number[] {
  const values: number[] = [];

  // 最多支持到 31 (因为 JS 中 number 是 32 位有符号整数)
  for (let value = 1; value <= 31; value++) {
    if ((bitmask & (1 << value)) !== 0) {
      values.push(value);
    }
  }

  return values;
}

/**
 * 检查位掩码中是否设置了特定值
 *
 * @param bitmask 位掩码
 * @param value 要检查的值
 * @returns 该值是否在位掩码中
 */
export function hasBit(bitmask: number, value: number): boolean {
  if (value <= 0 || value > 31) {
    return false;
  }
  return (bitmask & (1 << value)) !== 0;
}

/**
 * 向位掩码添加一个值
 *
 * @param bitmask 原始位掩码
 * @param value 要添加的值
 * @returns 新的位掩码
 */
export function addBit(bitmask: number, value: number): number {
  if (value <= 0 || value > 31) {
    return bitmask; // 值超出范围，保持原掩码不变
  }
  return bitmask | (1 << value);
}

/**
 * 从位掩码移除一个值
 *
 * @param bitmask 原始位掩码
 * @param value 要移除的值
 * @returns 新的位掩码
 */
export function removeBit(bitmask: number, value: number): number {
  if (value <= 0 || value > 31) {
    return bitmask; // 值超出范围，保持原掩码不变
  }
  return bitmask & ~(1 << value);
}

/**
 * 计算位掩码中设置的位的数量
 *
 * @param bitmask 位掩码
 * @returns 设置的位的数量
 */
export function countBits(bitmask: number): number {
  let count = 0;
  // 遍历所有可能的位
  for (let value = 1; value <= 31; value++) {
    if ((bitmask & (1 << value)) !== 0) {
      count++;
    }
  }
  return count;
}

/**
 * 创建从 1 到 size 的所有数字的位掩码
 *
 * @param size 网格尺寸
 * @returns 包含 1 到 size 所有数字的位掩码
 */
export function createFullBitmask(size: number): number {
  if (size <= 0 || size > 31) {
    throw new Error(`不支持的网格尺寸: ${size}，最大支持 31`);
  }

  // 创建 1 到 size 的所有数字的位掩码
  // 例如: size=9 生成 0b1111111110 (1-9的位都是1)
  return (1 << (size + 1)) - 2; // -2 是为了排除 0 位
}
