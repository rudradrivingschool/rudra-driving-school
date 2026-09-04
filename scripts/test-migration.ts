/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config';
import { NeonClient } from '../src/lib/db/neon-client';
import { loadDatabaseConfig } from '../src/lib/db/config';
import { supabaseNode as supabase } from './supabase-node-client';

async function testMigration() {
  console.log('Testing migration prerequisites...\n');

  try {
    // Test 1: Load config
    console.log('1. Loading Neon DB configuration...');
    const config = loadDatabaseConfig();
    console.log('   ✓ Config loaded');

    // Test 2: Create Neon client
    console.log('2. Creating Neon client...');
    const neonClient = new NeonClient(config);
    console.log('   ✓ Client created');

    // Test 3: Test Neon connection
    console.log('3. Testing Neon DB connection...');
    const isHealthy = await neonClient.healthCheck();
    console.log(`   ${isHealthy ? '✓' : '✗'} Health check: ${isHealthy}`);

    if (!isHealthy) {
      throw new Error('Neon DB health check failed');
    }

    // Test 4: Test Supabase connection
    console.log('4. Testing Supabase connection...');
    const { data, error } = await supabase
      .from('drivers')
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log('   ✓ Supabase connected');

    // Test 5: Count records in Supabase
    console.log('5. Counting records in Supabase...');
    const tables = ['drivers', 'admissions', 'rides', 'expenses', 'payments'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ✗ ${table}: Error - ${error.message}`);
      } else {
        console.log(`   ${table}: ${count} records`);
      }
    }

    // Test 6: Count records in Neon
    console.log('\n6. Counting records in Neon...');
    for (const table of tables) {
      const result = await neonClient.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${table}`,
      );
      const count = parseInt(result[0]?.count || '0');
      console.log(`   ${table}: ${count} records`);
    }

    await neonClient.close();
    console.log('\n✅ All tests passed! Ready to migrate.');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMigration();
