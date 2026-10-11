/**
 * Rang Healthcare — Ingest Edge Function
 * PRD §12: Complete ingestion pipeline — discover → retrieve → enrich → publish.
 *
 * This function is invoked on a cron schedule or manually via HTTP POST.
 * It orchestrates the full pipeline within free-tier limits.
 *
 * Environment variables required:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { getSupabaseAdmin } from "../_shared/supabase-client.ts";
import { fetchRssFeed, type RssEntry } from "../_shared/rss-parser.ts";
import { retrieveArticlePage } from "../_shared/article-retriever.ts";
import {
  generateSummary,
  type ArticleInput,
} from "../_shared/ai-enrichment.ts";
import { hashUrl, contentHash } from "../_shared/url-utils.ts";
import {
  PIPELINE_LIMITS,
  ARTICLE_STATUS,
  AI_CONFIG,
} from "../_shared/constants.ts";

// ============================================================
// Types
// ============================================================
interface RunStats {
  sources_checked: number;
  candidates_found: number;
  new_articles: number;
  duplicates_skipped: number;
  articles_retrieved: number;
  summaries_completed: number;
  failures_count: number;
  ai_calls_made: number;
  errors: string[];
}

// ============================================================
// Main Handler
// ============================================================
Deno.serve(async (req: Request) => {
  // Only allow POST (from cron/manual trigger)
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Optional auth check — verify the request carries a service-level secret
  const authHeader = req.headers.get("authorization");
  const expectedToken = Deno.env.get("CRON_SECRET");
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const startTime = Date.now();
  const supabase = getSupabaseAdmin();

  const stats: RunStats = {
    sources_checked: 0,
    candidates_found: 0,
    new_articles: 0,
    duplicates_skipped: 0,
    articles_retrieved: 0,
    summaries_completed: 0,
    failures_count: 0,
    ai_calls_made: 0,
    errors: [],
  };

  // Create ingestion run record
  const { data: run, error: runError } = await supabase
    .from("ingestion_runs")
    .insert({ run_status: "running" })
    .select("id")
    .single();

  if (runError || !run) {
    console.error("[ingest] Failed to create run record:", runError);
    return new Response(
      JSON.stringify({ error: "Failed to create run record" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const runId = run.id;

  const url = new URL(req.url);
  const isSync = url.searchParams.get("sync") === "true";

  const runPipeline = async () => {
    try {
      // ── Step 1: Discover — Fetch enabled RSS sources ────────
      await discoverArticles(supabase, stats);

      // ── Step 2: Retrieve — Fetch page content for new articles ─
      await retrieveArticles(supabase, stats);

      // ── Step 3: Enrich — Generate AI summaries ──────────────
      await enrichArticles(supabase, stats);

      // ── Finalize run ────────────────────────────────────────
      const runStatus =
        stats.failures_count > 0 && stats.summaries_completed > 0
          ? "partial"
          : stats.failures_count > 0
            ? "failed"
            : "completed";

      await supabase
        .from("ingestion_runs")
        .update({
          finished_at: new Date().toISOString(),
          run_status: runStatus,
          sources_checked: stats.sources_checked,
          candidates_found: stats.candidates_found,
          new_articles: stats.new_articles,
          duplicates_skipped: stats.duplicates_skipped,
          articles_retrieved: stats.articles_retrieved,
          summaries_completed: stats.summaries_completed,
          failures_count: stats.failures_count,
          ai_calls_made: stats.ai_calls_made,
          sanitized_error_summary:
            stats.errors.length > 0
              ? stats.errors.slice(0, 10).join("; ")
              : null,
          run_duration_ms: Date.now() - startTime,
        })
        .eq("id", runId);

      console.log(
        `[ingest] Run ${runId} completed in ${Date.now() - startTime}ms:`,
        JSON.stringify(stats, null, 2)
      );
    } catch (error) {
      const message = (error as Error).message;
      console.error("[ingest] Fatal error:", message);

      await supabase
        .from("ingestion_runs")
        .update({
          finished_at: new Date().toISOString(),
          run_status: "failed",
          sanitized_error_summary: `Fatal: ${message.slice(0, 200)}`,
          run_duration_ms: Date.now() - startTime,
          ...stats,
        })
        .eq("id", runId);
    }
  };

  // If running in Supabase Edge Runtime, dispatch to background to prevent gateway timeout
  // @ts-ignore
  if (!isSync && typeof EdgeRuntime !== "undefined" && typeof EdgeRuntime.waitUntil === "function") {
    // @ts-ignore
    EdgeRuntime.waitUntil(runPipeline());
    return new Response(
      JSON.stringify({
        status: "accepted",
        message: "Ingestion pipeline launched in background",
        run_id: runId,
        started_at: new Date(startTime).toISOString(),
      }),
      { status: 202, headers: { "Content-Type": "application/json" } }
    );
  }

  // Synchronous execution fallback (or when ?sync=true is specified)
  await runPipeline();
  return new Response(
    JSON.stringify({
      run_id: runId,
      status: "completed",
      stats,
      duration_ms: Date.now() - startTime,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

// ============================================================
// Step 1: DISCOVER — Fetch RSS feeds, insert new candidates
// ============================================================
async function discoverArticles(supabase: any, stats: RunStats) {
  // Get enabled sources, ordered by priority
  const { data: sources, error } = await supabase
    .from("sources")
    .select("*")
    .eq("is_enabled", true)
    .order("priority", { ascending: true });

  if (error || !sources || sources.length === 0) {
    if (error) stats.errors.push(`Source fetch failed: ${error.message}`);
    return;
  }

  // Fetch feeds in small batches of 3 with slight staggering to avoid Google 503 rate limits
  const results: any[] = [];
  for (let i = 0; i < sources.length; i += 3) {
    const chunk = sources.slice(i, i + 3);
    const chunkPromises = chunk.map(async (source: any) => {
      try {
        const entries = await fetchRssFeed(source);
        await supabase
          .from("sources")
          .update({
            last_checked_at: new Date().toISOString(),
            last_success_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", source.id);
        return { source, entries, error: null };
      } catch (err) {
        const errMsg = (err as Error).message.slice(0, 100);
        await supabase
          .from("sources")
          .update({
            last_checked_at: new Date().toISOString(),
            last_error: errMsg,
          })
          .eq("id", source.id);
        return { source, entries: [], error: `Source "${source.name}": ${errMsg}` };
      }
    });

    const chunkResults = await Promise.allSettled(chunkPromises);
    results.push(...chunkResults);
    if (i + 3 < sources.length) {
      await delay(350);
    }
  }
  let totalCandidates = 0;

  for (const res of results) {
    if (res.status !== "fulfilled") continue;
    const { source, entries, error: srcError } = res.value;
    stats.sources_checked++;

    if (srcError) {
      stats.errors.push(srcError);
      stats.failures_count++;
      continue;
    }

    stats.candidates_found += entries.length;

    for (const entry of entries) {
      if (totalCandidates >= PIPELINE_LIMITS.MAX_CANDIDATES_PER_RUN) break;

      try {
        const urlHashValue = await hashUrl(entry.url);

        const { error: insertError } = await supabase
          .from("articles")
          .insert({
            title: entry.title,
            canonical_url: entry.url,
            url_hash: urlHashValue,
            source_id: source.id,
            source_name: entry.sourceName,
            published_at: entry.publishedAt,
            country: entry.country,
            image_url: entry.imageUrl,
            source_description: entry.description,
            status: ARTICLE_STATUS.DISCOVERED,
          });

        if (insertError) {
          if (insertError.code === "23505") {
            stats.duplicates_skipped++;
          } else {
            stats.errors.push(`Insert error for "${entry.title.slice(0, 50)}": ${insertError.message}`);
            stats.failures_count++;
          }
        } else {
          stats.new_articles++;
          totalCandidates++;
        }
      } catch (err) {
        stats.errors.push(`Candidate error: ${(err as Error).message.slice(0, 100)}`);
        stats.failures_count++;
      }
    }
  }
}

// ============================================================
// Step 2: RETRIEVE — Fetch article pages for metadata + text
// ============================================================
async function retrieveArticles(supabase: any, stats: RunStats) {
  // Get articles in "discovered" status (not yet retrieved)
  const { data: articles, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", ARTICLE_STATUS.DISCOVERED)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(PIPELINE_LIMITS.MAX_CANDIDATES_PER_RUN);

  if (error || !articles || articles.length === 0) {
    console.log("[ingest] No articles to retrieve.");
    return;
  }

  for (const article of articles) {
    try {
      // Respectful delay between fetches
      await delay(PIPELINE_LIMITS.FETCH_DELAY_MS);

      const pageData = await retrieveArticlePage(article.canonical_url);

      if (!pageData) {
        // Page was paywalled, redirected, or protected against scraping.
        // Fall back to the RSS snippet/description and title so Gemini can still enrich it
        // rather than failing the candidate.
        if (article.source_description || article.title) {
          await supabase
            .from("articles")
            .update({
              status: ARTICLE_STATUS.RETRIEVED,
              retrieved_text: article.source_description || article.title,
              retry_count: 0,
              last_error: null,
            })
            .eq("id", article.id);

          stats.articles_retrieved++;
          continue;
        }

        // Genuinely missing metadata — increment retry or fail
        if (article.retry_count >= PIPELINE_LIMITS.MAX_RETRY_COUNT) {
          await supabase
            .from("articles")
            .update({
              status: ARTICLE_STATUS.FAILED,
              last_error: "Max retrieval retries exceeded",
            })
            .eq("id", article.id);
        } else {
          await supabase
            .from("articles")
            .update({
              retry_count: article.retry_count + 1,
              last_error: "Page retrieval failed",
            })
            .eq("id", article.id);
        }
        stats.failures_count++;
        continue;
      }

      // Update article with retrieved data
      const textHash = pageData.bodyText
        ? await contentHash(pageData.bodyText)
        : null;

      await supabase
        .from("articles")
        .update({
          status: ARTICLE_STATUS.RETRIEVED,
          retrieved_text: pageData.bodyText || article.source_description || null,
          source_description:
            pageData.description || article.source_description,
          image_url: pageData.imageUrl || article.image_url,
          published_at: pageData.publishedAt || article.published_at,
          content_hash: textHash,
          retry_count: 0,
          last_error: null,
        })
        .eq("id", article.id);

      stats.articles_retrieved++;
    } catch (err) {
      stats.errors.push(
        `Retrieval error for article ${article.id}: ${(err as Error).message.slice(0, 100)}`
      );
      stats.failures_count++;
    }
  }
}

// ============================================================
// Step 3: ENRICH — Generate AI summaries for retrieved articles
// ============================================================
async function enrichArticles(supabase: any, stats: RunStats) {
  // Reset any orphaned processing articles back to retrieved
  await supabase
    .from("articles")
    .update({ status: ARTICLE_STATUS.RETRIEVED })
    .eq("status", ARTICLE_STATUS.PROCESSING);

  // Get articles that are retrieved but not yet enriched
  const { data: articles, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", ARTICLE_STATUS.RETRIEVED)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(PIPELINE_LIMITS.MAX_AI_CALLS_PER_RUN);

  if (error || !articles || articles.length === 0) {
    console.log("[ingest] No articles to enrich.");
    return;
  }

  for (const article of articles) {
    if (stats.ai_calls_made >= PIPELINE_LIMITS.MAX_AI_CALLS_PER_RUN) {
      console.log("[ingest] Reached AI call limit for this run.");
      break;
    }

    try {
      // Mark as processing
      await supabase
        .from("articles")
        .update({ status: ARTICLE_STATUS.PROCESSING })
        .eq("id", article.id);

      const input: ArticleInput = {
        title: article.title,
        url: article.canonical_url,
        sourceName: article.source_name || "Unknown",
        publishedAt: article.published_at,
        country: article.country,
        regions: article.regions || [],
        description: article.source_description,
        bodyText: article.retrieved_text,
      };

      stats.ai_calls_made++;
      const summary = await generateSummary(input);

      if (!summary) {
        // AI returned null (rate limit or empty response)
        if (article.retry_count >= PIPELINE_LIMITS.MAX_RETRY_COUNT) {
          await supabase
            .from("articles")
            .update({
              status: ARTICLE_STATUS.FAILED,
              last_error: "AI enrichment failed after max retries",
            })
            .eq("id", article.id);
        } else {
          await supabase
            .from("articles")
            .update({
              status: ARTICLE_STATUS.RETRIEVED, // Reset to allow retry
              retry_count: article.retry_count + 1,
              last_error: "AI enrichment returned empty result",
            })
            .eq("id", article.id);
        }
        stats.failures_count++;
        continue;
      }

      // Update article with AI-derived metadata
      await supabase
        .from("articles")
        .update({
          primary_category: summary.primary_category,
          tags: summary.tags,
          country: summary.country,
          regions: summary.regions,
          is_major: summary.is_major ?? false,
          status: ARTICLE_STATUS.PUBLISHED,
          retry_count: 0,
          last_error: null,
        })
        .eq("id", article.id);

      // Insert summary record
      await supabase.from("article_summaries").insert({
        article_id: article.id,
        quick_summary: summary.quick_summary,
        detailed_summary: summary.detailed_summary,
        why_it_matters: summary.why_it_matters,
        recruiter_impact: summary.recruiter_impact,
        impact_status: summary.impact_status,
        evidence_notes: summary.evidence_notes,
        source_urls: [article.canonical_url],
        model_name: AI_CONFIG.MODEL_NAME,
        generated_at: new Date().toISOString(),
      });

      stats.summaries_completed++;
      console.log(`[ingest] Published article: "${article.title.slice(0, 60)}"`);

      // Brief pause between AI calls
      await delay(1000);
    } catch (err) {
      const errMsg = (err as Error).message.slice(0, 150);
      console.warn(`[ingest] Enrichment error for ${article.id}: ${errMsg}`);
      stats.errors.push(`Enrichment: ${errMsg}`);
      stats.failures_count++;

      // Don't leave in "processing" limbo — reset to retrieved for retry
      await supabase
        .from("articles")
        .update({
          status: ARTICLE_STATUS.RETRIEVED,
          retry_count: article.retry_count + 1,
          last_error: errMsg,
        })
        .eq("id", article.id);
    }
  }
}

// ─── Utility ────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
