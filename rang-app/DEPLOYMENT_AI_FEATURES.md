# Rang Healthcare — AI Article Summaries & US Healthcare Monthly Intelligence

This document details the architecture, database migrations, Edge Functions, secrets configuration, and scheduling workflows for the two new intelligence features:

1. **AI Article Summaries Page** (replaces Timeline at `/timeline` and `/summaries`)
2. **US Healthcare Monthly News Intelligence & Historical Archive** (`/healthcare-news` and `/monthly-reports`)

---

## 1. Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │             React Frontend                   │
                      │  - /timeline (AI Article Summaries)          │
                      │  - /healthcare-news (Monthly Intelligence)   │
                      └──────────────┬───────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│ Supabase Edge Function:         │         │ Supabase Edge Function:         │
│ `summarize-articles`            │         │ `generate-monthly-report`       │
│ - Content-hash invalidation     │         │ - 7 healthcare categories       │
│ - Google Gemini API integration │         │ - Dedicated Staffing Impact     │
│ - Zero redundant API calls      │         │ - Clickable citations           │
└────────────────┬────────────────┘         └────────────────┬────────────────┘
                 ▼                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PostgreSQL Database (Supabase)                    │
│ - `article_ai_summaries`: cached Gemini summaries & bullet takeaways        │
│ - `healthcare_monthly_reports`: canonical monthly reports archive           │
│ - `healthcare_news_items`: external curated developments                    │
│ - `healthcare_research_runs`: operational execution tracking                │
│ - View `published_articles`: unified read view with AI summary columns      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Migrations

Both migrations are version-controlled and applied directly to the database:

- `supabase/migrations/006_ai_summaries_and_monthly_reports.sql`
  - Creates `public.article_ai_summaries` with unique constraint on `article_id`
  - Creates `public.healthcare_news_items` with unique constraint on `(reporting_period, url_hash)`
  - Creates `public.healthcare_monthly_reports` with unique constraint on `reporting_period`
  - Creates `public.healthcare_research_runs`
  - Updates `published_articles` view to include `ai_summary_text`, `ai_key_takeaways`, `ai_generated_at`
  - Configures Row Level Security (RLS) policies allowing public read on published summaries and reports, while restricting writes to service role / Edge Functions
  - Automatically backfills existing published articles

- `supabase/migrations/007_seed_monthly_reports.sql`
  - Seeds verified, authoritative historical monthly reports for October 2026 and September 2026
  - Populates Executive Summary, Major Developments, Healthcare Staffing Impact, State & Regional Developments, Industry Trends, and What to Watch Next Month

To re-apply migrations or deploy to a new Supabase project:
```bash
npx supabase db query --linked -f supabase/migrations/006_ai_summaries_and_monthly_reports.sql
npx supabase db query --linked -f supabase/migrations/007_seed_monthly_reports.sql
```

---

## 3. Supabase Edge Functions

### 3.1 `summarize-articles`
- **Location:** `supabase/functions/summarize-articles/index.ts`
- **Role:** Generates or retrieves cached Gemini AI article summaries.
- **Cache Strategy:** Computes SHA-256 hash of article title and retrieved text. Reuses saved summaries when the content hash matches. Never calls Gemini unnecessarily.
- **Deploy Command:**
  ```bash
  npx supabase functions deploy summarize-articles --no-verify-jwt
  ```

### 3.2 `generate-monthly-report`
- **Location:** `supabase/functions/generate-monthly-report/index.ts`
- **Role:** Researches and synthesizes the authoritative monthly US Healthcare report across 7 categories.
- **Deploy Command:**
  ```bash
  npx supabase functions deploy generate-monthly-report --no-verify-jwt
  ```

---

## 4. Secrets Configuration

Store your secrets in Supabase Edge Functions (never expose in client code):
```bash
npx supabase secrets set GEMINI_API_KEY="your-google-ai-studio-gemini-key"
```

The functions automatically use:
- `GEMINI_API_KEY`: For Google Gemini 2.0 Flash / Flash Lite model synthesis.
- `SUPABASE_URL`: Pre-configured environment variable.
- `SUPABASE_SERVICE_ROLE_KEY`: Pre-configured environment variable for secure database writes.

---

## 5. Monthly Automation via `pg_cron`

To compile the previous month's US Healthcare News Report on the 1st of each month at 03:00 UTC, run this in the Supabase SQL Editor:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'monthly-healthcare-report-synthesis',
  '0 3 1 * *', -- At 03:00 UTC on day 1 of every month
  $$
  select net.http_post(
    url := 'https://cssyesbiihsbzxgwajkp.supabase.co/functions/v1/generate-monthly-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'triggered_by', 'pg_cron',
      'force', false
    )
  ) as request_id;
  $$
);
```

---

## 6. Manual Testing & Invocations

### On-Demand Article Summarization:
```bash
curl -X POST "https://cssyesbiihsbzxgwajkp.supabase.co/functions/v1/summarize-articles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VITE_SUPABASE_ANON_KEY>" \
  -d '{"limit": 5, "force": false}'
```

### On-Demand Monthly Report Generation:
```bash
curl -X POST "https://cssyesbiihsbzxgwajkp.supabase.co/functions/v1/generate-monthly-report" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VITE_SUPABASE_ANON_KEY>" \
  -d '{"reporting_period": "2026-10", "force": true}'
```
