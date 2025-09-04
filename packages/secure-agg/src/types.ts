/**
 * Secure Aggregation Types and Interfaces
 */

// Using native Float64Array instead of importing from core-crypto

export type SecureAggClientId = string;
export type RoundId = string;

/**
 * Masked vector message format
 */
export interface MaskedVector {
  clientId: SecureAggClientId;
  roundId: RoundId;
  vector: Float64Array;
  maskSeed: Uint8Array; // Seed for deterministic masking
  proof?: Uint8Array; // Optional zero-knowledge proof
}

/**
 * Secret sharing for dropout recovery
 */
export interface SecretShare {
  clientId: SecureAggClientId;
  shareIndex: number;
  shareData: Uint8Array;
  threshold: number; // Minimum shares needed for recovery
}

/**
 * Aggregation protocol phases
 */
export enum ProtocolPhase {
  SETUP = 'setup',
  KEY_EXCHANGE = 'key_exchange',
  MASKING = 'masking',
  SUBMISSION = 'submission',
  RECOVERY = 'recovery',
  AGGREGATION = 'aggregation',
  COMPLETE = 'complete'
}

/**
 * Client state in the protocol
 */
export interface ClientState {
  clientId: SecureAggClientId;
  phase: ProtocolPhase;
  roundId: RoundId;
  peers: SecureAggClientId[];
  sharedSecrets: Map<SecureAggClientId, Uint8Array>; // Pairwise secrets
  maskSeeds: Map<SecureAggClientId, Uint8Array>; // Seeds for masking
  submitted: boolean;
}

/**
 * Aggregator state
 */
export interface AggregatorState {
  roundId: RoundId;
  clients: Set<SecureAggClientId>;
  expectedClients: number;
  receivedShares: Map<SecureAggClientId, SecretShare[]>;
  maskedVectors: Map<SecureAggClientId, MaskedVector>;
  recoveredSecrets: Map<SecureAggClientId, Uint8Array>;
  aggregatedResult?: Float64Array;
}

/**
 * Protocol configuration
 */
export interface ProtocolConfig {
  vectorSize: number;
  minClients: number; // Minimum clients for aggregation
  maxClients: number; // Maximum clients allowed
  dropoutTolerance: number; // How many clients can drop out
  roundTimeout: number; // Timeout per round in milliseconds
  secretThreshold: number; // Threshold for secret sharing
}

/**
 * WebSocket message types
 */
export enum MessageType {
  JOIN_ROUND = 'join_round',
  KEY_EXCHANGE = 'key_exchange',
  SUBMIT_VECTOR = 'submit_vector',
  SECRET_SHARE = 'secret_share',
  AGGREGATION_RESULT = 'aggregation_result',
  ERROR = 'error'
}

/**
 * Base message structure
 */
export interface BaseMessage {
  type: MessageType;
  clientId: SecureAggClientId;
  roundId: RoundId;
  timestamp: number;
}

/**
 * Join round message
 */
export interface JoinRoundMessage extends BaseMessage {
  type: MessageType.JOIN_ROUND;
  publicKey: Uint8Array; // For key exchange
}

/**
 * Key exchange message
 */
export interface KeyExchangeMessage extends BaseMessage {
  type: MessageType.KEY_EXCHANGE;
  targetClientId: SecureAggClientId;
  encryptedSecret: Uint8Array; // Encrypted pairwise secret
}

/**
 * Submit vector message
 */
export interface SubmitVectorMessage extends BaseMessage {
  type: MessageType.SUBMIT_VECTOR;
  maskedVector: MaskedVector;
}

/**
 * Secret share message
 */
export interface SecretShareMessage extends BaseMessage {
  type: MessageType.SECRET_SHARE;
  shares: SecretShare[];
}

/**
 * Aggregation result message
 */
export interface AggregationResultMessage extends BaseMessage {
  type: MessageType.AGGREGATION_RESULT;
  result: Float64Array;
  participantCount: number;
}

/**
 * Error message
 */
export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  errorCode: string;
  errorMessage: string;
}

/**
 * Union type for all messages
 */
export type ProtocolMessage =
  | JoinRoundMessage
  | KeyExchangeMessage
  | SubmitVectorMessage
  | SecretShareMessage
  | AggregationResultMessage
  | ErrorMessage;

/**
 * Client configuration
 */
export interface ClientConfig {
  clientId: SecureAggClientId;
  aggregatorUrl: string;
  protocolConfig: ProtocolConfig;
  reconnectAttempts: number;
  reconnectDelay: number;
}

/**
 * Aggregator configuration
 */
export interface AggregatorConfig {
  host: string;
  port: number;
  protocolConfig: ProtocolConfig;
  maxConnections: number;
}
