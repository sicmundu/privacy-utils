import { describe, it, expect } from 'vitest';
import {
  sampleLaplace,
  sampleGaussian,
  sampleDiscreteGaussian,
  calibrateNoise,
  dpCount,
  dpSum,
  dpMean,
  dpHistogram,
  composeBudgets,
  createBudgetTracker,
  createBatchProcessor,
} from '../src';

describe('Differential Privacy', () => {
  describe('Noise Mechanisms', () => {
    it('should sample Laplace noise', () => {
      const noise = sampleLaplace(1.0);
      expect(typeof noise).toBe('number');
      expect(Number.isFinite(noise)).toBe(true);
    });

    it('should sample Gaussian noise', () => {
      const noise = sampleGaussian(1.0);
      expect(typeof noise).toBe('number');
      expect(Number.isFinite(noise)).toBe(true);
    });

    it('should sample discrete Gaussian noise', () => {
      const noise = sampleDiscreteGaussian(1.0);
      expect(typeof noise).toBe('number');
      expect(Number.isInteger(noise)).toBe(true);
    });

    it('should calibrate Laplace noise', () => {
      const params = calibrateNoise('laplace', 1.0, { epsilon: 0.1 });
      expect(params.scale).toBeGreaterThan(0);
      expect(params.mechanism).toBe('laplace');
    });

    it('should calibrate Gaussian noise', () => {
      const params = calibrateNoise('gaussian', 1.0, { epsilon: 0.1, delta: 1e-6 });
      expect(params.scale).toBeGreaterThan(0);
      expect(params.mechanism).toBe('gaussian');
    });
  });

  describe('DP Tasks', () => {
    it('should execute DP count', () => {
      const result = dpCount(100, { epsilon: 0.1 }, 'laplace');
      expect(result.value).toBeDefined();
      expect(typeof result.noise).toBe('number');
      expect(result.mechanism).toBe('laplace');
      expect(result.budget.epsilon).toBe(0.1);
    });

    it('should execute DP sum', () => {
      const values = [1, 2, 3, 4, 5];
      const result = dpSum(values, 10, { epsilon: 0.1 }, 'laplace');
      expect(result.value).toBeDefined();
      expect(typeof result.noise).toBe('number');
      expect(result.sensitivity).toBe(10);
    });

    it('should execute DP mean', () => {
      const values = [1, 2, 3, 4, 5];
      const result = dpMean(values, 10, { epsilon: 0.1 }, 'laplace');
      expect(result.value).toBeDefined();
      expect(typeof result.noise).toBe('number');
      expect(result.sensitivity).toBe(2); // 10/5
    });

    it('should execute DP histogram', () => {
      const bins = [10, 20, 30, 40];
      const result = dpHistogram(bins, { epsilon: 0.1 }, 'laplace');
      expect(result.value).toHaveLength(4);
      expect(result.value.every(v => typeof v === 'number')).toBe(true);
      expect(result.sensitivity).toBe(1);
    });
  });

  describe('Budget Management', () => {
    it('should compose budgets', () => {
      const budgets = [
        { epsilon: 0.1 },
        { epsilon: 0.2 },
        { epsilon: 0.3, delta: 1e-6 },
      ];
      const composed = composeBudgets(budgets);
      expect(composed.epsilon).toBeCloseTo(0.6);
      expect(composed.delta).toBeCloseTo(1e-6);
    });

    it('should track budget spending', () => {
      const tracker = createBudgetTracker({ epsilon: 1.0, delta: 1e-5 });
      expect(tracker.canSpend({ epsilon: 0.5 })).toBe(true);

      tracker.spend({ epsilon: 0.3 });
      expect(tracker.getSpent().epsilon).toBe(0.3);
      expect(tracker.getRemaining().epsilon).toBe(0.7);
    });

    it('should prevent overspending', () => {
      const tracker = createBudgetTracker({ epsilon: 0.5 });
      expect(tracker.canSpend({ epsilon: 1.0 })).toBe(false);

      expect(() => tracker.spend({ epsilon: 1.0 })).toThrow('Insufficient privacy budget');
    });
  });

  describe('Batch Processing', () => {
    it('should process batch operations with budget tracking', () => {
      const processor = createBatchProcessor({ epsilon: 1.0 });

      processor.count(100, { epsilon: 0.3 });
      processor.sum([1, 2, 3], 10, { epsilon: 0.4 });

      const remaining = processor.getRemainingBudget();
      expect(remaining.epsilon).toBeCloseTo(0.3); // 1.0 - 0.3 - 0.4

      const results = processor.getResults();
      expect(results).toHaveLength(2);
    });
  });
});
