/**
 * Message Authentication Codes
 * Uses WebCrypto HMAC for secure message authentication
 */

// Ensure crypto is available in Node.js environments
const cryptoAPI = globalThis.crypto || require('crypto').webcrypto;

export type HashFunction = 'SHA-256' | 'SHA-384' | 'SHA-512';

/**
 * Compute HMAC for a message using WebCrypto
 */
export async function computeHmac(
  key: Uint8Array,
  message: Uint8Array,
  hashFunction: HashFunction = 'SHA-256'
): Promise<Uint8Array> {
  const cryptoKey = await cryptoAPI.subtle.importKey(
    'raw',
    key as unknown as ArrayBuffer,
    { name: 'HMAC', hash: hashFunction },
    false,
    ['sign']
  );

  const signature = await cryptoAPI.subtle.sign('HMAC', cryptoKey, message as unknown as ArrayBuffer);
  return new Uint8Array(signature);
}

/**
 * Verify HMAC for a message using WebCrypto
 */
export async function verifyHmac(
  key: Uint8Array,
  message: Uint8Array,
  expectedMac: Uint8Array,
  hashFunction: HashFunction = 'SHA-256'
): Promise<boolean> {
  const computedMac = await computeHmac(key, message, hashFunction);

  // Constant-time comparison to prevent timing attacks
  if (computedMac.length !== expectedMac.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < computedMac.length; i++) {
    result |= (computedMac[i] ?? 0) ^ (expectedMac[i] ?? 0);
  }

  return result === 0;
}

/**
 * Generate a random key for HMAC
 */
export function generateHmacKey(length: number = 32): Uint8Array {
  const key = new Uint8Array(length);
  cryptoAPI.getRandomValues(key);
  return key;
}

/**
 * HMAC-based Key Derivation Function (HKDF) step using WebCrypto
 */
export async function hkdfExtract(
  salt: Uint8Array,
  inputKeyMaterial: Uint8Array,
  hashFunction: HashFunction = 'SHA-256'
): Promise<Uint8Array> {
  if (salt.length === 0) {
    // If salt is empty, use a salt of zeros with appropriate length
    const hashLen = hashFunction === 'SHA-256' ? 32 : hashFunction === 'SHA-384' ? 48 : 64;
    salt = new Uint8Array(hashLen);
  }

  const cryptoKey = await cryptoAPI.subtle.importKey(
    'raw',
    salt as unknown as ArrayBuffer,
    { name: 'HMAC', hash: hashFunction },
    false,
    ['sign']
  );

  const signature = await cryptoAPI.subtle.sign('HMAC', cryptoKey, inputKeyMaterial as unknown as ArrayBuffer);
  return new Uint8Array(signature);
}
