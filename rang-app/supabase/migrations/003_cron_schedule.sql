-- ============================================================
-- Rang Healthcare — Migration 003: Scheduled Ingestion via pg_cron & pg_net
-- (Optional / Supabase Cloud Pro or Self-Hosted with pg_cron enabled)
-- ============================================================
-- PRD §12.4: Recommended initial collection cadence
-- Run every 2 hours to remain comfortably within free tier allowances.
-- ============================================================

-- 1. Enable required extensions for scheduled HTTP invocations
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Create helper wrapper to invoke the edge function securely
create or replace function public.trigger_ingestion_edge_function()
returns void
language plpgsql
security definer
as $$
declare
  project_url text;
  service_role_key text;
  cron_secret text;
begin
  -- Retrieve configuration from custom app settings or vault if available
  -- In Supabase, you can set these using:
  -- ALTER DATABASE postgres SET "app.settings.project_url" = 'https://<project-ref>.supabase.co';
  -- ALTER DATABASE postgres SET "app.settings.service_role_key" = '<your-service-role-key>';
  project_url := current_setting('app.settings.project_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  cron_secret := current_setting('app.settings.cron_secret', true);

  if project_url is not null and service_role_key is not null then
    perform net.http_post(
      url := project_url || '/functions/v1/ingest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(cron_secret, service_role_key)
      ),
      body := jsonb_build_object('triggered_by', 'pg_cron', 'scheduled_at', now())
    );
  end if;
end;
$$;

comment on function public.trigger_ingestion_edge_function is
  'Invokes the Supabase ingest Edge Function via pg_net HTTP POST.';

-- 3. Schedule the ingestion job to run every 2 hours (PRD §12.4)
-- Minute 0 of every 2nd hour: 0 */2 * * *
-- NOTE: Uncomment the line below after configuring app.settings or if using pg_cron in Supabase Dashboard.
-- select cron.schedule('rang-ingest-every-2h', '0 */2 * * *', 'select public.trigger_ingestion_edge_function()');

-- To view active cron jobs:
-- select * from cron.job;

-- To unschedule:
-- select cron.unschedule('rang-ingest-every-2h');
