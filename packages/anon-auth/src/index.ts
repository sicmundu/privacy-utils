// Anonymous Authentication package
export * from './types';
export * from './vopr-tokens';
export * from './blind-hashes';
export * from './webauthn-ephemeral';

// Re-export commonly used functions with shorter names
export {
  issueTokens as issueVOPRTokens,
  redeemToken as redeemVOPRToken,
} from './vopr-tokens';
export {
  createBlindHash,
} from './blind-hashes';
export {
  createEphemeralWebAuthnKey,
  authenticateWithEphemeralKey,
  verifyEphemeralAuthentication,
} from './webauthn-ephemeral';
