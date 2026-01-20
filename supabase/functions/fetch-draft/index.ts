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
    
    if (!categoryFeeds) {
      // Fallback: try to find any feeds for the section
      const sectionFeeds = CATEGORY_FEEDS.filter(cf => cf.section === section);
      if (sectionFeeds.length === 0) {
        return new Response(
          JSON.stringify({ 
            items: [], 
            source: "rss", 
            count: 0,
            message: "No feeds configured for this category" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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

    // Filter by date range
    allItems = filterByDateRange(allItems, month, year);
    console.log(`After date filter: ${allItems.length} items`);

    // Filter by keywords (if any)
    if (keywords.length > 0) {
      allItems = filterByKeywords(allItems, keywords);
      console.log(`After keyword filter: ${allItems.length} items`);
    }

    // Deduplicate by hash
    const seenHashes = new Set<string>();
    const uniqueItems: RawFeedItem[] = [];
    
    for (const item of allItems) {
      const hash = createItemHash(item.title, item.url);
      if (!seenHashes.has(hash)) {
        seenHashes.add(hash);
        uniqueItems.push(item);
      }
    }
    console.log(`After deduplication: ${uniqueItems.length} items`);

    // Limit to max items
    const limitedItems = uniqueItems.slice(0, MAX_ITEMS_PER_CATEGORY);

    // Prepare for database insertion
    const dbItems = limitedItems.map(item => ({
      section,
      category,
      month,
      year,
      title: item.title,
      url: item.url,
      source: item.source,
      published_at: item.publishedAt?.toISOString() || null,
      snippet: item.snippet,
      hash: createItemHash(item.title, item.url),
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
        source: "rss",
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
