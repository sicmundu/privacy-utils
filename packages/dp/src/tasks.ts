/**
 * Ready-to-use Differential Privacy Tasks
 * High-level functions for common DP operations
 */

import { sampleNoise, calibrateNoise } from './mechanisms';
import { BudgetTracker } from './budget';
import type { Mechanism, DPBudget, DPResult, ClippingOptions } from './types';

/**
 * Default clipping options
 */
const DEFAULT_CLIPPING: ClippingOptions = {
  enabled: true,
  lower: 0,
  upper: 1,
};

/**
 * Apply clipping to a value
 */
function applyClipping(value: number, options: ClippingOptions): number {
  if (!options.enabled) {
    return value;
  }

  if (options.lower !== undefined && value < options.lower) {
    return options.lower;
  }

  if (options.upper !== undefined && value > options.upper) {
    return options.upper;
  }

  return value;
}

/**
 * Apply clipping to an array of values
 */
function applyClippingToArray(values: number[], options: ClippingOptions): number[] {
  return values.map(value => applyClipping(value, options));
}

/**
 * Calculate sensitivity for sum operation
 */
function calculateSumSensitivity(clip: number): number {
  return clip;
}

/**
 * Calculate sensitivity for mean operation
 */
function calculateMeanSensitivity(clip: number, count: number): number {
  return clip / count;
}

/**
 * Calculate sensitivity for count operation
 */
function calculateCountSensitivity(): number {
  return 1;
}

/**
 * DP Count: Add noise to a count
 */
export function dpCount(
  count: number,
  budget: DPBudget,
  mechanism: Mechanism = 'laplace'
): DPResult<number> {
  const sensitivity = calculateCountSensitivity();
  const params = calibrateNoise(mechanism, sensitivity, budget);
  const noise = sampleNoise(mechanism, params.scale);

  return {
    value: count + noise,
    noise,
    mechanism,
    budget: { ...budget },
    sensitivity,
  };
}

/**
 * DP Sum: Add noise to a sum with clipping
 */
export function dpSum(
  values: number[],
  clip: number,
  budget: DPBudget,
  mechanism: Mechanism = 'laplace',
  clippingOptions: ClippingOptions = DEFAULT_CLIPPING
): DPResult<number> {
  // Apply clipping to each value
  const clippedValues = applyClippingToArray(values, { ...clippingOptions, upper: clip });

  // Calculate sum
  const sum = clippedValues.reduce((acc, val) => acc + val, 0);

  // Calculate sensitivity and add noise
  const sensitivity = calculateSumSensitivity(clip);
  const params = calibrateNoise(mechanism, sensitivity, budget);
  const noise = sampleNoise(mechanism, params.scale);

  return {
    value: sum + noise,
    noise,
    mechanism,
    budget: { ...budget },
    sensitivity,
  };
}

/**
 * DP Mean: Add noise to a mean with clipping
 */
export function dpMean(
  values: number[],
  clip: number,
  budget: DPBudget,
  mechanism: Mechanism = 'laplace',
  clippingOptions: ClippingOptions = DEFAULT_CLIPPING
): DPResult<number> {
  if (values.length === 0) {
    throw new Error('Cannot calculate mean of empty array');
  }

  // Apply clipping to each value
  const clippedValues = applyClippingToArray(values, { ...clippingOptions, upper: clip });

  // Calculate mean
  const sum = clippedValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  // Calculate sensitivity and add noise
  const sensitivity = calculateMeanSensitivity(clip, values.length);
  const params = calibrateNoise(mechanism, sensitivity, budget);
  const noise = sampleNoise(mechanism, params.scale);

  return {
    value: mean + noise,
    noise,
    mechanism,
    budget: { ...budget },
    sensitivity,
  };
}

/**
 * DP Histogram: Add noise to histogram bins
 */
export function dpHistogram(
  bins: number[],
  budget: DPBudget,
  mechanism: Mechanism = 'laplace'
): DPResult<number[]> {
  // For histogram, each bin has sensitivity 1 (adding/removing an item affects one bin)
  const sensitivity = 1;
  const params = calibrateNoise(mechanism, sensitivity, budget);

  // Add noise to each bin independently
  const noisyBins = bins.map(bin => {
    const noise = sampleNoise(mechanism, params.scale);
    return bin + noise;
  });

  return {
    value: noisyBins,
    noise: params.scale, // Representative noise scale
    mechanism,
    budget: { ...budget },
    sensitivity,
  };
}

/**
 * Batch DP operations with budget tracking
 */
export class DPBatchProcessor {
  private tracker: BudgetTracker;
  private results: DPResult<any>[] = [];

  constructor(totalBudget: DPBudget) {
    this.tracker = new BudgetTracker(totalBudget);
  }

  /**
   * Execute DP count with budget tracking
   */
  count(count: number, budget: DPBudget, mechanism: Mechanism = 'laplace'): DPResult<number> {
    this.tracker.spend(budget);
    const result = dpCount(count, budget, mechanism);
    this.results.push(result);
    return result;
  }

  /**
   * Execute DP sum with budget tracking
   */
  sum(values: number[], clip: number, budget: DPBudget, mechanism: Mechanism = 'laplace'): DPResult<number> {
    this.tracker.spend(budget);
    const result = dpSum(values, clip, budget, mechanism);
    this.results.push(result);
    return result;
  }

  /**
   * Execute DP mean with budget tracking
   */
  mean(values: number[], clip: number, budget: DPBudget, mechanism: Mechanism = 'laplace'): DPResult<number> {
    this.tracker.spend(budget);
    const result = dpMean(values, clip, budget, mechanism);
    this.results.push(result);
    return result;
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): DPBudget {
    return this.tracker.getRemaining();
  }

  /**
   * Get all results
   */
  getResults(): DPResult<any>[] {
    return [...this.results];
  }
}

/**
 * Create a batch processor
 */
export function createBatchProcessor(totalBudget: DPBudget): DPBatchProcessor {
  return new DPBatchProcessor(totalBudget);
}
