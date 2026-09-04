# Authentication Service

This module provides authentication functionality for the driving school application, replacing Supabase Auth with a custom JWT-based authentication system.

## Features

- **Password Hashing**: Uses bcrypt with 10 rounds for secure password storage
- **JWT Tokens**: Generates JWT tokens with 7-day expiration
- **Session Management**: Stores sessions in localStorage with automatic validation
- **Plain-text Password Migration**: Automatically migrates plain-text passwords to bcrypt hashes on first login
- **Security**: Generic error messages prevent username enumeration attacks
- **Logging**: Logs authentication attempts without exposing passwords

## Usage

### Initialize AuthService

```typescript
import { NeonClient } from '../db/neon-client';
import { QueryAdapter } from '../db/query-adapter';
import { AuthService } from './auth-service';

const neonClient = new NeonClient({
  connectionString: process.env.NEON_DATABASE_URL || '',
});

const queryAdapter = new QueryAdapter(neonClient);
const authService = new AuthService(queryAdapter, process.env.JWT_SECRET);
```

### Sign In

```typescript
try {
  const session = await authService.signIn({
    username: 'john_doe',
    password: 'password123',
  });

  console.log('User:', session.user);
  console.log('Token:', session.token);
  console.log('Expires:', new Date(session.expiresAt));
} catch (error) {
  console.error('Sign in failed:', error.message);
}
```

### Get Current Session

```typescript
const session = await authService.getSession();

if (session) {
  console.log('Logged in as:', session.user.username);
} else {
  console.log('No active session');
}
```

### Refresh Session

```typescript
try {
  const newSession = await authService.refreshSession();
  console.log('Session refreshed with new token');
} catch (error) {
  console.error('Failed to refresh session:', error.message);
}
```

### Sign Out

```typescript
await authService.signOut();
console.log('Signed out successfully');
```

## Types

### AuthCredentials

```typescript
interface AuthCredentials {
  username: string;
  password: string;
}
```

### AuthUser

```typescript
interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  status: string;
  role: string;
}
```

### AuthSession

```typescript
interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number; // Unix timestamp in milliseconds
}
```

## Environment Variables

- `JWT_SECRET`: Secret key for signing JWT tokens (required in production)
- `NEON_DATABASE_URL`: Database connection string

## Security Features

### Password Hashing

All passwords are hashed using bcrypt with 10 rounds (2^10 iterations). This provides strong protection against brute-force attacks.

### Plain-text Password Migration

The service automatically detects plain-text passwords (those not starting with `$2a$`, `$2b$`, or `$2y$`) and migrates them to bcrypt hashes on successful authentication.

### Generic Error Messages

Authentication failures return a generic "Invalid credentials" message, preventing attackers from determining whether a username exists in the system.

### Token Expiration

JWT tokens expire after 7 days. The session includes an `expiresAt` timestamp for client-side validation.

### Logging

All authentication attempts are logged with:

- Username (but not password)
- Timestamp
- Success/failure status
- Password migration events

Example log output:

```
[Auth] Sign-in attempt for username: john_doe at 2024-01-15T10:30:00.000Z
[Auth] Migrating plain-text password to bcrypt hash for user: john_doe
[Auth] Password migration completed for user: john_doe
[Auth] Sign-in successful for username: john_doe
```

## Implementation Details

### Password Verification Flow

1. Query drivers table for matching username
2. Check if password is plain-text or bcrypt hash
3. For plain-text: Direct comparison, then migrate to bcrypt
4. For bcrypt: Use bcrypt.compare() for verification
5. Generate JWT token on success
6. Store session in localStorage

### Session Validation

1. Read session from localStorage
2. Validate JWT token signature and expiration
3. Check session expiration timestamp
4. Clear session if invalid or expired

### Token Structure

JWT tokens contain the following payload:

```json
{
  "id": "uuid",
  "username": "john_doe",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "active",
  "role": "driver",
  "iat": 1705315800,
  "exp": 1705920600
}
```

## Requirements Validation

This implementation satisfies the following requirements:

- **6.1**: Authenticate drivers using username and password from drivers table
- **6.2**: Hash passwords using bcrypt (10 rounds)
- **6.3**: Store authentication sessions in localStorage
- **6.4**: Validate user credentials against Neon DB
- **6.5**: Return complete user profile on successful authentication
- **6.6**: Return generic error messages on authentication failure
- **6.7**: Support sign-out functionality that clears session data
- **6.8**: Migrate plain-text passwords to hashed passwords on first login
- **10.5**: Log authentication attempts without logging passwords

## Testing

See `auth-service.example.ts` for usage examples.

To test the authentication service:

1. Ensure you have a driver record in the database
2. Run the example file with appropriate environment variables
3. Verify sign-in, session management, and sign-out functionality

## Error Handling

All authentication errors return a generic "Invalid credentials" message to prevent information leakage. Internal errors are logged for debugging but not exposed to the client.

```typescript
try {
  await authService.signIn({ username, password });
} catch (error) {
  // Always shows: "Invalid credentials"
  console.error(error.message);
}
```
