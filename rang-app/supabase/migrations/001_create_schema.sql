-- ============================================================
-- Rang Healthcare — Database Schema Migration
-- Creates: sources, articles, article_summaries, ingestion_runs
-- With RLS policies, indexes, and triggers
-- ============================================================

-- 1. Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- for fuzzy text search


-- ============================================================
-- 2. SOURCES — RSS feeds and newsrooms we monitor
-- ============================================================
create table public.sources (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  source_type   text not null check (source_type in ('rss', 'official_newsroom', 'search_feed', 'other')),
  country_scope text check (country_scope in ('US', 'CA', 'ALL', null)),
  feed_url      text not null,
  website_url   text,
  is_enabled    boolean not null default true,
  last_checked_at  timestamptz,
  last_success_at  timestamptz,
  last_error       text,        -- sanitized, no stack traces
  check_interval_minutes int not null default 60,
  priority      int not null default 5,  -- 1=highest, 10=lowest
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.sources is 'RSS feeds, official newsrooms, and search feeds monitored by the collector.';


-- ============================================================
-- 3. ARTICLES — discovered and enriched news stories
-- ============================================================
create table public.articles (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  canonical_url    text not null,
  url_hash         text not null,                -- sha256 of normalized URL for dedup
  source_id        uuid references public.sources(id) on delete set null,
  source_name      text,
  published_at     timestamptz,                  -- nullable if unavailable
  discovered_at    timestamptz not null default now(),
  country          text not null default 'US' check (country in ('US', 'CA', 'OTHER')),
  regions          text[] default '{}',
  location_text    text,
  primary_category text not null default 'other',
  tags             text[] default '{}',
  image_url        text,
  source_description text,                       -- short OG / meta description
  retrieved_text   text,                         -- limited excerpt, per source terms
  story_cluster_id uuid,
  status           text not null default 'discovered'
                   check (status in ('discovered', 'retrieved', 'processing', 'published', 'rejected', 'failed')),
  retry_count      int not null default 0,
  last_error       text,
  content_hash     text,                         -- fingerprint of retrieved text for re-processing check
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint articles_url_hash_unique unique (url_hash)
);

comment on table public.articles is 'Healthcare news articles discovered by the ingestion pipeline.';

-- Indexes for common frontend queries
create index idx_articles_status         on public.articles (status);
create index idx_articles_country        on public.articles (country);
create index idx_articles_category       on public.articles (primary_category);
create index idx_articles_published_at   on public.articles (published_at desc nulls last);
create index idx_articles_discovered_at  on public.articles (discovered_at desc);
create index idx_articles_source_id      on public.articles (source_id);
create index idx_articles_cluster        on public.articles (story_cluster_id) where story_cluster_id is not null;

-- GIN index for full-text search on title + tags
create index idx_articles_title_trgm on public.articles using gin (title gin_trgm_ops);
create index idx_articles_tags       on public.articles using gin (tags);


-- ============================================================
-- 4. ARTICLE_SUMMARIES — AI-generated intelligence briefs
-- ============================================================
create table public.article_summaries (
  id               uuid primary key default uuid_generate_v4(),
  article_id       uuid not null references public.articles(id) on delete cascade,
  quick_summary    text,
  detailed_summary text,
  why_it_matters   text,
  recruiter_impact text,
  impact_status    text not null default 'unclear'
                   check (impact_status in ('confirmed', 'potential', 'unclear')),
  evidence_notes   text,
  source_urls      text[] default '{}',
  model_name       text,
  generated_at     timestamptz not null default now(),
  schema_version   int not null default 1,
  review_status    text default 'auto_approved'
                   check (review_status in ('auto_approved', 'pending_review', 'approved', 'rejected')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint article_summaries_article_unique unique (article_id)
);

comment on table public.article_summaries is 'AI-generated recruiter intelligence briefs for each article.';


-- ============================================================
-- 5. INGESTION_RUNS — operational visibility
-- ============================================================
create table public.ingestion_runs (
  id                     uuid primary key default uuid_generate_v4(),
  started_at             timestamptz not null default now(),
  finished_at            timestamptz,
  run_status             text not null default 'running'
                         check (run_status in ('running', 'completed', 'failed', 'partial')),
  sources_checked        int not null default 0,
  candidates_found       int not null default 0,
  new_articles           int not null default 0,
  duplicates_skipped     int not null default 0,
  articles_retrieved     int not null default 0,
  summaries_completed    int not null default 0,
  failures_count         int not null default 0,
  ai_calls_made          int not null default 0,
  sanitized_error_summary text,
  run_duration_ms        int,
  created_at             timestamptz not null default now()
);

comment on table public.ingestion_runs is 'Tracks each scheduled collection run for operational visibility.';


-- ============================================================
-- 6. AUTO-UPDATE TRIGGER for updated_at columns
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sources_updated_at
  before update on public.sources
  for each row execute function public.handle_updated_at();

create trigger articles_updated_at
  before update on public.articles
  for each row execute function public.handle_updated_at();

create trigger article_summaries_updated_at
  before update on public.article_summaries
  for each row execute function public.handle_updated_at();


-- ============================================================
-- 7. VIEW: published articles with summaries (frontend read)
-- ============================================================
create or replace view public.published_articles as
select
  a.id,
  a.title,
  a.canonical_url,
  a.source_name,
  a.published_at,
  a.discovered_at,
  a.country,
  a.regions,
  a.location_text,
  a.primary_category,
  a.tags,
  a.image_url,
  a.source_description,
  a.story_cluster_id,
  a.status,
  s.quick_summary,
  s.detailed_summary,
  s.why_it_matters,
  s.recruiter_impact,
  s.impact_status,
  s.evidence_notes,
  s.source_urls,
  s.model_name,
  s.generated_at,
  s.schema_version
from public.articles a
left join public.article_summaries s on s.article_id = a.id
where a.status = 'published'
order by a.published_at desc nulls last;


-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_summaries enable row level security;
alter table public.ingestion_runs enable row level security;

-- Public read access: only published articles and their summaries
create policy "Public can read published articles"
  on public.articles for select
  using (status = 'published');

create policy "Public can read summaries of published articles"
  on public.article_summaries for select
  using (
    exists (
      select 1 from public.articles
      where articles.id = article_summaries.article_id
        and articles.status = 'published'
    )
  );

-- Sources: no public access (admin/service-role only)
-- No SELECT policy = blocked for anon/authenticated

-- Ingestion runs: no public access
-- No SELECT policy = blocked for anon/authenticated

-- Service role bypasses RLS, so edge functions can read/write everything


-- ============================================================
-- 9. HELPER FUNCTIONS
-- ============================================================

-- Normalize a URL for deduplication: lowercase, strip tracking params, trailing slashes
create or replace function public.normalize_url(raw_url text)
returns text
language plpgsql
immutable
as $$
declare
  result text;
begin
  result := lower(trim(raw_url));
  -- Remove common tracking parameters
  result := regexp_replace(result, '\?(utm_[^&]*&?)*$', '', 'g');
  result := regexp_replace(result, '&(utm_[^&]*)', '', 'g');
  result := regexp_replace(result, '\?$', '');
  -- Remove trailing slash
  result := regexp_replace(result, '/$', '');
  return result;
end;
$$;

-- Generate SHA-256 hash of normalized URL
create or replace function public.url_hash(raw_url text)
returns text
language sql
immutable
as $$
  select encode(sha256(convert_to(public.normalize_url(raw_url), 'UTF8')), 'hex');
$$;
