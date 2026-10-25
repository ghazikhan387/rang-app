/**
 * Rang Healthcare — AI Article Summarization Edge Function
 * Uses Google Gemini API to generate concise article summaries & takeaways.
 * Reuses cached summaries when content hash matches to eliminate redundant API calls.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseAdmin } from "../_shared/supabase-client.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

/**
 * Computes a simple SHA-256 hex string for a given text.
 */
async function computeHash(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    let body: any = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const { article_ids, force = false, limit = 25 } = body;

    // 1. Fetch eligible published articles
    let query = supabase
      .from("articles")
      .select("id, title, canonical_url, source_name, published_at, source_description, retrieved_text, content_hash, primary_category")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (Array.isArray(article_ids) && article_ids.length > 0) {
      query = supabase
        .from("articles")
        .select("id, title, canonical_url, source_name, published_at, source_description, retrieved_text, content_hash, primary_category")
        .in("id", article_ids)
        .eq("status", "published");
    }

    const { data: articles, error: artError } = await query;
    if (artError || !articles) {
      throw new Error(`Failed to fetch articles: ${artError?.message || "No data"}`);
    }

    if (articles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, summaries: {}, message: "No eligible published articles found." }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch existing cached summaries for these articles
    const articleIds = articles.map((a: any) => a.id);
    const { data: existingSummaries } = await supabase
      .from("article_ai_summaries")
      .select("*")
      .in("article_id", articleIds);

    const summaryMap = new Map<string, any>();
    if (existingSummaries) {
      for (const s of existingSummaries) {
        summaryMap.set(s.article_id, s);
      }
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const results: Record<string, any> = {};
    const toGenerate: any[] = [];

    // 3. Determine which articles need generation vs reuse
    for (const article of articles) {
      const contentRaw = `${article.title} ${article.retrieved_text || article.source_description || ""}`;
      const currentHash = await computeHash(contentRaw);
      const cached = summaryMap.get(article.id);

      if (cached && !force && cached.content_hash === currentHash) {
        results[article.id] = {
          summary_text: cached.summary_text,
          key_takeaways: cached.key_takeaways,
          generated_at: cached.generated_at,
          cached: true,
        };
      } else {
        toGenerate.push({ ...article, currentHash });
      }
    }

    // 4. Generate summaries for articles that need it (up to 10 per request to respect rate limits)
    const generationQueue = toGenerate.slice(0, 10);
    for (const item of generationQueue) {
      let generatedSummary = "";
      let generatedTakeaways: string[] = [];
      let success = false;

      if (apiKey && !apiKey.startsWith("AQ.Ab8RN6")) {
        try {
          const prompt = `You are a healthcare news analyst. Summarize this published healthcare article for readers.

ARTICLE:
- Title: ${item.title}
- Source: ${item.source_name}
- Published Date: ${item.published_at || "Unknown"}
- Content: ${item.retrieved_text || item.source_description || item.title}

STRICT INSTRUCTIONS:
1. Summarize ONLY what is supported by the article content. Do NOT invent facts or external statistics.
2. Do NOT confuse the article's publication date with dates of events or historical studies described.
3. Provide a clear, readable summary highlighting the main ideas and 2-3 important takeaways.

Respond with ONLY valid JSON:
{
  "summary_text": "2-3 concise, informative sentences highlighting the main event and key findings.",
  "key_takeaways": [
    "First main takeaway or insight",
    "Second key takeaway or clinical/operational implication",
    "Third takeaway or next milestone if applicable"
  ]
}`;

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.3,
                  maxOutputTokens: 1024,
                },
              }),
            }
          );

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed.summary_text) {
                generatedSummary = parsed.summary_text;
                generatedTakeaways = Array.isArray(parsed.key_takeaways) ? parsed.key_takeaways : [];
                success = true;
              }
            }
          } else {
            console.warn(`Gemini API returned status ${geminiRes.status} for article ${item.id}`);
          }
        } catch (genErr) {
          console.error(`Gemini generation failed for article ${item.id}:`, genErr);
        }
      }

      // If Gemini wasn't called or failed, fall back to existing article summary / description
      if (!success) {
        // Check if article_summaries has existing quick_summary
        const { data: legacySummary } = await supabase
          .from("article_summaries")
          .select("quick_summary, detailed_summary, why_it_matters, recruiter_impact")
          .eq("article_id", item.id)
          .single();

        generatedSummary = legacySummary?.quick_summary || item.source_description || item.title;
        generatedTakeaways = [];
        if (legacySummary?.why_it_matters) {
          generatedTakeaways.push(`Significance: ${legacySummary.why_it_matters}`);
        }
        if (legacySummary?.recruiter_impact) {
          generatedTakeaways.push(`Industry Impact: ${legacySummary.recruiter_impact}`);
        }
        if (generatedTakeaways.length === 0) {
          generatedTakeaways.push(`Published development in ${item.primary_category || "healthcare"}`);
        }
      }

      // Save / upsert into article_ai_summaries
      const { data: saved, error: saveErr } = await supabase
        .from("article_ai_summaries")
        .upsert(
          {
            article_id: item.id,
            content_hash: item.currentHash,
            summary_text: generatedSummary,
            key_takeaways: generatedTakeaways,
            gemini_model: success ? "gemini-2.0-flash" : "fallback-extractor",
            generated_at: new Date().toISOString(),
          },
          { onConflict: "article_id" }
        )
        .select()
        .single();

      if (!saveErr && saved) {
        results[item.id] = {
          summary_text: saved.summary_text,
          key_takeaways: saved.key_takeaways,
          generated_at: saved.generated_at,
          cached: false,
        };
      } else {
        // Fallback in-memory
        results[item.id] = {
          summary_text: generatedSummary,
          key_takeaways: generatedTakeaways,
          generated_at: new Date().toISOString(),
          cached: false,
        };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summaries: results,
        reused_count: Object.keys(results).length - generationQueue.length,
        generated_count: generationQueue.length,
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("summarize-articles error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
