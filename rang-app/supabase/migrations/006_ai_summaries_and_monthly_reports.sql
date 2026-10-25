-- ============================================================
-- Rang Healthcare — Migration 006: AI Article Summaries & Monthly Healthcare Reports
-- ============================================================

-- 1. ARTICLE_AI_SUMMARIES Table
-- Stores Gemini-generated reader summaries and key takeaways for website articles.
create table if not exists public.article_ai_summaries (
  id               uuid primary key default gen_random_uuid(),
  article_id       uuid not null references public.articles(id) on delete cascade,
  content_hash     text not null,
  summary_text     text not null,
  key_takeaways    jsonb not null default '[]'::jsonb,
  gemini_model     text not null default 'gemini-2.0-flash',
  generated_at     timestamptz not null default now(),
  schema_version   int not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint article_ai_summaries_article_unique unique (article_id)
);

comment on table public.article_ai_summaries is 'Gemini-generated concise article summaries and key takeaways for the AI Article Summaries page.';

create index if not exists idx_article_ai_summaries_article_id on public.article_ai_summaries (article_id);
create index if not exists idx_article_ai_summaries_generated_at on public.article_ai_summaries (generated_at desc);

-- RLS for article_ai_summaries
alter table public.article_ai_summaries enable row level security;

drop policy if exists "Public can read summaries of published articles" on public.article_ai_summaries;
create policy "Public can read summaries of published articles"
  on public.article_ai_summaries
  for select
  using (
    exists (
      select 1 from public.articles a
      where a.id = article_ai_summaries.article_id
        and a.status = 'published'
    )
  );

drop policy if exists "Service role can manage article_ai_summaries" on public.article_ai_summaries;
create policy "Service role can manage article_ai_summaries"
  on public.article_ai_summaries
  for all
  using (true)
  with check (true);

-- 2. HEALTHCARE_NEWS_ITEMS Table
-- Tracks individual external news developments for monthly intelligence reports.
create table if not exists public.healthcare_news_items (
  id                uuid primary key default gen_random_uuid(),
  reporting_period  text not null, -- 'YYYY-MM' e.g. '2026-10'
  title             text not null,
  summary           text not null,
  category          text not null check (category in ('policy', 'hospitals', 'workforce', 'companies', 'clinical', 'technology', 'labor', 'other')),
  source_name       text not null,
  source_url        text not null,
  published_at      timestamptz,
  event_date        text,
  geographic_scope  text default 'US Nationwide',
  significance      text,
  recruiter_impact  text,
  url_hash          text not null,
  evidence_excerpt  text,
  created_at        timestamptz not null default now(),

  constraint healthcare_news_items_period_hash_unique unique (reporting_period, url_hash)
);

comment on table public.healthcare_news_items is 'Verified external US healthcare news items curated for monthly intelligence reports.';

create index if not exists idx_healthcare_news_items_period on public.healthcare_news_items (reporting_period);
create index if not exists idx_healthcare_news_items_category on public.healthcare_news_items (category);
create index if not exists idx_healthcare_news_items_published_at on public.healthcare_news_items (published_at desc nulls last);

alter table public.healthcare_news_items enable row level security;

drop policy if exists "Public can read healthcare_news_items" on public.healthcare_news_items;
create policy "Public can read healthcare_news_items"
  on public.healthcare_news_items
  for select
  using (true);

drop policy if exists "Service role can manage healthcare_news_items" on public.healthcare_news_items;
create policy "Service role can manage healthcare_news_items"
  on public.healthcare_news_items
  for all
  using (true)
  with check (true);

-- 3. HEALTHCARE_MONTHLY_REPORTS Table
-- Canonical monthly reports synthesized by Gemini.
create table if not exists public.healthcare_monthly_reports (
  id                          uuid primary key default gen_random_uuid(),
  reporting_period            text not null unique, -- e.g. '2026-10'
  month_name                  text not null,        -- e.g. 'October 2026'
  executive_summary           text not null,
  major_developments          jsonb not null default '[]'::jsonb,
  staffing_impact             text not null,
  state_regional_developments jsonb not null default '[]'::jsonb,
  industry_trends             jsonb not null default '[]'::jsonb,
  what_to_watch_next          jsonb not null default '[]'::jsonb,
  source_count                int not null default 0,
  status                      text not null default 'published' check (status in ('generating', 'published', 'failed')),
  gemini_model                text not null default 'gemini-2.0-flash',
  generated_at                timestamptz not null default now(),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table public.healthcare_monthly_reports is 'Comprehensive monthly US healthcare intelligence reports synthesized by Gemini.';

create index if not exists idx_healthcare_monthly_reports_period on public.healthcare_monthly_reports (reporting_period desc);
create index if not exists idx_healthcare_monthly_reports_status on public.healthcare_monthly_reports (status);

alter table public.healthcare_monthly_reports enable row level security;

drop policy if exists "Public can read published monthly reports" on public.healthcare_monthly_reports;
create policy "Public can read published monthly reports"
  on public.healthcare_monthly_reports
  for select
  using (status = 'published');

drop policy if exists "Service role can manage healthcare_monthly_reports" on public.healthcare_monthly_reports;
create policy "Service role can manage healthcare_monthly_reports"
  on public.healthcare_monthly_reports
  for all
  using (true)
  with check (true);

-- 4. HEALTHCARE_RESEARCH_RUNS Table
-- Operational tracking of monthly research execution.
create table if not exists public.healthcare_research_runs (
  id               uuid primary key default gen_random_uuid(),
  reporting_period text not null,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  status           text not null default 'running' check (status in ('running', 'completed', 'failed')),
  sources_checked  int not null default 0,
  items_collected  int not null default 0,
  error_message    text,
  created_at       timestamptz not null default now()
);

alter table public.healthcare_research_runs enable row level security;

drop policy if exists "Public can read healthcare_research_runs" on public.healthcare_research_runs;
create policy "Public can read healthcare_research_runs"
  on public.healthcare_research_runs
  for select
  using (true);

drop policy if exists "Service role can manage healthcare_research_runs" on public.healthcare_research_runs;
create policy "Service role can manage healthcare_research_runs"
  on public.healthcare_research_runs
  for all
  using (true)
  with check (true);

-- 5. Auto-update triggers
drop trigger if exists article_ai_summaries_updated_at on public.article_ai_summaries;
create trigger article_ai_summaries_updated_at
  before update on public.article_ai_summaries
  for each row execute function public.handle_updated_at();

drop trigger if exists healthcare_monthly_reports_updated_at on public.healthcare_monthly_reports;
create trigger healthcare_monthly_reports_updated_at
  before update on public.healthcare_monthly_reports
  for each row execute function public.handle_updated_at();

-- 6. Initial backfill of article_ai_summaries from existing article_summaries for instant page load
insert into public.article_ai_summaries (article_id, content_hash, summary_text, key_takeaways, gemini_model, generated_at)
select 
  s.article_id,
  coalesce(a.content_hash, md5(a.title || ' ' || coalesce(s.quick_summary, ''))),
  coalesce(s.quick_summary, s.detailed_summary, a.title),
  case 
    when s.why_it_matters is not null and s.recruiter_impact is not null then
      jsonb_build_array(
        'Significance: ' || s.why_it_matters,
        'Workforce Impact: ' || s.recruiter_impact,
        'Evidence status: ' || coalesce(s.impact_status, 'unclear')
      )
    when s.why_it_matters is not null then
      jsonb_build_array('Significance: ' || s.why_it_matters)
    else
      jsonb_build_array('Key development in ' || a.primary_category)
  end,
  coalesce(s.model_name, 'gemini-flash-lite-latest'),
  coalesce(s.generated_at, now())
from public.article_summaries s
join public.articles a on a.id = s.article_id
where a.status = 'published'
on conflict (article_id) do nothing;

-- 7. Update published_articles view to include ai_summary_text and ai_key_takeaways
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
  a.is_major,
  s.quick_summary,
  s.detailed_summary,
  s.why_it_matters,
  s.recruiter_impact,
  s.impact_status,
  s.evidence_notes,
  s.source_urls,
  s.model_name,
  s.generated_at,
  s.schema_version,
  ais.summary_text as ai_summary_text,
  ais.key_takeaways as ai_key_takeaways,
  ais.generated_at as ai_generated_at
from public.articles a
left join public.article_summaries s on s.article_id = a.id
left join public.article_ai_summaries ais on ais.article_id = a.id
where a.status = 'published'
order by a.published_at desc nulls last;
