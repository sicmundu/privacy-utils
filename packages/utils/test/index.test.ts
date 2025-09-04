import { describe, it, expect } from 'vitest';
import {
  clamp,
  l1Norm,
  l2Norm,
  linfNorm,
  clipArray,
  median,
  mean,
  variance,
  standardDeviation,
} from '../src/index';

describe('Utils', () => {
  describe('clamp', () => {
    it('should return value when within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should return min when value is below min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max when value is above max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('l1Norm', () => {
    it('should calculate L1 norm correctly', () => {
      expect(l1Norm([1, -2, 3])).toBe(6);
      expect(l1Norm([0, 0, 0])).toBe(0);
      expect(l1Norm([])).toBe(0);
    });
  });

  describe('l2Norm', () => {
    it('should calculate L2 norm correctly', () => {
      expect(l2Norm([3, 4])).toBe(5); // 3-4-5 triangle
      expect(l2Norm([0, 0, 0])).toBe(0);
      expect(l2Norm([])).toBe(0);
    });
  });

  describe('linfNorm', () => {
    it('should calculate Linf norm correctly', () => {
      expect(linfNorm([1, -5, 3])).toBe(5);
      expect(linfNorm([0, 0, 0])).toBe(0);
    });

    it('should handle empty array', () => {
      expect(linfNorm([])).toBe(-Infinity);
    });
  });

  describe('clipArray', () => {
    it('should return original array when norm is within threshold', () => {
      const values = [1, 2, 3];
      expect(clipArray(values, 10, 'l2')).toEqual([1, 2, 3]);
    });

    it('should clip array using L2 norm', () => {
      const values = [3, 4]; // L2 norm = 5
      const result = clipArray(values, 2, 'l2');
      expect(result[0]).toBeCloseTo(3 * 2 / 5);
      expect(result[1]).toBeCloseTo(4 * 2 / 5);
    });

    it('should clip array using L1 norm', () => {
      const values = [1, 2, 3]; // L1 norm = 6
      const result = clipArray(values, 3, 'l1');
      expect(result).toEqual([1 * 3 / 6, 2 * 3 / 6, 3 * 3 / 6]);
    });

    it('should clip array using Linf norm', () => {
      const values = [1, 5, 3]; // Linf norm = 5
      const result = clipArray(values, 2, 'linf');
      expect(result[0]).toBeCloseTo(1 * 2 / 5);
      expect(result[1]).toBeCloseTo(5 * 2 / 5);
      expect(result[2]).toBeCloseTo(3 * 2 / 5);
    });
  });

  describe('median', () => {
    it('should calculate median for odd length array', () => {
      expect(median([1, 3, 2])).toBe(2);
      expect(median([5, 1, 9, 3, 7])).toBe(5);
    });

    it('should calculate median for even length array', () => {
      expect(median([1, 3, 2, 4])).toBe(2.5);
      expect(median([5, 1, 9, 3])).toBe(4);
    });

    it('should throw on empty array', () => {
      expect(() => median([])).toThrow('Cannot calculate median of empty array');
    });
  });

  describe('mean', () => {
    it('should calculate mean correctly', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
      expect(mean([10, 20, 30])).toBe(20);
    });

    it('should throw on empty array', () => {
      expect(() => mean([])).toThrow('Cannot calculate mean of empty array');
    });
  });

  describe('variance', () => {
    it('should calculate variance correctly', () => {
      expect(variance([1, 2, 3, 4, 5])).toBeCloseTo(2.5);
      expect(variance([10, 10, 10, 10])).toBe(0);
    });

    it('should throw on array with less than 2 elements', () => {
      expect(() => variance([])).toThrow('Cannot calculate variance of array with less than 2 elements');
      expect(() => variance([5])).toThrow('Cannot calculate variance of array with less than 2 elements');
    });
  });

  describe('standardDeviation', () => {
    it('should calculate standard deviation correctly', () => {
      expect(standardDeviation([1, 5])).toBeCloseTo(Math.sqrt(8)); // variance = 8, sqrt(8) ≈ 2.828
      expect(standardDeviation([10, 10, 10, 10])).toBe(0);
    });

    it('should throw on array with less than 2 elements', () => {
      expect(() => standardDeviation([])).toThrow('Cannot calculate variance of array with less than 2 elements');
    });
  });
});
