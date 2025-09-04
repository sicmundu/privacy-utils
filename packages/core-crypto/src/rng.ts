/**
 * Secure Random Number Generation
 * Uses crypto.getRandomValues() for cross-platform compatibility
 */

/**
 * Generate cryptographically secure random bytes
 */
export function randomBytes(length: number): Uint8Array {
  if (length < 0 || length > 65536) {
    throw new Error('Length must be between 0 and 65536');
  }

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

/**
 * Generate a cryptographically secure random number between 0 and 1
 */
export function random(): number {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);

  // Convert 4 bytes to a number between 0 and 1
  // Using the same approach as Math.random() but with secure randomness
  const view = new DataView(array.buffer);
  const randomValue = view.getUint32(0, true) / 0x100000000;

  return randomValue;
}

/**
 * Generate a cryptographically secure random integer in the specified range
 */
export function randomInt(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error('min and max must be integers');
  }

  if (min >= max) {
    throw new Error('min must be less than max');
  }

  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValid = Math.floor(0x100 ** bytesNeeded / range) * range;

  let result: number;
  do {
    const array = randomBytes(bytesNeeded);
    result = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      result = (result << 8) + (array[i] ?? 0);
    }
  } while (result >= maxValid);

  return min + (result % range);
}

/**
 * Shuffle an array using Fisher-Yates algorithm with secure randomness
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

/**
 * Sample n unique elements from an array
 */
export function sample<T>(array: T[], n: number): T[] {
  if (n > array.length) {
    throw new Error('Cannot sample more elements than available');
  }

  const shuffled = shuffle(array);
  return shuffled.slice(0, n);
}
