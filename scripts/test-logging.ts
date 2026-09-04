/**
 * Manual test script for logging system
 */

import { createLogger } from '../src/lib/logging/logger';
import { createDatabaseError, sanitizeQuery } from '../src/lib/db/errors';

console.log('=== Testing Logging System ===\n');

// Test 1: Logger with different levels
console.log('Test 1: Logger with different levels');
const debugLogger = createLogger({
  level: 'debug',
  environment: 'development',
});
console.log('Debug logger level:', debugLogger.getLevel());

debugLogger.debug('This is a debug message', { detail: 'debug info' });
debugLogger.info('This is an info message', { detail: 'info data' });
debugLogger.warn('This is a warning message', { detail: 'warning data' });
debugLogger.error('This is an error message', { detail: 'error data' });

console.log('\nTest 2: Logger filtering (info level)');
const infoLogger = createLogger({ level: 'info', environment: 'production' });
console.log('Info logger level:', infoLogger.getLevel());

infoLogger.debug('This should NOT appear');
infoLogger.info('This SHOULD appear');
infoLogger.warn('This SHOULD appear');
infoLogger.error('This SHOULD appear');

console.log('\nTest 3: Query sanitization');
const sql1 = 'SELECT * FROM drivers WHERE username = $1 AND password = $2';
const params1 = ['testuser', 'secretpassword'];
const sanitized1 = sanitizeQuery(sql1, params1);
console.log('Original query:', sql1);
console.log('Sanitized query:', sanitized1);

const sql2 = "UPDATE drivers SET password = 'newsecret' WHERE id = $1";
const params2 = ['123'];
const sanitized2 = sanitizeQuery(sql2, params2);
console.log('\nOriginal query:', sql2);
console.log('Sanitized query:', sanitized2);

console.log('\nTest 4: Database error logging');
const mockError = {
  code: '23505',
  message:
    'duplicate key value violates unique constraint "drivers_username_key"',
  constraint: 'drivers_username_key',
  table: 'drivers',
};

const dbError = createDatabaseError(
  mockError,
  'INSERT INTO drivers (username, password) VALUES ($1, $2)',
  ['testuser', 'password123'],
);

console.log('Database error created:');
console.log('- Category:', dbError.category);
console.log('- Code:', dbError.code);
console.log('- Message:', dbError.message);
console.log('- Context:', JSON.stringify(dbError.context, null, 2));
console.log('- Timestamp:', dbError.timestamp);

console.log('\n=== All Tests Complete ===');
