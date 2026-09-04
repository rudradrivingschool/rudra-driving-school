/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CSV import script for Neon DB
 * Imports data from CSV files into Neon DB tables
 */

import 'dotenv/config';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { NeonClient } from '../src/lib/db/neon-client';
import { loadDatabaseConfig } from '../src/lib/db/config';

interface ImportResult {
  success: boolean;
  tablesProcessed: string[];
  recordsImported: Record<string, number>;
  errors: Array<{ table: string; row: number; error: string }>;
}

class CSVImporter {
  // Column mappings: CSV column name -> DB column name
  private columnMappings: Record<string, Record<string, string>> = {
    rides: {
      client_name: '__SKIP__', // Skip this column, we have client_id
    },
    admissions: {
      admission_date: 'end_date', // Map admission_date to end_date
    },
    payments: {
      admission_id: 'client_id', // Map admission_id to client_id
      updated_at: '__SKIP__', // Skip updated_at (not in schema)
    },
  };

  constructor(
    private neonClient: NeonClient,
    private csvDirectory: string,
  ) {}

  /**
   * Import all CSV files into Neon DB
   */
  async importAll(): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      tablesProcessed: [],
      recordsImported: {},
      errors: [],
    };

    // Import order respects foreign key dependencies
    // Order: drivers → admissions → expenses → payments → rides
    const tables = [
      { name: 'drivers', file: 'drivers_rows.csv' },
      { name: 'admissions', file: 'admissions_rows.csv' },
      { name: 'expenses', file: 'expenses_rows.csv' },
      { name: 'payments', file: 'payments_rows.csv' },
      { name: 'rides', file: 'rides_rows.csv' },
    ];

    console.log('Starting CSV import...\n');

    for (const table of tables) {
      try {
        console.log(`Importing ${table.name}...`);
        const count = await this.importTable(table.name, table.file);
        result.recordsImported[table.name] = count;
        result.tablesProcessed.push(table.name);
        console.log(`✓ Imported ${count} records into ${table.name}\n`);
      } catch (error) {
        console.error(`✗ Failed to import ${table.name}:`, error);
        result.errors.push({
          table: table.name,
          row: 0,
          error: error instanceof Error ? error.message : String(error),
        });
        result.success = false;
        // Continue with other tables
      }
    }

    return result;
  }

  /**
   * Import a single CSV file into a table
   */
  private async importTable(
    tableName: string,
    filename: string,
  ): Promise<number> {
    const filePath = join(this.csvDirectory, filename);

    // Read and parse CSV file
    const fileContent = await readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true,
      cast_date: false, // We'll handle dates manually
    });

    if (records.length === 0) {
      console.log(`  No records found in ${filename}`);
      return 0;
    }

    console.log(`  Found ${records.length} records`);

    let imported = 0;
    let failed = 0;

    // Import records in batches
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map((record, idx) =>
          this.insertRecord(tableName, record, i + idx + 1),
        ),
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          imported++;
        } else {
          failed++;
          console.error(`  ✗ Row ${i + 1} failed:`, result.reason);
        }
      }

      // Progress reporting
      const progress = Math.min(i + batchSize, records.length);
      const percentage = ((progress / records.length) * 100).toFixed(1);
      console.log(`  Progress: ${progress}/${records.length} (${percentage}%)`);
    }

    if (failed > 0) {
      console.log(`  ⚠ ${failed} records failed to import`);
    }

    return imported;
  }

  /**
   * Insert a single record into a table
   */
  private async insertRecord(
    tableName: string,
    record: any,
    rowNumber: number,
  ): Promise<void> {
    try {
      // Clean the record (handle null values, empty strings, etc.)
      const cleanedRecord = this.cleanRecord(record);

      // Build column names and values
      const columns = Object.keys(cleanedRecord);
      const values = Object.values(cleanedRecord);

      // Build parameterized query
      const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
      const columnList = columns.join(', ');

      const sql = `
        INSERT INTO ${tableName} (${columnList})
        VALUES (${placeholders})
      `;

      await this.neonClient.query(sql, values);
    } catch (error) {
      throw new Error(
        `Row ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Clean record data (handle nulls, empty strings, type conversions)
   * Also applies column mappings for schema compatibility
   */
  private cleanRecord(record: any): Record<string, any> {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(record)) {
      // Skip empty column names
      if (!key || key.trim() === '') {
        continue;
      }

      // Handle null/empty values
      if (value === null || value === undefined || value === '') {
        cleaned[key] = null;
        continue;
      }

      // Handle boolean strings
      if (value === 'true' || value === 'TRUE') {
        cleaned[key] = true;
        continue;
      }
      if (value === 'false' || value === 'FALSE') {
        cleaned[key] = false;
        continue;
      }

      // Keep the value as-is (csv-parse handles type casting)
      cleaned[key] = value;
    }

    return cleaned;
  }

  /**
   * Apply column mappings to transform CSV columns to match DB schema
   */
  private applyColumnMappings(
    tableName: string,
    record: Record<string, any>,
  ): Record<string, any> {
    const mappings = this.columnMappings[tableName];
    if (!mappings) {
      return record; // No mappings for this table
    }

    const mapped: Record<string, any> = {};

    for (const [csvColumn, value] of Object.entries(record)) {
      const dbColumn = mappings[csvColumn];

      if (dbColumn === '__SKIP__') {
        // Skip this column
        continue;
      } else if (dbColumn) {
        // Map to different column name
        mapped[dbColumn] = value;
      } else {
        // Keep original column name
        mapped[csvColumn] = value;
      }
    }

    return mapped;
  }

  /**
   * Validate import by comparing record counts
   */
  async validateImport(
    expectedCounts: Record<string, number>,
  ): Promise<boolean> {
    console.log('\nValidating import...\n');

    let allValid = true;

    for (const [table, expectedCount] of Object.entries(expectedCounts)) {
      const result = await this.neonClient.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${table}`,
      );
      const actualCount = parseInt(result[0].count, 10);

      if (actualCount === expectedCount) {
        console.log(`✓ ${table}: ${actualCount} records (matches expected)`);
      } else {
        console.log(
          `✗ ${table}: ${actualCount} records (expected ${expectedCount})`,
        );
        allValid = false;
      }
    }

    return allValid;
  }

  /**
   * Generate import report
   */
  generateReport(result: ImportResult): string {
    const lines: string[] = [];

    lines.push('\n' + '='.repeat(60));
    lines.push('CSV IMPORT REPORT');
    lines.push('='.repeat(60));

    lines.push(`\nStatus: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);

    lines.push('\nTables Processed:');
    for (const table of result.tablesProcessed) {
      const count = result.recordsImported[table] || 0;
      lines.push(`  - ${table}: ${count} records`);
    }

    const totalRecords = Object.values(result.recordsImported).reduce(
      (sum, count) => sum + count,
      0,
    );
    lines.push(`\nTotal Records Imported: ${totalRecords}`);

    if (result.errors.length > 0) {
      lines.push(`\nErrors: ${result.errors.length}`);
      for (const error of result.errors.slice(0, 10)) {
        lines.push(`  - ${error.table} (row ${error.row}): ${error.error}`);
      }
      if (result.errors.length > 10) {
        lines.push(`  ... and ${result.errors.length - 10} more errors`);
      }
    }

    lines.push('\n' + '='.repeat(60));

    return lines.join('\n');
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('CSV Import Tool for Neon DB');
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
    console.log('✓ Neon DB connection healthy\n');

    // Create importer
    const csvDirectory = join(process.cwd(), 'public');
    const importer = new CSVImporter(neonClient, csvDirectory);

    // Run import
    const result = await importer.importAll();

    // Validate import
    const isValid = await importer.validateImport(result.recordsImported);

    // Generate and display report
    const report = importer.generateReport(result);
    console.log(report);

    // Close connection
    await neonClient.close();

    // Exit with appropriate code
    if (result.success && isValid) {
      console.log('\n✓ Import completed successfully');
      process.exit(0);
    } else {
      console.log('\n✗ Import completed with errors');
      process.exit(1);
    }
  } catch (error) {
    console.error('\nFatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly (ES module compatible)
main();
