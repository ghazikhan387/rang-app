/**
 * Rang Healthcare — AI Summary Service
 * Handles fetching published articles with their persisted Gemini AI summaries
 * for Today (24h), This Week (7 days), and This Month (30 days).
 */

import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '../lib/supabase';

export const PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
};

/**
 * Returns the Date boundary for the requested period.
 */
export function getPeriodStartDate(period) {
  const now = new Date();
  switch (period) {
    case PERIODS.TODAY:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case PERIODS.WEEK:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case PERIODS.MONTH:
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Normalizes article row into standard summary card format.
 */
function mapRowToSummaryCard(row) {
  const takeaways = Array.isArray(row.ai_key_takeaways)
    ? row.ai_key_takeaways
    : (row.why_it_matters || row.recruiter_impact)
      ? [
          row.why_it_matters ? `Significance: ${row.why_it_matters}` : null,
          row.recruiter_impact ? `Workforce Impact: ${row.recruiter_impact}` : null,
        ].filter(Boolean)
      : [];

  return {
    id: String(row.id),
    title: row.title,
    canonical_url: row.canonical_url,
    source_name: row.source_name || 'Healthcare Wire',
    published_at: row.published_at,
    primary_category: row.primary_category || 'healthcare',
    image_url: row.image_url,
    is_major: Boolean(row.is_major),
    summary_text: row.ai_summary_text || row.quick_summary || row.detailed_summary || 'Summary pending generation.',
    key_takeaways: takeaways,
    generated_at: row.ai_generated_at || row.generated_at,
    has_ai_summary: Boolean(row.ai_summary_text),
  };
}

/**
 * Fetches published articles with AI summaries for a specific period (today, week, month).
 * Automatically triggers Edge Function generation for articles needing summaries.
 */
export async function getArticlesForPeriod(period = PERIODS.MONTH, { limit = 30 } = {}) {
  if (!isSupabaseConfigured() || !supabase) {
    const reason = getSupabaseConfigError() || 'Supabase is not configured.';
    return { articles: [], error: `Summaries unavailable: ${reason}` };
  }

  try {
    const startDate = getPeriodStartDate(period);

    const { data, error } = await supabase
      .from('published_articles')
      .select('*')
      .gte('published_at', startDate.toISOString())
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`[aiSummaryService] Query for ${period} failed:`, error);
      return { articles: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { articles: [], error: null };
    }

    const mapped = data.map(mapRowToSummaryCard);

    // Check if any articles in this batch are missing summaries
    const missing = mapped.filter((a) => !a.has_ai_summary);
    if (missing.length > 0) {
      // Trigger edge function asynchronously to generate & cache
      triggerSummaryGeneration(missing.map((a) => a.id)).catch((err) =>
        console.warn('[aiSummaryService] Background summarization failed:', err)
      );
    }

    return { articles: mapped, error: null };
  } catch (err) {
    console.error(`[aiSummaryService] Error fetching ${period} summaries:`, err);
    return { articles: [], error: err.message || 'Failed to fetch article summaries' };
  }
}

/**
 * Fetches all 3 periods in parallel for the AI Article Summaries overview page.
 */
export async function getAllPeriodSummaries() {
  const [todayRes, weekRes, monthRes] = await Promise.all([
    getArticlesForPeriod(PERIODS.TODAY, { limit: 20 }),
    getArticlesForPeriod(PERIODS.WEEK, { limit: 30 }),
    getArticlesForPeriod(PERIODS.MONTH, { limit: 40 }),
  ]);

  return {
    today: todayRes.articles,
    week: weekRes.articles,
    month: monthRes.articles,
    error: todayRes.error || weekRes.error || monthRes.error || null,
  };
}

/**
 * Calls the Supabase Edge Function to generate/refresh AI summaries for specified article IDs.
 */
export async function triggerSummaryGeneration(articleIds = [], { force = false } = {}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return null;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/summarize-articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        article_ids: articleIds.length > 0 ? articleIds : undefined,
        force,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[aiSummaryService] Summarize Edge Function returned error:', res.status, errText);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[aiSummaryService] Failed to invoke summarize-articles function:', err);
    return null;
  }
}
