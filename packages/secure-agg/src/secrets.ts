/**
 * Secret Sharing for Dropout Recovery
 * Implements Shamir's Secret Sharing for secure aggregation
 */

import { randomBytes, deriveKey } from 'privacy-utils-core-crypto';
import type { SecureAggClientId, SecretShare } from './types';

/**
 * Generate polynomial coefficients for Shamir's scheme
 */
function generatePolynomial(secret: Uint8Array, threshold: number): Uint8Array[] {
  const coefficients: Uint8Array[] = [];
  coefficients.push(secret); // a0 = secret

  // Generate random coefficients a1, a2, ..., a_{t-1}
  for (let i = 1; i < threshold; i++) {
    coefficients.push(randomBytes(secret.length));
  }

  return coefficients;
}

/**
 * Evaluate polynomial at a given point
 */
function evaluatePolynomial(coefficients: Uint8Array[], x: number): Uint8Array {
  if (coefficients.length === 0) {
    throw new Error('Coefficients array cannot be empty');
  }
  const result = new Uint8Array(coefficients[0]!.length);
  const xBytes = new Uint8Array(4);
  new DataView(xBytes.buffer).setUint32(0, x, false);

  // Start with a0
  result.set(coefficients[0]!);

  // Add a1*x + a2*x^2 + ... + a_{t-1}*x^{t-1}
  for (let i = 1; i < coefficients.length; i++) {
    // Compute x^i (mod 2^32 for simplicity)
    let xPower = x;
    for (let j = 1; j < i; j++) {
      xPower = (xPower * x) >>> 0; // Keep as 32-bit
    }

    // Add coefficient * x^i
    const coeff = coefficients[i];
    if (coeff) {
      for (let k = 0; k < result.length; k++) {
        result[k] = ((result[k] ?? 0) + (coeff[k] ?? 0) * (xPower & 0xFF)) & 0xFF;
      }
    }
  }

  return result;
}

/**
 * Split secret into shares using Shamir's Secret Sharing
 */
export function splitSecret(
  secret: Uint8Array,
  totalShares: number,
  threshold: number
): SecretShare[] {
  if (threshold > totalShares) {
    throw new Error('Threshold cannot be greater than total shares');
  }

  if (threshold < 2) {
    throw new Error('Threshold must be at least 2');
  }

  const coefficients = generatePolynomial(secret, threshold);
  const shares: SecretShare[] = [];

  for (let i = 1; i <= totalShares; i++) {
    const shareData = evaluatePolynomial(coefficients, i);
    shares.push({
      clientId: `share_${i}`,
      shareIndex: i,
      shareData,
      threshold,
    });
  }

  return shares;
}

/**
 * Reconstruct secret from shares using Lagrange interpolation
 */
export function reconstructSecret(shares: SecretShare[]): Uint8Array | null {
  if (shares.length === 0) {
    return null;
  }

  const firstShare = shares[0];
  if (!firstShare) {
    return null;
  }
  const threshold = firstShare.threshold;
  if (shares.length < threshold) {
    return null; // Not enough shares
  }

  // Use first 'threshold' shares
  const selectedShares = shares.slice(0, threshold);
  const firstSelectedShare = selectedShares[0];
  if (!firstSelectedShare) {
    return null;
  }
  const secretLength = firstSelectedShare.shareData.length;
  // Use threshold for validation
  const result = new Uint8Array(secretLength);

  // Lagrange interpolation
  for (let i = 0; i < secretLength; i++) {
    let value = 0;

    for (let j = 0; j < selectedShares.length; j++) {
      let basis = 1;

      const shareJ = selectedShares[j];
      if (!shareJ) continue;

      for (let k = 0; k < selectedShares.length; k++) {
        if (j !== k) {
          const shareK = selectedShares[k];
          if (!shareK) continue;

          const xj = shareJ.shareIndex;
          const xk = shareK.shareIndex;
          basis = (basis * xk * modInverse(xk - xj, 256)) % 256;
        }
      }

      const shareData = shareJ.shareData[i];
      if (shareData !== undefined) {
        value = (value + shareData * basis) % 256;
      }
    }

    result[i] = value;
  }

  return result;
}

/**
 * Modular inverse using Extended Euclidean Algorithm
 */
function modInverse(a: number, m: number): number {
  let m0 = m;
  let y = 0;
  let x = 1;

  if (m === 1) {
    return 0;
  }

  while (a > 1) {
    const q = Math.floor(a / m);
    let t = m;
    m = a % m;
    a = t;
    t = y;
    y = x - q * y;
    x = t;
  }

  if (x < 0) {
    x += m0;
  }

  return x;
}

/**
 * Generate pairwise secrets for all client pairs
 */
export async function generatePairwiseSecrets(
  clients: SecureAggClientId[],
  roundId: string
): Promise<Map<SecureAggClientId, Map<SecureAggClientId, Uint8Array>>> {
  const secrets = new Map<SecureAggClientId, Map<SecureAggClientId, Uint8Array>>();

  for (const clientA of clients) {
    const clientSecrets = new Map<SecureAggClientId, Uint8Array>();

    for (const clientB of clients) {
      if (clientA !== clientB) {
        // Generate deterministic secret based on client pair and round
        const salt = new Uint8Array(32); // Zero salt for deterministic generation

        // Use lexicographic ordering to ensure symmetry
        const [first, second] = [clientA, clientB].sort();
        const pairKey = `${roundId}-${first}-${second}`;
        const secret = await deriveKey(
          new TextEncoder().encode(pairKey),
          salt,
          32,
          'SHA-256',
          1000
        );

        clientSecrets.set(clientB, secret);
      }
    }

    secrets.set(clientA, clientSecrets);
  }

  return secrets;
}

/**
 * Distribute secret shares among clients
 */
export function distributeShares(
  clientId: SecureAggClientId,
  clients: SecureAggClientId[],
  dropoutTolerance: number
): Map<SecureAggClientId, SecretShare[]> {
  // Each client gets shares from all other clients
  const distributions = new Map<SecureAggClientId, SecretShare[]>();

  for (const otherClient of clients) {
    if (otherClient !== clientId) {
      // Generate a random secret for this client
      const secret = randomBytes(32);

      // Split into shares: n = clients.length, t = n - dropoutTolerance
      const threshold = Math.max(1, clients.length - dropoutTolerance);
      const shares = splitSecret(secret, clients.length, threshold);

      // Assign shares to clients
      for (let i = 0; i < clients.length; i++) {
        const targetClient = clients[i];
        const share = shares[i];
        if (targetClient && share) {
          const existingShares = distributions.get(targetClient) || [];
          existingShares.push(share);
          distributions.set(targetClient, existingShares);
        }
      }
    }
  }

  return distributions;
}
