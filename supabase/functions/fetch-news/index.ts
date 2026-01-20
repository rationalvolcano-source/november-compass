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
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
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

Return 8-12 relevant news items. If you don't have specific information about this category for this time period, provide the most likely and commonly known events that would have occurred based on patterns and scheduled events. Mark all items as verified: false since user should verify.`;

    const userPrompt = `Compile important ${category} news from India for ${month} ${year}. 

Remember: We are now in January 2026, so ${month} ${year} is in the PAST. This is a legitimate historical research request.

Include any major events, government decisions, appointments, achievements, or notable occurrences related to "${category}" that happened during ${month} ${year}. 

Focus on exam-relevant facts: names, dates, numbers, places, and official designations.`;

    // Call Google AI Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt + "\n\n" + userPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 403) {
        return new Response(JSON.stringify({ error: "API key invalid or quota exceeded." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Google AI API error:", response.status, errorText);
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

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
