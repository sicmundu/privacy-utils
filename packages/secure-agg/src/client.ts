/**
 * Secure Aggregation Client
 * Handles client-side operations for secure multi-party aggregation
 */

import WebSocket from 'ws';
import { randomBytes } from 'privacy-utils-core-crypto';
import {
  distributeShares
} from './secrets';
import {
  generateAllMasks,
  applyAllMasks
} from './masking';
import type {
  ClientConfig,
  ClientState,
  ProtocolMessage,
  MaskedVector
} from './types';
import { MessageType, ProtocolPhase } from './types';

export class SecureAggregationClient {
  private config: ClientConfig;
  private state: ClientState;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private messageHandlers: Map<string, (message: ProtocolMessage) => void> = new Map();

  constructor(config: ClientConfig) {
    this.config = config;
    this.state = this.createInitialState();
    this.setupMessageHandlers();
  }

  /**
   * Create initial client state
   */
  private createInitialState(): ClientState {
    return {
      clientId: this.config.clientId,
      phase: ProtocolPhase.SETUP as any,
      roundId: '',
      peers: [],
      sharedSecrets: new Map(),
      maskSeeds: new Map(),
      submitted: false,
    };
  }

  /**
   * Setup message handlers
   */
  private setupMessageHandlers(): void {
    // These will be implemented as the protocol progresses
  }

  /**
   * Connect to aggregator
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.aggregatorUrl);

        this.ws.on('open', () => {
          console.log(`Client ${this.config.clientId} connected to aggregator`);
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('message', (data: Buffer) => {
          try {
            const message: ProtocolMessage = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        });

        this.ws.on('close', () => {
          console.log(`Client ${this.config.clientId} disconnected`);
          this.attemptReconnect();
        });

        this.ws.on('error', (error) => {
          console.error(`Client ${this.config.clientId} WebSocket error:`, error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to aggregator
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectAttempts) {
      console.error(`Client ${this.config.clientId} failed to reconnect after ${this.reconnectAttempts} attempts`);
      return;
    }

    this.reconnectAttempts++;
    console.log(`Client ${this.config.clientId} attempting reconnect (${this.reconnectAttempts}/${this.config.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.config.reconnectDelay);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: ProtocolMessage): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.warn(`No handler for message type: ${message.type}`);
    }
  }

  /**
   * Send message to aggregator
   */
  private sendMessage(message: ProtocolMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Join a new aggregation round
   */
  async joinRound(roundId: string): Promise<void> {
    this.state.roundId = roundId;
    this.state.phase = ProtocolPhase.KEY_EXCHANGE as any;
    this.state.submitted = false;

    // Generate public key for key exchange (simplified)
    const publicKey = randomBytes(32);

    const joinMessage = {
      type: MessageType.JOIN_ROUND as any,
      clientId: this.config.clientId,
      roundId,
      timestamp: Date.now(),
      publicKey,
    };

    this.sendMessage(joinMessage);
  }

  /**
   * Submit vector for aggregation
   */
  async submitVector(vector: Float64Array): Promise<void> {
    if (this.state.phase !== (ProtocolPhase.SUBMISSION as any)) {
      throw new Error('Not in submission phase');
    }

    if (this.state.submitted) {
      throw new Error('Vector already submitted for this round');
    }

    // Generate all pairwise masks
    const masks = await generateAllMasks(vector, this.state.sharedSecrets, this.state.roundId, this.state.clientId);

    // Apply all masks
    const maskedVector = applyAllMasks(vector, masks);

    // Create masked vector message
    const maskedVectorMessage: MaskedVector = {
      clientId: this.state.clientId,
      roundId: this.state.roundId,
      vector: maskedVector,
      maskSeed: randomBytes(32), // For reproducibility if needed
    };

    // Generate and distribute secret shares for dropout recovery
    const shareDistributions = distributeShares(
      this.state.clientId,
      this.state.peers,
      this.config.protocolConfig.dropoutTolerance
    );

    // Send masked vector and shares
    const submitMessage = {
      type: MessageType.SUBMIT_VECTOR as any,
      clientId: this.state.clientId,
      roundId: this.state.roundId,
      timestamp: Date.now(),
      maskedVector: maskedVectorMessage,
    };

    // Send shares to other clients
    for (const [, shares] of shareDistributions) {
      const shareMessage = {
        type: MessageType.SECRET_SHARE as any,
        clientId: this.state.clientId,
        roundId: this.state.roundId,
        timestamp: Date.now(),
        shares,
      };
      this.sendMessage(shareMessage);
    }

    this.sendMessage(submitMessage);
    this.state.submitted = true;
    this.state.phase = ProtocolPhase.AGGREGATION as any;
  }

  /**
   * Leave the current round
   */
  async leaveRound(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Reset state
    this.state = this.createInitialState();
  }

  /**
   * Get current client state
   */
  getState(): ClientState {
    return { ...this.state };
  }

  /**
   * Get client configuration
   */
  getConfig(): ClientConfig {
    return { ...this.config };
  }
}

/**
 * Create a secure aggregation client
 */
export function createSAClient(config: ClientConfig): SecureAggregationClient {
  return new SecureAggregationClient(config);
}
