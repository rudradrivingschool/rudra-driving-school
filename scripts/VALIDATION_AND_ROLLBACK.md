# Migration Validation and Rollback Tools

This document provides an overview of the migration validation and rollback tools created for the Supabase to Neon DB migration.

## Overview

Two critical tools have been implemented to ensure a safe and reversible migration:

1. **Migration Validation Script** (`validate-migration.ts`) - Comprehensive validation of migration success
2. **Rollback Script** (`rollback-to-supabase.ts`) - Safe reversion to Supabase if issues are found

## Migration Validation Script

### Purpose

The validation script performs comprehensive checks to verify that the migration from Supabase to Neon DB was successful and that all data and functionality are intact.

### What It Validates

#### 1. Schema Validation

- **Foreign Key Relationships**: Verifies all foreign keys are intact and no orphaned records exist
- **Indexes**: Confirms all tables have appropriate indexes
- **Constraints**: Validates database constraints are properly migrated

#### 2. Data Validation

- **Record Counts**: Compares record counts between Supabase and Neon for all tables
- **Data Integrity**: Samples random records and compares field values
- **UUID Preservation**: Ensures primary keys are identical in both databases

#### 3. Functional Validation

- **Authentication**: Tests authentication system can query drivers table
- **CRUD Operations**: Validates Create, Read, Update, Delete operations work correctly
- **Hook Queries**: Tests sample queries from all React hooks (useDrivers, useAdmissions, useRides, useExpenses, usePayments)

### Usage

#### Basic Validation

```bash
npm run validate:migration
```

#### Save Report to File

```bash
npm run validate:migration -- --output validation-report.json
```

This will create two files:

- `validation-report.json` - Detailed JSON report with all validation results
- `validation-report.txt` - Human-readable text report

### Validation Report

The validation script generates a comprehensive report including:

- **Overall Status**: PASS or FAIL
- **Go/No-Go Decision**: GO or NO-GO for cutover
- **Summary Statistics**: Total checks, passed checks, failed checks
- **Section Results**: Breakdown by validation category
- **Discrepancies**: List of all issues found
- **Recommendations**: Actionable recommendations based on results

### Exit Codes

- `0` - All validation checks passed
- `1` - One or more validation checks failed

### Decision Matrix

The script uses the following logic to determine go/no-go:

| Pass Rate | Overall Status | Go/No-Go | Recommendation                      |
| --------- | -------------- | -------- | ----------------------------------- |
| 100%      | PASS           | GO       | All checks passed, safe to proceed  |
| ≥90%      | PASS           | GO       | Minor issues, review before cutover |
| 70-89%    | FAIL           | NO-GO    | Significant issues, do not proceed  |
| <70%      | FAIL           | NO-GO    | Critical issues, re-run migration   |

## Rollback Script

### Purpose

The rollback script provides a safe and quick way to revert the application to use Supabase if critical issues are discovered during or after migration.

### What It Does

1. Creates a backup of the current `.env` file
2. Updates `DATABASE_PROVIDER` environment variable to `"supabase"`
3. Verifies the change was successful
4. Provides clear instructions for restarting the application

### Usage

#### Perform Rollback

```bash
npm run rollback
```

#### Check Current Configuration

```bash
npm run rollback -- --status
```

#### Restore from Backup

```bash
npm run rollback -- --restore
```

### Rollback Process

1. **Backup**: Creates `.env.backup` with current configuration
2. **Update**: Changes `DATABASE_PROVIDER` to `"supabase"`
3. **Verify**: Confirms the change was applied
4. **Restart**: User must restart application for changes to take effect

### When to Rollback

Consider rolling back if:

- Validation script reports NO-GO decision
- Critical data integrity issues found
- Application functionality is broken
- Performance is significantly degraded
- Persistent connection issues to Neon DB

See `ROLLBACK_PROCEDURE.md` for detailed rollback procedures and decision matrix.

## Integration with Migration Workflow

### Recommended Migration Workflow

```
1. Pre-Migration
   ├── Backup Supabase data
   ├── Test migration in staging
   └── Review rollback procedure

2. Schema Migration
   ├── Run: npm run migrate:schema
   └── Verify schema in Neon DB

3. Data Migration
   ├── Run: npm run migrate:data
   └── Review migration report

4. Validation (CRITICAL)
   ├── Run: npm run validate:migration --output validation-report.json
   ├── Review validation report
   └── Decision point: GO or NO-GO

5a. If GO Decision
    ├── Update DATABASE_PROVIDER to "neon"
    ├── Restart application
    ├── Monitor for issues
    └── Keep rollback ready

5b. If NO-GO Decision
    ├── Run: npm run rollback
    ├── Review validation discrepancies
    ├── Fix issues
    └── Retry migration
```

## Files Created

### Scripts

- `scripts/validate-migration.ts` - Validation script implementation
- `scripts/rollback-to-supabase.ts` - Rollback script implementation

### Documentation

- `scripts/VALIDATION_AND_ROLLBACK.md` - This file
- `scripts/ROLLBACK_PROCEDURE.md` - Detailed rollback procedures

### Package.json Scripts

- `validate:migration` - Run validation script
- `rollback` - Run rollback script

## Testing the Tools

### Test Validation Script

Before production migration, test the validation script:

```bash
# Ensure both Supabase and Neon connections are configured
npm run validate:migration
```

Expected output:

- Schema validation results
- Data validation results
- Functional validation results
- Overall pass/fail status
- Recommendations

### Test Rollback Script

Test the rollback procedure in staging:

```bash
# Check current status
npm run rollback -- --status

# Perform rollback
npm run rollback

# Verify rollback
npm run rollback -- --status

# Restore from backup (if needed)
npm run rollback -- --restore
```

## Monitoring and Logging

Both scripts provide detailed console output:

### Validation Script Output

- Real-time progress for each validation check
- ✓ for passed checks
- ✗ for failed checks
- Detailed information for each check
- Final summary report

### Rollback Script Output

- Current configuration status
- Backup creation confirmation
- Update progress
- Verification results
- Instructions for next steps

## Error Handling

### Validation Script Errors

If validation script fails to run:

1. Check Neon DB connection: Verify `NEON_DATABASE_URL` in `.env`
2. Check Supabase connection: Verify Supabase credentials
3. Review error messages in console output
4. Check database permissions

### Rollback Script Errors

If rollback script fails:

1. Verify `.env` file exists and is writable
2. Check file permissions: `ls -la .env`
3. Try manual rollback (see `ROLLBACK_PROCEDURE.md`)
4. Restore from backup if available

## Best Practices

### Before Migration

1. Test validation script in staging
2. Test rollback procedure in staging
3. Document expected validation results
4. Prepare rollback communication plan

### During Migration

1. Run validation immediately after data migration
2. Review validation report thoroughly
3. Do not proceed with cutover if validation fails
4. Keep rollback script ready

### After Migration

1. Monitor application logs for errors
2. Keep validation report for reference
3. Retain `.env.backup` for at least 7 days
4. Document any issues encountered

## Troubleshooting

### Validation Script Issues

**Issue**: Connection timeout to Neon DB

```bash
# Check connection
npm run test:migration
```

**Issue**: Supabase connection fails

```bash
# Verify Supabase credentials in .env
cat .env | grep SUPABASE
```

**Issue**: Validation takes too long

- Reduce sample size in validation script
- Run validation during off-peak hours
- Check network connectivity

### Rollback Script Issues

**Issue**: DATABASE_PROVIDER not updating

```bash
# Verify manually
cat .env | grep DATABASE_PROVIDER

# Update manually if needed
echo 'DATABASE_PROVIDER="supabase"' >> .env
```

**Issue**: Application still uses Neon after rollback

- Ensure application was restarted (not just refreshed)
- Clear application caches
- Verify environment variables are loaded

## Support and Escalation

If you encounter issues with validation or rollback:

1. **Check Documentation**: Review this file and `ROLLBACK_PROCEDURE.md`
2. **Review Logs**: Check console output for error messages
3. **Test Connections**: Verify both database connections work
4. **Manual Intervention**: Follow manual procedures if scripts fail
5. **Escalate**: Contact development team if issues persist

## Summary

The validation and rollback tools provide:

- **Safety**: Comprehensive validation before cutover
- **Confidence**: Detailed reporting of migration success
- **Reversibility**: Quick rollback if issues arise
- **Transparency**: Clear decision criteria and recommendations

Always run validation before proceeding with production cutover, and keep the rollback script ready for immediate use if needed.
