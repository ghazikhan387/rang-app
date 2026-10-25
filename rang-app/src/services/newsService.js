/**
 * Rang Healthcare — News Service
 * Abstraction layer for fetching news stories and summaries.
 * PRD §4.1, §4.3, §12.1:
 * - Reads from Supabase when configured
 * - NEVER falls back to mock data: failures return a descriptive `error`
 *   so the UI can clearly tell the user something is wrong and why.
 */

import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '../lib/supabase';

/**
 * Normalizes a database row from `published_articles` view to the standard frontend article format.
 */
function mapRowToArticle(row) {
  return {
    id: String(row.id),
    title: row.title,
    canonical_url: row.canonical_url,
    source_name: row.source_name,
    published_at: row.published_at,
    discovered_at: row.discovered_at,
    country: row.country,
    regions: Array.isArray(row.regions) ? row.regions : [],
    location_text: row.location_text,
    primary_category: row.primary_category,
    tags: Array.isArray(row.tags) ? row.tags : [],
    image_url: row.image_url,
    status: row.status,
    is_major: Boolean(row.is_major),
    summary: {
      quick_summary: row.quick_summary,
      detailed_summary: row.detailed_summary,
      why_it_matters: row.why_it_matters,
      recruiter_impact: row.recruiter_impact,
      impact_status: row.impact_status || 'unclear',
      evidence_notes: row.evidence_notes,
      source_urls: Array.isArray(row.source_urls) ? row.source_urls : [],
      model_name: row.model_name,
      generated_at: row.generated_at,
    },
  };
}

/**
 * Converts a raw Supabase/network error into a human-readable diagnosis
 * that tells the user what is broken and how to fix it.
 */
function toFriendlyError(err, context = 'fetch articles') {
  const raw = err?.message || err?.error_description || String(err || 'Unknown error');
  const code = err?.code ? ` (code ${err.code})` : '';
  const lower = raw.toLowerCase();

  // Missing table / view — migrations not applied
  if (err?.code === '42P01' || lower.includes('does not exist') || lower.includes('could not find the table') || lower.includes('published_articles')) {
    return `Database table/view "published_articles" not found${code}. The backend migrations have not been applied to this Supabase project. Run the migrations in supabase/ and check NEWS_PIPELINE.md. Raw: ${raw}`;
  }
  // RLS / permissions
  if (err?.code === '42501' || lower.includes('row-level security') || lower.includes('permission denied') || lower.includes('policy')) {
    return `Supabase Row Level Security blocked the read${code}. Add a SELECT policy allowing anon reads on published_articles. Raw: ${raw}`;
  }
  // Auth / API key
  if (err?.code === '401' || lower.includes('invalid api key') || lower.includes('apikey') || lower.includes('jwt') || lower.includes('unauthorized')) {
    return `Supabase authentication failed${code}. VITE_SUPABASE_ANON_KEY is invalid, expired, or for a different project. Raw: ${raw}`;
  }
  // Network / unreachable
  if (lower.includes('failed to fetch') || lower.includes('fetch failed') || lower.includes('networkerror') || lower.includes('load failed') || err instanceof TypeError) {
    return `Cannot reach Supabase while trying to ${context}. Check the network connection, verify VITE_SUPABASE_URL is correct, and confirm the project is not paused. Raw: ${raw}`;
  }

  return `Failed to ${context}${code}: ${raw}`;
}

/**
 * Fetches ALL published articles, across as many paginated requests as needed.
 * PostgREST (Supabase) caps every bare `.select()` at its max-rows setting
 * (1000 by default), which previously made the feed display a hard query
 * limit ("1000 stories") instead of the real total. This loops `.range()`
 * calls until the feed is exhausted.
 *
 * On any failure returns { articles: [], isLive: false, error } — never fake data.
 */
export async function getPublishedArticles() {
  if (!isSupabaseConfigured() || !supabase) {
    const reason = getSupabaseConfigError() || 'Supabase is not configured.';
    return { articles: [], isLive: false, error: `Feed unavailable: ${reason}` };
  }

  const PAGE_SIZE = 1000;
  const MAX_PAGES = 20; // safety cap: 20,000 rows max

  try {
    let rows = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const { data, error } = await supabase
        .from('published_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) {
        console.error('[newsService] Supabase query failed:', error);
        return { articles: [], isLive: false, error: toFriendlyError(error, 'load the news feed') };
      }

      if (!data || data.length === 0) break;
      rows = rows.concat(data);
      if (data.length < PAGE_SIZE) break; // last, short page → feed exhausted
    }

    // Empty is a legitimate state (pipeline hasn't ingested anything yet) —
    // return no error so the UI shows an honest "no stories yet" empty state.
    if (rows.length === 0) {
      console.warn('[newsService] Supabase returned 0 published articles. Pipeline may not have run yet.');
      return { articles: [], isLive: true, error: null };
    }

    const mapped = rows.map(mapRowToArticle);
    return { articles: mapped, isLive: true, error: null };
  } catch (err) {
    console.error('[newsService] Failed to fetch from Supabase:', err);
    return { articles: [], isLive: false, error: toFriendlyError(err, 'load the news feed') };
  }
}

/**
 * Fetches a single article by ID.
 * Returns { article: null, error } with a diagnosis on failure, or
 * { article: null, notFound: true } when the row genuinely doesn't exist.
 */
export async function getArticleById(id) {
  if (!isSupabaseConfigured() || !supabase) {
    const reason = getSupabaseConfigError() || 'Supabase is not configured.';
    return { article: null, isLive: false, error: `Article unavailable: ${reason}` };
  }

  try {
    const { data, error } = await supabase
      .from('published_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      // PostgREST "no rows" — the article genuinely doesn't exist
      if (error?.code === 'PGRST116') {
        return { article: null, isLive: true, error: null, notFound: true };
      }
      console.error('[newsService] Article query failed:', error);
      return { article: null, isLive: false, error: error ? toFriendlyError(error, `load article ${id}`) : `Article "${id}" was not found.` };
    }

    return { article: mapRowToArticle(data), isLive: true, error: null };
  } catch (err) {
    console.error('[newsService] Article fetch threw:', err);
    return { article: null, isLive: false, error: toFriendlyError(err, `load article ${id}`) };
  }
}

/**
 * Returns the ISO start date boundary for a given timeline range key.
 */
export function getDateRangeStart(rangeKey) {
  const now = new Date();
  switch (rangeKey) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '3months':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '6months':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case '3years': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 3);
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Fetches timeline articles with server-side filtering, chronological ordering, and pagination.
 * Never returns mock data: failures return { articles: [], error } with a diagnosis.
 */
export async function getTimelineArticles({
  country = 'US',
  dateRange = 'month',
  category = null,
  search = '',
  majorOnly = false,
  page = 1,
  pageSize = 20,
} = {}) {
  if (!isSupabaseConfigured() || !supabase) {
    const reason = getSupabaseConfigError() || 'Supabase is not configured.';
    return { articles: [], totalCount: 0, hasMore: false, isLive: false, error: `Timeline unavailable: ${reason}` };
  }

  try {
    const startDate = getDateRangeStart(dateRange);

    let query = supabase
      .from('published_articles')
      .select('*', { count: 'exact' })
      .gte('published_at', startDate.toISOString())
      .order('published_at', { ascending: false });

    if (country && country !== 'all') {
      query = query.eq('country', country);
    }

    if (category && category !== 'all') {
      query = query.eq('primary_category', category);
    }

    if (majorOnly) {
      query = query.eq('is_major', true);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`title.ilike.%${term}%,quick_summary.ilike.%${term}%,recruiter_impact.ilike.%${term}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[newsService] Supabase timeline query failed:', error);
      return { articles: [], totalCount: 0, hasMore: false, isLive: false, error: toFriendlyError(error, 'load the timeline') };
    }

    const totalCount = count ?? (data ? data.length : 0);
    const articles = (data || []).map(mapRowToArticle);

    return {
      articles,
      totalCount,
      hasMore: totalCount > page * pageSize,
      isLive: true,
      error: null,
    };
  } catch (err) {
    console.error('[newsService] Timeline fetch threw:', err);
    return { articles: [], totalCount: 0, hasMore: false, isLive: false, error: toFriendlyError(err, 'load the timeline') };
  }
}
