# QueryAdapter CRUD Operations

The `QueryAdapter` class provides a high-level interface for CRUD operations with a Supabase-compatible API.

## Overview

The QueryAdapter wraps the NeonClient and provides four main operations:

- **from()** - Create a QueryBuilder for SELECT operations
- **insert()** - Insert a record and return it with all fields
- **update()** - Update a record by ID and return the updated version
- **delete()** - Delete a record by ID

All operations use parameterized queries to prevent SQL injection and return results in Supabase format.

## Usage

### Initialize the Adapter

```typescript
import { QueryAdapter } from './query-adapter';
import { NeonClient } from './neon-client';
import { loadDatabaseConfig } from './config';

const config = loadDatabaseConfig();
const client = new NeonClient(config);
const adapter = new QueryAdapter(client);
```

### SELECT Operations

Use the `from()` method to create a QueryBuilder for SELECT queries:

```typescript
// Select all records
const drivers = await adapter.from('drivers').execute();

// Select with filters
const activeDrivers = await adapter
  .from('drivers')
  .eq('status', 'active')
  .order('name', { ascending: true })
  .execute();

// Select single record
const driver = await adapter.from('drivers').eq('id', 'some-uuid').single();
```

### INSERT Operations

Insert a new record and get back the complete record with all fields:

```typescript
const newDriver = {
  username: 'john_doe',
  password: 'hashed_password',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  status: 'active',
  role: 'driver',
};

const insertedDriver = await adapter.insert('drivers', newDriver);
console.log('New driver ID:', insertedDriver.id);
console.log('Created at:', insertedDriver.created_at);
```

**Features:**

- Returns the inserted record with all fields (including auto-generated ones like `id`, `created_at`, `updated_at`)
- Uses parameterized queries for security
- Throws error if data is empty

### UPDATE Operations

Update an existing record by ID and get back the updated record:

```typescript
const updates = {
  name: 'John Smith',
  phone: '9876543210',
};

const updatedDriver = await adapter.update('drivers', driverId, updates);
console.log('Updated name:', updatedDriver.name);
console.log('Updated at:', updatedDriver.updated_at);
```

**Features:**

- Updates only the specified fields
- Returns the complete updated record with all fields
- Uses parameterized queries for security
- Throws error if record not found
- Throws error if update data is empty

### DELETE Operations

Delete a record by ID:

```typescript
await adapter.delete('drivers', driverId);
```

**Features:**

- Deletes the record with the specified ID
- Does not throw error if record doesn't exist (idempotent)
- Uses parameterized queries for security

## Error Handling

All operations throw errors for invalid inputs or database errors:

```typescript
try {
  await adapter.insert('drivers', {});
} catch (error) {
  console.error('Error:', error.message);
  // Error: Cannot insert empty data
}

try {
  await adapter.update('drivers', 'invalid-id', { name: 'Test' });
} catch (error) {
  console.error('Error:', error.message);
  // Error: Query execution failed: invalid input syntax for type uuid
}
```

## TypeScript Support

Use TypeScript generics for type-safe operations:

```typescript
interface Driver {
  id: string;
  username: string;
  name: string;
  email: string;
  status: string;
  // ... other fields
}

// Type-safe SELECT
const drivers = await adapter
  .from<Driver>('drivers')
  .eq('status', 'active')
  .execute();

// Type-safe INSERT
const newDriver: Partial<Driver> = {
  username: 'john_doe',
  name: 'John Doe',
  email: 'john@example.com',
};
const inserted = await adapter.insert<Driver>('drivers', newDriver);

// Type-safe UPDATE
const updates: Partial<Driver> = {
  name: 'John Smith',
};
const updated = await adapter.update<Driver>('drivers', id, updates);
```

## Comparison with Supabase

The QueryAdapter provides a compatible interface with Supabase:

### Supabase

```typescript
const { data } = await supabase
  .from('drivers')
  .select('*')
  .eq('status', 'active');

const { data: inserted } = await supabase
  .from('drivers')
  .insert(newDriver)
  .select()
  .single();

const { data: updated } = await supabase
  .from('drivers')
  .update(updates)
  .eq('id', driverId)
  .select()
  .single();

await supabase.from('drivers').delete().eq('id', driverId);
```

### QueryAdapter

```typescript
const data = await adapter.from('drivers').eq('status', 'active').execute();

const inserted = await adapter.insert('drivers', newDriver);

const updated = await adapter.update('drivers', driverId, updates);

await adapter.delete('drivers', driverId);
```

## Testing

Run the test script to verify CRUD operations:

```bash
npx tsx scripts/test-query-adapter.ts
```

The test script verifies:

- INSERT returns complete record with all fields
- SELECT finds inserted records
- UPDATE modifies records and returns updated version
- DELETE removes records
- Error handling for invalid inputs
