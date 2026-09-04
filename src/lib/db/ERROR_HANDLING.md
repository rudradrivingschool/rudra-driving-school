# Database Error Handling

This document describes the comprehensive error handling system implemented in the query layer for the Neon DB migration.

## Overview

The error handling system categorizes database errors into three primary categories:

- **Connection Errors**: Database connectivity issues
- **Query Errors**: SQL syntax, permissions, and data type errors
- **Constraint Violations**: Database constraint violations (unique, foreign key, not-null, etc.)

## Error Object Structure

All database errors follow a consistent structure:

```typescript
interface DatabaseError {
  code: string; // PostgreSQL error code or 'UNKNOWN'
  message: string; // User-friendly error message
  category: 'connection' | 'query' | 'constraint';
  context?: {
    table?: string; // Table name involved in the error
    column?: string; // Column name involved in the error
    constraint?: string; // Constraint name that was violated
    query?: string; // Sanitized SQL query (no sensitive data)
  };
  timestamp: string; // ISO 8601 timestamp
  originalError?: Error; // Original error object for debugging
}
```

## Error Categories

### Connection Errors (Class 08)

Connection errors occur when the database is unreachable or authentication fails.

**PostgreSQL Error Codes:**

- `08000`: connection_exception
- `08003`: connection_does_not_exist
- `08006`: connection_failure
- `08001`: sqlclient_unable_to_establish_sqlconnection
- `08004`: sqlserver_rejected_establishment_of_sqlconnection
- `08007`: transaction_resolution_unknown
- `08P01`: protocol_violation

**Handling Strategy:**

- Retry with exponential backoff (3 attempts)
- Log connection parameters (excluding credentials)
- Return user-friendly error message
- Trigger connection pool health check

**Example:**

```typescript
{
  code: "08006",
  message: "Unable to connect to database. Please check your connection.",
  category: "connection",
  context: {},
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

### Constraint Violations (Class 23)

Constraint violations occur when data violates database integrity constraints.

**PostgreSQL Error Codes:**

- `23000`: integrity_constraint_violation
- `23502`: not_null_violation
- `23503`: foreign_key_violation
- `23505`: unique_violation
- `23514`: check_violation
- `23P01`: exclusion_violation

**Handling Strategy:**

- Parse PostgreSQL error to identify constraint type
- Return specific, user-friendly error message
- Log violation with affected record (sanitized)
- Do not retry (constraint violations are deterministic)

**User-Friendly Messages:**

- `23502`: "Required field is missing"
- `23503`: "Referenced record does not exist"
- `23505`: "A record with this value already exists"
- `23514`: "Value does not meet validation requirements"
- `23P01`: "Value conflicts with existing data"

**Example:**

```typescript
{
  code: "23505",
  message: "A record with this value already exists (drivers_username_key)",
  category: "constraint",
  context: {
    table: "drivers",
    column: "username",
    constraint: "drivers_username_key",
    query: "INSERT INTO drivers (username) VALUES (<string>)"
  },
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

### Query Errors (Class 42, 22)

Query errors occur due to SQL syntax errors, invalid table/column names, type mismatches, or permission issues.

**PostgreSQL Error Codes (Class 42 - Syntax/Access):**

- `42601`: syntax_error
- `42501`: insufficient_privilege
- `42703`: undefined_column
- `42P01`: undefined_table
- `42804`: datatype_mismatch
- And many more...

**PostgreSQL Error Codes (Class 22 - Data Exceptions):**

- `22001`: string_data_right_truncation
- `22003`: numeric_value_out_of_range
- `22007`: invalid_datetime_format
- `22012`: division_by_zero
- And more...

**Handling Strategy:**

- Log full error with query context
- Return structured error to caller
- Do not retry (query errors are deterministic)
- Include original error message (usually descriptive)

**Example:**

```typescript
{
  code: "42P01",
  message: "relation \"driverz\" does not exist",
  category: "query",
  context: {
    query: "SELECT * FROM driverz"
  },
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

## Query Sanitization

All SQL queries are sanitized before being logged to prevent sensitive data exposure:

```typescript
// Original query with parameters
const sql = 'SELECT * FROM drivers WHERE username = $1 AND password = $2';
const params = ['testuser', 'secret123'];

// Sanitized query (logged)
// SELECT * FROM drivers WHERE username = <string> AND password = <string>
```

Parameter values are replaced with type indicators (`<string>`, `<number>`, `<boolean>`, etc.).

## Usage Examples

### Catching and Handling Errors

```typescript
import { QueryAdapter, type DatabaseError } from '@/lib/db';

try {
  const driver = await queryAdapter.insert('drivers', {
    username: 'testuser',
    email: 'test@example.com',
  });
} catch (error) {
  const dbError = error as DatabaseError;

  switch (dbError.category) {
    case 'connection':
      // Handle connection errors - maybe retry or show maintenance message
      console.error('Database connection failed:', dbError.message);
      break;

    case 'constraint':
      // Handle constraint violations - show user-friendly message
      if (dbError.code === '23505') {
        console.error('Username already exists');
      }
      break;

    case 'query':
      // Handle query errors - log for debugging
      console.error('Query error:', dbError.message);
      break;
  }
}
```

### Accessing Error Context

```typescript
try {
  await queryAdapter.update('drivers', driverId, { email: null });
} catch (error) {
  const dbError = error as DatabaseError;

  console.log('Error occurred in table:', dbError.context?.table);
  console.log('Error occurred in column:', dbError.context?.column);
  console.log('Constraint violated:', dbError.context?.constraint);
  console.log('Query that failed:', dbError.context?.query);
}
```

## Logging

All database errors are automatically logged with full context:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "category": "constraint",
  "code": "23505",
  "message": "A record with this value already exists (drivers_username_key)",
  "context": {
    "table": "drivers",
    "column": "username",
    "constraint": "drivers_username_key",
    "query": "INSERT INTO drivers (username) VALUES (<string>)"
  }
}
```

Stack traces are logged separately for debugging:

```
[Stack Trace] Error: duplicate key value violates unique constraint "drivers_username_key"
    at Parser.parseErrorMessage (...)
    at Parser.handlePacket (...)
    ...
```

## Connection Lifecycle Logging

The NeonClient logs all connection lifecycle events:

```json
// Pool initialization
{
  "timestamp": "2024-01-15T10:00:00.000Z",
  "poolMin": 2,
  "poolMax": 10,
  "idleTimeout": 600000,
  "connectionTimeout": 30000
}

// New connection created
{
  "timestamp": "2024-01-15T10:00:01.000Z",
  "totalCount": 1,
  "idleCount": 1
}

// Connection acquired from pool
{
  "timestamp": "2024-01-15T10:00:02.000Z",
  "totalCount": 2,
  "idleCount": 1,
  "waitingCount": 0
}

// Connection removed from pool
{
  "timestamp": "2024-01-15T10:10:00.000Z",
  "totalCount": 1,
  "idleCount": 1
}
```

## Best Practices

1. **Always catch database errors**: Never let database errors propagate uncaught to the user
2. **Check error category**: Use the category field to determine appropriate handling
3. **Show user-friendly messages**: Use the `message` field for user-facing errors
4. **Log full context**: Log the entire error object for debugging
5. **Don't retry constraint violations**: These are deterministic and won't succeed on retry
6. **Retry connection errors**: Use exponential backoff for transient connection issues
7. **Sanitize before logging**: The system automatically sanitizes queries, but be careful with custom logging

## Testing

Run the error handling test suite:

```bash
npm run test:errors
```

This will test:

- Error categorization by code and message
- Context parsing from PostgreSQL errors
- Query sanitization
- User-friendly message generation
- Complete error object creation

## Requirements Validated

This error handling implementation validates the following requirements:

- **4.7**: Query layer handles database errors and returns structured error objects
- **4.8**: Error messages include query context
- **10.1**: Database errors are logged with timestamp and query context
- **10.2**: Error types are correctly distinguished (connection, query, constraint)
- **10.3**: Structured error objects with error code and message
- **10.6**: Connection lifecycle events are logged

## Related Files

- `src/lib/db/errors.ts` - Error handling utilities and types
- `src/lib/db/neon-client.ts` - NeonClient with error handling
- `src/lib/db/query-adapter.ts` - QueryAdapter with error handling
- `scripts/test-error-handling.ts` - Manual test script
