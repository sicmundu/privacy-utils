/**
 * Secure Aggregation Server Example
 * Demonstrates federated learning with privacy preservation
 */

import { createSAAggregator } from 'privacy-utils-secure-agg';
import { WebSocketServer } from 'ws';

async function main() {
  console.log('🔐 Privacy Utils - Secure Aggregation Server\n');

  // Create aggregator with configuration
  const aggregator = createSAAggregator({
    host: 'localhost',
    port: 8080,
    minClients: 2,
    maxClients: 10,
    protocolConfig: {
      dropoutTolerance: 1,
      roundTimeout: 30000
    }
  });

  // Start the aggregation server
  await aggregator.start();
  console.log('🚀 Aggregation server started on ws://localhost:8080');

  // Handle aggregation results
  aggregator.onRoundComplete((result) => {
    console.log('\n📊 Round completed!');
    console.log(`Participants: ${result.participantCount}`);
    console.log(`Final aggregated result: [${result.aggregatedData.slice(0, 5).join(', ')}...]`);
    console.log(`Privacy preserved: ✅`);
  });

  // Handle client connections
  aggregator.onClientConnected((clientId) => {
    console.log(`👤 Client connected: ${clientId}`);
  });

  aggregator.onClientDisconnected((clientId) => {
    console.log(`👋 Client disconnected: ${clientId}`);
  });

  console.log('\n⏳ Waiting for clients to connect and submit data...');
  console.log('Run the client example in another terminal to participate\n');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await aggregator.stop();
    process.exit(0);
  });
}

// Handle errors
main().catch((error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
