/**
 * Serper.dev API Client for Google Search
 * Low-cost, high-quality search results
 */

export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  source?: string;
}

export interface SerperResponse {
  organic: SerperResult[];
  searchParameters?: {
    q: string;
  };
}

// Category-specific search query templates
export const CATEGORY_SEARCH_QUERIES: Record<string, string[]> = {
  // National Affairs
  'cabinet-approvals': [
    'India cabinet approval decision {month} {year} site:pib.gov.in',
    'union cabinet ccea approval India {month} {year}',
  ],
  'government-schemes': [
    'India government scheme yojana launch {month} {year}',
    'welfare scheme India PM {month} {year}',
  ],
  'launches-inaugurations': [
    'India inauguration launch PM {month} {year}',
    'foundation stone dedication India {month} {year}',
  ],
  
  // International Affairs
  'visits-to-india': [
    'foreign leader visit India {month} {year}',
    'state visit India bilateral {month} {year}',
  ],
  'foreign-visits': [
    'PM India foreign visit {month} {year}',
    'India minister abroad tour {month} {year}',
  ],
  'bilateral-multilateral': [
    'India bilateral multilateral G20 BRICS {month} {year}',
    'India summit quad ASEAN {month} {year}',
  ],
  
  // Banking & Finance
  'rbi-news': [
    'RBI Reserve Bank India notification circular {month} {year}',
    'RBI monetary policy repo rate {month} {year}',
  ],
  'sebi-news': [
    'SEBI regulation notification India {month} {year}',
    'SEBI market IPO listing {month} {year}',
  ],
  'finance-news': [
    'India finance ministry budget tax GST {month} {year}',
    'India fiscal policy revenue {month} {year}',
  ],
  
  // Economy & Business
  'gdp-growth': [
    'India GDP growth economic NSO {month} {year}',
    'India economy growth statistics {month} {year}',
  ],
  'economy-news': [
    'India economy trade export import {month} {year}',
    'India inflation economic indicator {month} {year}',
  ],
  'business-news': [
    'India business corporate startup {month} {year}',
    'India industry company investment {month} {year}',
  ],
  
  // Defence
  'defence-exercises': [
    'India military exercise drill {month} {year}',
    'India joint exercise army navy air force {month} {year}',
  ],
  'defence-acquisitions': [
    'India defence procurement contract {month} {year}',
    'India military acquisition deal {month} {year}',
  ],
  'defence-news': [
    'India defence armed forces {month} {year}',
    'India military security {month} {year}',
  ],
  
  // Science & Tech
  'space': [
    'ISRO India space satellite rocket {month} {year}',
    'India space mission launch {month} {year}',
  ],
  'technology': [
    'India technology digital AI innovation {month} {year}',
    'India tech 5G semiconductor {month} {year}',
  ],
  'science-discoveries': [
    'India science research discovery {month} {year}',
    'India scientist innovation breakthrough {month} {year}',
  ],
  
  // Awards
  'sports-awards': [
    'India sports award arjuna khel ratna {month} {year}',
    'India athlete award medal {month} {year}',
  ],
  'national-awards': [
    'India padma bharat ratna national award {month} {year}',
    'India civilian gallantry award {month} {year}',
  ],
  'international-awards': [
    'India international award nobel {month} {year}',
    'Indian wins international prize {month} {year}',
  ],
  
  // Summits & Events
  'summits': [
    'India summit G20 BRICS SCO {month} {year}',
    'India international summit {month} {year}',
  ],
  'conferences': [
    'India conference conclave seminar {month} {year}',
    'India symposium convention {month} {year}',
  ],
  
  // Rankings & Reports
  'rankings': [
    'India ranking index world {month} {year}',
    'India global ranking list {month} {year}',
  ],
  'reports': [
    'India report survey economic {month} {year}',
    'India study findings data {month} {year}',
  ],
  
  // Appointments
  'national-appointments': [
    'India appointment chief secretary {month} {year}',
    'India new appointment named {month} {year}',
  ],
  'international-appointments': [
    'India international appointment UN IMF {month} {year}',
    'Indian appointed global organization {month} {year}',
  ],
  
  // Sports
  'cricket': [
    'India cricket BCCI IPL {month} {year}',
    'India cricket match series {month} {year}',
  ],
  'football': [
    'India football ISL AIFF {month} {year}',
    'India football match {month} {year}',
  ],
  'other-sports': [
    'India sports Olympics Commonwealth {month} {year}',
    'Indian athlete sports {month} {year}',
  ],
  
  // Environment
  'environment-news': [
    'India environment climate policy {month} {year}',
    'India pollution conservation {month} {year}',
  ],
  'wildlife': [
    'India wildlife tiger conservation {month} {year}',
    'India forest sanctuary {month} {year}',
  ],
  
  // Agriculture
  'agriculture-news': [
    'India agriculture farming policy {month} {year}',
    'India MSP crop scheme {month} {year}',
  ],
  
  // Health
  'health-news': [
    'India health ayushman medical {month} {year}',
    'India healthcare policy scheme {month} {year}',
  ],
  
  // Education
  'education-news': [
    'India education NEP university {month} {year}',
    'India school college policy {month} {year}',
  ],
};

/**
 * Get search queries for a category
 */
export function getSearchQueries(
  category: string, 
  month: string, 
  year: number
): string[] {
  const templates = CATEGORY_SEARCH_QUERIES[category];
  if (!templates) {
    // Fallback generic query
    return [`India current affairs ${category} ${month} ${year}`];
  }
  
  return templates.map(t => 
    t.replace('{month}', month).replace('{year}', year.toString())
  );
}

/**
 * Call Serper.dev API
 */
export async function searchSerper(
  query: string,
  apiKey: string,
  options: { num?: number; gl?: string } = {}
): Promise<SerperResult[]> {
  const { num = 20, gl = 'in' } = options;
  
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      gl, // Country: India
      num,
    }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error('Serper API error:', response.status, text);
    throw new Error(`Serper API error: ${response.status}`);
  }
  
  const data: SerperResponse = await response.json();
  return data.organic || [];
}

/**
 * Month number to name
 */
export function monthNumberToName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'January';
}
