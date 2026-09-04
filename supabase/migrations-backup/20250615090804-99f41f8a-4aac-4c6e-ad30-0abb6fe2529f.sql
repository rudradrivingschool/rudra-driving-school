
-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule: Every 1st of the month at 08:00 UTC, send completed/terminated backup
SELECT
  cron.schedule(
    'send-completed-terminated-admissions-backup-monthly',
    '0 8 1 * *', -- 08:00 UTC on the 1st of every month
    $$
    SELECT net.http_post(
      url := 'https://ujvyrxdrcadiduollegh.supabase.co/functions/v1/send-rides-backup',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"email": "YOUR_COMPLETED_TERMINATED_BACKUP_EMAIL", "statusType": "completed"}'
    );
    $$
  );

-- Schedule: Every Sunday at 08:00 UTC, send active clients backup
SELECT
  cron.schedule(
    'send-active-admissions-backup-weekly',
    '0 8 * * 0', -- 08:00 UTC every Sunday
    $$
    SELECT net.http_post(
      url := 'https://ujvyrxdrcadiduollegh.supabase.co/functions/v1/send-rides-backup',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"email": "YOUR_ACTIVE_CLIENTS_BACKUP_EMAIL", "statusType": "active"}'
    );
    $$
  );

-- NOTE:
-- Replace YOUR_COMPLETED_TERMINATED_BACKUP_EMAIL with the actual recipient for completed/terminated clients.
-- Replace YOUR_ACTIVE_CLIENTS_BACKUP_EMAIL with the actual recipient for active clients.
