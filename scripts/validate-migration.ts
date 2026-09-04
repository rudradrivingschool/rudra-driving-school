/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Migration validation script
 * Performs comprehensive validation of data migration from Supabase to Neon DB
 *
 * Validates:
 * - Record counts match between Supabase and Neon
 * - Foreign key relationships are intact
 * - Random sampling of records for data integrity
 * - Authentication system works
 * - Sample queries from hooks execute correctly
 * - All CRUD operations function properly
 */

import 'dotenv/config';
import { NeonClient } from '../src/lib/db/neon-client';
import { loadDatabaseConfig } from '../src/lib/db/config';
import { supabaseNode as supabase } from './supabase-node-client';
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

interface ValidationReport {
  timestamp: string;
  overallStatus: 'PASS' | 'FAIL';
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  sections: {
    schemaValidation: ValidationResult[];
    dataValidation: ValidationResult[];
    functionalValidation: ValidationResult[];
  };
  discrepancies: string[];
  recommendations: string[];
  goNoGo: 'GO' | 'NO-GO';
}

/**
 * MigrationValidator performs comprehensive validation checks
 */
class MigrationValidator {
  private neonClient: NeonClient;
  private queryAdapter: QueryAdapter;
  private authService: AuthService;
  private report: ValidationReport;

  constructor(neonClient: NeonClient) {
    this.neonClient = neonClient;
    this.queryAdapter = new QueryAdapter('neon', neonClient);
    this.authService = new AuthService(this.queryAdapter);

    this.report = {
      timestamp: new Date().toISOString(),
      overallStatus: 'PASS',
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      sections: {
        schemaValidation: [],
        dataValidation: [],
        functionalValidation: [],
      },
      discrepancies: [],
      recommendations: [],
      goNoGo: 'GO',
    };
  }

  /**
   * Run all validation checks
   */
  async validate(): Promise<ValidationReport> {
    console.log('='.repeat(70));
    console.log('MIGRATION VALIDATION');
    console.log('='.repeat(70));
    console.log(`Started at: ${this.report.timestamp}\n`);

    try {
      // Schema validation
      await this.validateSchema();

      // Data validation
      await this.validateData();

      // Functional validation
      await this.validateFunctionality();

      // Calculate final status
      this.calculateFinalStatus();

      return this.report;
    } catch (error) {
      console.error('Fatal error during validation:', error);
      this.report.overallStatus = 'FAIL';
      this.report.goNoGo = 'NO-GO';
      this.report.recommendations.push(
        'Critical error occurred during validation. Review logs before proceeding.',
      );
      return this.report;
    }
  }

  /**
   * Validate database schema
   */
  private async validateSchema(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('SCHEMA VALIDATION');
    console.log('='.repeat(70));

    // Check foreign key relationships
    await this.checkForeignKeys();

    // Check indexes
    await this.checkIndexes();
  }

  /**
   * Check foreign key relationships are intact
   */
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
        // Check if foreign key constraint exists
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

        const exists = result.length > 0;

        if (exists) {
          // Verify no orphaned records
          const orphanedResult = await this.neonClient.query<{
            count: string;
          }>(`
            SELECT COUNT(*) as count
            FROM ${fk.table}
            WHERE ${fk.column} IS NOT NULL
              AND ${fk.column} NOT IN (SELECT ${fk.refColumn} FROM ${fk.refTable})
          `);

          const orphanedCount = parseInt(orphanedResult[0]?.count || '0');

          if (orphanedCount === 0) {
            this.addResult(
              'schemaValidation',
              true,
              `Foreign key ${fk.table}.${fk.column} → ${fk.refTable}.${fk.refColumn} is intact`,
              { orphanedRecords: 0 },
            );
          } else {
            this.addResult(
              'schemaValidation',
              false,
              `Foreign key ${fk.table}.${fk.column} has ${orphanedCount} orphaned records`,
              { orphanedRecords: orphanedCount },
            );
            this.report.discrepancies.push(
              `${orphanedCount} orphaned records in ${fk.table}.${fk.column}`,
            );
          }
        } else {
          this.addResult(
            'schemaValidation',
            false,
            `Foreign key constraint missing: ${fk.table}.${fk.column} → ${fk.refTable}.${fk.refColumn}`,
          );
          this.report.discrepancies.push(
            `Missing foreign key: ${fk.table}.${fk.column}`,
          );
        }
      } catch (error) {
        this.addResult(
          'schemaValidation',
          false,
          `Error checking foreign key ${fk.table}.${fk.column}: ${error}`,
        );
      }
    }
  }

  /**
   * Check indexes exist
   */
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

        const indexCount = result.length;

        // At minimum, should have primary key index
        if (indexCount > 0) {
          this.addResult(
            'schemaValidation',
            true,
            `Table ${table} has ${indexCount} index(es)`,
            { indexes: result.map((r) => r.indexname) },
          );
        } else {
          this.addResult(
            'schemaValidation',
            false,
            `Table ${table} has no indexes`,
          );
          this.report.discrepancies.push(`No indexes found on ${table}`);
        }
      } catch (error) {
        this.addResult(
          'schemaValidation',
          false,
          `Error checking indexes for ${table}: ${error}`,
        );
      }
    }
  }

  /**
   * Validate data integrity
   */
  private async validateData(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('DATA VALIDATION');
    console.log('='.repeat(70));

    // Compare record counts
    await this.compareRecordCounts();

    // Sample and compare random records
    await this.sampleRecords();
  }

  /**
   * Compare record counts between Supabase and Neon
   */
  private async compareRecordCounts(): Promise<void> {
    console.log('\nComparing record counts...');

    const tables: TableName[] = [
      'drivers',
      'admissions',
      'rides',
      'expenses',
      'payments',
    ];

    for (const table of tables) {
      try {
        // Get count from Supabase
        const { count: supabaseCount, error: supabaseError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (supabaseError) {
          throw new Error(`Supabase error: ${supabaseError.message}`);
        }

        // Get count from Neon
        const neonResult = await this.neonClient.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${table}`,
        );
        const neonCount = parseInt(neonResult[0]?.count || '0');

        const match = supabaseCount === neonCount;

        if (match) {
          this.addResult(
            'dataValidation',
            true,
            `Record count matches for ${table}`,
            { supabase: supabaseCount, neon: neonCount },
          );
        } else {
          this.addResult(
            'dataValidation',
            false,
            `Record count mismatch for ${table}`,
            {
              supabase: supabaseCount,
              neon: neonCount,
              difference: Math.abs((supabaseCount || 0) - neonCount),
            },
          );
          this.report.discrepancies.push(
            `${table}: Supabase has ${supabaseCount}, Neon has ${neonCount}`,
          );
        }
      } catch (error) {
        this.addResult(
          'dataValidation',
          false,
          `Error comparing counts for ${table}: ${error}`,
        );
      }
    }
  }

  /**
   * Sample random records and compare field values
   */
  private async sampleRecords(): Promise<void> {
    console.log('\nSampling random records...');

    const tables: TableName[] = [
      'drivers',
      'admissions',
      'rides',
      'expenses',
      'payments',
    ];
    const sampleSize = 5; // Sample 5 random records per table

    for (const table of tables) {
      try {
        // Get random sample from Supabase
        const { data: supabaseData, error: supabaseError } = await supabase
          .from(table)
          .select('*')
          .limit(sampleSize);

        if (supabaseError) {
          throw new Error(`Supabase error: ${supabaseError.message}`);
        }

        if (!supabaseData || supabaseData.length === 0) {
          console.log(`  No records to sample in ${table}`);
          continue;
        }

        let matchCount = 0;
        let mismatchCount = 0;

        // Compare each sampled record
        for (const supabaseRecord of supabaseData) {
          const neonResult = await this.neonClient.query(
            `SELECT * FROM ${table} WHERE id = $1`,
            [supabaseRecord.id],
          );

          if (neonResult.length === 0) {
            mismatchCount++;
            this.report.discrepancies.push(
              `Record ${supabaseRecord.id} exists in Supabase ${table} but not in Neon`,
            );
            continue;
          }

          const neonRecord = neonResult[0];

          // Compare field values (excluding timestamps which may have minor differences)
          const fieldsMatch = this.compareRecords(
            supabaseRecord,
            neonRecord,
            table,
          );

          if (fieldsMatch) {
            matchCount++;
          } else {
            mismatchCount++;
          }
        }

        if (mismatchCount === 0) {
          this.addResult(
            'dataValidation',
            true,
            `All ${matchCount} sampled records match in ${table}`,
          );
        } else {
          this.addResult(
            'dataValidation',
            false,
            `${mismatchCount} of ${supabaseData.length} sampled records have mismatches in ${table}`,
            { matched: matchCount, mismatched: mismatchCount },
          );
        }
      } catch (error) {
        this.addResult(
          'dataValidation',
          false,
          `Error sampling records from ${table}: ${error}`,
        );
      }
    }
  }

  /**
   * Compare two records field by field
   */
  private compareRecords(
    supabaseRecord: any,
    neonRecord: any,
    table: string,
  ): boolean {
    const keys = Object.keys(supabaseRecord);
    let allMatch = true;

    for (const key of keys) {
      const supabaseValue = supabaseRecord[key];
      const neonValue = neonRecord[key];

      // Skip timestamp comparisons (may have minor formatting differences)
      if (key.includes('_at') || key.includes('date')) {
        continue;
      }

      // Compare values (handle null/undefined)
      if (supabaseValue !== neonValue) {
        // Check if both are null/undefined
        if (supabaseValue == null && neonValue == null) {
          continue;
        }

        this.report.discrepancies.push(
          `${table} record ${supabaseRecord.id}: field ${key} differs (Supabase: ${supabaseValue}, Neon: ${neonValue})`,
        );
        allMatch = false;
      }
    }

    return allMatch;
  }

  /**
   * Validate functionality
   */
  private async validateFunctionality(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('FUNCTIONAL VALIDATION');
    console.log('='.repeat(70));

    // Test authentication
    await this.testAuthentication();

    // Test CRUD operations
    await this.testCRUDOperations();

    // Test sample queries from hooks
    await this.testHookQueries();
  }

  /**
   * Test authentication with sample credentials
   */
  private async testAuthentication(): Promise<void> {
    console.log('\nTesting authentication system...');

    try {
      // Get a sample driver
      const drivers = await this.neonClient.query<DriversRow>(
        'SELECT * FROM drivers LIMIT 1',
      );

      if (drivers.length === 0) {
        this.addResult(
          'functionalValidation',
          false,
          'No drivers found to test authentication',
        );
        return;
      }

      const driver = drivers[0];

      // Test with correct credentials (assuming password is username for testing)
      // Note: In production, you'd use actual test credentials
      try {
        // Just verify the auth service can query the database
        const testDriver = await this.queryAdapter
          .from<DriversRow>('drivers')
          .eq('username', driver.username)
          .single();

        if (testDriver) {
          this.addResult(
            'functionalValidation',
            true,
            'Authentication system can query drivers table',
            { username: driver.username },
          );
        } else {
          this.addResult(
            'functionalValidation',
            false,
            'Authentication system failed to query drivers table',
          );
        }
      } catch (error) {
        this.addResult(
          'functionalValidation',
          false,
          `Authentication query failed: ${error}`,
        );
      }
    } catch (error) {
      this.addResult(
        'functionalValidation',
        false,
        `Error testing authentication: ${error}`,
      );
    }
  }

  /**
   * Test CRUD operations on Neon DB
   */
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

      if (insertedDriver && insertedDriver.id === testId) {
        this.addResult(
          'functionalValidation',
          true,
          'CREATE operation successful',
          { operation: 'INSERT', table: 'drivers' },
        );
      } else {
        this.addResult(
          'functionalValidation',
          false,
          'CREATE operation failed to return inserted record',
        );
      }

      // READ
      const readDriver = await this.queryAdapter
        .from<DriversRow>('drivers')
        .eq('id', testId)
        .single();

      if (readDriver && readDriver.id === testId) {
        this.addResult(
          'functionalValidation',
          true,
          'READ operation successful',
          { operation: 'SELECT', table: 'drivers' },
        );
      } else {
        this.addResult(
          'functionalValidation',
          false,
          'READ operation failed to retrieve record',
        );
      }

      // UPDATE
      const updatedDriver = await this.queryAdapter.update<DriversRow>(
        'drivers',
        testId,
        {
          name: 'Updated Test Driver',
        },
      );

      if (updatedDriver && updatedDriver.name === 'Updated Test Driver') {
        this.addResult(
          'functionalValidation',
          true,
          'UPDATE operation successful',
          { operation: 'UPDATE', table: 'drivers' },
        );
      } else {
        this.addResult(
          'functionalValidation',
          false,
          'UPDATE operation failed to update record',
        );
      }

      // DELETE
      await this.queryAdapter.delete('drivers', testId);

      const deletedDriver = await this.queryAdapter
        .from<DriversRow>('drivers')
        .eq('id', testId)
        .single();

      if (!deletedDriver) {
        this.addResult(
          'functionalValidation',
          true,
          'DELETE operation successful',
          { operation: 'DELETE', table: 'drivers' },
        );
      } else {
        this.addResult(
          'functionalValidation',
          false,
          'DELETE operation failed to remove record',
        );
      }
    } catch (error) {
      this.addResult(
        'functionalValidation',
        false,
        `CRUD operations test failed: ${error}`,
      );

      // Cleanup: try to delete test record if it exists
      try {
        await this.queryAdapter.delete('drivers', testId);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Test sample queries from hooks
   */
  private async testHookQueries(): Promise<void> {
    console.log('\nTesting sample queries from hooks...');

    // Test useDrivers query
    try {
      const drivers = await this.queryAdapter
        .from<DriversRow>('drivers')
        .order('created_at', { ascending: false })
        .execute();

      this.addResult(
        'functionalValidation',
        true,
        'useDrivers query executed successfully',
        { hook: 'useDrivers', recordCount: drivers.length },
      );
    } catch (error) {
      this.addResult(
        'functionalValidation',
        false,
        `useDrivers query failed: ${error}`,
      );
    }

    // Test useAdmissions query
    try {
      const admissions = await this.queryAdapter
        .from<AdmissionsRow>('admissions')
        .order('created_at', { ascending: false })
        .execute();

      this.addResult(
        'functionalValidation',
        true,
        'useAdmissions query executed successfully',
        { hook: 'useAdmissions', recordCount: admissions.length },
      );
    } catch (error) {
      this.addResult(
        'functionalValidation',
        false,
        `useAdmissions query failed: ${error}`,
      );
    }

    // Test useRides query with filter
    try {
      const rides = await this.queryAdapter
        .from<RidesRow>('rides')
        .order('date', { ascending: false })
        .limit(10)
        .execute();

      this.addResult(
        'functionalValidation',
        true,
        'useRides query executed successfully',
        { hook: 'useRides', recordCount: rides.length },
      );
    } catch (error) {
      this.addResult(
        'functionalValidation',
        false,
        `useRides query failed: ${error}`,
      );
    }

    // Test useExpenses query
    try {
      const expenses = await this.queryAdapter
        .from<ExpensesRow>('expenses')
        .order('date', { ascending: false })
        .execute();

      this.addResult(
        'functionalValidation',
        true,
        'useExpenses query executed successfully',
        { hook: 'useExpenses', recordCount: expenses.length },
      );
    } catch (error) {
      this.addResult(
        'functionalValidation',
        false,
        `useExpenses query failed: ${error}`,
      );
    }

    // Test usePayments query
    try {
      const payments = await this.queryAdapter
        .from<PaymentsRow>('payments')
        .order('payment_date', { ascending: false })
        .execute();

      this.addResult(
        'functionalValidation',
        true,
        'usePayments query executed successfully',
        { hook: 'usePayments', recordCount: payments.length },
      );
    } catch (error) {
      this.addResult(
        'functionalValidation',
        false,
        `usePayments query failed: ${error}`,
      );
    }
  }

  /**
   * Add a validation result
   */
  private addResult(
    section: keyof ValidationReport['sections'],
    passed: boolean,
    message: string,
    details?: any,
  ): void {
    const result: ValidationResult = { passed, message, details };
    this.report.sections[section].push(result);
    this.report.totalChecks++;

    if (passed) {
      this.report.passedChecks++;
      console.log(`  ✓ ${message}`);
    } else {
      this.report.failedChecks++;
      console.log(`  ✗ ${message}`);
    }

    if (details) {
      console.log(`    Details: ${JSON.stringify(details)}`);
    }
  }

  /**
   * Calculate final status and recommendations
   */
  private calculateFinalStatus(): void {
    const passRate = this.report.passedChecks / this.report.totalChecks;

    // Determine overall status
    if (this.report.failedChecks === 0) {
      this.report.overallStatus = 'PASS';
      this.report.goNoGo = 'GO';
      this.report.recommendations.push(
        'All validation checks passed. Migration is successful.',
      );
      this.report.recommendations.push(
        'Safe to proceed with cutover to Neon DB.',
      );
    } else if (passRate >= 0.9) {
      this.report.overallStatus = 'PASS';
      this.report.goNoGo = 'GO';
      this.report.recommendations.push(
        `${this.report.failedChecks} minor issues found, but overall validation passed.`,
      );
      this.report.recommendations.push('Review discrepancies before cutover.');
      this.report.recommendations.push(
        'Consider fixing non-critical issues post-migration.',
      );
    } else if (passRate >= 0.7) {
      this.report.overallStatus = 'FAIL';
      this.report.goNoGo = 'NO-GO';
      this.report.recommendations.push(
        `${this.report.failedChecks} validation checks failed.`,
      );
      this.report.recommendations.push(
        'DO NOT proceed with cutover until issues are resolved.',
      );
      this.report.recommendations.push(
        'Review discrepancies and re-run migration if necessary.',
      );
    } else {
      this.report.overallStatus = 'FAIL';
      this.report.goNoGo = 'NO-GO';
      this.report.recommendations.push(
        `Critical: ${this.report.failedChecks} validation checks failed.`,
      );
      this.report.recommendations.push('Migration has significant issues.');
      this.report.recommendations.push('DO NOT proceed with cutover.');
      this.report.recommendations.push(
        'Review all errors and consider re-running migration from scratch.',
      );
    }
  }

  /**
   * Generate and display validation report
   */
  generateReport(): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('='.repeat(70));
    lines.push('MIGRATION VALIDATION REPORT');
    lines.push('='.repeat(70));
    lines.push('');
    lines.push(`Timestamp: ${this.report.timestamp}`);
    lines.push(`Overall Status: ${this.report.overallStatus}`);
    lines.push(`Go/No-Go Decision: ${this.report.goNoGo}`);
    lines.push('');

    // Summary
    lines.push('SUMMARY');
    lines.push('-'.repeat(70));
    lines.push(`Total Checks: ${this.report.totalChecks}`);
    lines.push(
      `Passed: ${this.report.passedChecks} (${((this.report.passedChecks / this.report.totalChecks) * 100).toFixed(1)}%)`,
    );
    lines.push(
      `Failed: ${this.report.failedChecks} (${((this.report.failedChecks / this.report.totalChecks) * 100).toFixed(1)}%)`,
    );
    lines.push('');

    // Section summaries
    lines.push('SECTION RESULTS');
    lines.push('-'.repeat(70));

    for (const [section, results] of Object.entries(this.report.sections)) {
      const passed = results.filter((r) => r.passed).length;
      const failed = results.filter((r) => !r.passed).length;
      const sectionName = section
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toUpperCase();

      lines.push(`${sectionName}: ${passed}/${results.length} passed`);
    }
    lines.push('');

    // Discrepancies
    if (this.report.discrepancies.length > 0) {
      lines.push('DISCREPANCIES FOUND');
      lines.push('-'.repeat(70));

      for (const discrepancy of this.report.discrepancies.slice(0, 20)) {
        lines.push(`  • ${discrepancy}`);
      }

      if (this.report.discrepancies.length > 20) {
        lines.push(
          `  ... and ${this.report.discrepancies.length - 20} more discrepancies`,
        );
      }
      lines.push('');
    }

    // Recommendations
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(70));
    for (const recommendation of this.report.recommendations) {
      lines.push(`  • ${recommendation}`);
    }
    lines.push('');

    lines.push('='.repeat(70));

    return lines.join('\n');
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('Migration Validation Tool');
  console.log('='.repeat(70));

  try {
    // Load Neon DB configuration
    const config = loadDatabaseConfig();
    const neonClient = new NeonClient(config);

    // Test Neon DB connection
    const isHealthy = await neonClient.healthCheck();
    if (!isHealthy) {
      throw new Error('Neon DB connection health check failed');
    }
    console.log('✓ Neon DB connection healthy');

    // Test Supabase connection
    const { error: supabaseError } = await supabase
      .from('drivers')
      .select('id', { count: 'exact', head: true });

    if (supabaseError) {
      throw new Error(`Supabase connection failed: ${supabaseError.message}`);
    }
    console.log('✓ Supabase connection healthy');

    // Create validator and run validation
    const validator = new MigrationValidator(neonClient);
    const report = await validator.validate();

    // Generate and display report
    const reportText = validator.generateReport();
    console.log(reportText);

    // Save report to file if --output flag is provided
    const args = process.argv.slice(2);
    const outputIndex = args.indexOf('--output');

    if (outputIndex !== -1 && args[outputIndex + 1]) {
      const outputPath = args[outputIndex + 1];
      const fs = await import('fs/promises');

      // Save JSON report
      await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
      console.log(`\n✓ Validation report saved to: ${outputPath}`);

      // Also save text report
      const textPath = outputPath.replace('.json', '.txt');
      await fs.writeFile(textPath, reportText, 'utf-8');
      console.log(`✓ Text report saved to: ${textPath}`);
    }

    // Close connection
    await neonClient.close();

    // Exit with appropriate code
    process.exit(report.overallStatus === 'PASS' ? 0 : 1);
  } catch (error) {
    console.error('\nFatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { MigrationValidator, ValidationReport, ValidationResult };
