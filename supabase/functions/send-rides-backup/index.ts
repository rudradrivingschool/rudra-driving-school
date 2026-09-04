
// SUPABASE EDGE FUNCTION TO SEND ADMISSIONS BACKUP WITH RIDE DATES

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Utility to convert JSON to CSV string
function jsonToCsv(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map(row => headers.map(h => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")),
  ];
  return csvRows.join("\r\n");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, statusType } = await req.json().catch(() => ({ email: null, statusType: undefined }));
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase secrets missing");
    }
    if (!email) {
      return new Response("Missing email in request.", { status: 400, headers: corsHeaders });
    }

    const { createClient } = await import("npm:@supabase/supabase-js@2.50.0");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch admissions
    let query = supabase
      .from("admissions")
      .select("id, student_name, admission_date, status, contact, license_type, fees, advance_amount, duration, rides_completed, total_rides");

    // Apply statusType filter if set
    if (statusType === "active") {
      query = query.in("status", ["active", "Active", "ACTIVE"]);
    } else if (statusType === "completed") {
      query = query.in("status", ["completed", "terminated", "Completed", "Terminated", "COMPLETED", "TERMINATED"]);
    }

    const { data: admissions, error } = await query;
    if (error) throw error;
    if (!admissions || admissions.length === 0) throw new Error("No admissions data to back up.");

    // 2. Fetch rides
    const { data: rides, error: ridesErr } = await supabase
      .from("rides")
      .select("client_id, date");
    if (ridesErr) throw ridesErr;

    // 3. Map rides by admission/client_id
    const ridesMap: Record<string, string[]> = {};
    for (const ride of rides ?? []) {
      if (ride.client_id && ride.date) {
        if (!ridesMap[ride.client_id]) ridesMap[ride.client_id] = [];
        ridesMap[ride.client_id].push(ride.date);
      }
    }

    // 4. Compose rows for CSV (no duration field)
    const rows = admissions.map((adm: any) => ({
      student_name: adm.student_name,
      admission_date: adm.admission_date,
      status: adm.status,
      contact: adm.contact,
      license_type: adm.license_type,
      fees: adm.fees,
      advance_amount: adm.advance_amount,
      rides_completed: adm.rides_completed,
      total_rides: adm.total_rides,
      ride_dates: (ridesMap[adm.id] || []).sort().join(", "),
    }));

    // 5. Create CSV
    const csvStr = jsonToCsv(rows);

    // 6. Send email with attachment
    const attachment = {
      filename: "admissions_backup.csv",
      content: Buffer.from(csvStr).toString("base64"),
      type: "text/csv",
      disposition: "attachment",
    };

    const emailRes = await resend.emails.send({
      from: "Lovable Backup <onboarding@resend.dev>",
      to: [email],
      subject: statusType === "active"
        ? "Active Clients Admissions Backup"
        : statusType === "completed"
          ? "Completed/Terminated Clients Admissions Backup"
          : "Daily Admissions Data Backup",
      html: `<p>Your admissions backup${statusType ? ` (${statusType})` : ""} is attached.</p>`,
      attachments: [attachment],
    });

    return new Response(JSON.stringify({ message: "Admissions backup email sent", emailRes }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

