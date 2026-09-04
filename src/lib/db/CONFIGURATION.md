# Database Configuration Guide

## Overview

The application supports flexible database routing through the `DATABASE_PROVIDER` environment variable, enabling a phased migration from Supabase to Neon DB.

## Configuration Modes

### 1. Supabase Mode (Default)

Routes all database operations to Supabase. This is the default mode for backward compatibility.

```env
DATABASE_PROVIDER=supabase
```

**Use when:**

- Before migration begins
- During rollback scenarios
- Testing with legacy Supabase setup

**Requirements:**

- `VITE_SUPABASE_URL` must be set
- `VITE_SUPABASE_ANON_KEY` must be set
- `NEON_DATABASE_URL` is NOT required

### 2. Neon Mode

Routes all database operations to Neon DB. Use this after migration is complete.

```env
DATABASE_PROVIDER=neon
NEON_DATABASE_URL=postgresql://user:password@host:5432/database
```

**Use when:**

- Migration is complete and validated
- Ready for production cutover
- Testing Neon DB exclusively

**Requirements:**

- `NEON_DATABASE_URL` must be set
- Optional: `DATABASE_POOL_MIN` (default: 2)
- Optional: `DATABASE_POOL_MAX` (default: 10)

### 3. Dual-Write Mode

Writes to both Supabase and Neon DB, comparing results and logging discrepancies. Reads come from the primary provider.

```env
DATABASE_PROVIDER=dual-write
DATABASE_PRIMARY_PROVIDER=neon
NEON_DATABASE_URL=postgresql://user:password@host:5432/database
```

**Use when:**

- Validating migration in production
- Testing Neon DB with real traffic
- Comparing behavior between databases

**Requirements:**

- All Supabase configuration variables
- All Neon configuration variables
- `DATABASE_PRIMARY_PROVIDER` (default: neon)

**Behavior:**

- Write operations execute on both databases
- Results are compared and discrepancies logged
- Read operations use the primary provider
- If primary fails, operation fails (no fallback)

## Environment Variables

### Required (Mode-Dependent)

| Variable                 | Required For         | Description                              |
| ------------------------ | -------------------- | ---------------------------------------- |
| `NEON_DATABASE_URL`      | neon, dual-write     | PostgreSQL connection string for Neon DB |
| `VITE_SUPABASE_URL`      | supabase, dual-write | Supabase project URL                     |
| `VITE_SUPABASE_ANON_KEY` | supabase, dual-write | Supabase anonymous key                   |

### Optional

| Variable                    | Default  | Description                                            |
| --------------------------- | -------- | ------------------------------------------------------ |
| `DATABASE_PROVIDER`         | supabase | Database routing mode (supabase \| neon \| dual-write) |
| `DATABASE_PRIMARY_PROVIDER` | neon     | Primary provider in dual-write mode (supabase \| neon) |
| `DATABASE_POOL_MIN`         | 2        | Minimum connections in Neon pool                       |
| `DATABASE_POOL_MAX`         | 10       | Maximum connections in Neon pool                       |

## Implementation Details

### Client Initialization

The `getQueryAdapter()` function in `src/lib/db/client.ts` initializes the appropriate database client based on `DATABASE_PROVIDER`:

```typescript
const queryAdapter = getQueryAdapter();
// Returns ProviderRouter configured for the selected mode
```

### Provider Router

The `ProviderRouter` class handles routing logic:

- **Supabase mode**: Routes to Supabase client
- **Neon mode**: Routes to Neon client via QueryAdapter
- **Dual-write mode**: Executes on both, compares results, returns primary

### Backward Compatibility

All existing hooks (`useDrivers`, `useAdmissions`, etc.) work unchanged because:

1. They call `getQueryAdapter()` which returns a compatible interface
2. The `ProviderRouter` implements the same methods as `QueryAdapter`
3. Query syntax remains identical across all modes

## Migration Workflow

### Phase 1: Pre-Migration (Supabase Mode)

```env
DATABASE_PROVIDER=supabase
```

Application runs entirely on Supabase.

### Phase 2: Validation (Dual-Write Mode)

```env
DATABASE_PROVIDER=dual-write
DATABASE_PRIMARY_PROVIDER=supabase
NEON_DATABASE_URL=postgresql://...
```

- Writes go to both databases
- Reads come from Supabase (primary)
- Discrepancies are logged for investigation

### Phase 3: Testing (Dual-Write with Neon Primary)

```env
DATABASE_PROVIDER=dual-write
DATABASE_PRIMARY_PROVIDER=neon
```

- Writes go to both databases
- Reads come from Neon (primary)
- Validates Neon can handle production load

### Phase 4: Cutover (Neon Mode)

```env
DATABASE_PROVIDER=neon
```

Application runs entirely on Neon DB.

### Rollback (Back to Supabase)

```env
DATABASE_PROVIDER=supabase
```

Instant rollback to Supabase if issues arise.

## Monitoring

### Dual-Write Discrepancies

When results differ between databases, the router logs:

```
[ProviderRouter] Dual-write discrepancy detected
{
  timestamp: "2024-01-15T10:30:00.000Z",
  table: "drivers",
  operation: "insert",
  differences: [
    "Field \"created_at\": Supabase=\"2024-01-15T10:30:00Z\", Neon=\"2024-01-15T10:30:00.123Z\""
  ]
}
```

### Initialization Logs

Client initialization is logged:

```
[Database Client] Initialized
{
  timestamp: "2024-01-15T10:00:00.000Z",
  provider: "dual-write",
  message: "Database client configured for dual-write mode"
}
```

## Troubleshooting

### Error: Missing NEON_DATABASE_URL

**Cause:** `DATABASE_PROVIDER` is set to "neon" or "dual-write" but `NEON_DATABASE_URL` is not configured.

**Solution:** Add `NEON_DATABASE_URL` to your `.env` file or switch to `DATABASE_PROVIDER=supabase`.

### Error: Invalid DATABASE_PROVIDER

**Cause:** `DATABASE_PROVIDER` is set to an invalid value.

**Solution:** Use one of: `supabase`, `neon`, or `dual-write`.

### Dual-Write Performance Issues

**Cause:** Writing to two databases doubles write latency.

**Solution:** Dual-write mode is for validation only. Switch to single-provider mode for production.

## Testing

### Test Supabase Mode

```bash
DATABASE_PROVIDER=supabase npm run dev
```

### Test Neon Mode

```bash
DATABASE_PROVIDER=neon npm run dev
```

### Test Dual-Write Mode

```bash
DATABASE_PROVIDER=dual-write npm run dev
```

Check console for discrepancy logs.
