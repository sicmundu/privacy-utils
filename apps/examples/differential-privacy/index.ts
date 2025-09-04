/**
 * Differential Privacy Example
 * Demonstrates basic usage of privacy-preserving queries
 */

import { dpCount, dpSum, dpMean, createBudgetTracker } from 'privacy-utils-dp';

// Sample dataset - user ages
const userAges = [25, 30, 35, 28, 42, 33, 29, 31, 38, 26];

async function main() {
  console.log('🔒 Privacy Utils - Differential Privacy Example\n');

  // Create a privacy budget tracker
  const budget = createBudgetTracker({ epsilon: 1.0 });
  console.log(`Initial privacy budget: ε = ${budget.getRemainingBudget()}\n`);

  // Example 1: Count query with noise
  const trueCount = userAges.length;
  const noisyCount = dpCount(trueCount, { epsilon: 0.5 }, budget);

  console.log('📊 Count Query:');
  console.log(`  True count: ${trueCount}`);
  console.log(`  Noisy count: ${Math.round(noisyCount)}`);
  console.log(`  Privacy cost: ε = 0.5`);
  console.log(`  Remaining budget: ε = ${budget.getRemainingBudget()}\n`);

  // Example 2: Sum query with noise
  const trueSum = userAges.reduce((sum, age) => sum + age, 0);
  const noisySum = dpSum(trueSum, { epsilon: 0.3 }, budget);

  console.log('📈 Sum Query:');
  console.log(`  True sum: ${trueSum}`);
  console.log(`  Noisy sum: ${Math.round(noisySum)}`);
  console.log(`  Privacy cost: ε = 0.3`);
  console.log(`  Remaining budget: ε = ${budget.getRemainingBudget()}\n`);

  // Example 3: Mean query with noise
  const trueMean = userAges.reduce((sum, age) => sum + age, 0) / userAges.length;
  const noisyMean = dpMean(userAges, { epsilon: 0.2 }, budget);

  console.log('📉 Mean Query:');
  console.log(`  True mean: ${trueMean.toFixed(2)}`);
  console.log(`  Noisy mean: ${noisyMean.toFixed(2)}`);
  console.log(`  Privacy cost: ε = 0.2`);
  console.log(`  Remaining budget: ε = ${budget.getRemainingBudget()}\n`);

  // Show privacy budget exhaustion
  console.log('⚠️  Privacy Budget Management:');
  console.log('  As you perform more queries, your privacy budget decreases');
  console.log('  This prevents overfitting and protects individual privacy');
  console.log('  Always monitor your remaining budget!\n');

  console.log('✨ Differential Privacy ensures that:');
  console.log('  • Individual records remain private');
  console.log('  • Statistical queries provide useful insights');
  console.log('  • Privacy is mathematically guaranteed');
}

// Run the example
main().catch(console.error);
