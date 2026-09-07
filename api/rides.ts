/**
 * Vercel Serverless Function for Rides API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
        const isFiltered = !!(client_id || driver_id);

        // Always request an exact count so the UI can display the true DB total.
        // For filtered queries the count reflects the filtered set (still accurate).
        let dbQuery = supabase.from('rides').select('*', { count: 'exact' });

        if (client_id) {
          dbQuery = dbQuery.eq('client_id', client_id as string);
        }

        if (driver_id) {
          dbQuery = dbQuery.eq('driver_id', driver_id as string);
        }

        const { data, error, count } = await dbQuery.order('created_at', {
          ascending: false,
        });

        if (error) {
          return res
            .status(500)
            .json({ error: 'Failed to fetch rides', message: error.message });
        }

        // Filtered callers receive the plain array they have always expected.
        // The unfiltered caller (useRides) receives an envelope with the exact
        // database total — this lets the UI show the real count even when the
        // PostgREST row cap (default 1 000) truncates the returned rows.
        if (isFiltered) {
          return res.status(200).json(data || []);
        }

        return res.status(200).json({
          rides: data || [],
          totalCount: count ?? data?.length ?? 0,
        });
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
          return res
            .status(500)
            .json({ error: 'Failed to create ride', message: error.message });
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
          return res
            .status(500)
            .json({ error: 'Failed to update ride', message: error.message });
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
          return res
            .status(500)
            .json({ error: 'Failed to delete ride', message: error.message });
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
