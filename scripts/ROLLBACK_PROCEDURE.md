# Rollback Procedure: Reverting to Supabase

This document describes the procedure for rolling back from Neon DB to Supabase if critical issues are discovered during or after migration.

## When to Rollback

Consider rolling back to Supabase if:

- **Critical validation failures**: The validation script reports a NO-GO decision
- **Data integrity issues**: Significant discrepancies found between Supabase and Neon data
- **Performance problems**: Neon DB queries are significantly slower than Supabase
- **Application errors**: Critical functionality is broken after migration
- **Connection issues**: Persistent connection failures to Neon DB

## Rollback Methods

### Method 1: Automated Rollback Script (Recommended)

The automated rollback script safely switches the `DATABASE_PROVIDER` environment variable back to `supabase`.

#### Steps:

1. **Run the rollback script:**

   ```bash
   npm run rollback
   # or
   ts-node scripts/rollback-to-supabase.ts
   ```

2. **Verify the change:**

   ```bash
   npm run rollback -- --status
   ```

3. **Restart your application:**
   - Development: Stop and restart your dev server
   - Production: Restart your application server/container

4. **Verify application is working:**
   - Test login functionality
   - Verify data is loading correctly
   - Check that CRUD operations work

#### What the Script Does:

- Creates a backup of your current `.env` file (`.env.backup`)
- Updates `DATABASE_PROVIDER` to `"supabase"`
- Verifies the change was successful
- Provides clear feedback on success/failure

#### Script Options:

```bash
# Perform rollback (default)
npm run rollback

# Check current configuration
npm run rollback -- --status

# Restore from backup
npm run rollback -- --restore
```

### Method 2: Manual Rollback

If the automated script fails or is unavailable, you can manually rollback:

#### Steps:

1. **Backup your current .env file:**

   ```bash
   cp .env .env.backup
   ```

2. **Edit the .env file:**

   ```bash
   # Open .env in your editor
   nano .env
   # or
   code .env
   ```

3. **Change DATABASE_PROVIDER:**

   ```env
   # Change from:
   DATABASE_PROVIDER="neon"

   # To:
   DATABASE_PROVIDER="supabase"
   ```

4. **Save the file and restart your application**

5. **Verify the application is working**

## Post-Rollback Verification

After rolling back, verify that the application is functioning correctly:

### 1. Authentication Test

```bash
# Test authentication system
npm run test:auth
```

### 2. Database Connection Test

```bash
# Verify Supabase connection
npm run test:migration
```

### 3. Manual Testing Checklist

- [ ] Login with test credentials
- [ ] View drivers list
- [ ] View admissions list
- [ ] View rides list
- [ ] Create a test record (driver, admission, or ride)
- [ ] Update a test record
- [ ] Delete a test record
- [ ] Check that relationships work (e.g., rides linked to drivers)

## Rollback in Different Environments

### Development Environment

1. Run rollback script
2. Restart dev server (`npm run dev`)
3. Test locally

### Staging Environment

1. Run rollback script on staging server
2. Restart staging application
3. Run smoke tests
4. Verify with QA team

### Production Environment

**CRITICAL: Follow this procedure carefully**

1. **Announce maintenance window** (if possible)
2. **Take a backup** of current state
3. **Run rollback script:**
   ```bash
   npm run rollback
   ```
4. **Restart application servers** (use your deployment process)
5. **Monitor application logs** for errors
6. **Run health checks:**
   ```bash
   curl https://your-app.com/health
   ```
7. **Verify critical functionality:**
   - User login
   - Data retrieval
   - Data modification
8. **Monitor for 15-30 minutes** to ensure stability
9. **Announce rollback completion**

## Troubleshooting Rollback Issues

### Issue: Rollback script fails

**Solution:**

1. Check error message in console
2. Verify `.env` file exists and is writable
3. Try manual rollback method
4. Check file permissions: `ls -la .env`

### Issue: Application still uses Neon after rollback

**Solution:**

1. Verify `.env` file was updated: `cat .env | grep DATABASE_PROVIDER`
2. Ensure application was restarted (not just refreshed)
3. Clear any application caches
4. Check if environment variables are being overridden elsewhere

### Issue: Supabase connection fails after rollback

**Solution:**

1. Verify Supabase credentials in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Test Supabase connection: `npm run test:migration`
3. Check Supabase dashboard for service status
4. Verify network connectivity to Supabase

### Issue: Data appears outdated after rollback

**Explanation:**

- If you were in dual-write mode, data should be in sync
- If you were only writing to Neon, Supabase data may be stale

**Solution:**

1. Assess how long you were writing only to Neon
2. If data is critical, consider:
   - Reverse migration (Neon → Supabase)
   - Manual data sync for recent changes
   - Accepting data loss for the migration period

## Re-attempting Migration After Rollback

If you rolled back due to issues and want to try migration again:

1. **Identify and fix the root cause** of the rollback
2. **Review validation report** to understand what failed
3. **Test fixes in development/staging** first
4. **Re-run schema migration** if schema issues were found:
   ```bash
   npm run migrate:schema
   ```
5. **Re-run data migration:**
   ```bash
   npm run migrate:data
   ```
6. **Run validation again:**
   ```bash
   npm run validate:migration
   ```
7. **Only proceed if validation passes**

## Rollback Testing

It's recommended to test the rollback procedure in staging before production migration:

### Staging Rollback Test

1. Perform migration in staging
2. Test rollback procedure
3. Verify application works after rollback
4. Document any issues encountered
5. Update rollback procedure if needed

This ensures the rollback process is smooth if needed in production.

## Emergency Contacts

If you encounter issues during rollback:

- **Development Team Lead**: [Contact Info]
- **DevOps/Infrastructure**: [Contact Info]
- **Database Administrator**: [Contact Info]

## Rollback Decision Matrix

| Severity     | Issue Type                                       | Action                             |
| ------------ | ------------------------------------------------ | ---------------------------------- |
| **Critical** | Data loss, corruption, or major integrity issues | **IMMEDIATE ROLLBACK**             |
| **Critical** | Application completely broken                    | **IMMEDIATE ROLLBACK**             |
| **High**     | Validation fails with <70% pass rate             | **ROLLBACK RECOMMENDED**           |
| **High**     | Major functionality broken                       | **ROLLBACK RECOMMENDED**           |
| **Medium**   | Minor data discrepancies                         | **INVESTIGATE, CONSIDER ROLLBACK** |
| **Medium**   | Performance degradation                          | **INVESTIGATE, CONSIDER ROLLBACK** |
| **Low**      | Minor validation failures (>90% pass rate)       | **PROCEED, FIX POST-MIGRATION**    |
| **Low**      | Non-critical features affected                   | **PROCEED, FIX POST-MIGRATION**    |

## Post-Rollback Actions

After a successful rollback:

1. **Document the reason** for rollback
2. **Analyze what went wrong** during migration
3. **Create action items** to fix issues
4. **Update migration plan** based on lessons learned
5. **Schedule re-attempt** after fixes are implemented
6. **Communicate status** to stakeholders

## Backup and Recovery

The rollback script creates a backup of your `.env` file at `.env.backup`.

### Restore from Backup

If you need to restore your previous configuration:

```bash
npm run rollback -- --restore
```

Or manually:

```bash
cp .env.backup .env
```

### Backup Retention

- Keep `.env.backup` for at least 7 days after migration
- Store backups in a secure location
- Document backup locations in your runbook

## Summary

The rollback procedure is designed to be:

- **Fast**: Can be executed in under 5 minutes
- **Safe**: Creates backups before making changes
- **Reversible**: Can restore from backup if needed
- **Verifiable**: Includes verification steps

Always test rollback in staging before production migration to ensure a smooth process if rollback becomes necessary.
