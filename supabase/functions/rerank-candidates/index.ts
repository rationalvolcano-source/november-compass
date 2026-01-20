import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { computeCandidateSetHash, Candidate } from "../_shared/candidate-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_CANDIDATES_FOR_RERANK = 120;
const SELECTION_SIZE = 20;
const PROMPT_VERSION = 1;

interface GeminiMessage {
  role: string;
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text: string }[];
    };
    finishReason?: string;
  }[];
  error?: {
    message: string;
    code: number;
  };
}

// Category descriptions for context
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'cabinet-approvals': 'Decisions and approvals by the Union Cabinet of India',
  'government-schemes': 'Government welfare schemes, yojanas, and missions launched or modified',
  'launches-inaugurations': 'Projects, infrastructure, and initiatives inaugurated or launched',
  'rbi-news': 'RBI policy decisions, notifications, interest rates, and banking regulations',
  'sebi-news': 'SEBI regulations, market policies, and securities-related decisions',
  'defence-exercises': 'Military exercises and drills conducted by Indian armed forces',
  'defence-news': 'Defence policy, armed forces news, and security matters',
  'space': 'ISRO missions, satellite launches, and space technology',
  'rankings': 'India\'s position in global indices and rankings',
  'national-awards': 'Padma awards, Bharat Ratna, and national honors',
  'summits': 'International summits like G20, BRICS, SCO attended by India',
};

/**
 * Call Gemini API for reranking
 */
async function callGeminiForSelection(
  apiKey: string,
  category: string,
  categoryDescription: string,
  candidates: Candidate[]
): Promise<string[]> {
  const url = "https://ai.gateway.lovable.dev/v1/chat/completions";
  
  // Build compact candidate list
  const candidateList = candidates.map((c, i) => 
    `[${i}] ${c.id.substring(0, 8)} | ${c.title.substring(0, 80)} | ${c.source} | ${c.published_at?.substring(0, 10) || 'unknown'}`
  ).join('\n');

  const systemPrompt = `You are a news curator for Indian competitive exams (UPSC, SSC, Banking).
Select the ${SELECTION_SIZE} most exam-relevant articles for the category: "${category}".
Category definition: ${categoryDescription}

IMPORTANT RULES:
1. Return ONLY a JSON array of candidate indices (0-based)
2. Prefer official government sources (PIB, RBI, SEBI, PRS)
3. Prefer recent news with clear exam relevance
4. Avoid duplicates or similar articles
5. Focus on facts, policies, appointments, not opinions
6. NO explanation, NO markdown, ONLY the JSON array`;

  const userPrompt = `Select top ${SELECTION_SIZE} from these ${candidates.length} candidates:\n\n${candidateList}\n\nRespond with ONLY a JSON array like: [0, 5, 12, ...]`;

  const body = {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 500,
  };

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429 || response.status === 503) {
        console.log(`Gemini rate limited (attempt ${attempts}), waiting...`);
        await new Promise(r => setTimeout(r, 2000 * attempts));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Parse JSON array from response
      const jsonMatch = content.match(/\[[\d,\s]+\]/);
      if (!jsonMatch) {
        console.error("No JSON array in Gemini response:", content);
        throw new Error("Invalid Gemini response format");
      }

      const indices: number[] = JSON.parse(jsonMatch[0]);
      
      // Validate indices and convert to candidate IDs
      const validIndices = indices.filter(i => i >= 0 && i < candidates.length);
      const selectedIds = validIndices.map(i => candidates[i].id);
      
      if (selectedIds.length === 0) {
        throw new Error("No valid selections from Gemini");
      }

      return selectedIds;

    } catch (e) {
      if (attempts >= maxAttempts) throw e;
      console.error(`Gemini attempt ${attempts} failed:`, e);
      await new Promise(r => setTimeout(r, 1000 * attempts));
    }
  }

  throw new Error("All Gemini attempts failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { year, month, section, category } = await req.json();

    if (!year || !month || !section || !category) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: year, month, section, category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Load candidates from DB
    const { data: candidates, error: candidateError } = await supabase
      .from("candidates")
      .select("*")
      .eq("year", year)
      .eq("month", month)
      .eq("section", section)
      .eq("category", category)
      .order("published_at", { ascending: false })
      .limit(MAX_CANDIDATES_FOR_RERANK);

    if (candidateError) {
      throw new Error(`Failed to fetch candidates: ${candidateError.message}`);
    }

    if (!candidates || candidates.length === 0) {
      return new Response(
        JSON.stringify({ 
          items: [], 
          source: "empty",
          message: "No candidates found. Run fetch-candidates first." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Loaded ${candidates.length} candidates for reranking`);

    // Step 2: Compute candidate set hash
    const candidateIds = candidates.map((c: Candidate) => c.id);
    const setHash = await computeCandidateSetHash(candidateIds);

    // Step 3: Check for cached selection
    const { data: existingSelection } = await supabase
      .from("selections")
      .select("*")
      .eq("year", year)
      .eq("month", month)
      .eq("section", section)
      .eq("category", category)
      .eq("candidate_set_hash", setHash)
      .eq("prompt_version", PROMPT_VERSION)
      .single();

    if (existingSelection) {
      console.log("Using cached selection");
      const selectedIds = existingSelection.selected_ids as string[];
      
      // Return candidates matching selected IDs in order
      const candidateMap = new Map(candidates.map((c: Candidate) => [c.id, c]));
      const selectedCandidates = selectedIds
        .map((id: string) => candidateMap.get(id))
        .filter(Boolean);

      return new Response(
        JSON.stringify({
          items: selectedCandidates,
          source: "cache",
          selectionId: existingSelection.id,
          candidateCount: candidates.length,
          selectedCount: selectedCandidates.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Call Gemini for reranking
    console.log("Calling Gemini for selection...");
    const categoryDesc = CATEGORY_DESCRIPTIONS[category] || `News items related to ${category}`;
    const selectedIds = await callGeminiForSelection(
      lovableApiKey,
      category,
      categoryDesc,
      candidates as Candidate[]
    );

    console.log(`Gemini selected ${selectedIds.length} items`);

    // Step 5: Store selection in DB
    const { data: newSelection, error: insertError } = await supabase
      .from("selections")
      .insert({
        year,
        month,
        section,
        category,
        selected_ids: selectedIds,
        candidate_set_hash: setHash,
        prompt_version: PROMPT_VERSION,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing selection:", insertError);
      // Continue anyway - we have the selection
    }

    // Step 6: Return selected candidates
    const candidateMap = new Map(candidates.map((c: Candidate) => [c.id, c]));
    const selectedCandidates = selectedIds
      .map(id => candidateMap.get(id))
      .filter(Boolean);

    return new Response(
      JSON.stringify({
        items: selectedCandidates,
        source: "fresh",
        selectionId: newSelection?.id,
        candidateCount: candidates.length,
        selectedCount: selectedCandidates.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in rerank-candidates:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
