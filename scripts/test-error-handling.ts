/**
 * Manual test script for error handling functionality
 * Run with: npm run test:errors
 */

import {
  categorizeError,
  parseErrorContext,
  sanitizeQuery,
  getUserFriendlyMessage,
  createDatabaseError,
} from '../src/lib/db/errors';

console.log('Testing Database Error Handling\n');
console.log('='.repeat(50));

// Test 1: Error Categorization
console.log('\n1. Error Categorization Tests:');
console.log('-'.repeat(50));

const connectionError = { code: '08006', message: 'connection failure' };
console.log(`Connection error (08006): ${categorizeError(connectionError)}`);

const constraintError = { code: '23505', message: 'unique violation' };
console.log(`Constraint error (23505): ${categorizeError(constraintError)}`);

const queryError = { code: '42P01', message: 'undefined table' };
console.log(`Query error (42P01): ${categorizeError(queryError)}`);

const messageBasedError = { message: 'ECONNREFUSED: connection refused' };
console.log(`Message-based error: ${categorizeError(messageBasedError)}`);

// Test 2: Context Parsing
console.log('\n2. Error Context Parsing Tests:');
console.log('-'.repeat(50));

const errorWithContext = {
  table: 'drivers',
  column: 'username',
  constraint: 'drivers_username_key',
  detail: 'Key (username)=(test) already exists in table "drivers".',
};
const context = parseErrorContext(errorWithContext);
console.log('Parsed context:', JSON.stringify(context, null, 2));

// Test 3: Query Sanitization
console.log('\n3. Query Sanitization Tests:');
console.log('-'.repeat(50));

const sql1 = 'SELECT * FROM drivers WHERE username = $1 AND password = $2';
const params1 = ['testuser', 'secret123'];
console.log('Original:', sql1);
console.log('Sanitized:', sanitizeQuery(sql1, params1));

const sql2 = 'INSERT INTO drivers (name, age, active) VALUES ($1, $2, $3)';
const params2 = ['John', 25, true];
console.log('\nOriginal:', sql2);
console.log('Sanitized:', sanitizeQuery(sql2, params2));

// Test 4: User-Friendly Messages
console.log('\n4. User-Friendly Message Tests:');
console.log('-'.repeat(50));

const uniqueError = { code: '23505', constraint: 'drivers_username_key' };
console.log(
  'Unique violation:',
  getUserFriendlyMessage(uniqueError, 'constraint'),
);

const notNullError = { code: '23502', column: 'email' };
console.log(
  'Not-null violation:',
  getUserFriendlyMessage(notNullError, 'constraint'),
);

const foreignKeyError = { code: '23503' };
console.log(
  'Foreign key violation:',
  getUserFriendlyMessage(foreignKeyError, 'constraint'),
);

const timeoutError = { message: 'connection timeout' };
console.log(
  'Connection timeout:',
  getUserFriendlyMessage(timeoutError, 'connection'),
);

// Test 5: Complete Error Creation
console.log('\n5. Complete Database Error Creation:');
console.log('-'.repeat(50));

const rawError = {
  code: '23505',
  message: 'duplicate key value violates unique constraint',
  table: 'drivers',
  column: 'username',
  constraint: 'drivers_username_key',
};
const sql = 'INSERT INTO drivers (username) VALUES ($1)';
const params = ['testuser'];

const dbError = createDatabaseError(rawError, sql, params);
console.log('Created DatabaseError:');
console.log(JSON.stringify(dbError, null, 2));

// Test 6: Connection Error
console.log('\n6. Connection Error Example:');
console.log('-'.repeat(50));

const connError = {
  code: '08006',
  message: 'connection to server failed',
};
const dbConnError = createDatabaseError(connError);
console.log('Connection DatabaseError:');
console.log(JSON.stringify(dbConnError, null, 2));

// Test 7: Query Error
console.log('\n7. Query Error Example:');
console.log('-'.repeat(50));

const syntaxError = {
  code: '42601',
  message: 'syntax error at or near "SELCT"',
};
const querySql = 'SELCT * FROM drivers';
const dbQueryError = createDatabaseError(syntaxError, querySql);
console.log('Query DatabaseError:');
console.log(JSON.stringify(dbQueryError, null, 2));

console.log('\n' + '='.repeat(50));
console.log('All tests completed successfully!');
console.log('='.repeat(50) + '\n');
