Listed directory supabase
Listed directory functions
Viewed README.md:1-150
Viewed 003_cron_schedule.sql:1-58
Viewed index.ts:1-75
Listed directory News%20healthcare
Viewed .env:1-28

To automate your healthcare news pipeline using the **Supabase `pg_cron` & `pg_net` extensions**, you need to schedule a job that triggers your **`ingest` Edge Function**.

---

### What the Cron Job Does
- **Discovers** fresh news articles from curated US & Canadian RSS feeds (HHS, CMS, CDC, Health Canada, CBC, etc.).
- **Deduplicates** against existing articles using SHA-256 URL hashes.
- **Enriches & Summarizes** new articles with Google Gemini 2.0 Flash (Quick Summary, Why It Matters, Recruiter Impact).
- **Publishes** them to the `articles` and `article_summaries` tables for the frontend.
- **Cadence:** **Every 2 hours** (`0 */2 * * *`) or **Every 3 hours** (`0 */3 * * *`), which keeps API usage well within the free tier.

---

### Option 1: Run directly in Supabase SQL Editor (Recommended)

Open the **SQL Editor** in your [Supabase Dashboard](https://supabase.com/dashboard/project/cssyesbiihsbzxgwajkp/sql) and run this query (pre-filled with your project URL and secret):

```sql
-- 1. Enable pg_cron and pg_net extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Schedule the ingestion job every 2 hours
select
  cron.schedule(
    'rang-healthcare-ingest',
    '0 */2 * * *', -- Runs at minute 0 past every 2nd hour (e.g. 12:00, 2:00, 4:00, ...)
    $$
    select
      net.http_post(
        url := 'https://cssyesbiihsbzxgwajkp.supabase.co/functions/v1/ingest',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer rang_super_secret_cron_token_2026'
        ),
        body := jsonb_build_object(
          'triggered_by', 'pg_cron',
          'scheduled_at', now()
        )
      ) as request_id;
    $$
  );
```

---

### Option 2: Setup via Supabase Dashboard UI (Integrations / Cron Jobs)

If you are using the visual **Cron** extension page in the Supabase Dashboard:

| Field | Value |
| :--- | :--- |
| **Name** | `rang-healthcare-ingest` |
| **Schedule (Cron expression)** | `0 */2 * * *` *(Every 2 hours)* |
| **HTTP Method** | `POST` |
| **URL** | `https://cssyesbiihsbzxgwajkp.supabase.co/functions/v1/ingest` |
| **HTTP Headers** | `Content-Type`: `application/json`<br>`Authorization`: `Bearer rang_super_secret_cron_token_2026` |
| **HTTP Body** | `{"triggered_by": "pg_cron"}` |

> **Note**: Make sure you have deployed your `ingest` edge function and set the secret in Supabase:
> ```bash
> supabase secrets set CRON_SECRET="rang_super_secret_cron_token_2026"
> ```

---

### Useful Monitoring & Management Queries

In the **SQL Editor**, you can run these queries anytime:

1. **Check scheduled jobs:**
   ```sql
   select jobid, jobname, schedule, active from cron.job;
   ```

2. **Check recent execution logs & statuses:**
   ```sql
   select jobid, runid, status, return_message, start_time, end_time 
   from cron.job_run_details 
   order by start_time desc 
   limit 10;
   ```

3. **Check pipeline run logs in your app's table:**
   ```sql
   select * from public.ingestion_runs order by started_at desc limit 5;
   ```

4. **Trigger a test run immediately (without waiting 2 hours):**
   ```sql
   select net.http_post(
     url := 'https://cssyesbiihsbzxgwajkp.supabase.co/functions/v1/ingest',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'Authorization', 'Bearer rang_super_secret_cron_token_2026'
     ),
     body := jsonb_build_object('triggered_by', 'manual_test')
   );
   ```

5. **To pause or delete the cron job later:**
   ```sql
   -- To remove the schedule:
   select cron.unschedule('rang-healthcare-ingest');
   ```

Viewed NEWS_PIPELINE.md:58-63