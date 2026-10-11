# Rang Healthcare — How News Flows Through the System

A complete picture of where stories come from, how they are fetched,
processed, stored, and displayed. All paths are relative to `rang-app/`.

```
RSS feeds & official newsrooms
  │  (~85+ curated sources: trade media, govt agencies, staffing industry, hospital systems)
  ▼
 Ingestion trigger (Every 2h: pg_cron/pg_net OR GitHub Actions → POST /functions/v1/ingest)
  ▼
 Ingest Edge Function ── 1. DISCOVER → 2. RETRIEVE → 3. ENRICH (Gemini AI: Flash Lite)
  ▼
 PostgreSQL (Supabase): sources / articles / article_summaries / ingestion_runs
  │   RLS: anonymous users may read ONLY status='published' rows
  ▼   view: published_articles (articles + summaries + is_major, newest first)
 React frontend (newsService.js → HomePage, Timeline, ArticleDetail, Search)
```

Your local `.env` points at a real Supabase project (`cssyesbiihsbzxgwajkp.supabase.co`).
The app reads **live** data from Supabase. In accordance with PRD §4.1, failures
display clear, actionable diagnostics rather than silently masking issues with mock data.

---

## 1. Where stories come from — the sources

There is no live scraping initiated by the browser. All stories originate from a
**curated list of RSS and official newsroom feeds** stored in the `sources` table:

- `supabase/migrations/002_seed_sources.sql` — initial US & Canadian feed list (~25 foundation sources: HHS, CMS, CDC, Health Canada, CIHI, CBC, Modern Healthcare, etc.)
- `supabase/migrations/005_expand_sources.sql` — major feed expansion adding ~60+ top-tier healthcare trade publications, clinical journals, workforce media, and regional systems (STAT News, Healthcare Finance News, MedPage Today, Medscape, Politico Health Care, Health Affairs, Fierce Healthcare, Becker's Hospital Review, etc.) with `UNIQUE(feed_url)` deduplication.
- `supabase/seed.sql` — seed feeds for local development and test environments.

Each source row tracks operational health:
`last_checked_at`, `last_success_at`, `last_error` (`001_create_schema.sql`).

---

## 2. How news is fetched — the ingestion pipeline

### 2.1 What wakes it up

The ingestion pipeline can be triggered in three ways:

1. **In-Database Scheduled Cron (`pg_cron` + `pg_net`):**
   Defined in `supabase/migrations/003_cron_schedule.sql`. Scheduled directly within PostgreSQL
   via `cron.schedule('rang-healthcare-ingest', '0 */2 * * *', ...)` to issue a `net.http_post`
   to the Edge Function every 2 hours, authenticated with `CRON_SECRET`.
2. **GitHub Actions Scheduler:**
   Workflow at `.github/workflows/ingest-cron.yml` executes on schedule `0 */2 * * *` (every 2 hours)
   using repository secrets (`SUPABASE_URL` and `CRON_SECRET`).
3. **Manual HTTP POST:**
   Direct invocation for testing or on-demand refreshes:
   ```bash
   curl -X POST "https://<project-ref>.supabase.co/functions/v1/ingest" \
     -H "Authorization: Bearer <CRON_SECRET>" \
     -H "Content-Type: application/json"
   ```

### 2.2 The `ingest` Edge Function (Deno, server-side)

Entry point: `supabase/functions/ingest/index.ts`. Every execution logs an
`ingestion_runs` record (`running` → `completed` / `partial` / `failed`) and proceeds through
three distinct pipeline steps:

#### Step 1 — DISCOVER (`discoverArticles`, index.ts:193)
- Reads active feeds from `sources` ordered by priority.
- Fetches feeds concurrently in chunks of 3 (`_shared/rss-parser.ts` — regex XML parser, 10s timeout, filtering out articles older than `MAX_ARTICLE_AGE_DAYS: 21`).
- Up to `MAX_ENTRIES_PER_SOURCE: 30` entries per feed are examined.
- Normalizes URLs (lowercased, query tracking parameters such as `utm_*`, `fbclid`, `gclid` stripped) and generates a **SHA-256 hash** (`_shared/url-utils.ts:hashUrl`).
- The hash is inserted into `articles.url_hash` with a `UNIQUE` index. Existing stories conflict (`23505`) and increment `duplicates_skipped` without re-processing.
- New stories are inserted with `status = 'discovered'` (up to `MAX_CANDIDATES_PER_RUN: 150`).

#### Step 2 — RETRIEVE (`retrieveArticles`, index.ts:299)
- Queries `discovered` articles and fetches the target HTML pages (`_shared/article-retriever.ts`):
  follows redirects, extracts Open Graph metadata, publication dates, and clean body text excerpts.
- **Paywall & Anti-Scraping Resilience:** If a target page blocks scraping or sits behind a paywall,
  the pipeline falls back to the RSS snippet/description and title rather than failing the candidate,
  allowing Gemini to enrich the story with explicit evidence limitation flags.
- Successful retrieval sets `status = 'retrieved'` and saves `retrieved_text`, `content_hash`, and `image_url`.
- Retries transient errors up to `MAX_RETRY_COUNT: 3` before marking as `status = 'failed'`.

#### Step 3 — ENRICH (`enrichArticles`, index.ts:376)
- Processes `retrieved` articles up to `MAX_AI_CALLS_PER_RUN: 40` per run.
- Sends article metadata and body/snippet text to **Google Gemini** (`_shared/ai-enrichment.ts`):
  - Model: `AI_CONFIG.MODEL_NAME = "gemini-flash-lite-latest"` (high throughput, zero-cost on Google AI Studio free tier).
  - Temperature: `0.3` (factual, grounded analysis).
  - JSON Schema output mode with automated exponential backoff on HTTP 429/503.
- **Strict Evidence Grounding & Schema:**
  - Separates reported facts from recruiter implications.
  - Classifies recruiter relevance into `confirmed | potential | unclear`.
  - Determines single primary category from the 11 system categories.
  - Identifies geographical scope (`country: US | CA | OTHER`, `regions`).
  - **Milestone Detection (`is_major`):** Flags landmark events (`true` for major federal policy/CMS rules, antitrust/FTC enforcement, nationwide strikes, multibillion-dollar mergers, or major health system closures; `false` for routine updates).
- Validates the structured output (`validateAndParseSummary`), sets article to `status = 'published'`,
  updates tags, category, region, and `is_major`, then writes the structured intelligence brief into
  `article_summaries`.

---

## 3. How news is recorded and stored — the database

Defined across `supabase/migrations/`:

| Migration | Purpose | Key Objects Added |
|---|---|---|
| `001_create_schema.sql` | Core schema, RLS, indexes | `sources`, `articles`, `article_summaries`, `ingestion_runs`, `published_articles` view |
| `002_seed_sources.sql` | Foundation RSS sources | ~25 foundational US & Canadian healthcare feeds |
| `003_cron_schedule.sql` | Scheduled execution | `pg_cron` & `pg_net` setup and 2-hour schedule |
| `004_timeline_support.sql` | Timeline & milestone tracking | `articles.is_major` column, chronological indexes (`idx_articles_timeline`, `idx_articles_major_timeline`), updated `published_articles` view |
| `005_expand_sources.sql` | High-coverage feed expansion | ~60+ trade publications, workforce journals, and health system feeds; unique constraint on `feed_url` |

### Database Tables & Views

1. **`sources`**: Curated feeds with `feed_url`, `source_type`, `country_scope`, `priority`, `check_interval_minutes`, and health tracking.
2. **`articles`**: Discovered and processed stories with `url_hash` deduplication, lifecycle status (`discovered` → `retrieved` → `processing` → `published`), geographic tags, `primary_category`, and `is_major` flag.
3. **`article_summaries`**: 1-to-1 AI intelligence briefs: `quick_summary`, `detailed_summary`, `why_it_matters`, `recruiter_impact`, `impact_status`, `evidence_notes`, `source_urls`, `model_name`.
4. **`ingestion_runs`**: Operational execution metrics: candidate counts, retrieval counts, AI call counters, error lists, run duration.
5. **`published_articles` (View)**: Pre-joined view of published articles and their AI summaries, sorted by `published_at DESC`, exposing all columns including `is_major`.

### Security & Row Level Security (RLS)
- Anonymous frontend clients can **only** read `articles` where `status = 'published'` and their corresponding `article_summaries`.
- Raw operational tables (`sources`, `ingestion_runs`) and internal error traces are blocked from anonymous public access.
- Edge Functions use Supabase's `service_role` key to write articles and manage ingestion logs safely.

### Health & Observability
- `GET /functions/v1/status` (`supabase/functions/status/index.ts`):
  Returns JSON health status (`healthy`, `degraded`, `failing`, `idle`), latest run stats, failing sources, and published counts per country.

---

## 4. How the frontend gets the news — service layer

- **`src/lib/supabase.js`**: Initializes the browser Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **`src/services/newsService.js`**: Central data gateway with strict error handling:
  - `getPublishedArticles()`: Queries `published_articles` ordered by `published_at DESC`. Returns `{ articles, isLive: true, error: null }`.
  - `getArticleById(id)`: Fetches a single story and its full AI brief by article ID.
  - `getTimelineArticles({ country, dateRange, category, search, majorOnly, page, pageSize })`:
    Server-side filtered, chronological query designed for the Timeline page. Supports date boundaries (`getDateRangeStart`), text search across titles and summaries, category filtering, milestone filtering (`is_major`), and pagination.
  - **Error Philosophy (PRD §4.1 & §12.1):** When Supabase is configured, network or schema errors return a descriptive, friendly diagnosis to the UI (e.g., missing migrations, RLS permission denied, network unreachable). It **never** silently masks failures by substituting fake mock data.
  - **Empty State Handling:** An empty table returns an empty list without error, allowing the UI to present an honest "No articles published yet" prompt.
- **`src/data/mockArticles.js`**: 12 curated historical reference stories with realistic summary structures, maintained for local testing and developer reference.
- **`src/data/categories.js`**: Central catalog of the 11 healthcare categories (with Lucide icons), supported countries (All, US, CA), recency options (`latest`, `24h`, `7d`), timeline range bounds (`week`, `month`, `3months`, `6months`, `year`, `3years`), and `IMPACT_STATUS` definitions.

---

## 5. How the news is displayed — pages and components

### Routing Structure (`src/App.jsx`)
- `/` → **`HomePage`**: Main newsroom layout.
- `/timeline` → **`Timeline`**: Interactive chronological healthcare policy & workforce milestone timeline.
- `/article/:id` → **`ArticleDetail`**: In-depth executive intelligence brief for a single story.
- `/about` → **`AboutPage`**: Mission, editorial guidelines, and methodology.
- `*` → Fallback to `HomePage`.

### Key Components

- **Masthead (`src/components/Masthead/`)**: Brand header, edition date, latest story quick-links, and the breaking news **Ticker** (live marquee displaying the newest published stories).
- **Navbar (`src/components/Navbar/`)**: Primary navigation (News, Timeline, About), country filter pills (All / US / Canada), quick search modal trigger (Ctrl+K), and reader theme switcher.
- **HomePage (`src/pages/HomePage/`)**:
  - Fetches published stories on mount via `getPublishedArticles()`.
  - Interactive client-side filtering: country, category, recency (`24h`, `7d`, `latest`).
  - Leading stories ranked display + responsive `ArticleCard` grid.
- **Timeline (`src/pages/Timeline/`)**:
  - Chronological timeline view with dynamic grouping (by Day, Month, or Year).
  - Server-side filtering by date range (`Past week`, `Past month`, `Past 3 months`, `Past 6 months`, `Past year`, `Past 3 years`).
  - "Major Milestones Only" toggle powered by `is_major`.
  - Real-time text search and category filtering with timeline cards showing impact badges and recruiter takeaways.
- **ArticleDetail (`src/pages/ArticleDetail/`)**:
  - Displays the complete structured brief: Executive Quick Summary, Detailed Context, Why It Matters, Healthcare Recruiter Impact, Evidence Notes, and original source citation.
  - All AI content is pre-generated during ingestion; no AI execution occurs in the browser.
- **SearchModal (`src/components/SearchModal/`)**: Instant modal search indexing titles, sources, summaries, and tags in memory.
- **Themes (`src/styles/theme.css`)**: Three curated reader themes toggleable via `data-theme` attribute: `press` (default editorial), `parchment` (warm editorial), and `modern` (clean slate).

---

## 6. End-to-end example

1. CMS or STAT News publishes a major ruling on hospital price transparency or nurse staffing ratios.
2. The scheduled cron trigger (`pg_cron` or GitHub Actions) invokes `POST /functions/v1/ingest`.
3. **Step 1 (Discover):** The RSS parser fetches the feed, canonicalizes and hashes the URL (`url_hash`). If new, it creates a row in `articles` with status `discovered`.
4. **Step 2 (Retrieve):** The page retriever downloads the article metadata and text. If paywalled, it retains the RSS description. Status changes to `retrieved`.
5. **Step 3 (Enrich):** Gemini Flash Lite processes the text, produces a structured brief, assigns categories, and evaluates whether the event qualifies as a milestone (`is_major = true`).
6. The article is updated to `status = 'published'`, and its brief is written to `article_summaries`.
7. Visitors on `rang-app`:
   - See the story appear immediately in the **Ticker** and **HomePage** grid.
   - If marked as a milestone, it is highlighted on the **/timeline** page under its chronological date group.
   - Clicking the story opens the full recruiter brief at **/article/:id**.

---

## 7. File Map (Who does what)

| Layer | Files |
|---|---|
| **Sources & Feeds** | `supabase/migrations/002_seed_sources.sql`, `supabase/migrations/005_expand_sources.sql`, `supabase/seed.sql` |
| **Scheduler & Triggers** | `supabase/migrations/003_cron_schedule.sql` (`pg_cron` / `pg_net`), `.github/workflows/ingest-cron.yml` |
| **Backend Ingestion** | `supabase/functions/ingest/index.ts`, `supabase/functions/_shared/` (`rss-parser.ts`, `article-retriever.ts`, `ai-enrichment.ts`, `url-utils.ts`, `constants.ts`, `supabase-client.ts`) |
| **Database & Schema** | `supabase/migrations/001_create_schema.sql`, `supabase/migrations/004_timeline_support.sql` (`is_major`, `published_articles` view, indexes) |
| **Observability** | `supabase/functions/status/index.ts`, `ingestion_runs` table |
| **Frontend Data Layer** | `src/lib/supabase.js`, `src/services/newsService.js`, `src/data/categories.js`, `src/data/mockArticles.js` |
| **Pages & Views** | `src/App.jsx`, `src/pages/HomePage/`, `src/pages/Timeline/`, `src/pages/ArticleDetail/`, `src/pages/About/` |
| **Components & UI** | `src/components/Masthead/`, `src/components/Navbar/`, `src/components/ArticleCard/`, `src/components/SearchModal/`, `src/components/Footer/` |
| **Styles & Theming** | `src/styles/theme.css`, `src/utils/theme.js` |
| **Configuration** | `rang-app/.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `CRON_SECRET`) |
