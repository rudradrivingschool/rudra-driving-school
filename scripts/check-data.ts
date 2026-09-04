/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config';
import { Client } from 'pg';

async function checkData() {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('📊 Checking data in Neon database...\n');

    const tables = ['drivers', 'admissions', 'rides', 'expenses', 'payments'];

    for (const table of tables) {
      const result = await client.query(
        `SELECT COUNT(*) as count FROM ${table}`,
      );
      const count = parseInt(result.rows[0].count);
      console.log(`${table.padEnd(12)}: ${count} records`);
    }

    await client.end();
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkData();
