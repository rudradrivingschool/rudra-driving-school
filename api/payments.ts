/**
 * Vercel Serverless Function for Payments API
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
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .order('payment_date', { ascending: false });

        if (error) {
          return res.status(500).json({ error: 'Failed to fetch payments', message: error.message });
        }

        return res.status(200).json(data || []);
      }

      case 'POST': {
        const { data, error } = await supabase
          .from('payments')
          .insert({
            admission_id: body.admission_id,
            amount: body.amount,
            payment_date: body.payment_date,
            payment_type: body.payment_type,
            notes: body.notes,
          })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: 'Failed to create payment', message: error.message });
        }

        return res.status(201).json(data);
      }

      case 'PUT': {
        const { id } = query;
        const { data, error } = await supabase
          .from('payments')
          .update({
            admission_id: body.admission_id,
            amount: body.amount,
            payment_date: body.payment_date,
            payment_type: body.payment_type,
            notes: body.notes,
          })
          .eq('id', id as string)
          .select()
          .single();

        if (error) {
          // PostgREST returns PGRST116 when no row matched .single()
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Payment not found' });
          }
          return res.status(500).json({ error: 'Failed to update payment', message: error.message });
        }

        return res.status(200).json(data);
      }

      case 'DELETE': {
        const { id } = query;
        const { data, error } = await supabase
          .from('payments')
          .delete()
          .eq('id', id as string)
          .select('id');

        if (error) {
          return res.status(500).json({ error: 'Failed to delete payment', message: error.message });
        }

        if (!data || data.length === 0) {
          return res.status(404).json({ error: 'Payment not found' });
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
