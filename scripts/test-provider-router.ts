/**
 * Manual test script for ProviderRouter
 * Tests basic functionality and dual-write mode
 */

import { ProviderRouter } from '../src/lib/db/provider-router';
import { NeonClient } from '../src/lib/db/neon-client';
import { loadDatabaseConfig } from '../src/lib/db/config';

async function testProviderRouter() {
  console.log('=== Testing ProviderRouter ===\n');

  // Test 1: Configuration validation
  console.log('Test 1: Configuration validation');
  try {
    new ProviderRouter({
      provider: 'neon',
    });
    console.log('❌ Should have thrown error for missing neonClient');
  } catch (error) {
    console.log('✅ Correctly throws error for missing neonClient');
  }

  try {
    new ProviderRouter({
      provider: 'supabase',
    });
    console.log('✅ Accepts supabase provider without neonClient');
  } catch (error) {
    console.log('❌ Should not throw error for supabase provider');
  }

  // Test 2: Create router with Neon client
  console.log('\nTest 2: Create router with Neon client');
  try {
    const config = loadDatabaseConfig();
    const neonClient = new NeonClient(config);

    const router = new ProviderRouter({
      provider: 'neon',
      neonClient,
    });

    console.log('✅ Successfully created router with Neon provider');

    // Test health check
    const isHealthy = await neonClient.healthCheck();
    console.log(
      `✅ Neon client health check: ${isHealthy ? 'healthy' : 'unhealthy'}`,
    );

    await neonClient.close();
  } catch (error) {
    console.log('❌ Failed to create router with Neon client:', error);
  }

  // Test 3: Dual-write configuration
  console.log('\nTest 3: Dual-write configuration');
  try {
    const config = loadDatabaseConfig();
    const neonClient = new NeonClient(config);

    const router = new ProviderRouter({
      provider: 'dual-write',
      neonClient,
      primaryProvider: 'neon',
    });

    console.log('✅ Successfully created router with dual-write mode');

    await neonClient.close();
  } catch (error) {
    console.log('❌ Failed to create router with dual-write mode:', error);
  }

  // Test 4: Result comparison
  console.log('\nTest 4: Result comparison');
  try {
    const config = loadDatabaseConfig();
    const neonClient = new NeonClient(config);

    const router = new ProviderRouter({
      provider: 'dual-write',
      neonClient,
    });

    // Access private method for testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compareResults = (router as any).compareResults.bind(router);

    // Test matching results
    const result1 = { id: '123', name: 'Test', count: 5 };
    const result2 = { id: '123', name: 'Test', count: 5 };
    const comparison1 = compareResults(result1, result2);

    if (comparison1.match) {
      console.log('✅ Correctly identifies matching results');
    } else {
      console.log('❌ Should identify matching results');
    }

    // Test different results
    const result3 = { id: '123', name: 'Test1', count: 5 };
    const result4 = { id: '123', name: 'Test2', count: 10 };
    const comparison2 = compareResults(result3, result4);

    if (
      !comparison2.match &&
      comparison2.differences &&
      comparison2.differences.length > 0
    ) {
      console.log('✅ Correctly identifies different results');
      console.log('   Differences:', comparison2.differences);
    } else {
      console.log('❌ Should identify different results');
    }

    // Test null values
    const result5 = { id: '123', name: null };
    const result6 = { id: '123', name: null };
    const comparison3 = compareResults(result5, result6);

    if (comparison3.match) {
      console.log('✅ Correctly handles null values');
    } else {
      console.log('❌ Should handle null values correctly');
    }

    await neonClient.close();
  } catch (error) {
    console.log('❌ Failed result comparison test:', error);
  }

  // Test 5: Environment variable validation
  console.log('\nTest 5: Environment variable validation');
  try {
    const originalProvider = process.env.DATABASE_PROVIDER;

    // Test valid provider
    process.env.DATABASE_PROVIDER = 'neon';
    const config = loadDatabaseConfig();
    const neonClient = new NeonClient(config);

    const router1 = new ProviderRouter({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider: process.env.DATABASE_PROVIDER as any,
      neonClient,
    });
    console.log('✅ Accepts valid DATABASE_PROVIDER value');

    // Test invalid provider
    try {
      process.env.DATABASE_PROVIDER = 'invalid';
      new ProviderRouter({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider: process.env.DATABASE_PROVIDER as any,
      });
      console.log('❌ Should reject invalid DATABASE_PROVIDER value');
    } catch (error) {
      console.log('✅ Correctly rejects invalid DATABASE_PROVIDER value');
    }

    // Restore original value
    process.env.DATABASE_PROVIDER = originalProvider;

    await neonClient.close();
  } catch (error) {
    console.log('❌ Failed environment variable validation test:', error);
  }

  console.log('\n=== All tests completed ===');
}

// Run tests
testProviderRouter().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
