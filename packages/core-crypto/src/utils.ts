/**
 * Cryptographic utility functions
 * Including constant-time comparisons and encoding helpers
 */

/**
 * Constant-time comparison to prevent timing attacks
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }

  return result === 0;
}

/**
 * Constant-time comparison for strings
 */
export function constantTimeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  return constantTimeEqual(aBytes, bBytes);
}

/**
 * Securely wipe a Uint8Array (zero out memory)
 */
export function wipe(array: Uint8Array): void {
  for (let i = 0; i < array.length; i++) {
    array[i] = 0;
  }
}

/**
 * Convert Uint8Array to hex string
 */
export function toHex(array: Uint8Array): string {
  return Array.from(array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }

  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) {
      throw new Error('Invalid hex character');
    }
    array[i] = byte;
  }

  return array;
}

/**
 * Convert Uint8Array to base64 string
 */
export function toBase64(array: Uint8Array): string {
  // Use WebCrypto for base64 encoding if available
  if (typeof btoa !== 'undefined') {
    let binary = '';
    array.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }

  // Fallback for Node.js
  if (typeof Buffer !== 'undefined') {
    const buffer = Buffer.from(array);
    return buffer.toString('base64');
  }

  throw new Error('No base64 encoding method available');
}

/**
 * Convert base64 string to Uint8Array
 */
export function fromBase64(base64: string): Uint8Array {
  // Use WebCrypto for base64 decoding if available
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return array;
  }

  // Fallback for Node.js
  if (typeof Buffer !== 'undefined') {
    const buffer = Buffer.from(base64, 'base64');
    return new Uint8Array(buffer);
  }

  throw new Error('No base64 decoding method available');
}

/**
 * Concatenate multiple Uint8Arrays
 */
export function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, array) => sum + array.length, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
}

/**
 * Generate a cryptographically secure random string
 */
export function randomString(length: number, charset: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string {
  if (length < 0) {
    throw new Error('Length must be non-negative');
  }

  let result = '';
  const charsetLength = charset.length;

  while (result.length < length) {
    const randomBytes = new Uint8Array(Math.min(length - result.length, 256));
    globalThis.crypto.getRandomValues(randomBytes);

    for (const byte of randomBytes) {
      if (result.length >= length) break;

      const index = byte % charsetLength;
      result += charset[index];
    }
  }

  return result;
}

/**
 * Validate that a value is a valid Uint8Array
 */
export function validateUint8Array(value: unknown, name: string): Uint8Array {
  if (!(value instanceof Uint8Array)) {
    throw new Error(`${name} must be a Uint8Array`);
  }

  if (value.length === 0) {
    throw new Error(`${name} must not be empty`);
  }

  return value;
}
