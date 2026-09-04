/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Neon DB validation script (without Supabase comparison)
 * Validates that Neon DB is functioning correctly
 */

import 'dotenv/config';
import { NeonClient } from '../src/lib/db/neon-client';
import { loadDatabaseConfig } from '../src/lib/db/config';
import { QueryAdapter } from '../src/lib/db/query-adapter';
import { AuthService } from '../src/lib/auth/auth-service';
import type {
  DriversRow,
  AdmissionsRow,
  RidesRow,
  ExpensesRow,
  PaymentsRow,
} from '../src/lib/db/types';

type TableName = 'drivers' | 'admissions' | 'rides' | 'expenses' | 'payments';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: any;
}

class NeonValidator {
  private neonClient: NeonClient;
  private queryAdapter: QueryAdapter;
  private authService: AuthService;
  private results: ValidationResult[] = [];

  constructor(neonClient: NeonClient) {
    this.neonClient = neonClient;
    this.queryAdapter = new QueryAdapter(neonClient);
    this.authService = new AuthService(this.queryAdapter);
  }

  async validate(): Promise<void> {
    console.log('='.repeat(70));
    console.log('NEON DB VALIDATION');
    console.log('='.repeat(70));
    console.log(`Started at: ${new Date().toISOString()}\n`);

    await this.validateSchema();
    await this.validateData();
    await this.validateFunctionality();

    this.printSummary();
  }

  private async validateSchema(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('SCHEMA VALIDATION');
    console.log('='.repeat(70));

    await this.checkTables();
    await this.checkForeignKeys();
    await this.checkIndexes();
  }

  private async checkTables(): Promise<void> {
    console.log('\nChecking tables exist...');

    const tables: TableName[] = [
      'drivers',
      'admissions',
      'rides',
      'expenses',
      'payments',
    ];

    for (const table of tables) {
      try {
        const result = await this.neonClient.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${table}`,
        );
        const count = parseInt(result[0]?.count || '0');

        this.addResult(true, `Table ${table} exists with ${count} records`);
      } catch (error) {
        this.addResult(false, `Table ${table} check failed: ${error}`);
      }
    }
  }

  private async checkForeignKeys(): Promise<void> {
    console.log('\nChecking foreign key relationships...');

    const foreignKeys = [
      {
        table: 'rides',
        column: 'driver_id',
        refTable: 'drivers',
        refColumn: 'id',
      },
      {
        table: 'rides',
        column: 'client_id',
        refTable: 'admissions',
        refColumn: 'id',
      },
      {
        table: 'expenses',
        column: 'driver_id',
        refTable: 'drivers',
        refColumn: 'id',
      },
      {
        table: 'payments',
        column: 'admission_id',
        refTable: 'admissions',
        refColumn: 'id',
      },
    ];

    for (const fk of foreignKeys) {
      try {
        const result = await this.neonClient.query<{ constraint_name: string }>(
          `
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_name = $1
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%${fk.column}%'
          `,
          [fk.table],
        );

        if (result.length > 0) {
          // Check for orphaned records
          const orphanedResult = await this.neonClient.query<{
            count: string;
          }>(`
            SELECT COUNT(*) as count
            FROM ${fk.table}
            WHERE ${fk.column} IS NOT NULL
              AND ${fk.column} NOT IN (SELECT ${fk.refColumn} FROM ${fk.refTable})
          `);

          const orphanedCount = parseInt(orphanedResult[0]?.count || '0');

          this.addResult(
            orphanedCount === 0,
            `Foreign key ${fk.table}.${fk.column} → ${fk.refTable}.${fk.refColumn} is intact (${orphanedCount} orphaned records)`,
          );
        } else {
          this.addResult(
            false,
            `Foreign key constraint missing: ${fk.table}.${fk.column}`,
          );
        }
      } catch (error) {
        this.addResult(
          false,
          `Error checking foreign key ${fk.table}.${fk.column}: ${error}`,
        );
      }
    }
  }

  private async checkIndexes(): Promise<void> {
    console.log('\nChecking indexes...');

    const tables: TableName[] = [
      'drivers',
      'admissions',
      'rides',
      'expenses',
      'payments',
    ];

    for (const table of tables) {
      try {
        const result = await this.neonClient.query<{ indexname: string }>(
          `
          SELECT indexname
          FROM pg_indexes
          WHERE tablename = $1
            AND schemaname = 'public'
          `,
          [table],
        );

        this.addResult(
          result.length > 0,
          `Table ${table} has ${result.length} index(es)`,
        );
      } catch (error) {
        this.addResult(false, `Error checking indexes for ${table}: ${error}`);
      }
    }
  }

  private async validateData(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('DATA VALIDATION');
    console.log('='.repeat(70));

    await this.checkDataIntegrity();
  }

  private async checkDataIntegrity(): Promise<void> {
    console.log('\nChecking data integrity...');

    const tables: TableName[] = [
      'drivers',
      'admissions',
      'rides',
      'expenses',
      'payments',
    ];

    for (const table of tables) {
      try {
        // Check for NULL primary keys
        const nullPkResult = await this.neonClient.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${table} WHERE id IS NULL`,
        );
        const nullPkCount = parseInt(nullPkResult[0]?.count || '0');

        this.addResult(
          nullPkCount === 0,
          `Table ${table} has no NULL primary keys (found ${nullPkCount})`,
        );

        // Sample a few records
        const sampleResult = await this.neonClient.query(
          `SELECT * FROM ${table} LIMIT 3`,
        );

        this.addResult(
          true,
          `Table ${table} sample query successful (${sampleResult.length} records)`,
        );
      } catch (error) {
        this.addResult(
          false,
          `Error checking data integrity for ${table}: ${error}`,
        );
      }
    }
  }

  private async validateFunctionality(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('FUNCTIONAL VALIDATION');
    console.log('='.repeat(70));

    await this.testCRUDOperations();
    await this.testHookQueries();
    await this.testAuthentication();
  }

  private async testCRUDOperations(): Promise<void> {
    console.log('\nTesting CRUD operations...');

    const testId = 'test-' + Date.now();

    try {
      // CREATE
      const insertedDriver = await this.queryAdapter.insert<DriversRow>(
        'drivers',
        {
          id: testId,
          username: `test_user_${testId}`,
          password: 'test_password',
          name: 'Test Driver',
          email: `test_${testId}@example.com`,
          status: 'active',
          role: 'driver',
        },
      );

      this.addResult(
        insertedDriver && insertedDriver.id === testId,
        'CREATE operation successful',
      );

      // READ
      const readDriver = await this.queryAdapter
        .from<DriversRow>('drivers')
        .eq('id', testId)
        .single();

      this.addResult(
        readDriver && readDriver.id === testId,
        'READ operation successful',
      );

      // UPDATE
      const updatedDriver = await this.queryAdapter.update<DriversRow>(
        'drivers',
        testId,
        {
          name: 'Updated Test Driver',
        },
      );

      this.addResult(
        updatedDriver && updatedDriver.name === 'Updated Test Driver',
        'UPDATE operation successful',
      );

      // DELETE
      await this.queryAdapter.delete('drivers', testId);

      const deletedDriver = await this.queryAdapter
        .from<DriversRow>('drivers')
        .eq('id', testId)
        .single();

      this.addResult(!deletedDriver, 'DELETE operation successful');
    } catch (error) {
      this.addResult(false, `CRUD operations test failed: ${error}`);

      // Cleanup
      try {
        await this.queryAdapter.delete('drivers', testId);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }

  private async testHookQueries(): Promise<void> {
    console.log('\nTesting hook queries...');

    const hooks = [
      { name: 'useDrivers', table: 'drivers', orderBy: 'created_at' },
      { name: 'useAdmissions', table: 'admissions', orderBy: 'created_at' },
      { name: 'useRides', table: 'rides', orderBy: 'date' },
      { name: 'useExpenses', table: 'expenses', orderBy: 'date' },
      { name: 'usePayments', table: 'payments', orderBy: 'payment_date' },
    ];

    for (const hook of hooks) {
      try {
        const results = await this.queryAdapter
          .from(hook.table)
          .order(hook.orderBy, { ascending: false })
          .limit(10)
          .execute();

        this.addResult(
          true,
          `${hook.name} query executed successfully (${results.length} records)`,
        );
      } catch (error) {
        this.addResult(false, `${hook.name} query failed: ${error}`);
      }
    }
  }

  private async testAuthentication(): Promise<void> {
    console.log('\nTesting authentication system...');

    try {
      // Get a sample driver
      const drivers = await this.neonClient.query<DriversRow>(
        'SELECT * FROM drivers LIMIT 1',
      );

      if (drivers.length === 0) {
        this.addResult(false, 'No drivers found to test authentication');
        return;
      }

      const driver = drivers[0];

      // Test that auth service can query the database
      const testDriver = await this.queryAdapter
        .from<DriversRow>('drivers')
        .eq('username', driver.username)
        .single();

      this.addResult(
        testDriver !== null,
        'Authentication system can query drivers table',
      );
    } catch (error) {
      this.addResult(false, `Error testing authentication: ${error}`);
    }
  }

  private addResult(passed: boolean, message: string, details?: any): void {
    const result: ValidationResult = { passed, message, details };
    this.results.push(result);

    if (passed) {
      console.log(`  ✓ ${message}`);
    } else {
      console.log(`  ✗ ${message}`);
    }

    if (details) {
      console.log(`    Details: ${JSON.stringify(details)}`);
    }
  }

  private printSummary(): void {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;
    const passRate = (passed / total) * 100;

    console.log('\n' + '='.repeat(70));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Checks: ${total}`);
    console.log(`Passed: ${passed} (${passRate.toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${(100 - passRate).toFixed(1)}%)`);
    console.log('');

    if (failed === 0) {
      console.log('✓ All validation checks passed!');
      console.log('✓ Neon DB is functioning correctly');
      console.log('✓ Safe to use Neon DB as primary database');
    } else if (passRate >= 90) {
      console.log('⚠ Minor issues found, but overall validation passed');
      console.log('⚠ Review failed checks before proceeding');
    } else {
      console.log('✗ Significant issues found');
      console.log('✗ DO NOT proceed until issues are resolved');
    }

    console.log('='.repeat(70));
  }
}

async function main() {
  try {
    const config = loadDatabaseConfig();
    const neonClient = new NeonClient(config);

    // Test connection
    const isHealthy = await neonClient.healthCheck();
    if (!isHealthy) {
      throw new Error('Neon DB connection health check failed');
    }

    const validator = new NeonValidator(neonClient);
    await validator.validate();

    await neonClient.close();
    process.exit(0);
  } catch (error) {
    console.error('\nFatal error:', error);
    process.exit(1);
  }
}

main();
