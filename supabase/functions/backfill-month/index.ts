import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { CATEGORY_FEEDS } from "../_shared/rss-sources.ts";
import { createItemHash } from "../_shared/rss-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ITEMS_PER_CATEGORY = 30;

/**
 * GDELT DOC 2.1 API - Free news archive with date range queries
 * https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 */

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

// Category to GDELT search terms mapping
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // National
  'national::cabinet-approvals': ['India cabinet', 'Union cabinet approval', 'Modi government decision'],
  'national::government-schemes': ['India government scheme', 'PM Modi scheme launch', 'India welfare program'],
  'national::launches-inaugurations': ['India inaugurate', 'PM Modi launch', 'foundation stone India'],
  'national::statewise-news': ['India state government', 'chief minister India'],
  'national::festivals': ['India festival celebration', 'Diwali India', 'national festival India'],
  'national::other-national': ['India national news', 'India government'],
  
  // International
  'international::visits-to-india': ['state visit India', 'foreign leader India visit'],
  'international::foreign-visits': ['PM Modi foreign visit', 'India minister abroad'],
  'international::bilateral-multilateral': ['India bilateral agreement', 'India G20', 'India BRICS', 'India QUAD'],
  'international::international-news': ['India foreign policy', 'India international'],
  
  // Banking & Finance
  'banking-finance::rbi-news': ['RBI Reserve Bank India', 'RBI policy', 'RBI governor'],
  'banking-finance::sebi-news': ['SEBI India', 'SEBI regulation'],
  'banking-finance::bank-loans': ['India bank loan', 'RBI interest rate'],
  'banking-finance::finance-news': ['India budget', 'India finance ministry', 'GST India'],
  
  // Economy & Business
  'economy-business::gdp-growth': ['India GDP growth', 'India economic growth'],
  'economy-business::economy-news': ['India economy', 'India trade', 'India export import'],
  'economy-business::business-news': ['India business', 'India startup', 'India corporate'],
  
  // Defence
  'defence::defence-exercises': ['India military exercise', 'India joint exercise'],
  'defence::defence-acquisitions': ['India defence deal', 'India military procurement'],
  'defence::defence-news': ['India defence', 'Indian Army Navy Air Force'],
  
  // Science & Tech
  'science-tech::space': ['ISRO India', 'India space mission', 'India satellite launch'],
  'science-tech::technology': ['India technology', 'India digital', 'India AI'],
  'science-tech::science-discoveries': ['India science research', 'India scientist discovery'],
  
  // Sports
  'sports::cricket': ['India cricket', 'BCCI', 'India vs cricket'],
  'sports::football': ['India football', 'ISL India'],
  'sports::tennis': ['India tennis'],
  'sports::badminton': ['India badminton', 'PV Sindhu'],
  'sports::chess': ['India chess', 'Praggnanandhaa'],
  'sports::athletics': ['India Olympics', 'India athletics'],
  
  // Awards
  'awards::sports-awards': ['India sports award', 'Arjuna award', 'Khel Ratna'],
  'awards::national-awards': ['Padma award India', 'Bharat Ratna'],
  'awards::international-awards': ['India Nobel', 'India international award'],
  
  // Environment
  'environment::environment-news': ['India environment', 'India pollution', 'India climate'],
  'environment::climate-change': ['India climate change', 'India carbon emission', 'India renewable'],
  
  // Default
  'default': ['India news', 'India government'],
};

/**
 * Build GDELT query URL
 * Using GDELT DOC 2.0 API
 */
function buildGdeltUrl(keywords: string[], startDate: string, endDate: string): string {
  // Use simpler query format
  const query = keywords[0]; // Use primary keyword
  const params = new URLSearchParams({
    query: query,
    mode: 'artlist',
    maxrecords: '75',
    format: 'json',
    startdatetime: startDate,
    enddatetime: endDate,
  });
  
  return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
}

/**
 * Fetch from GDELT API
 */
async function fetchGdelt(url: string): Promise<GdeltArticle[]> {
  try {
    console.log(`GDELT URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsAggregator/1.0)',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`GDELT fetch failed: ${response.status}`);
      return [];
    }
    
    const text = await response.text();
    
    // Check if it's an error message
    if (text.startsWith('Queries') || text.startsWith('Error') || !text.startsWith('{') && !text.startsWith('[')) {
      console.warn(`GDELT returned error: ${text.slice(0, 100)}`);
      return [];
    }
    
    try {
      const data: GdeltResponse = JSON.parse(text);
      return data.articles || [];
    } catch (parseError) {
      console.warn(`GDELT JSON parse error: ${parseError}`);
      return [];
    }
  } catch (error) {
    console.error('GDELT fetch error:', error);
    return [];
  }
}

/**
 * Convert GDELT date format (YYYYMMDDHHMMSS) to ISO string
 * GDELT seendate can be in various formats, so we validate carefully
 */
function parseGdeltDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // Clean the input - remove any non-digit characters first
  const digits = dateStr.replace(/\D/g, '');
  
  if (digits.length < 8) return null;
  
  try {
    const year = digits.substring(0, 4);
    const month = digits.substring(4, 6);
    const day = digits.substring(6, 8);
    
    // Validate values
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);
    
    if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
      return null;
    }
    
    const hour = digits.length >= 10 ? digits.substring(8, 10) : '00';
    const min = digits.length >= 12 ? digits.substring(10, 12) : '00';
    const sec = digits.length >= 14 ? digits.substring(12, 14) : '00';
    
    // Validate time values
    const h = parseInt(hour);
    const mi = parseInt(min);
    const s = parseInt(sec);
    
    if (h > 23 || mi > 59 || s > 59) {
      // Just use date without time
      return `${year}-${month}-${day}T00:00:00Z`;
    }
    
    return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { year, month, section, category } = await req.json();

    if (!year || !month) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: year, month" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build date range for the month
    const startDate = `${year}${String(month).padStart(2, '0')}01000000`;
    const lastDay = new Date(year, month, 0).getDate(); // Last day of month
    const endDate = `${year}${String(month).padStart(2, '0')}${lastDay}235959`;

    console.log(`Backfilling ${month}/${year} from GDELT (${startDate} to ${endDate})`);

    // Determine which categories to backfill
    let categoriesToFetch: { section: string; category: string }[] = [];
    
    if (section && category) {
      // Single category
      categoriesToFetch = [{ section, category }];
    } else {
      // All categories
      categoriesToFetch = CATEGORY_FEEDS.map(cf => ({ section: cf.section, category: cf.category }));
    }

    let totalInserted = 0;
    let categoriesProcessed = 0;
    const results: { category: string; fetched: number; inserted: number }[] = [];

    for (const cat of categoriesToFetch) {
      const key = `${cat.section}::${cat.category}`;
      const keywords = CATEGORY_KEYWORDS[key] || CATEGORY_KEYWORDS['default'];
      
      const gdeltUrl = buildGdeltUrl(keywords, startDate, endDate);
      console.log(`Fetching ${key} from GDELT...`);
      
      const articles = await fetchGdelt(gdeltUrl);
      console.log(`${key}: ${articles.length} articles from GDELT`);
      
      if (articles.length === 0) {
        results.push({ category: key, fetched: 0, inserted: 0 });
        categoriesProcessed++;
        continue;
      }

      // Deduplicate and limit
      const seenUrls = new Set<string>();
      const uniqueArticles = articles.filter(a => {
        if (seenUrls.has(a.url)) return false;
        seenUrls.add(a.url);
        return true;
      }).slice(0, MAX_ITEMS_PER_CATEGORY);

      // Prepare DB items
      const dbItems = uniqueArticles.map(article => {
        const pubDate = parseGdeltDate(article.seendate);
        return {
          section: cat.section,
          category: cat.category,
          month: month,
          year: year,
          title: article.title,
          url: article.url,
          source: `GDELT: ${article.domain}`,
          published_at: pubDate || null,
          snippet: null, // GDELT doesn't provide snippets
          hash: createItemHash(article.title, article.url),
        };
      });

      // Insert into database
      const { error: insertError } = await supabase
        .from("draft_items")
        .upsert(dbItems, { 
          onConflict: "hash",
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error(`Insert error for ${key}: ${insertError.message}`);
      }

      results.push({ 
        category: key, 
        fetched: articles.length, 
        inserted: dbItems.length 
      });
      totalInserted += dbItems.length;
      categoriesProcessed++;

      // Small delay between categories to avoid rate limiting
      if (categoriesProcessed < categoriesToFetch.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`Backfill complete: ${totalInserted} items across ${categoriesProcessed} categories`);

    return new Response(
      JSON.stringify({
        success: true,
        month,
        year,
        categories_processed: categoriesProcessed,
        total_inserted: totalInserted,
        results: results.slice(0, 20), // Limit results in response
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in backfill-month:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
