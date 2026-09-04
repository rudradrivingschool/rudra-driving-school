# Provider Router

The Provider Router is a feature flag system that enables seamless migration from Supabase to Neon DB by routing database operations to the appropriate provider based on configuration.

## Features

- **Three Operation Modes**: Supabase, Neon, or dual-write
- **Dual-Write Validation**: Execute operations on both databases and compare results
- **Automatic Discrepancy Logging**: Logs differences between database results
- **Configurable Primary Provider**: Choose which database is authoritative in dual-write mode
- **Zero Code Changes**: Switch providers via environment variables

## Configuration

### Environment Variables

```bash
# Database provider mode (required)
# Options: supabase | neon | dual-write
DATABASE_PROVIDER=supabase

# Primary provider in dual-write mode (optional, defaults to neon)
# Options: supabase | neon
DATABASE_PRIMARY_PROVIDER=neon

# Neon database connection (required for neon and dual-write modes)
NEON_DATABASE_URL=postgresql://user:password@host:5432/database
```

## Usage

### Basic Setup

```typescript
import { createProviderRouter } from './provider-router';
import { createNeonClient } from './neon-client';
import { loadDatabaseConfig } from './config';

// For Supabase mode (no Neon client needed)
const router = createProviderRouter();

// For Neon or dual-write mode
const config = loadDatabaseConfig();
const neonClient = createNeonClient(config);
const router = createProviderRouter(neonClient);
```

### Query Operations

The router provides a Supabase-compatible interface:

```typescript
// SELECT queries
const drivers = await router
  .from('drivers')
  .eq('status', 'active')
  .order('name', { ascending: true })
  .execute();

// INSERT operations
const newDriver = await router.insert('drivers', {
  username: 'john_doe',
  password: 'hashed_password',
  name: 'John Doe',
  email: 'john@example.com',
});

// UPDATE operations
const updatedDriver = await router.update('drivers', driverId, {
  status: 'inactive',
});

// DELETE operations
await router.delete('drivers', driverId);
```

## Operation Modes

### 1. Supabase Mode

Routes all operations to Supabase (legacy mode).

```bash
DATABASE_PROVIDER=supabase
```

**Use case**: Current production state before migration.

### 2. Neon Mode

Routes all operations to Neon DB (new mode).

```bash
DATABASE_PROVIDER=neon
NEON_DATABASE_URL=postgresql://...
```

**Use case**: After successful migration and validation.

### 3. Dual-Write Mode

Executes write operations on both databases and compares results.

```bash
DATABASE_PROVIDER=dual-write
DATABASE_PRIMARY_PROVIDER=neon
NEON_DATABASE_URL=postgresql://...
```

**Use case**: Migration validation phase.

#### Dual-Write Behavior

**Write Operations (INSERT, UPDATE, DELETE)**:

- Executes on both Supabase and Neon
- Compares results from both databases
- Logs discrepancies with detailed differences
- Returns result from primary provider
- Continues if secondary provider fails (logs error)

**Read Operations (SELECT)**:

- Routes to primary provider only
- No dual execution for performance

#### Discrepancy Logging

When results differ, the router logs:

```
[ProviderRouter] Dual-write discrepancy detected
{
  timestamp: "2024-01-15T10:30:00.000Z",
  table: "drivers",
  operation: "insert",
  differences: [
    'Field "created_at": Supabase="2024-01-15T10:30:00.000Z", Neon="2024-01-15T10:30:00.001Z"'
  ],
  message: "Results from Supabase and Neon do not match"
}
```

## Migration Workflow

### Phase 1: Preparation

- Set up Neon DB
- Run schema migration
- Run data migration
- Verify data integrity

### Phase 2: Dual-Write Validation

```bash
DATABASE_PROVIDER=dual-write
DATABASE_PRIMARY_PROVIDER=supabase  # Keep Supabase as primary initially
```

- Enable dual-write mode
- Monitor logs for discrepancies
- Fix any issues found
- Verify both databases stay in sync

### Phase 3: Switch Primary to Neon

```bash
DATABASE_PROVIDER=dual-write
DATABASE_PRIMARY_PROVIDER=neon  # Switch to Neon as primary
```

- Change primary provider to Neon
- Continue monitoring
- Verify application works correctly

### Phase 4: Full Migration

```bash
DATABASE_PROVIDER=neon
```

- Switch to Neon-only mode
- Disable Supabase writes
- Monitor for issues

### Phase 5: Rollback (if needed)

```bash
DATABASE_PROVIDER=supabase
```

- Revert to Supabase if critical issues arise
- Investigate and fix issues
- Retry migration

## Error Handling

### Primary Provider Failure

If the primary provider fails, the operation throws an error:

```typescript
try {
  await router.insert('drivers', data);
} catch (error) {
  console.error('Primary database operation failed:', error);
  // Handle error (retry, rollback, etc.)
}
```

### Secondary Provider Failure

If the secondary provider fails in dual-write mode:

- Error is logged but not thrown
- Operation continues with primary result
- Allows migration to proceed despite secondary issues

### Comparison Failures

If results differ between providers:

- Discrepancy is logged with details
- Primary result is returned
- Application continues normally
- Review logs to identify issues

## Performance Considerations

### Dual-Write Mode

- Write operations take longer (2x database calls)
- Read operations use primary provider only (no performance impact)
- Use for validation phase only, not long-term

### Connection Pooling

- Each provider maintains its own connection pool
- Neon client: min 2, max 10 connections
- Supabase client: managed by Supabase SDK

## Testing

### Unit Tests

```typescript
import { ProviderRouter } from './provider-router';

// Test configuration validation
const router = new ProviderRouter({
  provider: 'neon',
  neonClient: mockNeonClient,
});

// Test result comparison
const comparison = router.compareResults(result1, result2);
expect(comparison.match).toBe(true);
```

### Integration Tests

```bash
# Run provider router tests
npm run test:provider-router
```

## Monitoring

### Key Metrics to Monitor

1. **Discrepancy Rate**: Number of mismatches in dual-write mode
2. **Error Rate**: Failed operations per provider
3. **Latency**: Operation duration per provider
4. **Success Rate**: Successful operations per provider

### Log Analysis

Search logs for:

- `[ProviderRouter] Dual-write discrepancy detected` - Result mismatches
- `[ProviderRouter] Supabase INSERT failed` - Supabase errors
- `[ProviderRouter] Neon INSERT failed` - Neon errors

## Troubleshooting

### Issue: Discrepancies in dual-write mode

**Symptoms**: Logs show result differences between providers

**Solutions**:

1. Check timestamp precision differences
2. Verify data types match between databases
3. Check for timezone handling differences
4. Review default values and constraints

### Issue: Neon operations failing

**Symptoms**: Neon errors in dual-write mode

**Solutions**:

1. Verify NEON_DATABASE_URL is correct
2. Check connection pool settings
3. Verify schema matches Supabase
4. Check network connectivity

### Issue: Performance degradation

**Symptoms**: Slow operations in dual-write mode

**Solutions**:

1. This is expected (2x database calls)
2. Use dual-write for validation only
3. Switch to single-provider mode for production
4. Optimize queries and indexes

## API Reference

### ProviderRouter

```typescript
class ProviderRouter {
  constructor(config: ProviderRouterConfig);
  from<T>(table: string): QueryBuilder<T>;
  insert<T>(table: string, data: Partial<T>): Promise<T>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<void>;
}
```

### ProviderRouterConfig

```typescript
interface ProviderRouterConfig {
  provider: 'supabase' | 'neon' | 'dual-write';
  neonClient?: NeonClient;
  primaryProvider?: 'supabase' | 'neon';
}
```

### createProviderRouter

```typescript
function createProviderRouter(neonClient?: NeonClient): ProviderRouter;
```

Creates a router instance from environment configuration.

## Related Documentation

- [Neon Client](./README.md#neon-client)
- [Query Adapter](./QUERY_BUILDER_README.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Migration Guide](./IMPLEMENTATION_SUMMARY.md)
