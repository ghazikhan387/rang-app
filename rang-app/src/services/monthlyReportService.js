/**
 * Rang Healthcare — Monthly Report Service
 * Fetches and triggers generation of comprehensive US Healthcare Monthly Intelligence Reports.
 */

import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '../lib/supabase';

/**
 * Fetches a specific monthly report by reporting_period (e.g. '2026-10').
 */
export async function getMonthlyReport(period) {
  if (!isSupabaseConfigured() || !supabase) {
    const reason = getSupabaseConfigError() || 'Supabase is not configured.';
    return { report: null, error: `Monthly reports unavailable: ${reason}` };
  }

  try {
    let query = supabase
      .from('healthcare_monthly_reports')
      .select('*')
      .eq('status', 'published');

    if (period) {
      query = query.eq('reporting_period', period);
    } else {
      // Default to latest published report
      query = query.order('reporting_period', { ascending: false }).limit(1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[monthlyReportService] Query failed:', error);
      return { report: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { report: null, error: null };
    }

    return { report: data[0], error: null };
  } catch (err) {
    console.error('[monthlyReportService] Error fetching report:', err);
    return { report: null, error: err.message || 'Failed to fetch report' };
  }
}

/**
 * Lists all available monthly report periods for historical archive navigation.
 */
export async function listReportArchives() {
  if (!isSupabaseConfigured() || !supabase) {
    return { archives: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('healthcare_monthly_reports')
      .select('reporting_period, month_name, source_count, status, generated_at')
      .order('reporting_period', { ascending: false });

    if (error) {
      console.error('[monthlyReportService] Archive list failed:', error);
      return { archives: [], error: error.message };
    }

    return { archives: data || [], error: null };
  } catch (err) {
    console.error('[monthlyReportService] Error listing archives:', err);
    return { archives: [], error: err.message || 'Failed to load archive list' };
  }
}

/**
 * Triggers the monthly report generation Edge Function.
 */
export async function triggerReportGeneration(period, { force = false } = {}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return { success: false, error: 'Supabase URL/Key missing' };
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-monthly-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        reporting_period: period,
        force,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Function error: ${res.status} - ${errText}` };
    }

    const data = await res.json();
    return { success: true, report: data.report };
  } catch (err) {
    console.error('[monthlyReportService] Generate function invocation failed:', err);
    return { success: false, error: err.message || 'Network error triggering report generation' };
  }
}
