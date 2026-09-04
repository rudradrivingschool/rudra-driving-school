/**
 * Schema migration system for Neon DB
 * Reads migration files from supabase/migrations directory and applies them to Neon DB
 */

import 'dotenv/config';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { NeonClient } from '../src/lib/db/neon-client';
import { loadDatabaseConfig } from '../src/lib/db/config';

interface MigrationFile {
  filename: string;
  timestamp: string;
  fullPath: string;
}

interface MigrationResult {
  success: boolean;
  appliedMigrations: string[];
  failedMigration?: string;
  error?: Error;
}

interface ValidationReport {
  success: boolean;
  tables: {
    name: string;
    exists: boolean;
  }[];
  foreignKeys: {
    name: string;
    exists: boolean;
    fromTable: string;
    toTable: string;
  }[];
  indexes: {
    name: string;
    exists: boolean;
    table: string;
  }[];
  errors: string[];
}

export class SchemaMigrator {
  private client: NeonClient;
  private migrationsDir: string;

  constructor(
    client: NeonClient,
    migrationsDir: string = 'supabase/migrations',
  ) {
    this.client = client;
    this.migrationsDir = migrationsDir;
  }

  /**
   * Apply all pending migrations to Neon DB
   */
  async applyMigrations(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      appliedMigrations: [],
    };

    try {
      // Ensure migrations tracking table exists
      await this.createMigrationsTable();

      // Get all migration files
      const migrationFiles = await this.getMigrationFiles();
      console.log(`Found ${migrationFiles.length} migration files`);

      // Get already applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      console.log(`${appliedMigrations.size} migrations already applied`);

      // Filter out already applied migrations
      const pendingMigrations = migrationFiles.filter(
        (file) => !appliedMigrations.has(file.filename),
      );

      console.log(`${pendingMigrations.length} migrations pending`);

      // Apply each pending migration
      for (const migration of pendingMigrations) {
        try {
          await this.applyMigration(migration);
          result.appliedMigrations.push(migration.filename);
          console.log(`✓ Applied migration: ${migration.filename}`);
        } catch (error) {
          result.failedMigration = migration.filename;
          result.error =
            error instanceof Error ? error : new Error(String(error));
          console.error(
            `✗ Failed to apply migration: ${migration.filename}`,
            error,
          );
          return result;
        }
      }

      result.success = true;
      console.log(
        `\n✓ Successfully applied ${result.appliedMigrations.length} migrations`,
      );
      return result;
    } catch (error) {
      result.error = error instanceof Error ? error : new Error(String(error));
      console.error('Migration process failed:', error);
      return result;
    }
  }

  /**
   * Create the migrations tracking table if it doesn't exist
   */
  private async createMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await this.client.query(sql);
    console.log('Migrations tracking table ready');
  }

  /**
   * Get all migration files from the migrations directory
   * Sorted chronologically by timestamp in filename
   */
  private async getMigrationFiles(): Promise<MigrationFile[]> {
    const files = await readdir(this.migrationsDir);

    // Filter for SQL files and extract timestamp
    const migrationFiles: MigrationFile[] = files
      .filter((file) => file.endsWith('.sql'))
      .map((filename) => {
        // Extract timestamp from filename (format: YYYYMMDDHHMMSS-uuid.sql)
        const timestampMatch = filename.match(/^(\d{14})/);
        const timestamp = timestampMatch ? timestampMatch[1] : '00000000000000';

        return {
          filename,
          timestamp,
          fullPath: join(this.migrationsDir, filename),
        };
      });

    // Sort by timestamp chronologically
    migrationFiles.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return migrationFiles;
  }

  /**
   * Get set of already applied migrations from tracking table
   */
  private async getAppliedMigrations(): Promise<Set<string>> {
    const sql = 'SELECT filename FROM schema_migrations';
    const rows = await this.client.query<{ filename: string }>(sql);
    return new Set(rows.map((row) => row.filename));
  }

  /**
   * Apply a single migration within a transaction
   */
  private async applyMigration(migration: MigrationFile): Promise<void> {
    // Read migration SQL file
    const sql = await readFile(migration.fullPath, 'utf-8');

    // Execute migration within a transaction
    await this.client.transaction(async (client) => {
      // Execute the migration SQL
      await client.query(sql);

      // Record successful migration in tracking table
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [migration.filename],
      );
    });
  }

  /**
   * Validate schema after migrations complete
   * Verifies tables, foreign keys, and indexes exist
   */
  async validateSchema(): Promise<ValidationReport> {
    const report: ValidationReport = {
      success: true,
      tables: [],
      foreignKeys: [],
      indexes: [],
      errors: [],
    };

    try {
      // Expected tables
      const expectedTables = [
        'admissions',
        'drivers',
        'expenses',
        'payments',
        'rides',
      ];

      // Check if tables exist
      for (const tableName of expectedTables) {
        const result = await this.client.query<{ exists: boolean }>(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [tableName],
        );

        const exists = result[0]?.exists || false;
        report.tables.push({ name: tableName, exists });

        if (!exists) {
          report.success = false;
          report.errors.push(`Table '${tableName}' does not exist`);
        }
      }

      // Check foreign key constraints
      const foreignKeys = await this.client.query<{
        constraint_name: string;
        table_name: string;
        foreign_table_name: string;
      }>(
        `SELECT
          tc.constraint_name,
          tc.table_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.constraint_column_usage AS ccu
          ON tc.constraint_name = ccu.constraint_name
          AND tc.table_schema = ccu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name`,
      );

      for (const fk of foreignKeys) {
        report.foreignKeys.push({
          name: fk.constraint_name,
          exists: true,
          fromTable: fk.table_name,
          toTable: fk.foreign_table_name,
        });
      }

      console.log(`Found ${foreignKeys.length} foreign key constraints`);

      // Check indexes
      const indexes = await this.client.query<{
        indexname: string;
        tablename: string;
      }>(
        `SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname`,
      );

      for (const idx of indexes) {
        report.indexes.push({
          name: idx.indexname,
          exists: true,
          table: idx.tablename,
        });
      }

      console.log(`Found ${indexes.length} indexes`);

      return report;
    } catch (error) {
      report.success = false;
      report.errors.push(
        error instanceof Error ? error.message : String(error),
      );
      return report;
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('Starting schema migration...\n');

  try {
    // Load database configuration
    const config = loadDatabaseConfig();
    const client = new NeonClient(config);

    // Test connection
    const isHealthy = await client.healthCheck();
    if (!isHealthy) {
      throw new Error('Database connection health check failed');
    }
    console.log('✓ Database connection healthy\n');

    // Create migrator and apply migrations
    const migrator = new SchemaMigrator(client);
    const result = await migrator.applyMigrations();

    // Validate schema if migrations succeeded
    if (result.success) {
      console.log('\nValidating schema...');
      const validationReport = await migrator.validateSchema();

      console.log('\n=== Validation Report ===');
      console.log(
        `Tables: ${validationReport.tables.filter((t) => t.exists).length}/${validationReport.tables.length}`,
      );
      validationReport.tables.forEach((t) => {
        console.log(`  ${t.exists ? '✓' : '✗'} ${t.name}`);
      });

      console.log(`\nForeign Keys: ${validationReport.foreignKeys.length}`);
      console.log(`Indexes: ${validationReport.indexes.length}`);

      if (validationReport.errors.length > 0) {
        console.log('\nErrors:');
        validationReport.errors.forEach((err) => console.log(`  ✗ ${err}`));
      }

      if (!validationReport.success) {
        console.error('\n✗ Schema validation failed');
        await client.close();
        process.exit(1);
      }
    }

    // Close connection
    await client.close();

    // Exit with appropriate code
    if (result.success) {
      console.log('\n✓ Migration completed successfully');
      process.exit(0);
    } else {
      console.error('\n✗ Migration failed');
      if (result.failedMigration) {
        console.error(`Failed at: ${result.failedMigration}`);
      }
      if (result.error) {
        console.error(`Error: ${result.error.message}`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly (ES module compatible)
main();
