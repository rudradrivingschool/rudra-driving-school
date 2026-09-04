# QueryBuilder Implementation

## Overview

The `QueryBuilder` class provides a Supabase-compatible chainable interface for building and executing SQL queries against Neon DB. It translates method chains into parameterized SQL queries to prevent SQL injection.

## Features

- **Supabase-compatible API**: Drop-in replacement for Supabase query syntax
- **Parameterized queries**: All values are safely parameterized to prevent SQL injection
- **Chainable methods**: Fluent interface for building complex queries
- **Type-safe**: Full TypeScript support with generic types

## Implemented Methods

### `select(columns?: string | string[])`

Specify columns to select. Accepts:

- `'*'` for all columns (default)
- Array of column names: `['id', 'name', 'email']`
- Comma-separated string: `'id, name, email'`

### `eq(column: string, value: unknown)`

Filter rows where column equals value.

### `neq(column: string, value: unknown)`

Filter rows where column does not equal value.

### `in(column: string, values: unknown[])`

Filter rows where column value is in the provided array.

### `order(column: string, options?: { ascending?: boolean })`

Order results by column. Default is ascending.

### `limit(count: number)`

Limit the number of results returned.

### `range(from: number, to: number)`

Specify range of results for pagination (0-indexed, inclusive).

### `single()`

Execute query and return single record or null.

### `execute()`

Build and execute the SQL query, returning an array of results.

## Usage Example

```typescript
import { QueryBuilder } from './query-adapter';
import { NeonClient } from './neon-client';
import { loadDatabaseConfig } from './config';

// Initialize client
const config = loadDatabaseConfig();
const client = new NeonClient(config);

// Build and execute query
const activeDrivers = await new QueryBuilder('drivers', client)
  .select(['id', 'name', 'email'])
  .eq('status', 'active')
  .order('name', { ascending: true })
  .limit(10)
  .execute();
```

## Supabase Compatibility

The QueryBuilder is designed to match Supabase's query syntax:

```typescript
// Supabase
const { data } = await supabase
  .from('drivers')
  .select('*')
  .eq('status', 'active')
  .order('name', { ascending: true });

// QueryBuilder (equivalent)
const data = await new QueryBuilder('drivers', client)
  .select('*')
  .eq('status', 'active')
  .order('name', { ascending: true })
  .execute();
```

## SQL Query Generation

The QueryBuilder generates parameterized SQL queries:

```typescript
// Query chain
new QueryBuilder('drivers', client)
  .select('*')
  .eq('status', 'active')
  .neq('role', 'admin')
  .order('name', { ascending: true })
  .limit(20);

// Generated SQL
// SELECT * FROM drivers
// WHERE status = $1 AND role != $2
// ORDER BY name ASC
// LIMIT 20
//
// Parameters: ['active', 'admin']
```

## Requirements Satisfied

- **Requirement 4.1**: Provides the same query interface as the existing Supabase client
- **Requirement 4.2**: Supports SELECT queries with filtering, ordering, and pagination

## Next Steps

The next task (6.3) will implement the full `QueryAdapter` class with CRUD operations:

- `from()` - Create a QueryBuilder for a table
- `insert()` - Insert new records
- `update()` - Update existing records
- `delete()` - Delete records

## Files

- `src/lib/db/query-adapter.ts` - QueryBuilder implementation
- `src/lib/db/query-adapter.example.ts` - Usage examples
- `src/lib/db/QUERY_BUILDER_README.md` - This documentation
