/**
 * Rang Healthcare — Consolidated Development Report Service
 * Fetches and triggers generation of unified US Healthcare Development Reports
 * across Past 24 Hours, Past Week, and Past Month (with archive selector).
 */

import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '../lib/supabase';

export const PERIOD_TYPES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

/**
 * Fetches the consolidated report for a specific period type and key.
 */
export async function getConsolidatedReport({ periodType = 'month', periodKey = null }) {
  if (!isSupabaseConfigured() || !supabase) {
    const reason = getSupabaseConfigError() || 'Supabase is not configured.';
    return { report: null, error: `Report unavailable: ${reason}` };
  }

  try {
    let query = supabase
      .from('healthcare_development_reports')
      .select('*')
      .eq('period_type', periodType)
      .eq('status', 'published');

    if (periodKey) {
      query = query.eq('period_key', periodKey);
    } else if (periodType === 'month') {
      // Latest monthly report
      query = query.order('period_key', { ascending: false }).limit(1);
    } else {
      query = query.eq('period_key', 'latest');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[developmentReportService] Fetch failed:', error);
      return { report: null, error: error.message };
    }

    if (!data || data.length === 0) {
      // If report doesn't exist yet, attempt automatic generation
      const genRes = await triggerReportGeneration({ periodType, periodKey, force: false });
      if (genRes.success && genRes.report) {
        return { report: genRes.report, error: null };
      }
      return { report: null, error: null };
    }

    return { report: data[0], error: null };
  } catch (err) {
    console.error('[developmentReportService] Query threw:', err);
    return { report: null, error: err.message || 'Failed to fetch development report' };
  }
}

/**
 * Lists all available monthly report archives for the archive selector dropdown.
 */
export async function listMonthlyArchives() {
  if (!isSupabaseConfigured() || !supabase) {
    return { archives: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('healthcare_development_reports')
      .select('period_key, period_label, report_title, source_count, generated_at, status')
      .eq('period_type', 'month')
      .eq('status', 'published')
      .order('period_key', { ascending: false });

    if (error) {
      console.error('[developmentReportService] Archive list error:', error);
      return { archives: [], error: error.message };
    }

    return { archives: data || [], error: null };
  } catch (err) {
    console.error('[developmentReportService] Archive query error:', err);
    return { archives: [], error: err.message || 'Failed to list archives' };
  }
}

/**
 * Triggers report generation or regeneration via the Supabase Edge Function.
 */
export async function triggerReportGeneration({ periodType, periodKey, force = false }) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: 'Supabase environment variables missing' };
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-development-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        period_type: periodType,
        period_key: periodKey,
        force,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Edge function returned ${res.status}: ${errText}` };
    }

    const data = await res.json();
    return { success: true, report: data.report };
  } catch (err) {
    console.error('[developmentReportService] Generation error:', err);
    return { success: false, error: err.message || 'Network error triggering generation' };
  }
}
