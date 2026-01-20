/**
 * GDELT API Client for historical news backfill
 * Free API, no key required
 */

export interface GdeltArticle {
  title: string;
  url: string;
  seendate: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

export interface GdeltResponse {
  articles?: GdeltArticle[];
}

// Category-specific GDELT keywords
export const CATEGORY_GDELT_KEYWORDS: Record<string, string[]> = {
  'cabinet-approvals': ['India', 'cabinet', 'approval', 'government'],
  'government-schemes': ['India', 'government', 'scheme', 'yojana', 'welfare'],
  'launches-inaugurations': ['India', 'inauguration', 'launch', 'PM Modi'],
  'statewise-news': ['India', 'state', 'chief minister'],
  'visits-to-india': ['India', 'visit', 'foreign', 'bilateral'],
  'foreign-visits': ['India', 'PM Modi', 'visit', 'abroad'],
  'bilateral-multilateral': ['India', 'G20', 'BRICS', 'summit', 'bilateral'],
  'international-news': ['India', 'international', 'world'],
  'rbi-news': ['India', 'RBI', 'Reserve Bank', 'monetary'],
  'sebi-news': ['India', 'SEBI', 'securities', 'market'],
  'bank-loans': ['India', 'bank', 'loan', 'credit'],
  'finance-news': ['India', 'finance', 'budget', 'tax', 'GST'],
  'gdp-growth': ['India', 'GDP', 'growth', 'economy'],
  'economy-news': ['India', 'economy', 'trade', 'inflation'],
  'business-news': ['India', 'business', 'company', 'corporate'],
  'defence-exercises': ['India', 'military', 'exercise', 'drill'],
  'defence-acquisitions': ['India', 'defence', 'procurement', 'contract'],
  'defence-news': ['India', 'defence', 'armed forces', 'military'],
  'space': ['India', 'ISRO', 'space', 'satellite', 'rocket'],
  'technology': ['India', 'technology', 'digital', 'AI', 'innovation'],
  'science-discoveries': ['India', 'science', 'research', 'discovery'],
  'sports-awards': ['India', 'sports', 'award', 'arjuna'],
  'national-awards': ['India', 'padma', 'bharat ratna', 'award'],
  'international-awards': ['India', 'international', 'award', 'prize'],
  'summits': ['India', 'summit', 'G20', 'BRICS'],
  'conferences': ['India', 'conference', 'conclave'],
  'rankings': ['India', 'ranking', 'index', 'world'],
  'reports': ['India', 'report', 'survey', 'study'],
  'national-appointments': ['India', 'appointment', 'named', 'chief'],
  'international-appointments': ['India', 'UN', 'IMF', 'appointed'],
  'cricket': ['India', 'cricket', 'BCCI', 'match'],
  'football': ['India', 'football', 'ISL'],
  'other-sports': ['India', 'sports', 'Olympics', 'athlete'],
  'environment-news': ['India', 'environment', 'climate', 'pollution'],
  'wildlife': ['India', 'wildlife', 'tiger', 'forest'],
  'agriculture-news': ['India', 'agriculture', 'farming', 'crop'],
  'health-news': ['India', 'health', 'medical', 'ayushman'],
  'education-news': ['India', 'education', 'NEP', 'university'],
};

/**
 * Format date for GDELT API (YYYYMMDDHHMMSS)
 */
function formatGdeltDate(year: number, month: number, day: number): string {
  const m = month.toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${year}${m}${d}000000`;
}

/**
 * Get days in month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Fetch articles from GDELT for a specific month/category
 */
export async function fetchGdeltArticles(
  year: number,
  month: number,
  category: string,
  maxRecords: number = 100
): Promise<GdeltArticle[]> {
  const keywords = CATEGORY_GDELT_KEYWORDS[category] || ['India', 'current affairs'];
  const query = keywords.join(' OR ');
  
  const startDate = formatGdeltDate(year, month, 1);
  const endDate = formatGdeltDate(year, month, getDaysInMonth(year, month));
  
  const params = new URLSearchParams({
    query: query,
    mode: 'ArtList',
    maxrecords: maxRecords.toString(),
    format: 'json',
    startdatetime: startDate,
    enddatetime: endDate,
    sourcelang: 'english',
  });
  
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('GDELT API error:', response.status);
      return [];
    }
    
    const data: GdeltResponse = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('GDELT fetch error:', error);
    return [];
  }
}

/**
 * Parse GDELT seendate to ISO string
 */
export function parseGdeltDate(seendate: string): string | null {
  if (!seendate || seendate.length < 8) return null;
  
  try {
    // Format: YYYYMMDDHHMMSS
    const year = seendate.substring(0, 4);
    const month = seendate.substring(4, 6);
    const day = seendate.substring(6, 8);
    const hour = seendate.substring(8, 10) || '00';
    const minute = seendate.substring(10, 12) || '00';
    const second = seendate.substring(12, 14) || '00';
    
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  } catch {
    return null;
  }
}
