/**
 * Authenticated Encryption with Associated Data
 * Uses AES-GCM via WebCrypto API for secure encryption
 */

export interface AeadResult {
  ciphertext: Uint8Array;
  tag: Uint8Array;
  nonce: Uint8Array;
}

/**
 * Encrypt plaintext using AES-GCM
 */
export async function encrypt(
  key: Uint8Array,
  plaintext: Uint8Array,
  associatedData?: Uint8Array
): Promise<AeadResult> {
  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes (256 bits) for AES-256-GCM');
  }

  // Generate random nonce (96 bits = 12 bytes is recommended for GCM)
  const nonce = new Uint8Array(12);
  globalThis.crypto.getRandomValues(nonce);

  // Import key for WebCrypto
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    key as unknown as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Prepare additional data
  const additionalData = associatedData ?? new Uint8Array(0);

  // Encrypt
  const encrypted = await globalThis.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce as unknown as ArrayBuffer,
      additionalData: additionalData as unknown as ArrayBuffer,
    },
    cryptoKey,
    plaintext as unknown as ArrayBuffer
  );

  // Extract ciphertext and tag (GCM tag is appended to ciphertext)
  const encryptedArray = new Uint8Array(encrypted);
  const tagLength = 16; // 128-bit tag for GCM
  const ciphertext = encryptedArray.slice(0, -tagLength);
  const tag = encryptedArray.slice(-tagLength);

  return {
    ciphertext,
    tag,
    nonce,
  };
}

/**
 * Decrypt ciphertext using AES-GCM
 */
export async function decrypt(
  key: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array,
  nonce: Uint8Array,
  associatedData?: Uint8Array
): Promise<Uint8Array> {
  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes (256 bits) for AES-256-GCM');
  }

  if (nonce.length !== 12) {
    throw new Error('Nonce must be 12 bytes for AES-GCM');
  }

  if (tag.length !== 16) {
    throw new Error('Tag must be 16 bytes for AES-GCM');
  }

  // Import key for WebCrypto
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    key as unknown as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Combine ciphertext and tag
  const encrypted = new Uint8Array(ciphertext.length + tag.length);
  encrypted.set(ciphertext);
  encrypted.set(tag, ciphertext.length);

  // Prepare additional data
  const additionalData = associatedData ?? new Uint8Array(0);

  try {
    // Decrypt
    const decrypted = await globalThis.crypto.subtle.decrypt(
          {
      name: 'AES-GCM',
      iv: nonce as unknown as ArrayBuffer,
      additionalData: additionalData as unknown as ArrayBuffer,
    },
    cryptoKey,
    encrypted as unknown as ArrayBuffer
    );

    return new Uint8Array(decrypted);
  } catch {
    throw new Error('Decryption failed: invalid key, nonce, or authentication tag');
  }
}

/**
 * Generate a random key for AES-GCM encryption
 */
export function generateKey(): Uint8Array {
  const key = new Uint8Array(32); // 256 bits
  globalThis.crypto.getRandomValues(key);
  return key;
}

/**
 * Encrypt a string using AES-GCM
 */
export async function encryptString(
  key: Uint8Array,
  plaintext: string,
  associatedData?: Uint8Array
): Promise<AeadResult> {
  const plaintextBytes = new TextEncoder().encode(plaintext);
  return encrypt(key, plaintextBytes, associatedData);
}

/**
 * Decrypt to string using AES-GCM
 */
export async function decryptString(
  key: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array,
  nonce: Uint8Array,
  associatedData?: Uint8Array
): Promise<string> {
  const plaintextBytes = await decrypt(key, ciphertext, tag, nonce, associatedData);
  return new TextDecoder().decode(plaintextBytes);
}
