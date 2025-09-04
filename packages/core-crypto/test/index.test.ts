import { describe, it, expect } from 'vitest';
import {
  randomBytes,
  random,
  randomInt,
  shuffle,
  sample,
} from '../src/rng';
import { deriveKey, generateSalt } from '../src/kdf';
import { computeHmac, verifyHmac } from '../src/mac';
import { toHex, fromHex, constantTimeEqual } from '../src/utils';

describe('Core Crypto', () => {
  describe('RNG', () => {
    it('should generate random bytes', () => {
      const bytes = randomBytes(32);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });

    it('should generate random number between 0 and 1', () => {
      const num = random();
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThan(1);
    });

    it('should generate random integer in range', () => {
      const num = randomInt(5, 10);
      expect(num).toBeGreaterThanOrEqual(5);
      expect(num).toBeLessThan(10);
      expect(Number.isInteger(num)).toBe(true);
    });

    it('should shuffle array', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      expect(shuffled).toHaveLength(5);
      expect(shuffled).toContain(1);
      expect(shuffled).toContain(2);
      expect(shuffled).toContain(3);
      expect(shuffled).toContain(4);
      expect(shuffled).toContain(5);
    });

    it('should sample unique elements', () => {
      const array = [1, 2, 3, 4, 5];
      const sampled = sample(array, 3);
      expect(sampled).toHaveLength(3);
      const unique = new Set(sampled);
      expect(unique.size).toBe(3);
    });
  });

  describe('KDF', () => {
    it('should derive key', () => {
      const inputKey = new Uint8Array(32);
      const salt = generateSalt();
      const info = new TextEncoder().encode('test');
      const derived = deriveKey(inputKey, salt, info, 32);
      expect(derived).toBeInstanceOf(Uint8Array);
      expect(derived.length).toBe(32);
    });

    it('should generate salt', () => {
      const salt = generateSalt(16);
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });
  });

  describe('MAC', () => {
    it('should compute and verify HMAC', () => {
      const key = new Uint8Array(32);
      const message = new TextEncoder().encode('test message');
      const mac = computeHmac(key, message);
      const isValid = verifyHmac(key, message, mac);
      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC', () => {
      const key = new Uint8Array(32);
      const message = new TextEncoder().encode('test message');
      const mac = computeHmac(key, message);
      const invalidMac = new Uint8Array(mac.length);
      invalidMac[0] = 255; // Change first byte
      const isValid = verifyHmac(key, message, invalidMac);
      expect(isValid).toBe(false);
    });
  });

  describe('Utils', () => {
    it('should convert to/from hex', () => {
      const original = new Uint8Array([1, 2, 3, 255]);
      const hex = toHex(original);
      const back = fromHex(hex);
      expect(back).toEqual(original);
    });

    it('should perform constant time comparison', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3]);
      const c = new Uint8Array([1, 2, 4]);
      expect(constantTimeEqual(a, b)).toBe(true);
      expect(constantTimeEqual(a, c)).toBe(false);
    });
  });
});
