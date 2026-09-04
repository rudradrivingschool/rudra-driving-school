/**
 * Reset Neon DB schema - drops all tables and recreates them
 * Use with caution - this will delete all data!
 */

import 'dotenv/config';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { NeonClient } from '../src/lib/db/neon-client';
import { loadDatabaseConfig } from '../src/lib/db/config';

async function resetSchema() {
  console.log('Neon DB Schema Reset Tool');
  console.log('='.repeat(60));
  console.log('⚠️  WARNING: This will DROP all tables and data!');
  console.log('='.repeat(60));
  console.log();

  try {
    // Load Neon DB configuration
    const config = loadDatabaseConfig();
    const neonClient = new NeonClient(config);

    // Test connection
    const isHealthy = await neonClient.healthCheck();
    if (!isHealthy) {
      throw new Error('Neon DB connection health check failed');
    }
    console.log('✓ Neon DB connection healthy\n');

    // Step 1: Drop all tables
    console.log('Step 1: Dropping existing tables...');

    await neonClient.query('DROP TABLE IF EXISTS public.rides CASCADE');
    console.log('  ✓ DROP TABLE IF EXISTS public.rides CASCADE');

    await neonClient.query('DROP TABLE IF EXISTS public.payments CASCADE');
    console.log('  ✓ DROP TABLE IF EXISTS public.payments CASCADE');

    await neonClient.query('DROP TABLE IF EXISTS public.expenses CASCADE');
    console.log('  ✓ DROP TABLE IF EXISTS public.expenses CASCADE');

    await neonClient.query('DROP TABLE IF EXISTS public.admissions CASCADE');
    console.log('  ✓ DROP TABLE IF EXISTS public.admissions CASCADE');

    await neonClient.query('DROP TABLE IF EXISTS public.drivers CASCADE');
    console.log('  ✓ DROP TABLE IF EXISTS public.drivers CASCADE');

    await neonClient.query(
      'DROP TABLE IF EXISTS public.schema_migrations CASCADE',
    );
    console.log('  ✓ DROP TABLE IF EXISTS public.schema_migrations CASCADE');

    // Step 2: Drop functions
    console.log('\nStep 2: Dropping functions...');
    await neonClient.query(
      'DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE',
    );
    console.log('  ✓ Dropped update_updated_at_column function');

    // Step 3: Create tables one by one
    console.log('\nStep 3: Creating new schema...\n');

    // Create drivers table
    await neonClient.query(`
      CREATE TABLE public.drivers (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        license_number TEXT,
        join_date DATE DEFAULT CURRENT_DATE,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        role TEXT DEFAULT 'driver',
        total_rides INTEGER DEFAULT 0
      );
    `);
    console.log('  ✓ Created table: drivers');

    // Create admissions table
    await neonClient.query(`
      CREATE TABLE public.admissions (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        student_name TEXT NOT NULL,
        admission_date DATE DEFAULT CURRENT_DATE,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        contact TEXT,
        email TEXT,
        sex TEXT,
        license_type TEXT,
        license_number TEXT,
        fees NUMERIC,
        advance_amount NUMERIC,
        duration TEXT,
        learning_license TEXT,
        driving_license TEXT,
        start_date DATE,
        additional_notes TEXT,
        rides_completed INTEGER DEFAULT 0,
        total_rides INTEGER NOT NULL DEFAULT 0
      );
    `);
    console.log('  ✓ Created table: admissions');

    // Create expenses table
    await neonClient.query(`
      CREATE TABLE public.expenses (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
        purpose TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    console.log('  ✓ Created table: expenses');

    // Create payments table
    await neonClient.query(`
      CREATE TABLE public.payments (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
        amount NUMERIC NOT NULL,
        payment_type TEXT NOT NULL CHECK (payment_type IN ('advance', 'installment_1', 'installment_2', 'installment_3', 'other')),
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
    `);
    console.log('  ✓ Created table: payments');

    // Create rides table
    await neonClient.query(`
      CREATE TABLE public.rides (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
        client_name TEXT NOT NULL,
        date DATE NOT NULL,
        time TEXT,
        status TEXT DEFAULT 'completed' CHECK (status = 'completed'),
        car TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        client_id UUID REFERENCES public.admissions(id)
      );
    `);
    console.log('  ✓ Created table: rides');

    // Step 4: Create indexes
    console.log('\nStep 4: Creating indexes...\n');

    await neonClient.query(
      'CREATE INDEX idx_drivers_username ON public.drivers(username)',
    );
    await neonClient.query(
      'CREATE INDEX idx_drivers_status ON public.drivers(status)',
    );
    await neonClient.query(
      'CREATE INDEX idx_drivers_email ON public.drivers(email)',
    );
    console.log('  ✓ Created indexes for drivers');

    await neonClient.query(
      'CREATE INDEX idx_admissions_status ON public.admissions(status)',
    );
    await neonClient.query(
      'CREATE INDEX idx_admissions_student_name ON public.admissions(student_name)',
    );
    console.log('  ✓ Created indexes for admissions');

    await neonClient.query(
      'CREATE INDEX idx_rides_client_id ON public.rides(client_id)',
    );
    await neonClient.query(
      'CREATE INDEX idx_rides_driver_id ON public.rides(driver_id)',
    );
    await neonClient.query('CREATE INDEX idx_rides_date ON public.rides(date)');
    await neonClient.query(
      'CREATE INDEX idx_rides_status ON public.rides(status)',
    );
    console.log('  ✓ Created indexes for rides');

    await neonClient.query(
      'CREATE INDEX idx_payments_admission_id ON public.payments(admission_id)',
    );
    await neonClient.query(
      'CREATE INDEX idx_payments_payment_date ON public.payments(payment_date)',
    );
    console.log('  ✓ Created indexes for payments');

    await neonClient.query(
      'CREATE INDEX idx_expenses_driver_id ON public.expenses(driver_id)',
    );
    await neonClient.query(
      'CREATE INDEX idx_expenses_date ON public.expenses(date)',
    );
    console.log('  ✓ Created indexes for expenses');

    // Step 5: Create functions and triggers
    console.log('\nStep 5: Creating functions and triggers...\n');

    await neonClient.query(`
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('  ✓ Created function: update_updated_at_column');

    await neonClient.query(`
      CREATE TRIGGER update_drivers_updated_at
        BEFORE UPDATE ON public.drivers
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    `);
    console.log('  ✓ Created trigger: update_drivers_updated_at');

    await neonClient.query(`
      CREATE TRIGGER update_payments_updated_at
        BEFORE UPDATE ON public.payments
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    `);
    console.log('  ✓ Created trigger: update_payments_updated_at');

    // Step 6: Verify tables
    console.log('\nStep 6: Verifying tables...\n');

    const result = await neonClient.query<{ table_name: string }>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`✓ Found ${result.length} table(s):`);
    result.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    await neonClient.close();

    console.log('\n✅ Schema reset completed successfully!');
    console.log('You can now run the CSV import script to load data.');
  } catch (error) {
    console.error('\n❌ Schema reset failed:', error);
    process.exit(1);
  }
}

resetSchema();
