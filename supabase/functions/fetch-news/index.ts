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

    const systemPrompt = `You are an expert researcher for Indian competitive exams (UPSC, SSC, Banking). 
Your task is to find REAL, VERIFIABLE news articles from ${month} ${year} for the category: "${category}".

CRITICAL RULES:
1. Only include news that actually happened in ${month} ${year}
2. Focus on government announcements, official data, appointments, and policy decisions
3. Include specific dates, names, figures, and official sources
4. Format each news item with: headline, date, key facts, and source reference
5. Prioritize exam-relevant facts: names, numbers, dates, places, ministries involved

Return a JSON array with this structure:
[
  {
    "headline": "Clear, factual headline",
    "date": "DD Month YYYY",
    "description": "2-3 line context paragraph",
    "examHints": {
      "what": "Key action/event",
      "who": "Person/Organization involved",
      "where": "Location",
      "when": "Specific date",
      "why": "Purpose/significance",
      "numbers": ["Any relevant figures, amounts, percentages"],
      "ministry": "Implementing ministry/agency",
      "relatedSchemes": ["Related schemes/acts/missions"]
    },
    "source": "Official source reference",
    "verified": false
  }
]

Return 8-12 news items per category. Be factual and precise.`;

    const userPrompt = `Find the most important and exam-relevant news for the category "${category}" from ${month} ${year} in India. 
Focus on:
- Government decisions and policies
- Official appointments and resignations
- Economic data and budget allocations
- International relations and agreements
- Awards and recognitions
- Scientific achievements
- Sports achievements

Return only verifiable facts with specific dates and figures.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse JSON from the response
    let newsItems = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        newsItems = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse news items:", parseError);
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
