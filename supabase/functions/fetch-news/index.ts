import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, month, year } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Current date is January 2026, so we're looking for PAST news from 2025
    const systemPrompt = `You are an expert researcher specializing in Indian current affairs for competitive exams (UPSC, SSC, Banking, State PSCs).

IMPORTANT CONTEXT: The current date is January 2026. You are being asked to recall and compile HISTORICAL news events that occurred in ${month} ${year}. This is a legitimate request for past events, not future prediction.

Your task is to compile important news events from ${month} ${year} for the category: "${category}"

Focus on:
- Major government announcements and policies
- Official appointments and resignations
- Economic indicators and budget allocations
- International agreements and visits
- Awards and recognitions
- Scientific/technological achievements
- Sports results and achievements
- Any significant events in this category

For each news item, provide:
- A clear, factual headline
- The approximate date (use format like "Early November 2025" or "15 November 2025")
- A brief description (2-3 sentences)
- Key facts formatted for exam preparation

Return your response as a JSON array with this exact structure:
[
  {
    "headline": "Clear headline about the event",
    "date": "Date or approximate period",
    "description": "Brief context paragraph explaining what happened",
    "examHints": {
      "what": "The main action or event",
      "who": "Key people or organizations involved",
      "where": "Location",
      "when": "Specific timing",
      "why": "Significance or purpose",
      "numbers": ["Key figures, amounts, percentages"],
      "ministry": "Relevant ministry or agency",
      "relatedSchemes": ["Related government schemes or acts"]
    },
    "source": "PIB/Government source/News agency",
    "verified": false
  }
]

Return 8-12 relevant news items. If you don't have specific information about this category for this time period, say so and return an empty array [] (do not invent events). Mark all items as verified: false since user should verify.`;

    const userPrompt = `Compile important ${category} news from India for ${month} ${year}.

Remember: We are now in January 2026, so ${month} ${year} is in the PAST.

Include major events, government decisions, appointments, achievements, or notable occurrences related to "${category}".

Output ONLY the JSON array, no extra text.`;

    const gatewayResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    // Surface gateway rate-limit/credits errors to the client
    if (!gatewayResp.ok) {
      const text = await gatewayResp.text();

      if (gatewayResp.status === 429) {
        return new Response(JSON.stringify({
          error: "AI rate limit exceeded. Please wait a moment and try again.",
          details: text,
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (gatewayResp.status === 402) {
        return new Response(JSON.stringify({
          error: "AI usage limit reached. Please add credits in Settings → Workspace → Usage.",
          details: text,
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle transient 503 errors gracefully
      if (gatewayResp.status === 503) {
        return new Response(JSON.stringify({
          error: "AI service temporarily unavailable. Please try again in a few seconds.",
          details: text,
        }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.error("AI gateway error:", gatewayResp.status, text);
      return new Response(JSON.stringify({
        error: `AI service error. Please try again.`,
        details: text,
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await gatewayResp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    let newsItems: any[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        newsItems = JSON.parse(jsonMatch[0]);
      } else {
        // If model returned strict JSON without extra text, it will still match; otherwise treat as empty.
        newsItems = [];
      }
    } catch (parseError) {
      console.error("Failed to parse news items:", parseError, { content });
      newsItems = [];
    }

    return new Response(JSON.stringify({ news: newsItems, raw: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-news:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
