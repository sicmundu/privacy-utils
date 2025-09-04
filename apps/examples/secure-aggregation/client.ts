/**
 * Secure Aggregation Client Example
 * Demonstrates participating in federated learning with privacy
 */

import { createSAClient } from 'privacy-utils-secure-agg';

async function main() {
  console.log('🔒 Privacy Utils - Secure Aggregation Client\n');

  // Create client with private data
  const client = createSAClient({
    clientId: `client-${Math.random().toString(36).substr(2, 9)}`,
    serverUrl: 'ws://localhost:8080',
    vectorSize: 100
  });

  // Generate some private data (simulating user preferences, model weights, etc.)
  const privateData = new Float64Array(100);
  for (let i = 0; i < privateData.length; i++) {
    privateData[i] = Math.random() * 2 - 1; // Random values between -1 and 1
  }

  console.log(`📱 Client ID: ${client.config.clientId}`);
  console.log(`📊 Private data length: ${privateData.length}`);
  console.log(`🔗 Connecting to server...\n`);

  try {
    // Connect to aggregation server
    await client.connect();
    console.log('✅ Connected to aggregation server');

    // Submit private data
    console.log('📤 Submitting private data...');
    await client.submitVector(privateData);
    console.log('✅ Data submitted with privacy preservation');

    // Wait for aggregation result
    console.log('⏳ Waiting for aggregation result...');
    const result = await client.getAggregationResult();

    console.log('\n📊 Aggregation completed!');
    console.log(`📈 Result length: ${result.length}`);
    console.log(`🔐 Privacy preserved: Your individual data was masked before sharing`);
    console.log(`🤝 Contributed to: ${result.length}-dimensional aggregated result`);

    // Disconnect
    await client.disconnect();
    console.log('👋 Disconnected from server');

  } catch (error) {
    console.error('❌ Client error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Client shutting down...');
  process.exit(0);
});

// Run the client
main().catch(console.error);
