/**
 * Mathematical and statistical utilities
 */

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate L1 norm (sum of absolute values)
 */
export function l1Norm(values: number[]): number {
  return values.reduce((sum, value) => sum + Math.abs(value), 0);
}

/**
 * Calculate L2 norm (Euclidean norm)
 */
export function l2Norm(values: number[]): number {
  const sumSquares = values.reduce((sum, value) => sum + value * value, 0);
  return Math.sqrt(sumSquares);
}

/**
 * Calculate Linf norm (maximum absolute value)
 */
export function linfNorm(values: number[]): number {
  return Math.max(...values.map(Math.abs));
}

/**
 * Apply clipping to an array using specified norm
 */
export function clipArray(
  values: number[],
  threshold: number,
  norm: 'l1' | 'l2' | 'linf' = 'l2'
): number[] {
  const currentNorm = norm === 'l1' ? l1Norm(values) :
                     norm === 'l2' ? l2Norm(values) :
                     linfNorm(values);

  if (currentNorm <= threshold) {
    return [...values];
  }

  const scale = threshold / currentNorm;
  return values.map(value => value * scale);
}

/**
 * Calculate median of an array
 */
export function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate median of empty array');
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  } else {
    return sorted[mid]!;
  }
}

/**
 * Calculate mean of an array
 */
export function mean(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate mean of empty array');
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Calculate variance of an array
 */
export function variance(values: number[]): number {
  if (values.length < 2) {
    throw new Error('Cannot calculate variance of array with less than 2 elements');
  }

  const avg = mean(values);
  const squaredDiffs = values.map(value => (value - avg) ** 2);
  return squaredDiffs.reduce((sum, value) => sum + value, 0) / (values.length - 1);
}

/**
 * Calculate standard deviation of an array
 */
export function standardDeviation(values: number[]): number {
  return Math.sqrt(variance(values));
}
