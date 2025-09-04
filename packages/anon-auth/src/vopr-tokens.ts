/**
 * VOPRF (Verifiable Oblivious Pseudorandom Function) Tokens
 * Implementation of anonymous token issuance and redemption
 */

import { randomBytes, deriveKey } from 'privacy-utils-core-crypto';
import type {
  AnonToken,
  VOPRFServerState,
  VOPRFClientState,
  TokenIssuanceRequest,
  TokenIssuanceResponse,
  TokenRedemptionRequest,
  TokenRedemptionResponse,
} from './types';

/**
 * Generate a random blinding factor for VOPRF
 */
function generateBlindingFactor(): Uint8Array {
  return randomBytes(32);
}

/**
 * Apply blinding to input using blinding factor
 */
async function applyBlinding(
  input: Uint8Array,
  blindingFactor: Uint8Array,
  serverKey: Uint8Array,
  rounds: number = 1000
): Promise<Uint8Array> {
  // Simple blinding: XOR with derived key
  const derivedKey = await deriveKey(serverKey, blindingFactor, input.length, 'SHA-256', rounds);
  const result = new Uint8Array(input.length);

  const minLength = Math.min(input.length, derivedKey.length);
  for (let i = 0; i < minLength; i++) {
    result[i] = (input[i] ?? 0) ^ (derivedKey[i] ?? 0);
  }

  return result;
}

/**
 * Remove blinding from response
 */
async function removeBlinding(
  response: Uint8Array,
  blindingFactor: Uint8Array,
  serverKey: Uint8Array,
  rounds: number = 1000
): Promise<Uint8Array> {
  // Reverse the blinding operation
  return applyBlinding(response, blindingFactor, serverKey, rounds);
}

/**
 * Generate server key for VOPRF
 */
export function generateServerKey(): Uint8Array {
  return randomBytes(32);
}

/**
 * Issue VOPRF tokens
 */
export async function issueTokens(
  request: TokenIssuanceRequest,
  serverKey: Uint8Array
): Promise<TokenIssuanceResponse> {
  const tokens: AnonToken[] = [];
  const issuedTokens = new Map<string, AnonToken>();

  for (let i = 0; i < request.count; i++) {
    const tokenId = `token_${Date.now()}_${i}_${randomBytes(8).reduce((acc, byte) => acc + byte.toString(16), '')}`;
    const blindingFactor = generateBlindingFactor();

    // Generate token input (could be user-specific or random)
    const tokenInput = randomBytes(32);

    // Apply blinding
    const blindedInput = await applyBlinding(tokenInput, blindingFactor, serverKey);

    // Server evaluation (simplified VOPRF evaluation)
    const serverResponse = await deriveKey(serverKey, blindedInput, 32, 'SHA-256', 1000);

    // Remove blinding to get final token
    const finalToken = await removeBlinding(serverResponse, blindingFactor, serverKey);

    const token: AnonToken = {
      tokenId,
      blindedToken: finalToken,
      unblinder: blindingFactor,
      ...(request.metadata ? { metadata: request.metadata } : {}),
      ...(request.scope ? { scope: request.scope } : {}),
      ...(request.expiresIn ? { expiresAt: Date.now() + request.expiresIn * 1000 } : {}),
    };

    tokens.push(token);
    issuedTokens.set(tokenId, token);
  }

  const serverState: VOPRFServerState = {
    serverKey,
    issuedTokens,
    usedTokens: new Set(),
    keyVersion: 1,
  };

  return {
    tokens,
    serverState,
  };
}

/**
 * Redeem a VOPRF token
 */
export async function redeemToken(
  request: TokenRedemptionRequest,
  serverState: VOPRFServerState
): Promise<TokenRedemptionResponse> {
  const { token } = request;

  // Check if token exists
  const issuedToken = serverState.issuedTokens.get(token.tokenId);
  if (!issuedToken) {
    return {
      success: false,
      tokenId: token.tokenId,
      error: 'Token not found',
      redeemedAt: Date.now(),
    };
  }

  // Check if token is expired
  if (issuedToken.expiresAt && issuedToken.expiresAt < Date.now()) {
    return {
      success: false,
      tokenId: token.tokenId,
      error: 'Token expired',
      redeemedAt: Date.now(),
    };
  }

  // Check if token was already used
  if (serverState.usedTokens.has(token.tokenId)) {
    return {
      success: false,
      tokenId: token.tokenId,
      error: 'Token already redeemed',
      redeemedAt: Date.now(),
    };
  }

  // Verify token (simplified verification)
  // The token.blindedToken should match what we would get from server evaluation
  const serverEvaluation = await deriveKey(serverState.serverKey, token.blindedToken, 32, 'SHA-256', 1000);
  const isValid = serverEvaluation.every((byte, index) => byte === token.blindedToken[index]);

  if (!isValid) {
    return {
      success: false,
      tokenId: token.tokenId,
      error: 'Invalid token',
      redeemedAt: Date.now(),
    };
  }

  // Mark token as used
  serverState.usedTokens.add(token.tokenId);

  return {
    success: true,
    tokenId: token.tokenId,
    redeemedAt: Date.now(),
  };
}

/**
 * Verify token scope
 */
export function verifyTokenScope(
  token: AnonToken,
  requiredScope?: string
): boolean {
  if (!requiredScope) {
    return true; // No scope required
  }

  return token.scope === requiredScope;
}

/**
 * Check token expiration
 */
export function isTokenExpired(token: AnonToken): boolean {
  if (!token.expiresAt) {
    return false; // Token doesn't expire
  }

  return token.expiresAt < Date.now();
}

/**
 * Create client state for token management
 */
export function createClientState(): VOPRFClientState {
  return {
    tokens: new Map(),
    redeemedTokens: new Set(),
  };
}

/**
 * Add token to client state
 */
export function addTokenToClient(
  clientState: VOPRFClientState,
  token: AnonToken
): void {
  clientState.tokens.set(token.tokenId, token);
}

/**
 * Remove token from client state
 */
export function removeTokenFromClient(
  clientState: VOPRFClientState,
  tokenId: string
): boolean {
  return clientState.tokens.delete(tokenId);
}

/**
 * Get available tokens from client state
 */
export function getAvailableTokens(
  clientState: VOPRFClientState
): AnonToken[] {
  return Array.from(clientState.tokens.values()).filter(token =>
    !isTokenExpired(token) && !clientState.redeemedTokens.has(token.tokenId)
  );
}

/**
 * Mark token as redeemed in client state
 */
export function markTokenRedeemed(
  clientState: VOPRFClientState,
  tokenId: string
): void {
  clientState.redeemedTokens.add(tokenId);
  clientState.tokens.delete(tokenId); // Remove from available tokens
}
