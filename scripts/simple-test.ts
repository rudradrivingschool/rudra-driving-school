import 'dotenv/config';

console.log('Environment variables loaded:');
console.log(
  'NEON_DATABASE_URL:',
  process.env.NEON_DATABASE_URL ? 'SET' : 'NOT SET',
);
console.log('DATABASE_PROVIDER:', process.env.DATABASE_PROVIDER);
console.log('DATABASE_POOL_MIN:', process.env.DATABASE_POOL_MIN);
console.log('DATABASE_POOL_MAX:', process.env.DATABASE_POOL_MAX);

console.log('\nTest complete');
process.exit(0);
