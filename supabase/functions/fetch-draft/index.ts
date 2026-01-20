import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { getFeedsForCategory, CATEGORY_FEEDS } from "../_shared/rss-sources.ts";
import { 
  fetchAndParseFeed, 
  createItemHash, 
  filterByKeywords, 
  filterByDateRange,
  RawFeedItem 
} from "../_shared/rss-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ITEMS_PER_CATEGORY = 12;

// Month number to name mapping
const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// LLM fallback for when RSS fails
async function fetchWithLLM(
  category: string, 
  section: string,
  month: number, 
  year: number
): Promise<RawFeedItem[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.warn("No LOVABLE_API_KEY for LLM fallback");
    return [];
  }

  const monthName = MONTH_NAMES[month] || 'January';
  
  const systemPrompt = `You are an expert researcher compiling Indian current affairs for competitive exams.
Return a JSON array of news items from ${monthName} ${year} for the category: "${category}" (section: ${section}).

Each item must have:
- title: Clear headline (string)
- date: Approximate date like "15 ${monthName} ${year}" or "Early ${monthName} ${year}"
- snippet: 1-2 sentence description
- source: "AI Generated"

Return 8-12 items as a valid JSON array. If no relevant news, return [].
Output ONLY the JSON array, no extra text.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `List important ${category} news from India for ${monthName} ${year}. JSON array only.` },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.warn(`LLM fallback failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const items = JSON.parse(jsonMatch[0]);
    
    return items.map((item: any) => ({
      title: item.title || item.headline || "",
      url: "",
      source: "AI Generated",
      publishedAt: null,
      snippet: item.snippet || item.description || "",
    })).filter((item: RawFeedItem) => item.title);

  } catch (error) {
    console.error("LLM fallback error:", error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section, category, month, year, forceRefresh } = await req.json();

    if (!section || !category || !month || !year) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: section, category, month, year" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first (unless forceRefresh)
    if (!forceRefresh) {
      const { data: cachedItems } = await supabase
        .from("draft_items")
        .select("*")
        .eq("section", section)
        .eq("category", category)
        .eq("month", month)
        .eq("year", year)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(MAX_ITEMS_PER_CATEGORY);

      if (cachedItems && cachedItems.length > 0) {
        console.log(`Cache hit for ${section}/${category} ${month}/${year}: ${cachedItems.length} items`);
        return new Response(
          JSON.stringify({ 
            items: cachedItems, 
            source: "cache",
            count: cachedItems.length 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get feeds for this category
    const categoryFeeds = getFeedsForCategory(section, category);
    const feeds = categoryFeeds?.feeds || [];
    const keywords = categoryFeeds?.keywords || [];

    // Fetch all feeds in parallel
    console.log(`Fetching ${feeds.length} feeds for ${section}/${category}`);
    const feedPromises = feeds.map(feed => 
      fetchAndParseFeed(feed.url, feed.name)
    );
    const feedResults = await Promise.all(feedPromises);

    // Combine all items
    let allItems: RawFeedItem[] = feedResults.flat();
    console.log(`Fetched ${allItems.length} raw items from feeds`);

    // Filter by date range (skip for current month since RSS has recent items)
    const now = new Date();
    const isCurrentMonth = month === (now.getMonth() + 1) && year === now.getFullYear();
    
    if (!isCurrentMonth) {
      allItems = filterByDateRange(allItems, month, year);
      console.log(`After date filter: ${allItems.length} items`);
    } else {
      console.log(`Skipping date filter for current month, keeping ${allItems.length} items`);
    }

    // Skip keyword filtering - RSS sources are already category-specific
    // Keywords were filtering out too many valid items
    console.log(`Proceeding with ${allItems.length} items (keyword filter disabled)`);

    // Deduplicate by hash
    const seenHashes = new Set<string>();
    let uniqueItems: RawFeedItem[] = [];
    
    for (const item of allItems) {
      const hash = createItemHash(item.title, item.url);
      if (!seenHashes.has(hash)) {
        seenHashes.add(hash);
        uniqueItems.push(item);
      }
    }
    console.log(`After deduplication: ${uniqueItems.length} items`);

    // If RSS returned nothing, use LLM fallback
    let source = "rss";
    if (uniqueItems.length === 0) {
      console.log("RSS returned 0 items, trying LLM fallback...");
      const categoryName = categoryFeeds?.category || category;
      uniqueItems = await fetchWithLLM(categoryName, section, month, year);
      source = "llm";
      console.log(`LLM fallback returned ${uniqueItems.length} items`);
    }

    // Limit to max items
    const limitedItems = uniqueItems.slice(0, MAX_ITEMS_PER_CATEGORY);

    // Prepare for database insertion
    const dbItems = limitedItems.map(item => ({
      section,
      category,
      month,
      year,
      title: item.title,
      url: item.url || null,
      source: item.source,
      published_at: item.publishedAt?.toISOString() || null,
      snippet: item.snippet,
      hash: createItemHash(item.title, item.url || item.title),
    }));

    // Insert into database (upsert on hash)
    if (dbItems.length > 0) {
      const { error: insertError } = await supabase
        .from("draft_items")
        .upsert(dbItems, { 
          onConflict: "hash",
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error("Insert error:", insertError);
      }
    }

    // Fetch the inserted/updated items to return consistent data
    const { data: finalItems } = await supabase
      .from("draft_items")
      .select("*")
      .eq("section", section)
      .eq("category", category)
      .eq("month", month)
      .eq("year", year)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(MAX_ITEMS_PER_CATEGORY);

    return new Response(
      JSON.stringify({ 
        items: finalItems || [], 
        source,
        count: finalItems?.length || 0,
        feedsQueried: feeds.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in fetch-draft:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
