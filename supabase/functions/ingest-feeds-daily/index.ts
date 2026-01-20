import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { CATEGORY_FEEDS, getAllFeeds, Feed } from "../_shared/rss-sources.ts";
import { 
  fetchAndParseFeed, 
  createItemHash, 
  RawFeedItem 
} from "../_shared/rss-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ITEMS_PER_FEED = 50;
const FEED_CONCURRENCY = 3;
const DELAY_BETWEEN_BATCHES_MS = 1000;

/**
 * Daily ingestion job that fetches all feeds and stores items
 * This creates historical data for future months
 * 
 * Run via cron: Once or twice daily
 */

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current month/year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get all unique feeds
    const allFeeds = getAllFeeds();
    console.log(`Starting daily ingestion for ${allFeeds.length} unique feeds`);

    let totalItemsFetched = 0;
    let totalItemsInserted = 0;
    let feedsProcessed = 0;
    let feedsFailed = 0;
    const errors: string[] = [];

    // Process feeds in batches with concurrency limit
    for (let i = 0; i < allFeeds.length; i += FEED_CONCURRENCY) {
      const batch = allFeeds.slice(i, i + FEED_CONCURRENCY);
      
      const batchPromises = batch.map(async (feed) => {
        try {
          const items = await fetchAndParseFeed(feed.url, feed.name);
          
          if (items.length === 0) {
            console.log(`${feed.name}: 0 items`);
            return { feed, items: [], inserted: 0, error: null };
          }

          // Limit items per feed
          const limitedItems = items.slice(0, MAX_ITEMS_PER_FEED);
          
          // Find which categories use this feed
          const categoriesUsingFeed = CATEGORY_FEEDS.filter(
            cf => cf.feeds.some(f => f.id === feed.id)
          );

          let insertedCount = 0;

          // Insert items for each category that uses this feed
          for (const categoryConfig of categoriesUsingFeed) {
            const dbItems = limitedItems.map(item => ({
              section: categoryConfig.section,
              category: categoryConfig.category,
              month: item.publishedAt ? item.publishedAt.getMonth() + 1 : currentMonth,
              year: item.publishedAt ? item.publishedAt.getFullYear() : currentYear,
              title: item.title,
              url: item.url || null,
              source: item.source,
              published_at: item.publishedAt?.toISOString() || null,
              snippet: item.snippet || null,
              hash: createItemHash(item.title, item.url || item.title),
            }));

            const { error: insertError, count } = await supabase
              .from("draft_items")
              .upsert(dbItems, { 
                onConflict: "hash",
                ignoreDuplicates: true,
                count: 'exact'
              });

            if (insertError) {
              console.warn(`Insert error for ${feed.name} -> ${categoryConfig.section}/${categoryConfig.category}: ${insertError.message}`);
            } else {
              insertedCount += count || 0;
            }
          }

          console.log(`${feed.name}: ${limitedItems.length} items fetched, ${insertedCount} inserted across ${categoriesUsingFeed.length} categories`);
          return { feed, items: limitedItems, inserted: insertedCount, error: null };

        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          console.error(`Failed to process ${feed.name}: ${errMsg}`);
          return { feed, items: [], inserted: 0, error: errMsg };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        feedsProcessed++;
        totalItemsFetched += result.items.length;
        totalItemsInserted += result.inserted;
        if (result.error) {
          feedsFailed++;
          errors.push(`${result.feed.name}: ${result.error}`);
        }
      }

      // Delay between batches to avoid rate limiting
      if (i + FEED_CONCURRENCY < allFeeds.length) {
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    }

    const duration = Date.now() - startTime;

    console.log(`Daily ingestion complete in ${duration}ms`);
    console.log(`Feeds: ${feedsProcessed} processed, ${feedsFailed} failed`);
    console.log(`Items: ${totalItemsFetched} fetched, ${totalItemsInserted} inserted/updated`);

    return new Response(
      JSON.stringify({
        success: true,
        duration_ms: duration,
        feeds_processed: feedsProcessed,
        feeds_failed: feedsFailed,
        items_fetched: totalItemsFetched,
        items_inserted: totalItemsInserted,
        month: currentMonth,
        year: currentYear,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit errors in response
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ingest-feeds-daily:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration_ms: Date.now() - startTime
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
