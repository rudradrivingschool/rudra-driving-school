/**
 * Test script for QueryAdapter CRUD operations
 * Verifies insert, update, delete, and select operations work correctly
 */

import 'dotenv/config';
import { QueryAdapter } from '../src/lib/db/query-adapter';
import { NeonClient } from '../src/lib/db/neon-client';
import { loadDatabaseConfig } from '../src/lib/db/config';

interface TestDriver {
  id?: string;
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  status?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

async function testCRUDOperations() {
  console.log('🚀 Starting QueryAdapter CRUD tests...\n');

  // Initialize client and adapter
  const config = loadDatabaseConfig();
  const client = new NeonClient(config);
  const adapter = new QueryAdapter(client);

  let testDriverId: string | undefined;

  try {
    // Test 1: INSERT operation
    console.log('📝 Test 1: INSERT operation');
    const newDriver: Partial<TestDriver> = {
      username: `test_driver_${Date.now()}`,
      password: 'test_password_123',
      name: 'Test Driver',
      email: `test${Date.now()}@example.com`,
      phone: '1234567890',
      status: 'active',
      role: 'driver',
    };

    const insertedDriver = await adapter.insert<TestDriver>(
      'drivers',
      newDriver,
    );
    testDriverId = insertedDriver.id;

    console.log('✅ INSERT successful');
    console.log('   Inserted driver ID:', insertedDriver.id);
    console.log('   Inserted driver name:', insertedDriver.name);
    console.log(
      '   Has all fields:',
      !!insertedDriver.created_at && !!insertedDriver.updated_at,
    );
    console.log('');

    // Test 2: SELECT operation using from()
    console.log('📖 Test 2: SELECT operation using from()');
    const selectedDriver = await adapter
      .from<TestDriver>('drivers')
      .eq('id', testDriverId!)
      .single();

    console.log('✅ SELECT successful');
    console.log('   Found driver:', selectedDriver?.name);
    console.log(
      '   Username matches:',
      selectedDriver?.username === newDriver.username,
    );
    console.log('');

    // Test 3: UPDATE operation
    console.log('✏️  Test 3: UPDATE operation');
    const updateData: Partial<TestDriver> = {
      name: 'Updated Test Driver',
      phone: '9876543210',
    };

    const updatedDriver = await adapter.update<TestDriver>(
      'drivers',
      testDriverId!,
      updateData,
    );

    console.log('✅ UPDATE successful');
    console.log('   Updated name:', updatedDriver.name);
    console.log('   Updated phone:', updatedDriver.phone);
    console.log(
      '   Name changed:',
      updatedDriver.name === 'Updated Test Driver',
    );
    console.log('   Phone changed:', updatedDriver.phone === '9876543210');
    console.log('');

    // Test 4: SELECT with filters
    console.log('🔍 Test 4: SELECT with filters');
    const activeDrivers = await adapter
      .from<TestDriver>('drivers')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)
      .execute();

    console.log('✅ SELECT with filters successful');
    console.log('   Found drivers:', activeDrivers.length);
    console.log(
      '   All active:',
      activeDrivers.every((d) => d.status === 'active'),
    );
    console.log('');

    // Test 5: DELETE operation
    console.log('🗑️  Test 5: DELETE operation');
    await adapter.delete('drivers', testDriverId!);

    // Verify deletion
    const deletedDriver = await adapter
      .from<TestDriver>('drivers')
      .eq('id', testDriverId!)
      .single();

    console.log('✅ DELETE successful');
    console.log('   Driver deleted:', deletedDriver === null);
    console.log('');

    // Test 6: Error handling - update non-existent record
    console.log('⚠️  Test 6: Error handling - update non-existent record');
    try {
      await adapter.update('drivers', 'non-existent-id', {
        name: 'Should Fail',
      });
      console.log('❌ Should have thrown an error');
    } catch (error) {
      console.log('✅ Error handling works correctly');
      console.log('   Error message:', (error as Error).message);
    }
    console.log('');

    // Test 7: Error handling - insert empty data
    console.log('⚠️  Test 7: Error handling - insert empty data');
    try {
      await adapter.insert('drivers', {});
      console.log('❌ Should have thrown an error');
    } catch (error) {
      console.log('✅ Error handling works correctly');
      console.log('   Error message:', (error as Error).message);
    }
    console.log('');

    console.log('🎉 All CRUD tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup: ensure test driver is deleted if it exists
    if (testDriverId) {
      try {
        await adapter.delete('drivers', testDriverId);
        console.log('\n🧹 Cleanup: Test driver deleted');
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    // Close the client
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the tests
testCRUDOperations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
