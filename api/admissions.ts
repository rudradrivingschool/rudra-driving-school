/**
 * Vercel Serverless Function for Admissions API
 * Handles CRUD operations for admissions table
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
        const { id } = query;

        let dbQuery = supabase
          .from('admissions')
          .select('*');

        if (id) {
          dbQuery = dbQuery.eq('id', id as string);
        }

        const { data, error } = await dbQuery
          .order('created_at', { ascending: false });

        if (error) {
          return res.status(500).json({ error: 'Failed to fetch admissions', message: error.message });
        }

        return res.status(200).json(data || []);
      }

      case 'POST': {
        const { data, error } = await supabase
          .from('admissions')
          .insert({
            student_name: body.student_name,
            contact: body.contact,
            email: body.email,
            sex: body.sex,
            license_type: body.license_type,
            license_number: body.license_number,
            fees: body.fees,
            advance_amount: body.advance_amount,
            duration: body.duration,
            learning_license: body.learning_license,
            driving_license: body.driving_license,
            total_rides: body.total_rides,
            rides_completed: body.rides_completed ?? 0,
            status: body.status,
            start_date: body.start_date,
            admission_date: body.admission_date,
            additional_notes: body.additional_notes,
          })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: 'Failed to create admission', message: error.message });
        }

        return res.status(201).json(data);
      }

      case 'PUT': {
        const { id } = query;
        const { data, error } = await supabase
          .from('admissions')
          .update({
            student_name: body.student_name,
            contact: body.contact,
            email: body.email,
            sex: body.sex,
            license_type: body.license_type,
            license_number: body.license_number,
            fees: body.fees,
            advance_amount: body.advance_amount,
            duration: body.duration,
            learning_license: body.learning_license,
            driving_license: body.driving_license,
            total_rides: body.total_rides,
            rides_completed: body.rides_completed,
            status: body.status,
            start_date: body.start_date,
            admission_date: body.admission_date,
            additional_notes: body.additional_notes,
          })
          .eq('id', id as string)
          .select()
          .single();

        if (error) {
          // PostgREST returns PGRST116 when no row matched .single()
          if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Admission not found' });
          }
          return res.status(500).json({ error: 'Failed to update admission', message: error.message });
        }

        return res.status(200).json(data);
      }

      case 'DELETE': {
        const { id } = query;
        const { data, error } = await supabase
          .from('admissions')
          .delete()
          .eq('id', id as string)
          .select('id');

        if (error) {
          return res.status(500).json({ error: 'Failed to delete admission', message: error.message });
        }

        if (!data || data.length === 0) {
          return res.status(404).json({ error: 'Admission not found' });
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
