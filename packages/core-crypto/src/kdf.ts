/**
 * Key Derivation Functions
 * Uses WebCrypto PBKDF2 for secure key derivation
 */

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
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    inputKeyMaterial as unknown as ArrayBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: iterations,
      hash: hashFunction,
    },
    cryptoKey,
    outputLength * 8 // Convert bytes to bits
  );

  return new Uint8Array(derivedBits);
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
  crypto.getRandomValues(salt);
  return salt;
}
