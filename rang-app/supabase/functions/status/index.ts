/**
 * Rang Healthcare — Status & Operational Visibility Edge Function
 * PRD §16: Error handling and operational visibility
 *
 * Provides a lightweight health check and observability endpoint:
 * - Last successful collection run
 * - Sources checked, failing sources
 * - Article counts (published, pending, failed)
 * - Summaries generated & AI call metrics
 *
 * Environment variables:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STATUS_API_KEY (optional)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseAdmin } from "../_shared/supabase-client.ts";

Deno.serve(async (req: Request) => {
  // Allow GET and OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Optional status API key protection
  const statusApiKey = Deno.env.get("STATUS_API_KEY");
  const authHeader = req.headers.get("authorization");
  if (statusApiKey && authHeader !== `Bearer ${statusApiKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch recent ingestion runs (last 5)
    const { data: runs, error: runsError } = await supabase
      .from("ingestion_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(5);

    if (runsError) {
      throw new Error(`Failed to fetch runs: ${runsError.message}`);
    }

    // 2. Fetch sources health summary
    const { data: sources, error: sourcesError } = await supabase
      .from("sources")
      .select("id, name, country_scope, is_enabled, last_checked_at, last_success_at, last_error");

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    const totalSources = sources?.length || 0;
    const enabledSources = sources?.filter((s) => s.is_enabled).length || 0;
    const failingSources = sources?.filter((s) => s.last_error !== null) || [];

    // 3. Fetch article metrics
    const { count: totalPublished, error: pubCountError } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");

    const { count: totalDiscovered } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "discovered");

    const { count: totalFailed } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed");

    const { count: usCount } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("country", "US");

    const { count: caCount } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("country", "CA");

    // 4. Derive overall health status
    const latestRun = runs && runs.length > 0 ? runs[0] : null;
    let systemStatus = "healthy";

    if (!latestRun) {
      systemStatus = "idle";
    } else if (latestRun.run_status === "failed") {
      systemStatus = "degraded";
    } else if (failingSources.length > (totalSources / 2)) {
      systemStatus = "degraded";
    }

    const responseBody = {
      status: systemStatus,
      timestamp: new Date().toISOString(),
      pipeline: {
        last_run: latestRun
          ? {
              id: latestRun.id,
              status: latestRun.run_status,
              started_at: latestRun.started_at,
              finished_at: latestRun.finished_at,
              duration_ms: latestRun.run_duration_ms,
              sources_checked: latestRun.sources_checked,
              candidates_found: latestRun.candidates_found,
              new_articles: latestRun.new_articles,
              duplicates_skipped: latestRun.duplicates_skipped,
              summaries_completed: latestRun.summaries_completed,
              failures_count: latestRun.failures_count,
              error_summary: latestRun.sanitized_error_summary,
            }
          : null,
        recent_runs: runs?.slice(0, 3) || [],
      },
      sources: {
        total: totalSources,
        enabled: enabledSources,
        failing_count: failingSources.length,
        failing_list: failingSources.map((s) => ({
          name: s.name,
          country: s.country_scope,
          last_error: s.last_error,
          last_success_at: s.last_success_at,
        })),
      },
      articles: {
        published: totalPublished || 0,
        discovered_pending: totalDiscovered || 0,
        failed: totalFailed || 0,
        by_country: {
          US: usCount || 0,
          CA: caCount || 0,
        },
      },
    };

    return new Response(JSON.stringify(responseBody, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error: any) {
    console.error("[status] Error producing status report:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        error: error.message || "Failed to retrieve status",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
