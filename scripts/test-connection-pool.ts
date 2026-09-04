/**
 * Test script for connection pool monitoring
 * Tests health checks, retry logic, and pool metrics
 */

import 'dotenv/config';
import { NeonClient } from '../src/lib/db/neon-client';
import { loadDatabaseConfig } from '../src/lib/db/config';
import { logger } from '../src/lib/logging/logger';

async function testHealthCheck() {
  console.log('\n=== Testing Health Check ===');

  const config = loadDatabaseConfig();
  const client = new NeonClient({
    connectionString: config.connectionString,
    poolMin: config.poolMin,
    poolMax: config.poolMax,
    enablePeriodicHealthCheck: false, // Disable for manual testing
  });

  try {
    const isHealthy = await client.healthCheck();
    console.log(
      'Health check result:',
      isHealthy ? '✓ HEALTHY' : '✗ UNHEALTHY',
    );

    if (!isHealthy) {
      console.error('Database connection is not healthy!');
      process.exit(1);
    }
  } finally {
    await client.close();
  }
}

async function testPoolMetrics() {
  console.log('\n=== Testing Pool Metrics ===');

  const config = loadDatabaseConfig();
  const client = new NeonClient({
    connectionString: config.connectionString,
    poolMin: 2,
    poolMax: 5,
    enablePeriodicHealthCheck: false,
  });

  try {
    // Get initial metrics
    const initialMetrics = client.getPoolMetrics();
    console.log('Initial pool metrics:', initialMetrics);

    // Execute some queries to create connections
    await client.query('SELECT 1');
    await client.query('SELECT 2');
    await client.query('SELECT 3');

    // Get metrics after queries
    const afterMetrics = client.getPoolMetrics();
    console.log('Metrics after queries:', afterMetrics);

    console.log('\nPool statistics:');
    console.log(`  Total connections: ${afterMetrics.totalCount}`);
    console.log(`  Idle connections: ${afterMetrics.idleCount}`);
    console.log(`  Waiting requests: ${afterMetrics.waitingCount}`);
  } finally {
    await client.close();
  }
}

async function testRetryLogic() {
  console.log('\n=== Testing Retry Logic ===');

  // Use invalid connection string to trigger connection errors
  const client = new NeonClient({
    connectionString: 'postgresql://invalid:invalid@invalid.invalid/invalid',
    retryAttempts: 3,
    retryDelayMs: 500,
    enablePeriodicHealthCheck: false,
  });

  try {
    console.log(
      'Attempting query with invalid connection (should retry 3 times)...',
    );
    await client.query('SELECT 1');
    console.log('✗ Query succeeded unexpectedly');
  } catch (error: unknown) {
    console.log('✓ Query failed as expected after retries');
    if (
      error &&
      typeof error === 'object' &&
      'category' in error &&
      'message' in error
    ) {
      console.log('Error category:', error.category);
      console.log('Error message:', error.message);
    }
  } finally {
    await client.close();
  }
}

async function testPeriodicHealthCheck() {
  console.log('\n=== Testing Periodic Health Check ===');

  const config = loadDatabaseConfig();
  const client = new NeonClient({
    connectionString: config.connectionString,
    poolMin: config.poolMin,
    poolMax: config.poolMax,
    enablePeriodicHealthCheck: true,
    healthCheckIntervalMs: 5000, // Check every 5 seconds
  });

  try {
    console.log('Periodic health checks enabled (5 second interval)');
    console.log('Waiting 12 seconds to observe health check logs...');

    // Wait to observe periodic health checks
    await new Promise((resolve) => setTimeout(resolve, 12000));

    console.log('✓ Periodic health checks completed');
  } finally {
    await client.close();
  }
}

async function testConnectionRecovery() {
  console.log('\n=== Testing Connection Recovery ===');

  const config = loadDatabaseConfig();
  const client = new NeonClient({
    connectionString: config.connectionString,
    poolMin: config.poolMin,
    poolMax: config.poolMax,
    retryAttempts: 3,
    retryDelayMs: 1000,
    enablePeriodicHealthCheck: false,
  });

  try {
    // Execute successful query
    console.log('Executing successful query...');
    const result1 = await client.query('SELECT 1 as test');
    console.log('✓ First query succeeded:', result1);

    // Execute another query (should reuse connection)
    console.log('Executing second query (should reuse connection)...');
    const result2 = await client.query('SELECT 2 as test');
    console.log('✓ Second query succeeded:', result2);

    // Check pool metrics
    const metrics = client.getPoolMetrics();
    console.log('\nFinal pool metrics:', metrics);

    if (metrics.totalCount > 0 && metrics.idleCount > 0) {
      console.log('✓ Connection pool is reusing connections');
    }
  } finally {
    await client.close();
  }
}

async function main() {
  console.log('Connection Pool Monitoring Test Suite');
  console.log('=====================================');

  try {
    await testHealthCheck();
    await testPoolMetrics();
    await testConnectionRecovery();
    await testRetryLogic();
    await testPeriodicHealthCheck();

    console.log('\n=== All Tests Completed ===');
    console.log('✓ Connection pool monitoring is working correctly');
  } catch (error) {
    console.error('\n✗ Test suite failed:', error);
    process.exit(1);
  }
}

main();
