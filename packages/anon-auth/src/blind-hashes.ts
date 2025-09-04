/**
 * Blind Hash Functions
 * Implementation of blind hashing for anonymous identity verification
 */

import { randomBytes, deriveKey, toHex, fromHex } from 'privacy-utils-core-crypto';
import type {
  BlindHash,
  BlindHashVerificationRequest,
  BlindHashVerificationResponse,
} from './types';

/**
 * Create a blind hash from input data
 */
export async function createBlindHash(
  input: string | Uint8Array,
  serverKey: Uint8Array,
  rounds: number = 1000
): Promise<BlindHash> {
  // Convert input to bytes if it's a string
  const inputBytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;

  // Generate blinding factor
  const blindingFactor = randomBytes(32);
  const blindId = `blind_${Date.now()}_${toHex(randomBytes(8))}`;

  // Create blinded input
  const blindedInput = await applyBlinding(inputBytes, blindingFactor, serverKey, rounds);

  // Store original hash for later verification
  const originalHash = await deriveKey(serverKey, inputBytes, 32, 'SHA-256', rounds);

  return {
    blindId,
    blindedInput,
    unblinder: blindingFactor,
    originalHash,
  };
}

/**
 * Apply blinding to input data
 */
async function applyBlinding(
  input: Uint8Array,
  blindingFactor: Uint8Array,
  serverKey: Uint8Array,
  rounds: number
): Promise<Uint8Array> {
  // Create blinding mask using server key and blinding factor
  const blindingMask = await deriveKey(
    serverKey,
    blindingFactor,
    input.length,
    'SHA-256',
    rounds
  );

  // Ensure blinding mask has correct length
  if (blindingMask.length < input.length) {
    throw new Error('Blinding mask length is insufficient');
  }

  // Apply blinding: blinded = input ⊕ blindingMask
  const blinded = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    blinded[i] = (input[i] ?? 0) ^ (blindingMask[i] ?? 0);
  }

  return blinded;
}

/**
 * Remove blinding from server response
 */
async function removeBlinding(
  response: Uint8Array,
  blindingFactor: Uint8Array,
  serverKey: Uint8Array,
  rounds: number
): Promise<Uint8Array> {
  // Recreate the same blinding mask
  const blindingMask = await deriveKey(
    serverKey,
    blindingFactor,
    response.length,
    'SHA-256',
    rounds
  );

  // Ensure blinding mask has correct length
  if (blindingMask.length < response.length) {
    throw new Error('Blinding mask length is insufficient');
  }

  // Remove blinding: unblinded = response ⊕ blindingMask
  const unblinded = new Uint8Array(response.length);
  for (let i = 0; i < response.length; i++) {
    unblinded[i] = (response[i] ?? 0) ^ (blindingMask[i] ?? 0);
  }

  return unblinded;
}

/**
 * Server-side processing of blind hash
 */
export async function processBlindHash(
  blindedInput: Uint8Array,
  serverKey: Uint8Array,
  rounds: number = 1000
): Promise<Uint8Array> {
  // Server computes hash of blinded input
  return deriveKey(serverKey, blindedInput, 32, 'SHA-256', rounds);
}

/**
 * Verify blind hash on client side
 */
export async function verifyBlindHash(
  blindHash: BlindHash,
  serverResponse: Uint8Array,
  serverKey: Uint8Array,
  rounds: number = 1000
): Promise<boolean> {
  // Remove blinding from server response
  const unblindedResponse = await removeBlinding(
    serverResponse,
    blindHash.unblinder,
    serverKey,
    rounds
  );

  // Compare with expected original hash
  return unblindedResponse.every((byte, index) =>
    byte === blindHash.originalHash[index]
  );
}

/**
 * Server-side verification of blind hash (alternative approach)
 */
export async function serverVerifyBlindHash(
  request: BlindHashVerificationRequest,
  serverKey: Uint8Array,
  rounds: number = 1000
): Promise<BlindHashVerificationResponse> {
  const { blindHash, expectedValue } = request;

  try {
    // Process the blinded input
    const serverResponse = await processBlindHash(
      blindHash.blindedInput,
      serverKey,
      rounds
    );

    if (expectedValue) {
      // If expected value is provided, verify against it
      const isValid = expectedValue.every((byte, index) =>
        byte === serverResponse[index]
      );

      return {
        success: isValid,
        verifiedValue: serverResponse,
      };
    } else {
      // Just return the processed hash
      return {
        success: true,
        verifiedValue: serverResponse,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Create multiple blind hashes in batch
 */
export async function createBlindHashes(
  inputs: (string | Uint8Array)[],
  serverKey: Uint8Array,
  rounds: number = 1000
): Promise<BlindHash[]> {
  const promises = inputs.map(input => createBlindHash(input, serverKey, rounds));
  return Promise.all(promises);
}

/**
 * Batch verification of blind hashes
 */
export async function batchVerifyBlindHashes(
  blindHashes: BlindHash[],
  serverResponses: Uint8Array[],
  serverKey: Uint8Array,
  rounds: number = 1000
): Promise<boolean[]> {
  if (blindHashes.length !== serverResponses.length) {
    throw new Error('Number of blind hashes must match number of server responses');
  }

  const promises = blindHashes.map((blindHash, index) =>
    verifyBlindHash(blindHash, serverResponses[index]!, serverKey, rounds)
  );
  return Promise.all(promises);
}

/**
 * Utility function to convert blind hash to/from JSON
 */
export function blindHashToJSON(blindHash: BlindHash): any {
  return {
    blindId: blindHash.blindId,
    blindedInput: toHex(blindHash.blindedInput),
    unblinder: toHex(blindHash.unblinder),
    originalHash: toHex(blindHash.originalHash),
    serverResponse: blindHash.serverResponse ? toHex(blindHash.serverResponse) : undefined,
  };
}

/**
 * Utility function to convert JSON to blind hash
 */
export function blindHashFromJSON(json: any): BlindHash {
  const result: BlindHash = {
    blindId: json.blindId,
    blindedInput: fromHex(json.blindedInput),
    unblinder: fromHex(json.unblinder),
    originalHash: fromHex(json.originalHash),
  };

  if (json.serverResponse) {
    result.serverResponse = fromHex(json.serverResponse);
  }

  return result;
}

/**
 * Create blind hash for email verification (example use case)
 */
export async function createEmailBlindHash(
  email: string,
  serverKey: Uint8Array
): Promise<BlindHash> {
  // Normalize email (lowercase, trim)
  const normalizedEmail = email.toLowerCase().trim();
  return createBlindHash(normalizedEmail, serverKey);
}

/**
 * Create blind hash for phone verification (example use case)
 */
export async function createPhoneBlindHash(
  phone: string,
  serverKey: Uint8Array
): Promise<BlindHash> {
  // Normalize phone (remove spaces, dashes, etc.)
  const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
  return createBlindHash(normalizedPhone, serverKey);
}
