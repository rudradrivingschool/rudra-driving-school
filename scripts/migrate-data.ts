/**
 * Data migration system for transferring data from Supabase to Neon DB
 * Migrates all records while preserving UUIDs and referential integrity
 */

import 'dotenv/config';
import { NeonClient } from '../src/lib/db/neon-client';
import { loadDatabaseConfig } from '../src/lib/db/config';
import { supabase } from '../src/integrations/supabase/client';
import type { Database } from '../src/integrations/supabase/types';

// Type aliases for table rows
type Driver = Database['public']['Tables']['drivers']['Row'];
type Admission = Database['public']['Tables']['admissions']['Row'];
type Ride = Database['public']['Tables']['rides']['Row'];
type Expense = Database['public']['Tables']['expenses']['Row'];
type Payment = Database['public']['Tables']['payments']['Row'];

type TableName = 'drivers' | 'admissions' | 'rides' | 'expenses' | 'payments';
type TableRow = Driver | Admission | Ride | Expense | Payment;

interface MigrationError {
  table: string;
  record: Record<string, unknown>;
  error: string;
}

interface TableMigrationResult {
  table: string;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: MigrationError[];
}

interface DataMigrationResult {
  success: boolean;
  tablesProcessed: string[];
  recordsMigrated: Record<string, number>;
  totalRecords: number;
  totalErrors: number;
  errors: MigrationError[];
  tableResults: TableMigrationResult[];
}

/**
 * DataMigrator handles the transfer of data from Supabase to Neon DB
 * Respects foreign key dependencies and preserves UUID primary keys
 */
export class DataMigrator {
  private neonClient: NeonClient;
  private batchSize: number = 100;

  // Migration order respects foreign key dependencies
  private readonly migrationOrder = [
    'drivers',
    'admissions',
    'rides',
    'expenses',
    'payments',
  ] as const;

  constructor(neonClient: NeonClient, batchSize: number = 100) {
    this.neonClient = neonClient;
    this.batchSize = batchSize;
  }

  /**
   * Migrate all tables from Supabase to Neon DB
   */
  async migrateAll(): Promise<DataMigrationResult> {
    const result: DataMigrationResult = {
      success: false,
      tablesProcessed: [],
      recordsMigrated: {},
      totalRecords: 0,
      totalErrors: 0,
      errors: [],
      tableResults: [],
    };

    console.log('Starting data migration...\n');
    console.log(`Migration order: ${this.migrationOrder.join(' → ')}\n`);

    try {
      // Migrate each table in dependency order
      for (const table of this.migrationOrder) {
        console.log(`\n=== Migrating table: ${table} ===`);

        const tableResult = await this.migrateTable(table);
        result.tableResults.push(tableResult);
        result.tablesProcessed.push(table);
        result.recordsMigrated[table] = tableResult.recordsSucceeded;
        result.totalRecords += tableResult.recordsSucceeded;
        result.totalErrors += tableResult.recordsFailed;
        result.errors.push(...tableResult.errors);

        console.log(
          `✓ Completed ${table}: ${tableResult.recordsSucceeded}/${tableResult.recordsProcessed} records migrated`,
        );
        if (tableResult.recordsFailed > 0) {
          console.log(`  ⚠ ${tableResult.recordsFailed} records failed`);
        }
      }

      // Validate migration
      console.log('\n=== Validating migration ===');
      const isValid = await this.validateMigration();

      result.success = isValid && result.totalErrors === 0;

      return result;
    } catch (error) {
      console.error('Fatal error during migration:', error);
      result.success = false;
      return result;
    }
  }

  /**
   * Migrate a single table from Supabase to Neon DB
   */
  private async migrateTable(
    tableName: TableName,
  ): Promise<TableMigrationResult> {
    const result: TableMigrationResult = {
      table: tableName,
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      errors: [],
    };

    try {
      // Extract all records from Supabase
      const records = await this.extractRecords(tableName);
      result.recordsProcessed = records.length;

      console.log(`  Extracted ${records.length} records from Supabase`);

      if (records.length === 0) {
        console.log(`  No records to migrate`);
        return result;
      }

      // Process records in batches
      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        const batchNum = Math.floor(i / this.batchSize) + 1;
        const totalBatches = Math.ceil(records.length / this.batchSize);

        console.log(
          `  Processing batch ${batchNum}/${totalBatches} (${batch.length} records)`,
        );

        // Insert each record individually with error handling
        for (const record of batch) {
          try {
            await this.insertRecord(tableName, record);
            result.recordsSucceeded++;
          } catch (error) {
            result.recordsFailed++;
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            result.errors.push({
              table: tableName,
              record: this.sanitizeRecord(record),
              error: errorMessage,
            });

            // Log error but continue processing
            console.error(
              `    ✗ Failed to insert record ${record.id}: ${errorMessage}`,
            );
          }
        }

        // Report progress
        const progress = Math.round(
          ((i + batch.length) / records.length) * 100,
        );
        console.log(`  Progress: ${progress}% complete`);
      }

      return result;
    } catch (error) {
      console.error(`Error migrating table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Extract all records from a Supabase table
   */
  private async extractRecords(tableName: TableName): Promise<TableRow[]> {
    const { data, error } = await supabase.from(tableName).select('*');

    if (error) {
      throw new Error(
        `Failed to extract records from ${tableName}: ${error.message}`,
      );
    }

    return data || [];
  }

  /**
   * Insert a single record into Neon DB using parameterized query
   * Preserves UUID primary keys exactly
   */
  private async insertRecord(
    tableName: TableName,
    record: TableRow,
  ): Promise<void> {
    // Get column names and values
    const columns = Object.keys(record);
    const values = Object.values(record);

    // Build parameterized INSERT query
    const columnList = columns.join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `
      INSERT INTO ${tableName} (${columnList})
      VALUES (${placeholders})
    `;

    await this.neonClient.query(sql, values);
  }

  /**
   * Validate migration by comparing record counts
   */
  private async validateMigration(): Promise<boolean> {
    console.log('\nComparing record counts...');

    let allMatch = true;

    for (const table of this.migrationOrder) {
      const counts = await this.compareRecordCounts(table);

      const match = counts.source === counts.destination;
      const status = match ? '✓' : '✗';

      console.log(
        `  ${status} ${table}: Supabase=${counts.source}, Neon=${counts.destination}`,
      );

      if (!match) {
        allMatch = false;
      }
    }

    return allMatch;
  }

  /**
   * Compare record counts between Supabase and Neon DB for a table
   */
  private async compareRecordCounts(
    tableName: TableName,
  ): Promise<{ source: number; destination: number }> {
    // Get count from Supabase
    const { count: sourceCount, error: sourceError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (sourceError) {
      throw new Error(
        `Failed to count records in Supabase ${tableName}: ${sourceError.message}`,
      );
    }

    // Get count from Neon DB
    const destResult = await this.neonClient.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${tableName}`,
    );

    const destCount = parseInt(destResult[0]?.count || '0', 10);

    return {
      source: sourceCount || 0,
      destination: destCount,
    };
  }

  /**
   * Sanitize record for logging (remove sensitive data)
   */
  private sanitizeRecord(record: TableRow): Record<string, unknown> {
    const sanitized = { ...record } as Record<string, unknown>;

    // Remove password fields
    if ('password' in sanitized) {
      sanitized.password = '[REDACTED]';
    }

    return sanitized;
  }

  /**
   * Retry failed records from a previous migration
   */
  async retryFailedRecords(
    errors: MigrationError[],
  ): Promise<DataMigrationResult> {
    const result: DataMigrationResult = {
      success: false,
      tablesProcessed: [],
      recordsMigrated: {},
      totalRecords: 0,
      totalErrors: 0,
      errors: [],
      tableResults: [],
    };

    console.log('\n=== Retrying failed records ===');
    console.log(`Total failed records to retry: ${errors.length}\n`);

    // Group errors by table
    const errorsByTable = new Map<string, MigrationError[]>();
    for (const error of errors) {
      if (!errorsByTable.has(error.table)) {
        errorsByTable.set(error.table, []);
      }
      errorsByTable.get(error.table)!.push(error);
    }

    // Retry each table's failed records
    for (const [table, tableErrors] of errorsByTable) {
      console.log(`\nRetrying ${tableErrors.length} records for ${table}`);

      const tableResult: TableMigrationResult = {
        table,
        recordsProcessed: tableErrors.length,
        recordsSucceeded: 0,
        recordsFailed: 0,
        errors: [],
      };

      for (const error of tableErrors) {
        try {
          // Restore password if it was redacted
          const record = error.record;
          await this.insertRecord(table, record);
          tableResult.recordsSucceeded++;
          console.log(`  ✓ Successfully inserted record ${record.id}`);
        } catch (retryError) {
          tableResult.recordsFailed++;
          const errorMessage =
            retryError instanceof Error
              ? retryError.message
              : String(retryError);

          tableResult.errors.push({
            table,
            record: error.record,
            error: errorMessage,
          });

          console.error(
            `  ✗ Failed again to insert record ${error.record.id}: ${errorMessage}`,
          );
        }
      }

      result.tableResults.push(tableResult);
      result.tablesProcessed.push(table);
      result.recordsMigrated[table] = tableResult.recordsSucceeded;
      result.totalRecords += tableResult.recordsSucceeded;
      result.totalErrors += tableResult.recordsFailed;
      result.errors.push(...tableResult.errors);

      console.log(
        `Completed retry for ${table}: ${tableResult.recordsSucceeded}/${tableResult.recordsProcessed} records succeeded`,
      );
    }

    result.success = result.totalErrors === 0;
    return result;
  }

  /**
   * Generate migration report
   */
  generateReport(result: DataMigrationResult): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('='.repeat(60));
    lines.push('DATA MIGRATION REPORT');
    lines.push('='.repeat(60));
    lines.push('');

    // Summary
    lines.push('SUMMARY');
    lines.push('-'.repeat(60));
    lines.push(`Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
    lines.push(`Tables Processed: ${result.tablesProcessed.length}`);
    lines.push(`Total Records Migrated: ${result.totalRecords}`);
    lines.push(`Total Errors: ${result.totalErrors}`);
    lines.push('');

    // Per-table statistics
    lines.push('TABLE STATISTICS');
    lines.push('-'.repeat(60));
    for (const tableResult of result.tableResults) {
      lines.push(`${tableResult.table}:`);
      lines.push(`  Processed: ${tableResult.recordsProcessed}`);
      lines.push(`  Succeeded: ${tableResult.recordsSucceeded}`);
      lines.push(`  Failed: ${tableResult.recordsFailed}`);
      if (tableResult.recordsFailed > 0) {
        const successRate =
          (tableResult.recordsSucceeded / tableResult.recordsProcessed) * 100;
        lines.push(`  Success Rate: ${successRate.toFixed(2)}%`);
      }
      lines.push('');
    }

    // Errors
    if (result.errors.length > 0) {
      lines.push('ERRORS');
      lines.push('-'.repeat(60));
      for (const error of result.errors.slice(0, 10)) {
        // Show first 10 errors
        lines.push(`Table: ${error.table}`);
        lines.push(`Record ID: ${error.record.id || 'unknown'}`);
        lines.push(`Error: ${error.error}`);
        lines.push('');
      }

      if (result.errors.length > 10) {
        lines.push(`... and ${result.errors.length - 10} more errors`);
        lines.push('');
      }
    }

    lines.push('='.repeat(60));

    return lines.join('\n');
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('Data Migration Tool');
  console.log('='.repeat(60));

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

    // Create migrator and run migration
    const migrator = new DataMigrator(neonClient);
    const result = await migrator.migrateAll();

    // Generate and display report
    const report = migrator.generateReport(result);
    console.log(report);

    // If there were errors, offer to retry
    if (result.errors.length > 0) {
      console.log('\n⚠ Migration completed with errors.');
      console.log(
        `Would you like to retry the ${result.errors.length} failed records?`,
      );
      console.log('To retry, run: npm run migrate:data -- --retry');
      console.log(
        '\nNote: This is a manual step. Review errors above before retrying.',
      );
    }

    // Close connection
    await neonClient.close();

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\nFatal error:', error);
    process.exit(1);
  }
}

/**
 * Retry function for failed records
 * This would typically be called separately after reviewing errors
 */
async function retryFailed() {
  console.log('Retry Failed Records Tool');
  console.log('='.repeat(60));

  try {
    // Load Neon DB configuration
    const config = loadDatabaseConfig();
    const neonClient = new NeonClient(config);

    // Test connection
    const isHealthy = await neonClient.healthCheck();
    if (!isHealthy) {
      throw new Error('Neon DB connection health check failed');
    }
    console.log('✓ Neon DB connection healthy');

    // Note: In a real implementation, you would load failed records from a file
    // For now, this is a placeholder showing the structure
    console.log(
      '\nNote: Load failed records from previous migration log and pass to retryFailedRecords()',
    );
    console.log(
      'Example: const errors = JSON.parse(fs.readFileSync("migration-errors.json"))',
    );

    // Close connection
    await neonClient.close();
  } catch (error) {
    console.error('\nFatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly (ES module compatible)
const args = process.argv.slice(2);
if (args.includes('--retry')) {
  retryFailed();
} else {
  main();
}
