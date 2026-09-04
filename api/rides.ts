/**
 * Vercel Serverless Function for Rides API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        const { client_id, driver_id } = query;

        let dbQuery = supabase
          .from('rides')
          .select('*');

        if (client_id) {
          dbQuery = dbQuery.eq('client_id', client_id as string);
        }

        if (driver_id) {
          dbQuery = dbQuery.eq('driver_id', driver_id as string);
        }

        const { data, error } = await dbQuery
          .order('date', { ascending: false });

        if (error) {
          return res.status(500).json({ error: 'Failed to fetch rides', message: error.message });
        }

        return res.status(200).json(data || []);
      }

      case 'POST': {
        // Insert using actual rides schema columns only
        const { data, error } = await supabase
          .from('rides')
          .insert({
            client_id: body.client_id,
            client_name: body.client_name,
            driver_id: body.driver_id,
            car: body.car,
            date: body.date,
            time: body.time,
            status: body.status || 'completed',
            notes: body.notes,
          })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: 'Failed to create ride', message: error.message });
        }

        return res.status(201).json(data);
      }

      case 'PUT': {
        // Update using actual rides schema columns only
        const { id } = query;
        const { data, error } = await supabase
          .from('rides')
          .update({
            client_id: body.client_id,
            client_name: body.client_name,
            driver_id: body.driver_id,
            car: body.car,
            date: body.date,
            time: body.time,
            status: body.status,
            notes: body.notes,
          })
          .eq('id', id as string)
          .select()
          .single();

        if (error) {
          // PostgREST returns PGRST116 when no row matched .single()
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Ride not found' });
          }
          return res.status(500).json({ error: 'Failed to update ride', message: error.message });
        }

        return res.status(200).json(data);
      }

      case 'DELETE': {
        const { id } = query;
        const { data, error } = await supabase
          .from('rides')
          .delete()
          .eq('id', id as string)
          .select('id');

        if (error) {
          return res.status(500).json({ error: 'Failed to delete ride', message: error.message });
        }

        if (!data || data.length === 0) {
          return res.status(404).json({ error: 'Ride not found' });
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
