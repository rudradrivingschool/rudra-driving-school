# Connection Pool Monitoring

This document describes the connection pool monitoring features implemented in the NeonClient.

## Features

### 1. Health Check

The `healthCheck()` method tests the database connection by executing a simple query:

```typescript
const client = getNeonClient();
const isHealthy = await client.healthCheck();
console.log('Database is', isHealthy ? 'healthy' : 'unhealthy');
```

**Features:**

- Returns `true` if connection is working, `false` otherwise
- Logs status changes (healthy → unhealthy or vice versa)
- Safe to call repeatedly without performance impact

### 2. Connection Pool Metrics

Track real-time connection pool statistics:

```typescript
const metrics = client.getPoolMetrics();
console.log('Pool metrics:', {
  totalConnections: metrics.totalCount,
  idleConnections: metrics.idleCount,
  waitingRequests: metrics.waitingCount,
  timestamp: metrics.timestamp,
});
```

**Metrics:**

- `totalCount`: Total number of connections in the pool
- `idleCount`: Number of idle connections available for reuse
- `waitingCount`: Number of requests waiting for a connection
- `timestamp`: ISO timestamp when metrics were captured

### 3. Automatic Retry with Exponential Backoff

All queries automatically retry on connection errors:

```typescript
// Automatically retries up to 3 times with exponential backoff
const result = await client.query('SELECT * FROM drivers');
```

**Configuration:**

```typescript
const client = new NeonClient({
  connectionString: process.env.NEON_DATABASE_URL,
  retryAttempts: 3, // Max retry attempts (default: 3)
  retryDelayMs: 1000, // Initial delay in ms (default: 1000)
});
```

**Retry behavior:**

- Only retries connection errors (not query errors or constraint violations)
- Uses exponential backoff: 1s → 2s → 4s → 8s (up to 30s max)
- Logs each retry attempt with delay and error details
- Throws error after all attempts exhausted

### 4. Periodic Health Checks

Automatically monitor connection health at regular intervals:

```typescript
const client = new NeonClient({
  connectionString: process.env.NEON_DATABASE_URL,
  enablePeriodicHealthCheck: true, // Enable periodic checks (default: true)
  healthCheckIntervalMs: 60000, // Check every 60 seconds (default: 60000)
});
```

**Features:**

- Runs health check at specified interval
- Logs pool status with each check
- Detects and logs connection loss/restoration
- Automatically stops when client is closed
- Uses `unref()` to prevent blocking process exit

**Log output example:**

```json
{
  "timestamp": "2026-03-03T16:27:34.309Z",
  "level": "info",
  "message": "Connection pool status",
  "context": {
    "healthy": true,
    "totalConnections": 1,
    "idleConnections": 1,
    "waitingRequests": 0,
    "timestamp": "2026-03-03T16:27:34.309Z"
  }
}
```

### 5. Connection Lifecycle Logging

All connection events are automatically logged:

**Connection created:**

```json
{
  "level": "debug",
  "message": "Connection created",
  "context": {
    "event": "created",
    "totalCount": 1,
    "idleCount": 0
  }
}
```

**Connection reused:**

```json
{
  "level": "debug",
  "message": "Connection acquired from pool",
  "context": {
    "event": "reused",
    "totalCount": 1,
    "idleCount": 0,
    "waitingCount": 0
  }
}
```

**Connection closed:**

```json
{
  "level": "debug",
  "message": "Connection removed from pool",
  "context": {
    "event": "closed",
    "totalCount": 0,
    "idleCount": 0
  }
}
```

## Configuration

### Full Configuration Example

```typescript
import { NeonClient } from './lib/db/neon-client';

const client = new NeonClient({
  // Required
  connectionString: process.env.NEON_DATABASE_URL,

  // Connection pool settings
  poolMin: 2, // Minimum idle connections (default: 2)
  poolMax: 10, // Maximum total connections (default: 10)
  idleTimeoutMillis: 600000, // Close idle connections after 10 min (default: 600000)
  connectionTimeoutMillis: 30000, // Connection timeout 30s (default: 30000)

  // Retry settings
  retryAttempts: 3, // Max retry attempts (default: 3)
  retryDelayMs: 1000, // Initial retry delay (default: 1000)

  // Health check settings
  enablePeriodicHealthCheck: true, // Enable periodic checks (default: true)
  healthCheckIntervalMs: 60000, // Check interval in ms (default: 60000)
});
```

### Environment Variables

```bash
# Required
NEON_DATABASE_URL=postgresql://user:password@host:5432/database

# Optional
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

## Testing

Run the connection pool monitoring test suite:

```bash
npx tsx scripts/test-connection-pool.ts
```

**Test coverage:**

- Health check functionality
- Pool metrics tracking
- Connection reuse
- Retry logic with exponential backoff
- Periodic health checks
- Connection recovery

## Monitoring in Production

### Recommended Settings

```typescript
const client = new NeonClient({
  connectionString: process.env.NEON_DATABASE_URL,
  poolMin: 2,
  poolMax: 10,
  enablePeriodicHealthCheck: true,
  healthCheckIntervalMs: 60000, // Check every minute
  retryAttempts: 3,
  retryDelayMs: 1000,
});
```

### Log Levels

- **debug**: Connection lifecycle events (created, reused, closed)
- **info**: Pool initialization, health check status, pool closure
- **warn**: Connection errors with retry attempts, connection loss
- **error**: Fatal errors, health check failures

Set log level via environment:

```bash
LOG_LEVEL=info  # Production: info or warn
LOG_LEVEL=debug # Development: debug for detailed connection tracking
```

### Metrics to Monitor

1. **Total connections**: Should stay within pool limits (min to max)
2. **Idle connections**: Should be > 0 for good performance
3. **Waiting requests**: Should be 0 or low; high values indicate pool exhaustion
4. **Health check status**: Should always be `true` in production
5. **Retry attempts**: Frequent retries indicate connection instability

### Alerting Recommendations

- Alert if health check fails for > 2 consecutive checks
- Alert if waiting requests > 5 for > 30 seconds
- Alert if retry attempts > 10 per minute
- Alert if total connections consistently at max limit

## Troubleshooting

### High waiting requests

**Symptom:** `waitingCount` consistently > 0

**Causes:**

- Pool size too small for load
- Slow queries holding connections
- Connection leaks (not releasing connections)

**Solutions:**

- Increase `poolMax`
- Optimize slow queries
- Ensure all queries use connection pool (not holding clients)

### Frequent retries

**Symptom:** Many "Connection error, retrying" log entries

**Causes:**

- Network instability
- Database server overloaded
- Firewall/security group issues

**Solutions:**

- Check network connectivity
- Verify database server health
- Review firewall rules
- Increase `connectionTimeoutMillis`

### Health check failures

**Symptom:** `healthCheck()` returns `false`

**Causes:**

- Database server down
- Network issues
- Invalid credentials
- Connection string misconfigured

**Solutions:**

- Verify database server is running
- Test connection manually with `psql`
- Check credentials and connection string
- Review database logs

## Requirements Validated

This implementation validates the following requirements:

- **Requirement 8.6**: Connection pool health monitoring
- **Requirement 8.7**: Connection retry logic with exponential backoff
- **Requirement 10.6**: Connection lifecycle event logging
- **Requirement 10.7**: Structured logging with different log levels

## Related Documentation

- [Database Configuration](./config.ts)
- [Error Handling](./errors.ts)
- [Logging System](../logging/logger.ts)
- [Query Adapter](./query-adapter.ts)
