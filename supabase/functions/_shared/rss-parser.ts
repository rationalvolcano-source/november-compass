/**
 * RSS/Atom parser for edge functions
 * Parses RSS and Atom feeds into normalized items
 */

export interface RawFeedItem {
  title: string;
  url: string;
  source: string;
  publishedAt: Date | null;
  snippet: string;
}

/**
 * Parse RSS 2.0 feed
 */
function parseRSS2(xml: string, sourceName: string): RawFeedItem[] {
  const items: RawFeedItem[] = [];
  
  // Extract items using regex (Deno-friendly, no DOM parser needed)
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link') || extractTag(itemXml, 'guid');
    const description = extractTag(itemXml, 'description');
    const pubDate = extractTag(itemXml, 'pubDate');
    
    if (title) {
      items.push({
        title: cleanHtml(title),
        url: link || '',
        source: sourceName,
        publishedAt: pubDate ? parseDate(pubDate) : null,
        snippet: cleanHtml(description || '').slice(0, 500),
      });
    }
  }
  
  return items;
}

/**
 * Parse Atom feed
 */
function parseAtom(xml: string, sourceName: string): RawFeedItem[] {
  const items: RawFeedItem[] = [];
  
  const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  let match;
  
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    
    const title = extractTag(entryXml, 'title');
    const link = extractAtomLink(entryXml);
    const summary = extractTag(entryXml, 'summary') || extractTag(entryXml, 'content');
    const updated = extractTag(entryXml, 'updated') || extractTag(entryXml, 'published');
    
    if (title) {
      items.push({
        title: cleanHtml(title),
        url: link || '',
        source: sourceName,
        publishedAt: updated ? parseDate(updated) : null,
        snippet: cleanHtml(summary || '').slice(0, 500),
      });
    }
  }
  
  return items;
}

/**
 * Extract content of an XML tag
 */
function extractTag(xml: string, tagName: string): string {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();
  
  // Handle regular content
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extract link from Atom entry
 */
function extractAtomLink(xml: string): string {
  // Try href attribute
  const hrefMatch = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (hrefMatch) return hrefMatch[1];
  
  // Try link content
  return extractTag(xml, 'link');
}

/**
 * Clean HTML entities and tags
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse date string
 */
function parseDate(dateStr: string): Date | null {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Detect feed type and parse accordingly
 */
export function parseFeed(xml: string, sourceName: string): RawFeedItem[] {
  // Detect feed type
  if (xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"')) {
    return parseAtom(xml, sourceName);
  }
  
  // Default to RSS
  return parseRSS2(xml, sourceName);
}

/**
 * Fetch and parse a feed with browser-like headers
 */
export async function fetchAndParseFeed(
  url: string, 
  sourceName: string,
  timeout = 15000
): Promise<RawFeedItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Feed fetch failed for ${url}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    return parseFeed(xml, sourceName);
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`Feed fetch error for ${url}:`, error);
    return [];
  }
}

/**
 * Create hash for deduplication
 */
export function createItemHash(title: string, url: string): string {
  // Normalize title
  const normalizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 100);
  
  // Normalize URL (remove tracking params)
  let normalizedUrl = '';
  try {
    const urlObj = new URL(url);
    urlObj.search = ''; // Remove query params
    normalizedUrl = urlObj.toString().toLowerCase();
  } catch {
    normalizedUrl = url.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  
  // Simple hash
  const combined = normalizedTitle + normalizedUrl;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Filter items by keywords
 */
export function filterByKeywords(items: RawFeedItem[], keywords: string[]): RawFeedItem[] {
  if (keywords.length === 0) return items;
  
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  
  return items.filter(item => {
    const text = (item.title + ' ' + item.snippet).toLowerCase();
    return lowerKeywords.some(keyword => text.includes(keyword));
  });
}

/**
 * Filter items by date range
 */
export function filterByDateRange(
  items: RawFeedItem[], 
  month: number, 
  year: number
): RawFeedItem[] {
  return items.filter(item => {
    if (!item.publishedAt) return true; // Include items without dates
    
    const itemMonth = item.publishedAt.getMonth() + 1;
    const itemYear = item.publishedAt.getFullYear();
    
    return itemMonth === month && itemYear === year;
  });
}
