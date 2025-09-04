/**
 * Key Derivation Functions
 * Uses @noble/hashes PBKDF2 for secure key derivation
 */

import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256, sha384, sha512 } from '@noble/hashes/sha2';

export type KdfHashFunction = 'SHA-256' | 'SHA-384' | 'SHA-512';

/**
 * Derive a key using PBKDF2
 */
export async function deriveKey(
  inputKeyMaterial: Uint8Array,
  salt: Uint8Array,
  outputLength: number,
  hashFunction: KdfHashFunction = 'SHA-256',
  iterations: number = 100000
): Promise<Uint8Array> {
  const hashFn = hashFunction === 'SHA-256' ? sha256 :
                hashFunction === 'SHA-384' ? sha384 :
                sha512;

  const derived = pbkdf2(hashFn, inputKeyMaterial, salt, { c: iterations, dkLen: outputLength });
  return derived;
}

/**
 * Derive a key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  outputLength: number,
  hashFunction: KdfHashFunction = 'SHA-256',
  iterations: number = 100000
): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  return deriveKey(passwordBytes, salt, outputLength, hashFunction, iterations);
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(length: number = 32): Uint8Array {
  const salt = new Uint8Array(length);
  globalThis.crypto.getRandomValues(salt);
  return salt;
}
