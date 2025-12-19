/**
 * 将 Uniswap V3 的 sqrtPriceX96 转换为 token1 / token0 的价格（字符串）
 */
export function sqrtPriceX96ToPrice(sqrtPriceX96: number | bigint, decimals0: number, decimals1: number): string {
  const sqrt = BigInt(sqrtPriceX96);
  const Q96 = BigInt(2) ** BigInt(96);

  // price_raw = (sqrt / 2^96)^2 = sqrt^2 / 2^192
  const priceRaw = (sqrt * sqrt) / (Q96 * Q96);

  // 调整小数位：price = priceRaw * 10^(decimals0 - decimals1)
  const shift = decimals0 - decimals1;
  let priceAdjusted;
  if (shift >= 0) {
    priceAdjusted = priceRaw * (BigInt(10) ** BigInt(shift));
  } else {
    priceAdjusted = priceRaw / (BigInt(10) ** BigInt(-shift));
  }

  // 转为字符串并格式化小数
  const str = priceAdjusted.toString();
  const targetDecimals = decimals1;
  if (str.length > targetDecimals) {
    const int = str.slice(0, -targetDecimals);
    const frac = str.slice(-targetDecimals).replace(/0+$/, '');
    return int + (frac ? '.' + frac : '');
  } else {
    const frac = str.padStart(targetDecimals, '0').replace(/0+$/, '');
    return '0.' + (frac || '0');
  }
}

/**
 * 将人类可读价格（token1 / token0）转换为 sqrtPriceX96
 * @param {string|number} price - 例如 "2000.5" 表示 1 token1 = 2000.5 token0
 * @param {number} decimals0 - token0 小数位
 * @param {number} decimals1 - token1 小数位
 * @returns {bigint} sqrtPriceX96
 */
export function priceToSqrtPriceX96(price: { toString: () => any; }, decimals0: number, decimals1: number) {
  // 1. 转为高精度整数：price * 10^decimals1
  const priceStr = price.toString();
  const [intPart, fracPart = ''] = priceStr.split('.');
  const decimalsInPrice = fracPart.length;

  // 目标：price * 10^decimals1
  let priceScaled = BigInt(intPart + fracPart.padEnd(decimalsInPrice, '0'));
  if (decimalsInPrice > 0) {
    priceScaled = priceScaled * (BigInt(10) ** BigInt(decimals1 - decimalsInPrice));
  } else {
    priceScaled = priceScaled * (BigInt(10) ** BigInt(decimals1));
  }

  // 2. 调整 token0 的小数位：price_raw = price * 10^decimals0 / 10^decimals1
  const shift = decimals0 - decimals1;
  let priceRaw;
  if (shift >= 0) {
    priceRaw = priceScaled / (BigInt(10) ** BigInt(shift));
  } else {
    priceRaw = priceScaled * (BigInt(10) ** BigInt(-shift));
  }

  // 3. sqrt(price_raw) * 2^96
  // 使用整数平方根近似（Babylonian method）
  const sqrtPrice = sqrtBigInt(priceRaw);
  const Q96 = BigInt(2) ** BigInt(96);
  return (sqrtPrice * Q96) / BigInt(2 ** 64); // 模拟 Q64.96 向上取整
}

/**
 * 整数平方根（Babylonian 方法）
 */
export function sqrtBigInt(y:  bigint): bigint {
  if (y === 0n || y === 1n) return y;
  let z = y;
  let x = y / 2n + 1n;
  while (x < z) {
    z = x;
    x = (z + y / z) / 2n;
  }
  return z;
}

/**
 * 反向价格（token0 / token1）
 */
export function getReversePrice(priceStr: string) {
  const p = parseFloat(priceStr);
  if (p === 0) return 'Infinity';
  return (1 / p).toFixed(18).replace(/\.?0+$/, '');
}

export function sortTokens(tokenA:string, tokenB:string) {
    // 按照 Uniswap 的规则：按地址十六进制值排序
    const addressA = tokenA.toLowerCase();
    const addressB = tokenB.toLowerCase();

    return addressA < addressB ? [tokenA, tokenB] : [tokenB, tokenA];
}