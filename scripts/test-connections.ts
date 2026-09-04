/**
 * Simple connection test script
 * Tests both Neon and Supabase connections
 */

import 'dotenv/config';
import { NeonClient } from '../src/lib/db/neon-client';
import { loadDatabaseConfig } from '../src/lib/db/config';
import { supabaseNode as supabase } from './supabase-node-client';

async function testConnections() {
  console.log('Testing database connections...\n');

  // Test Neon connection
  console.log('1. Testing Neon DB connection...');
  try {
    const config = loadDatabaseConfig();
    const neonClient = new NeonClient(config);

    const isHealthy = await neonClient.healthCheck();
    if (isHealthy) {
      console.log('✓ Neon DB connection successful\n');
    } else {
      console.log('✗ Neon DB health check failed\n');
    }

    await neonClient.close();
  } catch (error) {
    console.log('✗ Neon DB connection failed:', error);
    console.log('');
  }

  // Test Supabase connection
  console.log('2. Testing Supabase connection...');
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.log('✗ Supabase connection failed:', error.message);
    } else {
      console.log('✓ Supabase connection successful\n');
    }
  } catch (error) {
    console.log('✗ Supabase connection failed:', error);
    console.log('');
  }

  console.log('Connection tests complete.');
}

testConnections().catch(console.error);
