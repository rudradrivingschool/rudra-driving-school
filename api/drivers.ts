/**
 * Vercel Serverless Function for Drivers API
 * Handles CRUD operations for drivers table
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, query, body } = req;

    switch (method) {
      case 'GET': {
        // Fetch all drivers with aggregated ride count in a single query
        const { data, error } = await supabase
          .from('drivers')
          .select('*, rides(count)')
          .order('created_at', { ascending: false });

        if (error) {
          return res.status(500).json({ error: 'Failed to fetch drivers', message: error.message });
        }

        // Map ride count from embedded relationship; remove nested rides array
        // Supabase response typed as any — PostgREST does not infer from service-role queries
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const drivers = (data || []).map((d: any) => {
          const total_rides = d.rides?.[0]?.count ?? 0;
          const { rides, ...driver } = d;
          return { ...driver, total_rides };
        });

        return res.status(200).json(drivers);
      }

      case 'POST': {
        // Create new driver with explicit column mapping
        const { data, error } = await supabase
          .from('drivers')
          .insert({
            name: body.name,
            email: body.email,
            phone: body.phone,
            license_number: body.license_number,
            join_date: body.join_date,
            status: body.status || 'active',
            username: body.username,
            password: body.password,
            role: body.role || 'driver',
          })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: 'Failed to create driver', message: error.message });
        }

        return res.status(201).json(data);
      }

      case 'PUT': {
        // Update driver with explicit column mapping
        const { id } = query;
        const { data, error } = await supabase
          .from('drivers')
          .update({
            name: body.name,
            email: body.email,
            phone: body.phone,
            license_number: body.license_number,
            join_date: body.join_date,
            status: body.status,
            username: body.username,
            password: body.password,
            role: body.role,
          })
          .eq('id', id as string)
          .select()
          .single();

        if (error) {
          // PostgREST returns PGRST116 when no row matched .single()
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Driver not found' });
          }
          return res.status(500).json({ error: 'Failed to update driver', message: error.message });
        }

        return res.status(200).json(data);
      }

      case 'DELETE': {
        // Delete driver — check existence to preserve 404 behavior
        const { id } = query;
        const { data, error } = await supabase
          .from('drivers')
          .delete()
          .eq('id', id as string)
          .select('id');

        if (error) {
          return res.status(500).json({ error: 'Failed to delete driver', message: error.message });
        }

        if (!data || data.length === 0) {
          return res.status(404).json({ error: 'Driver not found' });
        }

        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
