# Migration Scripts

This directory contains scripts for migrating from Supabase to Neon DB.

## Quick Reference

| Script           | Command                      | Purpose                               |
| ---------------- | ---------------------------- | ------------------------------------- |
| Schema Migration | `npm run migrate:schema`     | Apply database schema to Neon DB      |
| Data Migration   | `npm run migrate:data`       | Transfer data from Supabase to Neon   |
| Type Generation  | `npm run generate:types`     | Generate TypeScript types from schema |
| Validation       | `npm run validate:migration` | Validate migration success            |
| Rollback         | `npm run rollback`           | Revert to Supabase                    |

## Migration Workflow

```
1. Schema Migration    → npm run migrate:schema
2. Data Migration      → npm run migrate:data
3. Validation          → npm run validate:migration
4. Decision Point      → Review validation report
5a. If GO              → Update DATABASE_PROVIDER to "neon"
5b. If NO-GO           → npm run rollback
```

## Schema Migration

The schema migration script reads SQL migration files from `supabase/migrations/` and applies them to Neon DB in chronological order.

### Prerequisites

1. Set up your Neon database connection in `.env`:

   ```
   NEON_DATABASE_URL=postgresql://user:password@host:5432/database
   ```

2. Optional configuration:
   ```
   DATABASE_POOL_MIN=2
   DATABASE_POOL_MAX=10
   ```

### Running Schema Migration

```bash
npm run migrate:schema
```

### What it does

1. Creates a `schema_migrations` tracking table in Neon DB
2. Reads all `.sql` files from `supabase/migrations/`
3. Sorts migrations chronologically by timestamp in filename
4. Applies only migrations that haven't been applied yet
5. Each migration runs in a transaction (auto-rollback on error)
6. Records successful migrations in the tracking table
7. Validates the schema after all migrations complete:
   - Verifies all expected tables exist (admissions, drivers, expenses, payments, rides)
   - Checks foreign key constraints
   - Checks indexes

### Migration Tracking

The script creates a `schema_migrations` table to track which migrations have been applied:

```sql
CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

This ensures migrations are only applied once, even if you run the script multiple times.

### Error Handling

- If a migration fails, the transaction is rolled back
- The script stops at the first failure
- Failed migrations are not recorded in the tracking table
- You can fix the issue and re-run the script

### Validation Report

After migrations complete, the script generates a validation report showing:

- Tables found/missing
- Number of foreign key constraints
- Number of indexes
- Any validation errors

## Data Migration

The data migration script transfers all records from Supabase to Neon DB while preserving UUIDs and referential integrity.

### Running Data Migration

```bash
npm run migrate:data
```

### What it does

1. Connects to both Supabase and Neon DB
2. Migrates tables in dependency order:
   - drivers
   - admissions
   - rides
   - expenses
   - payments
3. Preserves UUID primary keys exactly
4. Processes records in batches (100 records per batch)
5. Validates record counts after migration
6. Generates detailed migration report

### Migration Report

The script generates a comprehensive report including:

- Tables processed
- Records migrated per table
- Success/failure statistics
- Detailed error information for failed records
- Record count comparison

### Error Handling

- Failed records are logged but don't stop the migration
- Errors include table name, record ID, and error message
- You can retry failed records after reviewing errors

## Migration Validation

The validation script performs comprehensive checks to verify migration success.

### Running Validation

```bash
# Basic validation
npm run validate:migration

# Save report to file
npm run validate:migration -- --output validation-report.json
```

### What it validates

#### Schema Validation

- Foreign key relationships are intact
- No orphaned records exist
- Indexes are present on all tables

#### Data Validation

- Record counts match between Supabase and Neon
- Random sampling of records for data integrity
- Field values match between databases

#### Functional Validation

- Authentication system works
- All CRUD operations function correctly
- Sample queries from hooks execute successfully

### Validation Report

The script generates a detailed report with:

- Overall PASS/FAIL status
- Go/No-Go decision for cutover
- Section-by-section results
- List of discrepancies found
- Actionable recommendations

### Decision Criteria

| Pass Rate | Status | Go/No-Go | Action              |
| --------- | ------ | -------- | ------------------- |
| 100%      | PASS   | GO       | Safe to proceed     |
| ≥90%      | PASS   | GO       | Review minor issues |
| 70-89%    | FAIL   | NO-GO    | Fix issues first    |
| <70%      | FAIL   | NO-GO    | Re-run migration    |

## Rollback to Supabase

The rollback script provides a safe way to revert to Supabase if issues are found.

### Running Rollback

```bash
# Perform rollback
npm run rollback

# Check current status
npm run rollback -- --status

# Restore from backup
npm run rollback -- --restore
```

### What it does

1. Creates backup of current `.env` file
2. Updates `DATABASE_PROVIDER` to `"supabase"`
3. Verifies the change
4. Provides restart instructions

### When to Rollback

- Validation reports NO-GO decision
- Critical data integrity issues
- Application functionality broken
- Persistent connection issues

See `ROLLBACK_PROCEDURE.md` for detailed procedures.

## Type Generation

Generate TypeScript types from the Neon DB schema.

### Running Type Generation

```bash
npm run generate:types
```

### What it does

1. Connects to Neon DB
2. Introspects database schema
3. Generates TypeScript interfaces for all tables
4. Creates Row, Insert, and Update types
5. Outputs to `src/lib/db/types.ts`

## Testing Scripts

Additional scripts for testing migration components:

- `test-auth-system.ts` - Test authentication system
- `test-connection-pool.ts` - Test connection pool behavior
- `test-error-handling.ts` - Test error handling
- `test-logging.ts` - Test logging system
- `test-migration.ts` - Test migration prerequisites
- `test-provider-router.ts` - Test provider routing
- `test-query-adapter.ts` - Test query adapter

## Documentation

- `VALIDATION_AND_ROLLBACK.md` - Detailed validation and rollback guide
- `ROLLBACK_PROCEDURE.md` - Step-by-step rollback procedures

## Next Steps

After schema migration completes successfully:

1. Run data migration: `npm run migrate:data`
2. Run validation: `npm run validate:migration --output report.json`
3. Review validation report
4. If GO decision: Update `DATABASE_PROVIDER` to `"neon"` in `.env`
5. If NO-GO decision: Run `npm run rollback` and fix issues
6. Restart application
7. Monitor for issues

## Troubleshooting

### Connection Issues

```bash
# Test Neon connection
npm run test:migration

# Check environment variables
cat .env | grep NEON_DATABASE_URL
```

### Migration Failures

1. Review error messages in console output
2. Check database permissions
3. Verify schema is correct
4. Try re-running the failed step

### Validation Failures

1. Review validation report for specific issues
2. Check discrepancies list
3. Compare data between Supabase and Neon manually
4. Consider re-running migration if major issues found

## Support

For issues or questions:

1. Review documentation in this directory
2. Check error messages and logs
3. Test connections with test scripts
4. Contact development team if issues persist
