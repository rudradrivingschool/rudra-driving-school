-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly email for active clients every Sunday at 9:00 AM
SELECT cron.schedule(
  'weekly-active-clients-backup',
  '0 9 * * 0', -- Every Sunday at 9:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://ujvyrxdrcadiduollegh.supabase.co/functions/v1/send-rides-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqdnlyeGRyY2FkaWR1b2xsZWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5Mjg0OTAsImV4cCI6MjA2NTUwNDQ5MH0.SY2Wh1_RUlsHAgUZFrnm_660dGGr_acV5hMhLnAHP6U"}'::jsonb,
        body:='{"email": "drivingschoolrudra@gmail.com", "statusType": "active"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule monthly email for completed/terminated clients on 1st of every month at 9:00 AM
SELECT cron.schedule(
  'monthly-completed-clients-backup',
  '0 9 1 * *', -- 1st day of every month at 9:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://ujvyrxdrcadiduollegh.supabase.co/functions/v1/send-rides-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqdnlyeGRyY2FkaWR1b2xsZWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5Mjg0OTAsImV4cCI6MjA2NTUwNDQ5MH0.SY2Wh1_RUlsHAgUZFrnm_660dGGr_acV5hMhLnAHP6U"}'::jsonb,
        body:='{"email": "drivingschoolrudra@gmail.com", "statusType": "completed"}'::jsonb
    ) as request_id;
  $$
);