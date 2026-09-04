# Neon Database Client

This module provides connection infrastructure for Neon DB with connection pooling, transaction support, and health monitoring.

## Setup

### 1. Install Dependencies

The required dependencies are already installed:

- `pg` - PostgreSQL client for Node.js
- `@types/pg` - TypeScript type definitions

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Required
NEON_DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Optional (defaults shown)
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

See `.env.example` for a complete example.

## Usage

### Basic Query Execution

```typescript
import { loadDatabaseConfig } from './lib/db/config';
import { createNeonClient } from './lib/db/neon-client';

// Load configuration
const config = loadDatabaseConfig();

// Create client
const client = createNeonClient(config);

// Execute query
const users = await client.query<User>(
  'SELECT * FROM users WHERE status = $1',
  ['active'],
);

// Close when done
await client.close();
```

### Transaction Support

```typescript
await client.transaction(async (txClient) => {
  await txClient.query('INSERT INTO users (name) VALUES ($1)', ['John']);
  await txClient.query('INSERT INTO profiles (user_id) VALUES ($1)', [userId]);
  // Automatically commits on success, rolls back on error
});
```

### Health Monitoring

```typescript
// Check connection health
const isHealthy = await client.healthCheck();

// Get pool statistics
const stats = client.getPoolStats();
console.log(`Active: ${stats.totalCount}, Idle: ${stats.idleCount}`);
```

## Configuration

### Connection Pool

The client uses connection pooling with the following defaults:

- **Min connections**: 2 (configurable via `DATABASE_POOL_MIN`)
- **Max connections**: 10 (configurable via `DATABASE_POOL_MAX`)
- **Idle timeout**: 10 minutes (600000ms)
- **Connection timeout**: 30 seconds (30000ms)

### Error Handling

The client provides enhanced error messages with context:

```typescript
try {
  await client.query('SELECT * FROM invalid_table');
} catch (error) {
  // Error includes query context
  console.error(error.message);
}
```

## Testing

Run the connection test script to verify setup:

```bash
# Install tsx if not already installed
npm install -D tsx

# Run test
npx tsx src/lib/db/test-connection.ts
```

This will test:

1. Configuration loading
2. Client creation
3. Health check
4. Query execution
5. Pool statistics
6. Transaction support

## Architecture

### Modules

- **config.ts**: Environment variable loading and validation
- **neon-client.ts**: Database client with connection pooling
- **test-connection.ts**: Validation script for testing setup

### Design Decisions

1. **Parameterized Queries**: All queries use parameterized statements to prevent SQL injection
2. **Connection Pooling**: Reuses connections for better performance
3. **Transaction Support**: Automatic commit/rollback handling
4. **Health Monitoring**: Built-in health checks and pool statistics
5. **Fail Fast**: Configuration errors are caught at startup

## Requirements Satisfied

This implementation satisfies the following requirements:

- **1.1**: Store Neon DB connection string in environment variables
- **1.2**: Store credentials separately from source code
- **1.3**: Support connection pooling with configurable pool size
- **1.4**: Validate connection parameters before attempting connection
- **1.5**: Return descriptive error messages for invalid parameters
- **1.6**: Support separate configurations for different environments
- **8.1**: Maintain minimum of 2 idle connections
- **8.2**: Support maximum of 10 concurrent connections
- **8.3**: Reuse connections for multiple queries
- **8.5**: Close idle connections after 10 minutes
- **11.1**: Require NEON_DATABASE_URL environment variable
- **11.2**: Support optional DATABASE_POOL_MIN and DATABASE_POOL_MAX
- **11.3**: Provide default values for optional configuration
- **11.4**: Fail fast with clear error messages for missing variables
- **11.6**: Validate environment variable formats before use
