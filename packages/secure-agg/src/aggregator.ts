/**
 * Secure Aggregation Aggregator
 * Server-side coordinator for secure multi-party aggregation
 */

import { WebSocketServer, WebSocket } from 'ws';
import { reconstructSecret } from './secrets';
import { aggregateVectors } from './masking';
import type {
  AggregatorConfig,
  AggregatorState,
  ProtocolMessage,
  SecretShare,
  SecureAggClientId
} from './types';

export class SecureAggregationAggregator {
  private config: AggregatorConfig;
  private server: WebSocketServer;
  private state: AggregatorState;
  private clients: Map<SecureAggClientId, WebSocket> = new Map();
  private messageHandlers: Map<string, (ws: WebSocket, message: ProtocolMessage) => void> = new Map();

  constructor(config: AggregatorConfig) {
    this.config = config;
    this.state = this.createInitialState();
    this.server = new WebSocketServer({
      host: config.host,
      port: config.port,
      maxPayload: 1024 * 1024, // 1MB max payload
    });

    this.setupServer();
    this.setupMessageHandlers();
  }

  /**
   * Create initial aggregator state
   */
  private createInitialState(): AggregatorState {
    return {
      roundId: '',
      clients: new Set(),
      expectedClients: this.config.protocolConfig.minClients,
      receivedShares: new Map(),
      maskedVectors: new Map(),
      recoveredSecrets: new Map(),
    };
  }

  /**
   * Setup WebSocket server
   */
  private setupServer(): void {
    this.server.on('connection', (ws: WebSocket, _request: any) => {
      console.log('New client connected');

      ws.on('message', (data: Buffer) => {
        try {
          const message: ProtocolMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Failed to parse message from client:', error);
          this.sendError(ws, 'INVALID_MESSAGE', 'Failed to parse message');
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        // Handle client disconnection
        this.handleClientDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('Client WebSocket error:', error);
      });
    });

    this.server.on('listening', () => {
      console.log(`Secure Aggregation Aggregator listening on ${this.config.host}:${this.config.port}`);
    });

    this.server.on('error', (error: any) => {
      console.error('WebSocket server error:', error);
    });
  }

  /**
   * Setup message handlers
   */
  private setupMessageHandlers(): void {
    this.messageHandlers.set('join_round', this.handleJoinRound.bind(this));
    this.messageHandlers.set('key_exchange', this.handleKeyExchange.bind(this));
    this.messageHandlers.set('submit_vector', this.handleSubmitVector.bind(this));
    this.messageHandlers.set('secret_share', this.handleSecretShare.bind(this));
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(ws: WebSocket, message: ProtocolMessage): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(ws, message);
    } else {
      console.warn(`No handler for message type: ${message.type}`);
      this.sendError(ws, 'UNKNOWN_MESSAGE_TYPE', `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle client joining a round
   */
  private handleJoinRound(ws: WebSocket, message: any): void {
    const { clientId, roundId } = message;

    // Register client
    this.clients.set(clientId, ws);
    this.state.clients.add(clientId);

    console.log(`Client ${clientId} joined round ${roundId}`);

    // If we have enough clients, start the aggregation
    if (this.state.clients.size >= this.config.protocolConfig.minClients) {
      this.startAggregationRound(roundId);
    }
  }

  /**
   * Handle key exchange messages
   */
  private handleKeyExchange(_ws: WebSocket, message: any): void {
    // Simplified key exchange - in real implementation this would handle ECDH
    console.log(`Key exchange from ${message.clientId}`);
  }

  /**
   * Handle vector submission
   */
  private handleSubmitVector(_ws: WebSocket, message: any): void {
    const { clientId, maskedVector } = message;

    // Store masked vector
    this.state.maskedVectors.set(clientId, maskedVector);

    console.log(`Received masked vector from ${clientId}`);

    // Check if we have all vectors
    if (this.state.maskedVectors.size >= this.state.clients.size) {
      this.performAggregation();
    }
  }

  /**
   * Handle secret shares for dropout recovery
   */
  private handleSecretShare(_ws: WebSocket, message: any): void {
    const { clientId, shares } = message;

    // Store shares for this client
    if (!this.state.receivedShares.has(clientId)) {
      this.state.receivedShares.set(clientId, []);
    }
    this.state.receivedShares.get(clientId)!.push(...shares);

    console.log(`Received ${shares.length} secret shares from ${clientId}`);
  }

  /**
   * Start a new aggregation round
   */
  private startAggregationRound(roundId: string): void {
    this.state.roundId = roundId;
    this.state.maskedVectors.clear();
    this.state.receivedShares.clear();
    this.state.recoveredSecrets.clear();

    console.log(`Starting aggregation round ${roundId} with ${this.state.clients.size} clients`);

    // Broadcast round start to all clients
    const startMessage = {
      type: 'round_started',
      roundId,
      expectedClients: this.state.clients.size,
      timestamp: Date.now(),
    };

    this.broadcastMessage(startMessage);
  }

  /**
   * Perform the actual aggregation
   */
  private performAggregation(): void {
    try {
      console.log('Performing secure aggregation...');

      // Collect all masked vectors
      const maskedVectors: Float64Array[] = [];
      for (const maskedVector of this.state.maskedVectors.values()) {
        maskedVectors.push(maskedVector.vector);
      }

      // Sum all masked vectors
      const aggregatedMasked = aggregateVectors(maskedVectors);

      // Try to recover original sum by removing masks
      // In a real implementation, this would involve reconstructing pairwise secrets
      const result = aggregatedMasked; // Simplified - masks would cancel out

      this.state.aggregatedResult = result;

      // Broadcast result to all clients
      const resultMessage = {
        type: 'aggregation_result',
        roundId: this.state.roundId,
        result,
        participantCount: this.state.clients.size,
        timestamp: Date.now(),
      };

      this.broadcastMessage(resultMessage);

      console.log(`Aggregation completed for round ${this.state.roundId}`);

    } catch (error) {
      console.error('Aggregation failed:', error);
      this.broadcastError('AGGREGATION_FAILED', 'Failed to perform aggregation');
    }
  }

  /**
   * Handle client disconnection
   */
  private handleClientDisconnect(ws: WebSocket): void {
    // Find and remove disconnected client
    for (const [clientId, clientWs] of this.clients) {
      if (clientWs === ws) {
        this.clients.delete(clientId);
        this.state.clients.delete(clientId);
        console.log(`Client ${clientId} disconnected`);

        // If client had submitted data, try to recover using secret shares
        this.attemptRecovery(clientId);
        break;
      }
    }
  }

  /**
   * Attempt to recover data from dropped client using secret shares
   */
  private attemptRecovery(droppedClientId: SecureAggClientId): void {
    console.log(`Attempting recovery for dropped client ${droppedClientId}`);

    // Collect shares for the dropped client
    const sharesForClient: SecretShare[] = [];
    for (const shares of this.state.receivedShares.values()) {
      const clientShares = shares.filter(share => share.clientId === droppedClientId);
      sharesForClient.push(...clientShares);
    }

    // Try to reconstruct the client's secret
    const recoveredSecret = reconstructSecret(sharesForClient);
    if (recoveredSecret) {
      this.state.recoveredSecrets.set(droppedClientId, recoveredSecret);
      console.log(`Successfully recovered secret for client ${droppedClientId}`);

      // If we have enough data, we could continue with aggregation
      // For now, we'll just mark the recovery as successful
    } else {
      console.warn(`Failed to recover secret for client ${droppedClientId}`);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcastMessage(message: any): void {
    const messageStr = JSON.stringify(message);
    for (const ws of this.clients.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    }
  }

  /**
   * Send error message to specific client
   */
  private sendError(ws: WebSocket, errorCode: string, errorMessage: string): void {
    const errorMsg = {
      type: 'error',
      errorCode,
      errorMessage,
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(errorMsg));
  }

  /**
   * Broadcast error to all clients
   */
  private broadcastError(errorCode: string, errorMessage: string): void {
    const errorMsg = {
      type: 'error',
      errorCode,
      errorMessage,
      timestamp: Date.now(),
    };
    this.broadcastMessage(errorMsg);
  }

  /**
   * Start the aggregator
   */
  async start(): Promise<void> {
    // Server is already started in constructor
    console.log('Secure Aggregation Aggregator started');
  }

  /**
   * Stop the aggregator
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      console.log('Secure Aggregation Aggregator stopped');
    }
  }

  /**
   * Get current aggregator state
   */
  getState(): AggregatorState {
    return { ...this.state };
  }

  /**
   * Get aggregator configuration
   */
  getConfig(): AggregatorConfig {
    return { ...this.config };
  }
}

/**
 * Create a secure aggregation aggregator
 */
export function createSAAggregator(config: AggregatorConfig): SecureAggregationAggregator {
  return new SecureAggregationAggregator(config);
}
