/**
 * Utilities for candidate management
 */

// Create a deterministic hash for deduplication
export async function hashCandidate(
  url: string | null | undefined,
  title: string,
  source: string,
  dateStr: string | null | undefined
): Promise<string> {
  const canonicalUrl = url ? normalizeUrl(url) : null;
  const input = canonicalUrl || `${title}|${source}|${dateStr || ''}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(input.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalize URL by removing tracking params
 */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove common tracking parameters
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'source'];
    paramsToRemove.forEach(p => u.searchParams.delete(p));
    // Remove fragment
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

export interface Candidate {
  id: string;
  year: number;
  month: number;
  section: string;
  category: string;
  title: string;
  url: string | null;
  source: string;
  snippet: string | null;
  published_at: string | null;
  provider: 'rss' | 'gdelt' | 'serper';
  created_at?: string;
}

/**
 * Deduplicate candidates by ID
 */
export function deduplicateCandidates(candidates: Candidate[]): Candidate[] {
  const seen = new Map<string, Candidate>();
  
  for (const c of candidates) {
    if (!seen.has(c.id)) {
      seen.set(c.id, c);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Sort candidates by date (newest first) and source weight
 */
export function sortCandidates(candidates: Candidate[]): Candidate[] {
  // Source weight mapping
  const sourceWeight: Record<string, number> = {
    'pib.gov.in': 10,
    'rbi.org.in': 10,
    'sebi.gov.in': 10,
    'prsindia.org': 9,
    'thehindu.com': 8,
    'indianexpress.com': 8,
    'livemint.com': 7,
    'business-standard.com': 7,
    'economictimes.com': 7,
    'hindustantimes.com': 6,
    'ndtv.com': 6,
    'news18.com': 5,
  };
  
  return candidates.sort((a, b) => {
    // First by date (newest first)
    if (a.published_at && b.published_at) {
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      if (dateA !== dateB) return dateB - dateA;
    }
    
    // Then by source weight
    const domainA = a.url ? extractDomain(a.url) : a.source;
    const domainB = b.url ? extractDomain(b.url) : b.source;
    const weightA = sourceWeight[domainA] || 3;
    const weightB = sourceWeight[domainB] || 3;
    
    return weightB - weightA;
  });
}

/**
 * Compute hash of candidate set for caching
 */
export async function computeCandidateSetHash(candidateIds: string[]): Promise<string> {
  const sorted = [...candidateIds].sort();
  const input = sorted.join('|');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}
