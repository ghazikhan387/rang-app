# Rang Healthcare — Supabase Backend Architecture

This directory contains the complete backend infrastructure for **Rang Healthcare**, implementing the requirements defined in the Product Requirements Document (PRD §12–§17).

The backend is built entirely on **Supabase** (PostgreSQL, Row Level Security, Edge Functions) and **Google Gemini 2.0 Flash** ($0 free tier) to operate with **$0 recurring operating cost**.

---

## Directory Structure

```
supabase/
├── config.toml                     # Supabase CLI project configuration
├── seed.sql                        # Comprehensive seed data for local dev & testing
├── README.md                       # This architecture & deployment documentation
├── migrations/
│   ├── 001_create_schema.sql       # PostgreSQL tables, RLS, indexes, triggers, & views
│   ├── 002_seed_sources.sql        # Initial curated US & CA healthcare RSS feeds
│   └── 003_cron_schedule.sql       # Optional pg_cron & pg_net scheduled trigger
└── functions/
    ├── _shared/                    # Shared Deno modules for Edge Functions
    │   ├── ai-enrichment.ts        # Gemini 2.0 Flash structured brief generation
    │   ├── article-retriever.ts    # Public page fetcher (OG tags, text, paywall detection)
    │   ├── constants.ts            # Rate limits, categories, and pipeline constraints
    │   ├── rss-parser.ts           # RSS/Atom XML parser with date & URL deduplication
    │   ├── supabase-client.ts      # Service-role & public Supabase client factories
    │   └── url-utils.ts            # URL canonicalization, tracking strip, SHA-256 hashing
    ├── ingest/
    │   └── index.ts                # Main 3-step automated ingestion pipeline function
    └── status/
        └── index.ts                # Operational health & pipeline metrics observability
```

---

## 1. Database Schema (`migrations/001_create_schema.sql`)

### Tables
1. **`sources`**: Curated RSS and newsroom feeds for US and Canadian healthcare (HHS, CMS, CDC, Health Canada, CIHI, CBC Health, Modern Healthcare, Google News search feeds).
2. **`articles`**: Discovered and processed news stories with deduplication hash (`url_hash` unique index), geographic tags, categories, and statuses (`discovered`, `retrieved`, `processing`, `published`, `rejected`, `failed`).
3. **`article_summaries`**: AI-generated structured intelligence briefs:
   - `quick_summary`: 2–3 sentence executive brief
   - `detailed_summary`: Full event breakdown and context
   - `why_it_matters`: Broader healthcare industry significance
   - `recruiter_impact`: Concrete implications for healthcare talent acquisition
   - `impact_status`: Strict qualification (`confirmed`, `potential`, `unclear`)
   - `evidence_notes`: Explicit grounded basis from retrieved source material
4. **`ingestion_runs`**: Operational run logs tracking candidates discovered, articles retrieved, AI calls executed, and error summaries.

### Row Level Security (RLS)
- Public anonymous users can **ONLY** read rows where `status = 'published'` in `articles` and corresponding `article_summaries`.
- Raw internal tables (`sources`, `ingestion_runs`) and internal processing errors are blocked from anonymous access.
- Supabase Edge Functions interact using the secure `service_role` key, bypassing RLS safely on the server side.

### Frontend View (`published_articles`)
Combines published articles with their verified summaries into a single optimized query view used directly by the React frontend.

---

## 2. Ingestion Pipeline (`functions/ingest/index.ts`)

The ingestion pipeline runs on an automated schedule (e.g. every 3 hours) or manual POST trigger. It strictly complies with PRD §17 Cost-Control & Quality requirements:

```
[1. RSS Discovery]
       │
       ▼
[2. Deduplication Check] ─── (Matches url_hash? Skip)
       │
       ▼
[3. Page Retrieval] ─────── (Never bypasses paywalls; respects robots rules)
       │
       ▼
[4. Gemini 2.0 Flash] ───── (Evidence-grounded prompt, strict JSON schema output)
       │
       ▼
[5. Validation & Publish] ── (Saves article & summary; logs metrics to ingestion_runs)
```

### Safety & Cost Controls
- **Max articles per run:** 15 candidates discovered, 10 articles retrieved, 5 AI summaries generated per run.
- **Rate limiting backoff:** 2,000ms delay between AI calls to stay well within Gemini free-tier limits (15 RPM / 1,500 RPD).
- **Paywall detection:** Identifies paywalled pages and skips detailed speculation, preventing hallucinations.
- **Error sanitization:** Strips internal server paths and database passwords before writing to logs.

---

## 3. Operational Visibility (`functions/status/index.ts`)

Maintainers can inspect the system health without paid monitoring tools via `GET /functions/v1/status`:
- Overall status: `healthy`, `degraded`, `failing`, `idle`
- Details of the latest ingestion run (duration, articles processed, errors)
- List of failing sources
- Total count of published articles (split by US and Canada)

---

## 4. Setup & Deployment Guide

### Prerequisites
1. [Supabase Account](https://supabase.com) (Free tier)
2. [Google AI Studio API Key](https://aistudio.google.com/app/apikey) (Free tier)
3. [Supabase CLI](https://supabase.com/docs/guides/cli) installed (optional for local testing)

### Step 1: Create Supabase Project
1. Create a new free project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Note your **Project URL** (`https://<project-ref>.supabase.co`), **Anon Key**, and **Service Role Key**.

### Step 2: Apply Database Migrations
In the Supabase Dashboard, open the **SQL Editor** and run the migration files in order:
1. `migrations/001_create_schema.sql` (Tables, RLS policies, Views, Triggers)
2. `migrations/002_seed_sources.sql` (Initial US & Canada RSS feeds)
3. `seed.sql` (Optional: Seeds 5 sample articles & summaries matching the demo)

*Alternatively via Supabase CLI:*
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### Step 3: Configure Edge Function Secrets
In the Supabase Dashboard under **Project Settings → Edge Functions → Secrets** (or via CLI):
```bash
supabase secrets set GEMINI_API_KEY="your-gemini-api-key"
supabase secrets set CRON_SECRET="your-chosen-secret-token"
```

### Step 4: Deploy Edge Functions
Deploy both functions using the Supabase CLI:
```bash
supabase functions deploy ingest --no-verify-jwt
supabase functions deploy status --no-verify-jwt
```

### Step 5: Configure Automated Scheduled Runs

You can use either:
- **GitHub Actions (Recommended, 100% Free):**
  Add `SUPABASE_URL` and `CRON_SECRET` to your GitHub Repository Secrets. The workflow at `.github/workflows/ingest-cron.yml` will automatically trigger the ingestion pipeline every 3 hours.
- **Supabase pg_cron (`migrations/003_cron_schedule.sql`):**
  If pg_cron is enabled in your project, schedule the HTTP invocation directly within Postgres.

### Step 6: Connect React Frontend
Create a `.env` file in `rang-app/`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
The React frontend will immediately detect the configuration and fetch live published stories from Supabase!
