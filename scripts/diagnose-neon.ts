/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config';
import { Client } from 'pg';

async function diagnoseConnection() {
  console.log('🔍 Neon Database Connection Diagnostics\n');

  // Step 1: Check environment variable
  const connectionString = process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    console.error('❌ NEON_DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('✅ NEON_DATABASE_URL found');

  // Parse connection string to show details (without password)
  try {
    const url = new URL(connectionString);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || '5432'}`);
    console.log(`   Database: ${url.pathname.slice(1).split('?')[0]}`);
    console.log(`   User: ${url.username}`);
    console.log(
      `   SSL Mode: ${url.searchParams.get('sslmode') || 'not specified'}`,
    );
    console.log();
  } catch (error) {
    console.error('❌ Invalid connection string format');
    process.exit(1);
  }

  // Step 2: Test basic connection
  console.log('🔌 Testing basic connection...');
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!\n');

    // Step 3: Test query execution
    console.log('📊 Testing query execution...');
    const result = await client.query(
      'SELECT version(), current_database(), current_user',
    );
    console.log('✅ Query successful!');
    console.log(
      `   PostgreSQL Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`,
    );
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   User: ${result.rows[0].current_user}\n`);

    // Step 4: Check if tables exist
    console.log('🗄️  Checking for existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log(`✅ Found ${tablesResult.rows.length} table(s):`);
      tablesResult.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found (database is empty)');
    }

    await client.end();
    console.log('\n✅ All diagnostics passed!');
  } catch (error: any) {
    console.error('\n❌ Connection failed!');
    console.error(`   Error: ${error.message}`);

    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }

    // Provide specific troubleshooting advice
    console.log('\n💡 Troubleshooting suggestions:');

    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      console.log('   • The connection timed out - this usually means:');
      console.log('     - Your firewall is blocking port 5432');
      console.log('     - The Neon database is paused (check Neon dashboard)');
      console.log('     - Network connectivity issues');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log(
        '   • DNS resolution failed - check your internet connection',
      );
    } else if (error.message.includes('authentication')) {
      console.log(
        '   • Authentication failed - verify your credentials in Neon dashboard',
      );
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log(
        '   • Connection refused - the database might be paused or unavailable',
      );
    }

    console.log(
      '   • Try accessing your Neon dashboard to wake up the database',
    );
    console.log(
      "   • Verify the connection string matches what's in your Neon dashboard",
    );

    process.exit(1);
  }
}

diagnoseConnection();
