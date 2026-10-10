/**
 * Rang Healthcare — AI Enrichment Pipeline
 * PRD §12.1 step 5 and §14: Structured AI summary generation.
 * Uses Google Gemini 2.0 Flash (free tier).
 */

import {
  AI_CONFIG,
  VALID_CATEGORIES,
  IMPACT_STATUSES,
  type ValidCategory,
  type ImpactStatus,
} from "./constants.ts";

// ============================================================
// Types
// ============================================================
export interface ArticleInput {
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string | null;
  country: string;
  regions: string[];
  description: string | null;
  bodyText: string | null;
}

export interface AiSummaryOutput {
  quick_summary: string;
  detailed_summary: string;
  why_it_matters: string;
  recruiter_impact: string;
  impact_status: ImpactStatus;
  evidence_notes: string;
  primary_category: ValidCategory;
  tags: string[];
  country: string;
  regions: string[];
}

// ============================================================
// Prompt Construction (PRD §14: AI quality requirements)
// ============================================================
function buildPrompt(article: ArticleInput): string {
  const hasBody = article.bodyText && article.bodyText.length > 100;

  return `You are a healthcare news analyst for Rang Healthcare, a news intelligence service for US and Canadian healthcare recruiters.

TASK: Analyze the following healthcare news article and produce a structured summary. Your audience is busy healthcare recruiters and talent leaders.

ARTICLE METADATA:
- Title: ${article.title}
- Source: ${article.sourceName}
- URL: ${article.url}
- Published: ${article.publishedAt || "Unknown"}
- Country: ${article.country}
- Regions: ${article.regions.length > 0 ? article.regions.join(", ") : "Not specified"}
${article.description ? `- Description: ${article.description}` : ""}

${hasBody ? `ARTICLE TEXT (excerpt):\n${article.bodyText}\n` : "NOTE: Full article text is unavailable. Base your summary only on the metadata above. Clearly state that detailed analysis is limited due to insufficient source text."}

STRICT RULES:
1. Do NOT invent facts, quotations, figures, dates, links, publishers, or images.
2. Do NOT describe a source as official unless it is an official organization source.
3. Do NOT infer that a hospital's expansion guarantees hiring or that a closure necessarily causes layoffs.
4. SEPARATE reported facts from possible implications.
5. PRESERVE important qualifications, eligibility conditions, dates, and uncertainty.
6. Use plain, professional language suitable for a busy recruiter.
7. Avoid sensational headlines and clickbait.
8. Do NOT duplicate the article word-for-word; summarize in original language.
${!hasBody ? "9. Since full text is unavailable, produce a LIMITED summary and clearly note the evidence limitation." : ""}

IMPACT STATUS CLASSIFICATION:
- "confirmed": A source explicitly reports or documents the relevant workforce or hiring change.
- "potential": The story may matter to recruiters, but a direct hiring effect is not confirmed.
- "unclear": No meaningful implication can be supported from the available evidence.

VALID CATEGORIES (pick exactly one):
${VALID_CATEGORIES.map((c) => `- ${c}`).join("\n")}

Respond with ONLY a valid JSON object (no markdown, no code fences) matching this exact schema:
{
  "quick_summary": "2-3 concise sentences summarizing what happened.",
  "detailed_summary": "A readable multi-paragraph explanation with the main event, details, context, and next steps where known.",
  "why_it_matters": "Broader significance to the healthcare system.",
  "recruiter_impact": "Evidence-based recruiting relevance. Distinguish confirmed changes from plausible implications.",
  "impact_status": "confirmed | potential | unclear",
  "evidence_notes": "Brief explanation of the factual basis for your analysis. Note limitations.",
  "primary_category": "one of the valid categories above",
  "tags": ["3-6 relevant keywords"],
  "country": "US | CA | OTHER",
  "regions": ["relevant states/provinces if mentioned"]
}`;
}

// ============================================================
// Gemini API Call
// ============================================================
export async function generateSummary(
  article: ArticleInput
): Promise<AiSummaryOutput | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const prompt = buildPrompt(article);
  const url = `${AI_CONFIG.GEMINI_API_BASE}/${AI_CONFIG.MODEL_NAME}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: AI_CONFIG.TEMPERATURE,
      maxOutputTokens: AI_CONFIG.MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_ONLY_HIGH",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
    ],
  };

  // Retry loop with backoff for transient 429 / 503 (spikes in demand)
  let response: Response | null = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) break;

      if (response.status === 429 || response.status === 503) {
        console.warn(
          `[ai-enrichment] Gemini ${response.status} on attempt ${attempts}/${maxAttempts}. Backing off ${attempts * 2000}ms...`
        );
        await new Promise((r) => setTimeout(r, attempts * 2000));
        continue;
      }

      // Other non-transient errors
      const errorText = await response.text();
      throw new Error(
        `Gemini API error ${response.status}: ${errorText.slice(0, 200)}`
      );
    } catch (fetchErr) {
      if (attempts >= maxAttempts) throw fetchErr;
      await new Promise((r) => setTimeout(r, attempts * 2000));
    }
  }

  if (!response || !response.ok) {
    console.warn("[ai-enrichment] Gemini API temporarily busy. Deferring article to next run.");
    return null;
  }

  const data = await response.json();

  // Extract the generated text
  const generatedText =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

  if (!generatedText) {
    console.warn("[ai-enrichment] Empty response from Gemini API.");
    return null;
  }

  return validateAndParseSummary(generatedText);
}

// ============================================================
// Output Validation (PRD §12.1 step 6)
// ============================================================
function validateAndParseSummary(rawJson: string): AiSummaryOutput | null {
  try {
    // Clean potential markdown code fences
    const cleaned = rawJson
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (!parsed.quick_summary || typeof parsed.quick_summary !== "string") {
      console.warn("[ai-enrichment] Missing or invalid quick_summary");
      return null;
    }

    // Validate impact_status
    if (!IMPACT_STATUSES.includes(parsed.impact_status)) {
      parsed.impact_status = "unclear";
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(parsed.primary_category)) {
      parsed.primary_category = "other";
    }

    // Validate country
    if (!["US", "CA", "OTHER"].includes(parsed.country)) {
      parsed.country = "OTHER";
    }

    // Ensure arrays
    if (!Array.isArray(parsed.tags)) {
      parsed.tags = [];
    }
    if (!Array.isArray(parsed.regions)) {
      parsed.regions = [];
    }

    return {
      quick_summary: parsed.quick_summary,
      detailed_summary: parsed.detailed_summary || "",
      why_it_matters: parsed.why_it_matters || "",
      recruiter_impact: parsed.recruiter_impact || "",
      impact_status: parsed.impact_status,
      evidence_notes: parsed.evidence_notes || "",
      primary_category: parsed.primary_category,
      tags: parsed.tags.slice(0, 8), // Cap tags
      country: parsed.country,
      regions: parsed.regions.slice(0, 5), // Cap regions
    };
  } catch (error) {
    console.error(
      "[ai-enrichment] Failed to parse AI output:",
      (error as Error).message
    );
    console.error("[ai-enrichment] Raw output:", rawJson.slice(0, 300));
    return null;
  }
}
