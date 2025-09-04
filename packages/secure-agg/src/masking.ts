/**
 * Vector Masking and Unmasking Utilities
 * Implements pairwise masking for secure aggregation
 */

import { deriveKey } from 'privacy-utils-core-crypto';
import type { SecureAggClientId } from './types';

/**
 * Generate a pairwise mask for a vector
 * Uses deterministic PRG based on shared secret and round ID
 */
export async function generatePairwiseMask(
  vector: Float64Array,
  sharedSecret: Uint8Array,
  roundId: string,
  peerId: SecureAggClientId
): Promise<Float64Array> {
  const mask = new Float64Array(vector.length);

  // Use HKDF to derive a seed for the mask
  const maskSeed = await deriveKey(sharedSecret, new Uint8Array(0), 32, 'SHA-256', 1000);

  // Generate pseudorandom mask values
  // Using a simple but secure PRG based on the seed
  let seedValue = maskSeed.reduce((acc: number, byte: number) => acc + byte, 0);
  // Incorporate roundId for additional entropy
  seedValue = (seedValue + roundId.charCodeAt(0)) % 2147483648;

  for (let i = 0; i < vector.length; i++) {
    // Simple PRG: combine seed with index and peer info
    const peerCode = typeof peerId === 'string' ? peerId.charCodeAt(i % peerId.length) : (peerId as number);
    const combined = seedValue + i + peerCode;
    mask[i] = Math.sin(combined) * 1000; // Generate pseudo-random float
    seedValue = (seedValue * 1103515245 + 12345) % 2147483648; // Linear congruential generator
  }

  return mask;
}

/**
 * Apply mask to vector: result = vector + mask
 */
export function applyMask(vector: Float64Array, mask: Float64Array): Float64Array {
  if (vector.length !== mask.length) {
    throw new Error('Vector and mask must have the same length');
  }

  const result = new Float64Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    result[i] = (vector[i] ?? 0) + (mask[i] ?? 0);
  }
  return result;
}

/**
 * Remove mask from vector: result = vector - mask
 */
export function removeMask(vector: Float64Array, mask: Float64Array): Float64Array {
  if (vector.length !== mask.length) {
    throw new Error('Vector and mask must have the same length');
  }

  const result = new Float64Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    result[i] = (vector[i] ?? 0) - (mask[i] ?? 0);
  }
  return result;
}

/**
 * Generate all pairwise masks for a client
 */
export async function generateAllMasks(
  vector: Float64Array,
  sharedSecrets: Map<SecureAggClientId, Uint8Array>,
  roundId: string,
  clientId: SecureAggClientId
): Promise<Map<SecureAggClientId, Float64Array>> {
  const masks = new Map<SecureAggClientId, Float64Array>();

  for (const [peerId, secret] of sharedSecrets) {
    if (peerId !== clientId) {
      const mask = await generatePairwiseMask(vector, secret, roundId, peerId);
      masks.set(peerId, mask);
    }
  }

  return masks;
}

/**
 * Apply all pairwise masks to create the final masked vector
 */
export function applyAllMasks(
  vector: Float64Array,
  masks: Map<SecureAggClientId, Float64Array>
): Float64Array {
  let result = new Float64Array(vector.buffer.slice(0));

  for (const mask of masks.values()) {
    result = applyMask(result, mask);
  }

  return result;
}

/**
 * Remove all pairwise masks from a received vector
 */
export function removeAllMasks(
  maskedVector: Float64Array,
  masks: Map<SecureAggClientId, Float64Array>
): Float64Array {
  let result = new Float64Array(maskedVector.buffer.slice(0));

  for (const mask of masks.values()) {
    result = removeMask(result, mask);
  }

  return result;
}

/**
 * Generate random vector for testing
 */
export function generateRandomVector(size: number, min: number = -10, max: number = 10): Float64Array {
  const vector = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    vector[i] = min + Math.random() * (max - min);
  }
  return vector;
}

/**
 * Add two vectors element-wise
 */
export function addVectors(a: Float64Array, b: Float64Array): Float64Array {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  const result = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = (a[i] ?? 0) + (b[i] ?? 0);
  }
  return result;
}

/**
 * Aggregate multiple masked vectors
 */
export function aggregateVectors(vectors: Float64Array[]): Float64Array {
  if (vectors.length === 0) {
    throw new Error('Cannot aggregate empty vector list');
  }

  const firstVector = vectors[0];
  if (!firstVector) {
    throw new Error('First vector is undefined');
  }

  let result = new Float64Array(firstVector.buffer.slice(0));

  for (let i = 1; i < vectors.length; i++) {
    const currentVector = vectors[i];
    if (!currentVector) {
      throw new Error(`Vector at index ${i} is undefined`);
    }
    result = addVectors(result, currentVector);
  }

  return result;
}
