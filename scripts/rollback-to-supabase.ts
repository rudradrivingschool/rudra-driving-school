/**
 * Rollback script to switch back to Supabase
 *
 * This script safely reverts the application to use Supabase instead of Neon DB
 * by updating the DATABASE_PROVIDER environment variable.
 *
 * Usage:
 *   npm run rollback
 *   or
 *   ts-node scripts/rollback-to-supabase.ts
 */

import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';

interface RollbackResult {
  success: boolean;
  message: string;
  previousProvider?: string;
  newProvider?: string;
  backupPath?: string;
  error?: string;
}

/**
 * Rollback manager handles switching back to Supabase
 */
class RollbackManager {
  private envPath: string;
  private backupPath: string;

  constructor() {
    this.envPath = path.join(process.cwd(), '.env');
    this.backupPath = path.join(process.cwd(), '.env.backup');
  }

  /**
   * Execute rollback to Supabase
   */
  async rollback(): Promise<RollbackResult> {
    console.log('='.repeat(70));
    console.log('ROLLBACK TO SUPABASE');
    console.log('='.repeat(70));
    console.log('');

    try {
      // Check if .env file exists
      const envExists = await this.fileExists(this.envPath);
      if (!envExists) {
        return {
          success: false,
          message: '.env file not found',
          error: 'Cannot rollback without .env file',
        };
      }

      // Read current .env file
      console.log('Reading current .env file...');
      const envContent = await fs.readFile(this.envPath, 'utf-8');

      // Check current provider
      const currentProvider = this.extractProvider(envContent);
      console.log(`Current DATABASE_PROVIDER: ${currentProvider || 'not set'}`);

      if (currentProvider === 'supabase') {
        return {
          success: true,
          message: 'Already using Supabase - no rollback needed',
          previousProvider: 'supabase',
          newProvider: 'supabase',
        };
      }

      // Create backup of current .env
      console.log('Creating backup of current .env...');
      await fs.copyFile(this.envPath, this.backupPath);
      console.log(`✓ Backup created: ${this.backupPath}`);

      // Update DATABASE_PROVIDER to supabase
      console.log('Updating DATABASE_PROVIDER to "supabase"...');
      const updatedContent = this.updateProvider(envContent, 'supabase');

      // Write updated .env file
      await fs.writeFile(this.envPath, updatedContent, 'utf-8');
      console.log('✓ .env file updated');

      // Verify the change
      const verifyContent = await fs.readFile(this.envPath, 'utf-8');
      const verifyProvider = this.extractProvider(verifyContent);

      if (verifyProvider !== 'supabase') {
        throw new Error('Failed to verify DATABASE_PROVIDER change');
      }

      console.log('✓ Rollback completed successfully');
      console.log('');
      console.log(
        'IMPORTANT: Restart your application for changes to take effect',
      );
      console.log('');

      return {
        success: true,
        message: 'Rollback completed successfully',
        previousProvider: currentProvider || 'neon',
        newProvider: 'supabase',
        backupPath: this.backupPath,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error('✗ Rollback failed:', errorMessage);
      console.log('');
      console.log('If a backup was created, you can restore it manually:');
      console.log(`  cp ${this.backupPath} ${this.envPath}`);
      console.log('');

      return {
        success: false,
        message: 'Rollback failed',
        error: errorMessage,
      };
    }
  }

  /**
   * Extract DATABASE_PROVIDER value from .env content
   */
  private extractProvider(envContent: string): string | null {
    const match = envContent.match(/^DATABASE_PROVIDER\s*=\s*["']?(\w+)["']?/m);
    return match ? match[1] : null;
  }

  /**
   * Update DATABASE_PROVIDER in .env content
   */
  private updateProvider(envContent: string, newProvider: string): string {
    // Check if DATABASE_PROVIDER exists
    if (envContent.match(/^DATABASE_PROVIDER\s*=/m)) {
      // Replace existing value
      return envContent.replace(
        /^DATABASE_PROVIDER\s*=\s*["']?\w+["']?/m,
        `DATABASE_PROVIDER="${newProvider}"`,
      );
    } else {
      // Add DATABASE_PROVIDER at the end
      return envContent.trim() + `\n\nDATABASE_PROVIDER="${newProvider}"\n`;
    }
  }

  /**
   * Check if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(): Promise<RollbackResult> {
    console.log('='.repeat(70));
    console.log('RESTORE FROM BACKUP');
    console.log('='.repeat(70));
    console.log('');

    try {
      const backupExists = await this.fileExists(this.backupPath);

      if (!backupExists) {
        return {
          success: false,
          message: 'Backup file not found',
          error: `No backup found at ${this.backupPath}`,
        };
      }

      console.log('Restoring .env from backup...');
      await fs.copyFile(this.backupPath, this.envPath);
      console.log('✓ .env restored from backup');

      // Verify restoration
      const restoredContent = await fs.readFile(this.envPath, 'utf-8');
      const provider = this.extractProvider(restoredContent);
      console.log(`✓ DATABASE_PROVIDER restored to: ${provider || 'not set'}`);

      console.log('');
      console.log(
        'IMPORTANT: Restart your application for changes to take effect',
      );
      console.log('');

      return {
        success: true,
        message: 'Restored from backup successfully',
        newProvider: provider || undefined,
        backupPath: this.backupPath,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error('✗ Restore failed:', errorMessage);

      return {
        success: false,
        message: 'Restore from backup failed',
        error: errorMessage,
      };
    }
  }

  /**
   * Display current configuration
   */
  async showStatus(): Promise<void> {
    console.log('='.repeat(70));
    console.log('CURRENT CONFIGURATION');
    console.log('='.repeat(70));
    console.log('');

    try {
      const envExists = await this.fileExists(this.envPath);

      if (!envExists) {
        console.log('✗ .env file not found');
        return;
      }

      const envContent = await fs.readFile(this.envPath, 'utf-8');
      const provider = this.extractProvider(envContent);

      console.log(
        `DATABASE_PROVIDER: ${provider || 'not set (defaults to neon)'}`,
      );

      if (provider === 'supabase') {
        console.log('Status: Using Supabase');
      } else if (provider === 'neon') {
        console.log('Status: Using Neon DB');
      } else if (provider === 'dual-write') {
        console.log('Status: Dual-write mode (writing to both databases)');
      } else {
        console.log('Status: Using Neon DB (default)');
      }

      const backupExists = await this.fileExists(this.backupPath);
      console.log(`Backup available: ${backupExists ? 'Yes' : 'No'}`);

      if (backupExists) {
        console.log(`Backup location: ${this.backupPath}`);
      }

      console.log('');
    } catch (error) {
      console.error('Error reading configuration:', error);
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const manager = new RollbackManager();

  // Check for command flags
  if (args.includes('--status')) {
    await manager.showStatus();
    return;
  }

  if (args.includes('--restore')) {
    const result = await manager.restoreFromBackup();
    process.exit(result.success ? 0 : 1);
    return;
  }

  // Default: perform rollback
  const result = await manager.rollback();

  // Display result
  console.log('='.repeat(70));
  console.log('ROLLBACK RESULT');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log(`Message: ${result.message}`);

  if (result.previousProvider) {
    console.log(`Previous Provider: ${result.previousProvider}`);
  }

  if (result.newProvider) {
    console.log(`New Provider: ${result.newProvider}`);
  }

  if (result.backupPath) {
    console.log(`Backup Location: ${result.backupPath}`);
  }

  if (result.error) {
    console.log(`Error: ${result.error}`);
  }

  console.log('');
  console.log('='.repeat(70));

  process.exit(result.success ? 0 : 1);
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}

export { RollbackManager, RollbackResult };
