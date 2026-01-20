import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { fetchAndParseFeed, RawFeedItem } from "../_shared/rss-parser.ts";
import { getFeedsForCategory, Feed } from "../_shared/rss-sources.ts";
import { fetchGdeltArticles, parseGdeltDate } from "../_shared/gdelt-client.ts";
import { searchSerper, getSearchQueries, monthNumberToName } from "../_shared/serper-client.ts";
import { hashCandidate, deduplicateCandidates, sortCandidates, Candidate } from "../_shared/candidate-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CANDIDATE_THRESHOLD = 30; // If we have this many, skip external fetch
const MAX_CANDIDATES_RETURN = 80; // Max candidates to return
const FEED_CONCURRENCY = 4;
const MAX_SERPER_QUERIES = 2; // Limit search API calls

/**
 * Fetch multiple RSS feeds with concurrency limit
 */
async function fetchFeedsWithConcurrency(
  feeds: Feed[],
  limit: number
): Promise<RawFeedItem[]> {
  const results: RawFeedItem[] = [];
  
  for (let i = 0; i < feeds.length; i += limit) {
    const batch = feeds.slice(i, i + limit);
    const batchResults = await Promise.allSettled(
      batch.map(feed => fetchAndParseFeed(feed.url, feed.name, feed.weight))
    );
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(...result.value);
      }
    }
  }
  
  return results;
}

/**
 * Convert RSS items to candidates
 */
async function rssItemsToCandidates(
  items: RawFeedItem[],
  section: string,
  category: string,
  year: number,
  month: number
): Promise<Candidate[]> {
  const candidates: Candidate[] = [];
  
  for (const item of items) {
    // Convert Date to ISO string for hashing and storage
    const publishedAtStr = item.publishedAt ? item.publishedAt.toISOString() : null;
    const id = await hashCandidate(item.url, item.title, item.source, publishedAtStr);
    candidates.push({
      id,
      year,
      month,
      section,
      category,
      title: item.title,
      url: item.url || null,
      source: item.source,
      snippet: item.snippet || null,
      published_at: publishedAtStr,
      provider: 'rss',
    });
  }
  
  return candidates;
}

/**
 * Check if month is current or future
 */
function isCurrentOrFutureMonth(year: number, month: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year > currentYear) return true;
  if (year === currentYear && month >= currentMonth) return true;
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { year, month, section, category, forceRefresh = false } = await req.json();

    if (!year || !month || !section || !category) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: year, month, section, category" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serperKey = Deno.env.get("SERPER_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Check existing candidates in DB
    const { data: existingCandidates, error: fetchError } = await supabase
      .from("candidates")
      .select("*")
      .eq("year", year)
      .eq("month", month)
      .eq("section", section)
      .eq("category", category)
      .order("published_at", { ascending: false })
      .limit(200);

    if (fetchError) {
      console.error("Error fetching existing candidates:", fetchError);
    }

    const existingCount = existingCandidates?.length || 0;
    console.log(`Found ${existingCount} existing candidates for ${section}/${category} ${month}/${year}`);

    // If we have enough candidates and not forcing refresh, return them
    if (!forceRefresh && existingCount >= CANDIDATE_THRESHOLD) {
      const sorted = sortCandidates(existingCandidates as Candidate[]);
      return new Response(
        JSON.stringify({
          candidates: sorted.slice(0, MAX_CANDIDATES_RETURN),
          source: "cache",
          total: existingCount,
          fetched: { rss: 0, gdelt: 0, serper: 0 },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Fetch from multiple sources
    const newCandidates: Candidate[] = [];
    const fetchStats = { rss: 0, gdelt: 0, serper: 0 };

    // 2a: RSS feeds (always for current months)
    if (isCurrentOrFutureMonth(year, month)) {
      const categoryConfig = getFeedsForCategory(section, category);
      if (categoryConfig && categoryConfig.feeds.length > 0) {
        console.log(`Fetching ${categoryConfig.feeds.length} RSS feeds...`);
        const rssItems = await fetchFeedsWithConcurrency(categoryConfig.feeds, FEED_CONCURRENCY);
        const rssCandidates = await rssItemsToCandidates(rssItems, section, category, year, month);
        newCandidates.push(...rssCandidates);
        fetchStats.rss = rssCandidates.length;
        console.log(`Got ${rssCandidates.length} candidates from RSS`);
      }
    }

    // 2b: GDELT (for historical months or if RSS didn't yield enough)
    const needMoreCandidates = existingCount + newCandidates.length < CANDIDATE_THRESHOLD;
    if (!isCurrentOrFutureMonth(year, month) || needMoreCandidates) {
      console.log("Fetching from GDELT...");
      const gdeltArticles = await fetchGdeltArticles(year, month, category, 50);
      
      for (const article of gdeltArticles) {
        const publishedAt = parseGdeltDate(article.seendate);
        const id = await hashCandidate(article.url, article.title, article.domain, publishedAt);
        newCandidates.push({
          id,
          year,
          month,
          section,
          category,
          title: article.title,
          url: article.url,
          source: article.domain,
          snippet: null,
          published_at: publishedAt,
          provider: 'gdelt',
        });
      }
      fetchStats.gdelt = gdeltArticles.length;
      console.log(`Got ${gdeltArticles.length} candidates from GDELT`);
    }

    // 2c: Serper.dev (if still need more and API key is available)
    const stillNeedMore = existingCount + newCandidates.length < CANDIDATE_THRESHOLD;
    if (stillNeedMore && serperKey) {
      console.log("Fetching from Serper.dev...");
      const monthName = monthNumberToName(month);
      const queries = getSearchQueries(category, monthName, year);
      
      for (let i = 0; i < Math.min(queries.length, MAX_SERPER_QUERIES); i++) {
        try {
          const results = await searchSerper(queries[i], serperKey, { num: 15 });
          
          for (const result of results) {
            const id = await hashCandidate(result.link, result.title, result.source || 'serper', result.date);
            newCandidates.push({
              id,
              year,
              month,
              section,
              category,
              title: result.title,
              url: result.link,
              source: result.source || 'web',
              snippet: result.snippet || null,
              published_at: result.date ? new Date(result.date).toISOString() : null,
              provider: 'serper',
            });
            fetchStats.serper++;
          }
        } catch (e) {
          console.error(`Serper query failed: ${queries[i]}`, e);
        }
      }
      console.log(`Got ${fetchStats.serper} candidates from Serper`);
    }

    // Step 3: Deduplicate and insert
    if (newCandidates.length > 0) {
      const uniqueNew = deduplicateCandidates(newCandidates);
      console.log(`Inserting ${uniqueNew.length} unique candidates...`);
      
      // Upsert to handle duplicates gracefully
      const { error: insertError } = await supabase
        .from("candidates")
        .upsert(
          uniqueNew.map(c => ({
            id: c.id,
            year: c.year,
            month: c.month,
            section: c.section,
            category: c.category,
            title: c.title,
            url: c.url,
            source: c.source,
            snippet: c.snippet,
            published_at: c.published_at,
            provider: c.provider,
          })),
          { onConflict: 'id', ignoreDuplicates: true }
        );

      if (insertError) {
        console.error("Error inserting candidates:", insertError);
      }
    }

    // Step 4: Fetch final candidate list
    const { data: finalCandidates, error: finalError } = await supabase
      .from("candidates")
      .select("*")
      .eq("year", year)
      .eq("month", month)
      .eq("section", section)
      .eq("category", category)
      .order("published_at", { ascending: false })
      .limit(200);

    if (finalError) {
      throw new Error(`Failed to fetch final candidates: ${finalError.message}`);
    }

    const sorted = sortCandidates((finalCandidates || []) as Candidate[]);

    return new Response(
      JSON.stringify({
        candidates: sorted.slice(0, MAX_CANDIDATES_RETURN),
        source: "fresh",
        total: sorted.length,
        fetched: fetchStats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in fetch-candidates:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
