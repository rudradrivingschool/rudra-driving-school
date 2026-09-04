/**
 * Vercel Serverless Function for Authentication API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: 'Username and password are required' });
    }

    // Look up driver by username using maybeSingle() — returns null instead of throwing when no row found
    const { data: driver, error } = await supabase
      .from('drivers')
      .select('id, username, password, name, email, status, role')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Auth query error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }

    if (!driver) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simple password check (NOTE: In production, use bcrypt for hashed passwords!)
    if (driver.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Remove password from response
    const { password: _, ...safeDriver } = driver;

    return res.status(200).json({
      user: safeDriver,
      message: 'Authentication successful',
    });
  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
