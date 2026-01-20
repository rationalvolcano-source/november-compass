import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { getFeedsForCategory, Feed } from "../_shared/rss-sources.ts";
import { 
  fetchAndParseFeed, 
  createItemHash, 
  filterByDateRange,
  RawFeedItem 
} from "../_shared/rss-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ITEMS_PER_CATEGORY = 25;
const FEED_CONCURRENCY_LIMIT = 4;

/**
 * Fetch feeds with concurrency limit
 */
async function fetchFeedsWithConcurrency(
  feeds: Feed[],
  limit: number
): Promise<RawFeedItem[]> {
  const results: RawFeedItem[] = [];
  
  // Process feeds in batches
  for (let i = 0; i < feeds.length; i += limit) {
    const batch = feeds.slice(i, i + limit);
    const batchPromises = batch.map(feed => 
      fetchAndParseFeed(feed.url, feed.name)
        .then(items => items.map(item => ({
          ...item,
          weight: feed.weight || 5, // Attach weight for ranking
        })))
        .catch(err => {
          console.warn(`Failed to fetch ${feed.name}: ${err.message}`);
          return [];
        })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());
  }
  
  return results;
}

/**
 * Normalize URL for deduplication (remove tracking params, fragments)
 */
function normalizeUrl(url: string): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    // Remove common tracking params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'source'];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    urlObj.hash = '';
    return urlObj.toString().toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Enhanced deduplication with URL normalization
 */
function deduplicateItems(items: RawFeedItem[]): RawFeedItem[] {
  const seenHashes = new Set<string>();
  const seenUrls = new Set<string>();
  const unique: RawFeedItem[] = [];
  
  for (const item of items) {
    const hash = createItemHash(item.title, item.url);
    const normalizedUrl = normalizeUrl(item.url);
    
    // Check both hash and normalized URL
    if (!seenHashes.has(hash) && (!normalizedUrl || !seenUrls.has(normalizedUrl))) {
      seenHashes.add(hash);
      if (normalizedUrl) seenUrls.add(normalizedUrl);
      unique.push(item);
    }
  }
  
  return unique;
}

/**
 * Rank items by source weight and recency
 */
function rankItems(items: RawFeedItem[], keywords: string[]): RawFeedItem[] {
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  
  return items.sort((a, b) => {
    // 1. Prefer primary sources (higher weight)
    const weightA = (a as any).weight || 5;
    const weightB = (b as any).weight || 5;
    if (weightB !== weightA) return weightB - weightA;
    
    // 2. Prefer items with longer snippets
    const snippetLenA = (a.snippet || '').length;
    const snippetLenB = (b.snippet || '').length;
    if (Math.abs(snippetLenA - snippetLenB) > 50) {
      return snippetLenB - snippetLenA;
    }
    
    // 3. Prefer items matching category keywords
    if (lowerKeywords.length > 0) {
      const textA = (a.title + ' ' + a.snippet).toLowerCase();
      const textB = (b.title + ' ' + b.snippet).toLowerCase();
      const matchesA = lowerKeywords.filter(k => textA.includes(k)).length;
      const matchesB = lowerKeywords.filter(k => textB.includes(k)).length;
      if (matchesB !== matchesA) return matchesB - matchesA;
    }
    
    // 4. Prefer more recent items
    const dateA = a.publishedAt?.getTime() || 0;
    const dateB = b.publishedAt?.getTime() || 0;
    return dateB - dateA;
  });
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

    // Determine if this is current month
    const now = new Date();
    const isCurrentMonth = month === (now.getMonth() + 1) && year === now.getFullYear();

    // For older months: ONLY query DB (RSS won't have historical data)
    if (!isCurrentMonth && !forceRefresh) {
      const { data: cachedItems } = await supabase
        .from("draft_items")
        .select("*")
        .eq("section", section)
        .eq("category", category)
        .eq("month", month)
        .eq("year", year)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(MAX_ITEMS_PER_CATEGORY);

      console.log(`Historical month ${month}/${year}: returning ${cachedItems?.length || 0} cached items`);
      return new Response(
        JSON.stringify({ 
          items: cachedItems || [], 
          source: "cache",
          count: cachedItems?.length || 0,
          message: isCurrentMonth ? undefined : "Historical months use cached data only. Use daily ingestion to build archive."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache first for current month (unless forceRefresh)
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

      if (cachedItems && cachedItems.length >= 5) {
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
    const categoryConfig = getFeedsForCategory(section, category);
    const feeds = categoryConfig?.feeds || [];
    const keywords = categoryConfig?.keywords || [];

    if (feeds.length === 0) {
      console.warn(`No feeds configured for ${section}/${category}`);
      return new Response(
        JSON.stringify({ 
          items: [], 
          source: "none",
          count: 0,
          error: "No feeds configured for this category"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all feeds with concurrency limit
    console.log(`Fetching ${feeds.length} feeds for ${section}/${category} with concurrency ${FEED_CONCURRENCY_LIMIT}`);
    let allItems = await fetchFeedsWithConcurrency(feeds, FEED_CONCURRENCY_LIMIT);
    console.log(`Fetched ${allItems.length} raw items from ${feeds.length} feeds`);

    // Filter by date range for current month (skip for forceRefresh to get latest)
    if (!forceRefresh) {
      allItems = filterByDateRange(allItems, month, year);
      console.log(`After date filter: ${allItems.length} items`);
    }

    // Deduplicate
    let uniqueItems = deduplicateItems(allItems);
    console.log(`After deduplication: ${uniqueItems.length} items`);

    // Rank items (primary sources first, longer snippets, keyword matches)
    uniqueItems = rankItems(uniqueItems, keywords);

    // Limit to max items
    const limitedItems = uniqueItems.slice(0, MAX_ITEMS_PER_CATEGORY);
    console.log(`Returning top ${limitedItems.length} items`);

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
      snippet: item.snippet || null,
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
        source: "rss",
        count: finalItems?.length || 0,
        feedsQueried: feeds.length,
        feedNames: feeds.map(f => f.name)
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
