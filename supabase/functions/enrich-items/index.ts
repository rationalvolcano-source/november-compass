import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ITEMS_PER_REQUEST = 5;
const PROMPT_VERSION = 1;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header for user identification
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { draft_ids } = await req.json();

    if (!draft_ids || !Array.isArray(draft_ids) || draft_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: draft_ids (array)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (draft_ids.length > MAX_ITEMS_PER_REQUEST) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_ITEMS_PER_REQUEST} items per request` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check entitlement and usage
    const { data: entitlement } = await supabaseAdmin
      .rpc("get_user_entitlement", { p_user_id: user.id });
    
    const plan = entitlement?.[0]?.plan || "free";
    const dailyQuota = entitlement?.[0]?.enrich_quota_daily || 10;

    // Get today's usage
    const { data: usage } = await supabaseAdmin
      .rpc("get_or_create_daily_usage", { p_user_id: user.id });
    
    const currentEnrichCount = usage?.enrich_count || 0;
    const remainingQuota = dailyQuota - currentEnrichCount;

    if (remainingQuota < draft_ids.length) {
      return new Response(
        JSON.stringify({ 
          error: `Daily enrichment limit reached. Remaining: ${remainingQuota}, Requested: ${draft_ids.length}`,
          remaining_quota: remainingQuota,
          plan
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get draft items
    const { data: draftItems, error: draftError } = await supabaseAdmin
      .from("draft_items")
      .select("*")
      .in("id", draft_ids);

    if (draftError || !draftItems || draftItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Draft items not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which items are already enriched
    const { data: existingEnrichments } = await supabaseAdmin
      .from("enriched_items")
      .select("draft_id, summary, exam_points, mcqs")
      .in("draft_id", draft_ids);

    const existingMap = new Map(
      (existingEnrichments || []).map(e => [e.draft_id, e])
    );

    // Filter items that need enrichment
    const itemsToEnrich = draftItems.filter(item => !existingMap.has(item.id));
    
    if (itemsToEnrich.length === 0) {
      // All items already enriched, return cached
      return new Response(
        JSON.stringify({ 
          enrichments: draft_ids.map(id => ({
            draft_id: id,
            ...existingMap.get(id)
          })),
          source: "cache",
          credits_used: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Lovable API key for LLM
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enrich items one by one to avoid rate limits
    const enrichments: any[] = [];
    const errors: any[] = [];

    for (const item of itemsToEnrich) {
      try {
        const enrichment = await enrichSingleItem(item, LOVABLE_API_KEY);
        
        // Store in database
        const { error: insertError } = await supabaseAdmin
          .from("enriched_items")
          .insert({
            draft_id: item.id,
            summary: enrichment.summary,
            exam_points: enrichment.exam_points,
            mcqs: enrichment.mcqs || null,
            model: "google/gemini-3-flash-preview",
            prompt_version: PROMPT_VERSION,
          });

        if (insertError) {
          console.error("Insert error:", insertError);
          errors.push({ draft_id: item.id, error: insertError.message });
        } else {
          enrichments.push({
            draft_id: item.id,
            ...enrichment
          });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error enriching item ${item.id}:`, error);
        errors.push({ 
          draft_id: item.id, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    // Increment usage
    await supabaseAdmin.rpc("increment_usage", {
      p_user_id: user.id,
      p_field: "enrich_count",
      p_amount: enrichments.length
    });

    // Add cached items to response
    for (const id of draft_ids) {
      if (existingMap.has(id) && !enrichments.find(e => e.draft_id === id)) {
        enrichments.push({
          draft_id: id,
          ...existingMap.get(id)
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        enrichments,
        errors: errors.length > 0 ? errors : undefined,
        source: "llm",
        credits_used: enrichments.length,
        remaining_quota: remainingQuota - enrichments.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in enrich-items:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function enrichSingleItem(item: any, apiKey: string): Promise<{
  summary: string;
  exam_points: string[];
  mcqs?: any[];
}> {
  const systemPrompt = `You are an expert at creating exam-focused summaries for Indian competitive exams (UPSC, SSC, Banking, State PSCs).

For each news item, provide:
1. A concise 2-3 line summary focused on what's exam-relevant
2. 3-5 key exam pointers (facts that could appear in MCQs)

Output ONLY valid JSON in this exact format:
{
  "summary": "2-3 line exam-focused summary",
  "exam_points": ["Point 1", "Point 2", "Point 3"]
}`;

  const userPrompt = `News Item:
Title: ${item.title}
Source: ${item.source}
Date: ${item.published_at || "Unknown"}
Snippet: ${item.snippet || "No additional details"}

Create an exam-focused summary and key points for this news item.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add credits.");
    }
    
    throw new Error(`AI service error: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? "";

  try {
    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || "Summary not available",
        exam_points: Array.isArray(parsed.exam_points) ? parsed.exam_points : [],
        mcqs: parsed.mcqs,
      };
    }
  } catch (parseError) {
    console.error("Parse error:", parseError, { content });
  }

  // Fallback
  return {
    summary: item.snippet || item.title,
    exam_points: [item.title],
  };
}
