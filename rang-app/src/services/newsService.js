/**
 * Rang Healthcare — News Service
 * Abstraction layer for fetching news stories and summaries.
 * PRD §4.1, §4.3, §12.1:
 * - Reads from Supabase when configured
 * - Gracefully falls back to curated mock data during development/offline
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockArticles } from '../data/mockArticles';

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
 * Fetches all published articles with optional filters.
 */
export async function getPublishedArticles() {
  if (!isSupabaseConfigured()) {
    return { articles: mockArticles, isLive: false, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('published_articles')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) {
      console.warn('[newsService] Supabase query returned error, falling back to mock data:', error.message);
      return { articles: mockArticles, isLive: false, error: error.message };
    }

    if (!data || data.length === 0) {
      console.info('[newsService] Supabase returned 0 articles, falling back to mock data.');
      return { articles: mockArticles, isLive: false, error: null };
    }

    const mapped = data.map(mapRowToArticle);
    return { articles: mapped, isLive: true, error: null };
  } catch (err) {
    console.warn('[newsService] Failed to fetch from Supabase, using mock fallback:', err);
    return { articles: mockArticles, isLive: false, error: err.message };
  }
}

/**
 * Fetches a single article by ID.
 */
export async function getArticleById(id) {
  if (!isSupabaseConfigured()) {
    const mock = mockArticles.find((a) => a.id === id);
    return { article: mock || null, isLive: false };
  }

  try {
    const { data, error } = await supabase
      .from('published_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      // Fallback search in mock data
      const mock = mockArticles.find((a) => a.id === id);
      return { article: mock || null, isLive: false };
    }

    return { article: mapRowToArticle(data), isLive: true };
  } catch (err) {
    const mock = mockArticles.find((a) => a.id === id);
    return { article: mock || null, isLive: false };
  }
}
