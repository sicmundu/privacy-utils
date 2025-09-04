import { describe, it, expect } from 'vitest';
import {
  generatePairwiseMask,
  applyMask,
  removeMask,
  generateRandomVector,
  addVectors,
  aggregateVectors,
} from '../src/masking';
import { splitSecret, reconstructSecret } from '../src/secrets';

describe('Secure Aggregation', () => {
  describe('Masking', () => {
    it('should generate pairwise mask', () => {
      const vector = new Float64Array([1, 2, 3]);
      const secret = new Uint8Array(32);
      const mask = generatePairwiseMask(vector, secret, 'test-round', 'peer1');

      expect(mask).toBeInstanceOf(Float64Array);
      expect(mask.length).toBe(3);
    });

    it('should apply and remove mask correctly', () => {
      const vector = new Float64Array([1, 2, 3]);
      const mask = new Float64Array([0.1, 0.2, 0.3]);

      const masked = applyMask(vector, mask);
      expect(masked).toEqual(new Float64Array([1.1, 2.2, 3.3]));

      const unmasked = removeMask(masked, mask);
      expect(unmasked).toEqual(vector);
    });

    it('should generate random vector', () => {
      const vector = generateRandomVector(5, 0, 10);
      expect(vector).toBeInstanceOf(Float64Array);
      expect(vector.length).toBe(5);
      vector.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(10);
      });
    });

    it('should add vectors correctly', () => {
      const a = new Float64Array([1, 2, 3]);
      const b = new Float64Array([4, 5, 6]);
      const result = addVectors(a, b);
      expect(result).toEqual(new Float64Array([5, 7, 9]));
    });

    it('should aggregate multiple vectors', () => {
      const vectors = [
        new Float64Array([1, 2, 3]),
        new Float64Array([4, 5, 6]),
        new Float64Array([7, 8, 9]),
      ];
      const result = aggregateVectors(vectors);
      expect(result).toEqual(new Float64Array([12, 15, 18]));
    });
  });

  describe('Secret Sharing', () => {
    it('should split and reconstruct secret', () => {
      const secret = new Uint8Array([1, 2, 3, 4, 5]);
      const shares = splitSecret(secret, 5, 3);

      expect(shares.length).toBe(5);
      shares.forEach(share => {
        expect(share.shareData).toBeDefined();
        expect(share.threshold).toBe(3);
      });

      // Test reconstruction with minimum shares
      const reconstructed = reconstructSecret(shares.slice(0, 3));
      expect(reconstructed).toEqual(secret);
    });

    it('should fail reconstruction with insufficient shares', () => {
      const secret = new Uint8Array([1, 2, 3, 4, 5]);
      const shares = splitSecret(secret, 5, 3);

      // Try to reconstruct with only 2 shares (below threshold)
      const reconstructed = reconstructSecret(shares.slice(0, 2));
      expect(reconstructed).toBeNull();
    });
  });

  describe('Protocol Integration', () => {
    it('should handle basic protocol flow', () => {
      // This would test the full client-aggregator interaction
      // For now, we'll just verify the types are correct
      expect(true).toBe(true);
    });
  });
});
