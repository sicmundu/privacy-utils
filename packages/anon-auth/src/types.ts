/**
 * Anonymous Authentication Types and Interfaces
 */

export type TokenId = string;
export type BlindId = string;

/**
 * VOPRF Token structure
 */
export interface AnonToken {
  tokenId: TokenId;
  blindedToken: Uint8Array;
  unblinder: Uint8Array;
  metadata?: Record<string, string>;
  expiresAt?: number; // Unix timestamp
  scope?: string; // Usage scope
}

/**
 * VOPRF Server state for token issuance
 */
export interface VOPRFServerState {
  serverKey: Uint8Array;
  issuedTokens: Map<TokenId, AnonToken>;
  usedTokens: Set<TokenId>;
  keyVersion: number;
}

/**
 * VOPRF Client state for token redemption
 */
export interface VOPRFClientState {
  tokens: Map<TokenId, AnonToken>;
  redeemedTokens: Set<TokenId>;
}

/**
 * Blind hash structure
 */
export interface BlindHash {
  blindId: BlindId;
  blindedInput: Uint8Array;
  unblinder: Uint8Array;
  originalHash: Uint8Array;
  serverResponse?: Uint8Array;
}

/**
 * WebAuthn Ephemeral key structure
 */
export interface EphemeralWebAuthnKey {
  keyId: string;
  publicKeyJwk: JsonWebKey;
  attestation?: any;
  challenge: Uint8Array;
  createdAt: number;
  expiresAt?: number;
  usageCount: number;
  maxUsage?: number;
}

/**
 * WebAuthn Ephemeral session
 */
export interface EphemeralSession {
  sessionId: string;
  keys: Map<string, EphemeralWebAuthnKey>;
  createdAt: number;
  expiresAt?: number;
  maxKeys: number;
}

/**
 * Authentication context
 */
export interface AuthContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Token issuance request
 */
export interface TokenIssuanceRequest {
  count: number;
  scope?: string;
  expiresIn?: number; // seconds from now
  metadata?: Record<string, string>;
  context?: AuthContext;
}

/**
 * Token issuance response
 */
export interface TokenIssuanceResponse {
  tokens: AnonToken[];
  serverState: VOPRFServerState;
}

/**
 * Token redemption request
 */
export interface TokenRedemptionRequest {
  token: AnonToken;
  context?: AuthContext;
  proof?: Uint8Array; // Zero-knowledge proof
}

/**
 * Token redemption response
 */
export interface TokenRedemptionResponse {
  success: boolean;
  tokenId: TokenId;
  error?: string;
  redeemedAt: number;
}

/**
 * Blind hash verification request
 */
export interface BlindHashVerificationRequest {
  blindHash: BlindHash;
  expectedValue?: Uint8Array;
  context?: AuthContext;
}

/**
 * Blind hash verification response
 */
export interface BlindHashVerificationResponse {
  success: boolean;
  verifiedValue?: Uint8Array;
  error?: string;
}

/**
 * WebAuthn ephemeral creation options
 */
export interface EphemeralWebAuthnOptions {
  challenge?: Uint8Array;
  timeout?: number;
  maxUsage?: number;
  expiresIn?: number; // seconds
  rpName?: string;
  rpId?: string;
  userId?: string;
  userName?: string;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  maxTokensPerHour?: number;
  maxTokensPerDay?: number;
  maxRedemptionsPerHour?: number;
  maxRedemptionsPerDay?: number;
  maxBlindHashesPerHour?: number;
  maxBlindHashesPerDay?: number;
}

/**
 * Anonymous authentication configuration
 */
export interface AnonAuthConfig {
  voprKeySize: number; // 32 bytes default
  blindHashRounds: number; // 1000 rounds default
  tokenExpiration: number; // 3600 seconds default
  maxTokensPerUser: number; // 10 default
  maxSessionsPerUser: number; // 5 default
  rateLimit: RateLimitConfig;
}
