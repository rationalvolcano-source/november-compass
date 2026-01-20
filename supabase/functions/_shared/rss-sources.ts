/**
 * RSS/Feed source mapping for news acquisition
 * Maps categories to their respective RSS feeds and government sources
 */

export interface FeedSource {
  url: string;
  name: string;
  type: 'rss' | 'atom' | 'json';
  priority: number; // 1 = highest
}

export interface CategoryFeeds {
  section: string;
  category: string;
  feeds: FeedSource[];
  keywords: string[]; // For filtering/categorization
}

// PIB (Press Information Bureau) RSS feeds
// Lang=1 is English, Lang=2 is Hindi
// Regid=1 is PIB Delhi (Central/Main English releases)
const PIB_BASE = 'https://pib.gov.in/RssMain.aspx';
const PIB_FEEDS = {
  all: `${PIB_BASE}?ModId=6&Lang=1&Regid=1`,
  defence: `${PIB_BASE}?ModId=6&Lang=1&Regid=1`,
  finance: `${PIB_BASE}?ModId=6&Lang=1&Regid=1`,
  agriculture: `${PIB_BASE}?ModId=6&Lang=1&Regid=1`,
  environment: `${PIB_BASE}?ModId=6&Lang=1&Regid=1`,
  education: `${PIB_BASE}?ModId=6&Lang=1&Regid=1`,
  health: `${PIB_BASE}?ModId=6&Lang=1&Regid=1`,
  science: `${PIB_BASE}?ModId=6&Lang=1&Regid=1`,
  commerce: `${PIB_BASE}?ModId=6&Lang=1&Regid=1`,
  external: `${PIB_BASE}?ModId=6&Lang=1&Regid=1`,
  sports: `${PIB_BASE}?ModId=6&Lang=1&Regid=1`,
};

// RBI RSS feeds
const RBI_FEEDS = {
  pressReleases: 'https://rbi.org.in/Scripts/BS_PressReleasesRssData.aspx',
  notifications: 'https://rbi.org.in/Scripts/BS_NotificationsRssData.aspx',
  circulars: 'https://rbi.org.in/Scripts/BS_CircularRssData.aspx',
};

// SEBI feeds (if available)
const SEBI_FEEDS = {
  pressReleases: 'https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doGet=yes&method=getRSSFeed',
};

// PRS Legislative Research
const PRS_FEEDS = {
  bills: 'https://prsindia.org/billtrack/rss',
  legislative: 'https://prsindia.org/rss',
};

// Category to feeds mapping
export const CATEGORY_FEEDS: CategoryFeeds[] = [
  // National Affairs
  {
    section: 'national',
    category: 'cabinet-approvals',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['cabinet', 'approval', 'decision', 'union cabinet', 'ccea'],
  },
  {
    section: 'national',
    category: 'government-schemes',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['scheme', 'yojana', 'mission', 'programme', 'initiative', 'launch'],
  },
  {
    section: 'national',
    category: 'launches-inaugurations',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['launch', 'inaugurate', 'unveil', 'dedicate', 'foundation stone'],
  },
  {
    section: 'national',
    category: 'statewise-news',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['state', 'chief minister', 'cm', 'assembly'],
  },
  {
    section: 'national',
    category: 'festivals',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['festival', 'celebration', 'diwali', 'holi', 'eid', 'christmas', 'pongal'],
  },
  {
    section: 'national',
    category: 'other-national',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: [],
  },

  // International Affairs
  {
    section: 'international',
    category: 'visits-to-india',
    feeds: [
      { url: PIB_FEEDS.external, name: 'PIB External', type: 'rss', priority: 1 },
    ],
    keywords: ['visit', 'arrival', 'state visit', 'official visit', 'india tour'],
  },
  {
    section: 'international',
    category: 'foreign-visits',
    feeds: [
      { url: PIB_FEEDS.external, name: 'PIB External', type: 'rss', priority: 1 },
    ],
    keywords: ['pm visit', 'president visit', 'minister visit', 'foreign tour'],
  },
  {
    section: 'international',
    category: 'bilateral-multilateral',
    feeds: [
      { url: PIB_FEEDS.external, name: 'PIB External', type: 'rss', priority: 1 },
    ],
    keywords: ['bilateral', 'multilateral', 'g20', 'brics', 'quad', 'asean', 'saarc', 'un'],
  },
  {
    section: 'international',
    category: 'international-news',
    feeds: [
      { url: PIB_FEEDS.external, name: 'PIB External', type: 'rss', priority: 1 },
    ],
    keywords: [],
  },

  // Banking & Finance
  {
    section: 'banking-finance',
    category: 'rbi-news',
    feeds: [
      { url: RBI_FEEDS.pressReleases, name: 'RBI Press', type: 'rss', priority: 1 },
      { url: RBI_FEEDS.notifications, name: 'RBI Notifications', type: 'rss', priority: 2 },
      { url: RBI_FEEDS.circulars, name: 'RBI Circulars', type: 'rss', priority: 3 },
    ],
    keywords: ['rbi', 'reserve bank', 'monetary policy', 'repo rate', 'inflation'],
  },
  {
    section: 'banking-finance',
    category: 'sebi-news',
    feeds: [
      { url: SEBI_FEEDS.pressReleases, name: 'SEBI Press', type: 'rss', priority: 1 },
    ],
    keywords: ['sebi', 'securities', 'ipo', 'listing', 'market regulation'],
  },
  {
    section: 'banking-finance',
    category: 'bank-loans',
    feeds: [
      { url: RBI_FEEDS.pressReleases, name: 'RBI Press', type: 'rss', priority: 1 },
      { url: PIB_FEEDS.finance, name: 'PIB Finance', type: 'rss', priority: 2 },
    ],
    keywords: ['loan', 'credit', 'lending', 'interest rate', 'borrowing'],
  },
  {
    section: 'banking-finance',
    category: 'bank-agreements',
    feeds: [
      { url: PIB_FEEDS.finance, name: 'PIB Finance', type: 'rss', priority: 1 },
    ],
    keywords: ['agreement', 'mou', 'partnership', 'collaboration', 'bank'],
  },
  {
    section: 'banking-finance',
    category: 'other-banking',
    feeds: [
      { url: RBI_FEEDS.pressReleases, name: 'RBI Press', type: 'rss', priority: 1 },
      { url: PIB_FEEDS.finance, name: 'PIB Finance', type: 'rss', priority: 2 },
    ],
    keywords: ['bank', 'banking', 'financial'],
  },
  {
    section: 'banking-finance',
    category: 'finance-news',
    feeds: [
      { url: PIB_FEEDS.finance, name: 'PIB Finance', type: 'rss', priority: 1 },
    ],
    keywords: ['finance', 'budget', 'tax', 'revenue', 'fiscal'],
  },

  // Economy & Business
  {
    section: 'economy-business',
    category: 'gdp-growth',
    feeds: [
      { url: PIB_FEEDS.finance, name: 'PIB Finance', type: 'rss', priority: 1 },
      { url: PIB_FEEDS.commerce, name: 'PIB Commerce', type: 'rss', priority: 2 },
    ],
    keywords: ['gdp', 'growth', 'economy', 'economic'],
  },
  {
    section: 'economy-business',
    category: 'economy-news',
    feeds: [
      { url: PIB_FEEDS.finance, name: 'PIB Finance', type: 'rss', priority: 1 },
      { url: PIB_FEEDS.commerce, name: 'PIB Commerce', type: 'rss', priority: 2 },
    ],
    keywords: ['economy', 'economic', 'trade', 'export', 'import'],
  },
  {
    section: 'economy-business',
    category: 'business-news',
    feeds: [
      { url: PIB_FEEDS.commerce, name: 'PIB Commerce', type: 'rss', priority: 1 },
    ],
    keywords: ['business', 'company', 'corporate', 'industry'],
  },

  // MoUs & Agreements
  {
    section: 'mous-agreements',
    category: 'mou-countries',
    feeds: [
      { url: PIB_FEEDS.external, name: 'PIB External', type: 'rss', priority: 1 },
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 2 },
    ],
    keywords: ['mou', 'agreement', 'bilateral', 'country', 'nation'],
  },
  {
    section: 'mous-agreements',
    category: 'mou-states',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['mou', 'agreement', 'state', 'government'],
  },
  {
    section: 'mous-agreements',
    category: 'mou-organizations',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['mou', 'agreement', 'organization', 'institution', 'partnership'],
  },

  // Appointments
  {
    section: 'appointments',
    category: 'national-appointments',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['appoint', 'appointment', 'named', 'designate', 'assume office'],
  },
  {
    section: 'appointments',
    category: 'international-appointments',
    feeds: [
      { url: PIB_FEEDS.external, name: 'PIB External', type: 'rss', priority: 1 },
    ],
    keywords: ['appoint', 'un', 'who', 'imf', 'world bank', 'international'],
  },
  {
    section: 'appointments',
    category: 'brand-ambassadors',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['ambassador', 'brand', 'spokesperson', 'campaign'],
  },
  {
    section: 'appointments',
    category: 'resignations',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['resign', 'retirement', 'step down', 'quit'],
  },

  // Awards & Honours
  {
    section: 'awards',
    category: 'sports-awards',
    feeds: [
      { url: PIB_FEEDS.sports, name: 'PIB Sports', type: 'rss', priority: 1 },
    ],
    keywords: ['award', 'arjuna', 'khel ratna', 'dronacharya', 'sports award'],
  },
  {
    section: 'awards',
    category: 'national-awards',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['padma', 'bharat ratna', 'national award', 'civilian award'],
  },
  {
    section: 'awards',
    category: 'international-awards',
    feeds: [
      { url: PIB_FEEDS.external, name: 'PIB External', type: 'rss', priority: 1 },
    ],
    keywords: ['nobel', 'booker', 'grammy', 'oscar', 'international award'],
  },
  {
    section: 'awards',
    category: 'other-awards',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['award', 'honour', 'recognition', 'prize'],
  },

  // Summits & Events
  {
    section: 'summits-events',
    category: 'summits',
    feeds: [
      { url: PIB_FEEDS.external, name: 'PIB External', type: 'rss', priority: 1 },
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 2 },
    ],
    keywords: ['summit', 'g20', 'brics', 'sco', 'asean', 'saarc'],
  },
  {
    section: 'summits-events',
    category: 'conferences',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['conference', 'conclave', 'seminar', 'symposium'],
  },
  {
    section: 'summits-events',
    category: 'events',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['event', 'celebration', 'ceremony', 'function'],
  },

  // Committees
  {
    section: 'committees',
    category: 'committees',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
      { url: PRS_FEEDS.legislative, name: 'PRS Legislative', type: 'rss', priority: 2 },
    ],
    keywords: ['committee', 'panel', 'commission', 'task force'],
  },
  {
    section: 'committees',
    category: 'meetings',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['meeting', 'session', 'assembly'],
  },

  // Rankings & Reports
  {
    section: 'rankings-reports',
    category: 'rankings',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['ranking', 'rank', 'index', 'top', 'best', 'list'],
  },
  {
    section: 'rankings-reports',
    category: 'reports',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
      { url: RBI_FEEDS.pressReleases, name: 'RBI Press', type: 'rss', priority: 2 },
    ],
    keywords: ['report', 'survey', 'study', 'analysis', 'findings'],
  },

  // Acquisitions & Mergers
  {
    section: 'acquisitions-mergers',
    category: 'acquisitions',
    feeds: [
      { url: PIB_FEEDS.commerce, name: 'PIB Commerce', type: 'rss', priority: 1 },
    ],
    keywords: ['acquisition', 'acquire', 'takeover', 'buy'],
  },
  {
    section: 'acquisitions-mergers',
    category: 'mergers',
    feeds: [
      { url: PIB_FEEDS.commerce, name: 'PIB Commerce', type: 'rss', priority: 1 },
    ],
    keywords: ['merger', 'merge', 'consolidation', 'amalgamation'],
  },

  // Defence
  {
    section: 'defence',
    category: 'defence-exercises',
    feeds: [
      { url: PIB_FEEDS.defence, name: 'PIB Defence', type: 'rss', priority: 1 },
    ],
    keywords: ['exercise', 'drill', 'military exercise', 'joint exercise'],
  },
  {
    section: 'defence',
    category: 'defence-acquisitions',
    feeds: [
      { url: PIB_FEEDS.defence, name: 'PIB Defence', type: 'rss', priority: 1 },
    ],
    keywords: ['procurement', 'acquisition', 'purchase', 'contract', 'deal'],
  },
  {
    section: 'defence',
    category: 'defence-news',
    feeds: [
      { url: PIB_FEEDS.defence, name: 'PIB Defence', type: 'rss', priority: 1 },
    ],
    keywords: ['defence', 'defense', 'military', 'armed forces', 'army', 'navy', 'air force'],
  },

  // Science & Tech
  {
    section: 'science-tech',
    category: 'space',
    feeds: [
      { url: PIB_FEEDS.science, name: 'PIB Science', type: 'rss', priority: 1 },
    ],
    keywords: ['isro', 'space', 'satellite', 'rocket', 'launch', 'mission', 'chandrayaan', 'gaganyaan'],
  },
  {
    section: 'science-tech',
    category: 'technology',
    feeds: [
      { url: PIB_FEEDS.science, name: 'PIB Science', type: 'rss', priority: 1 },
    ],
    keywords: ['technology', 'digital', 'ai', 'artificial intelligence', 'innovation'],
  },
  {
    section: 'science-tech',
    category: 'science-discoveries',
    feeds: [
      { url: PIB_FEEDS.science, name: 'PIB Science', type: 'rss', priority: 1 },
    ],
    keywords: ['discovery', 'research', 'scientist', 'breakthrough', 'innovation'],
  },

  // Sports
  {
    section: 'sports',
    category: 'cricket',
    feeds: [
      { url: PIB_FEEDS.sports, name: 'PIB Sports', type: 'rss', priority: 1 },
    ],
    keywords: ['cricket', 'bcci', 'icc', 'test', 'odi', 't20'],
  },
  {
    section: 'sports',
    category: 'football',
    feeds: [
      { url: PIB_FEEDS.sports, name: 'PIB Sports', type: 'rss', priority: 1 },
    ],
    keywords: ['football', 'fifa', 'aiff', 'isl'],
  },
  {
    section: 'sports',
    category: 'tennis',
    feeds: [
      { url: PIB_FEEDS.sports, name: 'PIB Sports', type: 'rss', priority: 1 },
    ],
    keywords: ['tennis', 'atp', 'wta', 'grand slam'],
  },
  {
    section: 'sports',
    category: 'badminton',
    feeds: [
      { url: PIB_FEEDS.sports, name: 'PIB Sports', type: 'rss', priority: 1 },
    ],
    keywords: ['badminton', 'bwf', 'shuttler'],
  },
  {
    section: 'sports',
    category: 'chess',
    feeds: [
      { url: PIB_FEEDS.sports, name: 'PIB Sports', type: 'rss', priority: 1 },
    ],
    keywords: ['chess', 'fide', 'grandmaster'],
  },
  {
    section: 'sports',
    category: 'athletics',
    feeds: [
      { url: PIB_FEEDS.sports, name: 'PIB Sports', type: 'rss', priority: 1 },
    ],
    keywords: ['athletics', 'olympic', 'asian games', 'commonwealth'],
  },
  {
    section: 'sports',
    category: 'other-sports',
    feeds: [
      { url: PIB_FEEDS.sports, name: 'PIB Sports', type: 'rss', priority: 1 },
    ],
    keywords: ['sports', 'game', 'championship', 'tournament'],
  },

  // Books & Authors
  {
    section: 'books-authors',
    category: 'books',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['book', 'author', 'release', 'launch', 'published', 'autobiography', 'memoir'],
  },

  // Obituary
  {
    section: 'obituary',
    category: 'obituary',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['passed away', 'demise', 'death', 'obituary', 'condolence'],
  },

  // Important Days
  {
    section: 'important-days',
    category: 'important-days',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
    ],
    keywords: ['day', 'week', 'observance', 'celebrate', 'commemorate', 'anniversary'],
  },

  // Apps & Portals
  {
    section: 'apps-portals',
    category: 'apps-portals',
    feeds: [
      { url: PIB_FEEDS.all, name: 'PIB All', type: 'rss', priority: 1 },
      { url: PIB_FEEDS.science, name: 'PIB Science', type: 'rss', priority: 2 },
    ],
    keywords: ['app', 'portal', 'website', 'platform', 'digital', 'mobile app', 'launch'],
  },

  // Environment
  {
    section: 'environment',
    category: 'environment-news',
    feeds: [
      { url: PIB_FEEDS.environment, name: 'PIB Environment', type: 'rss', priority: 1 },
    ],
    keywords: ['environment', 'pollution', 'conservation', 'green'],
  },
  {
    section: 'environment',
    category: 'climate',
    feeds: [
      { url: PIB_FEEDS.environment, name: 'PIB Environment', type: 'rss', priority: 1 },
    ],
    keywords: ['climate', 'carbon', 'emission', 'warming', 'cop', 'unfccc'],
  },
  {
    section: 'environment',
    category: 'biodiversity',
    feeds: [
      { url: PIB_FEEDS.environment, name: 'PIB Environment', type: 'rss', priority: 1 },
    ],
    keywords: ['biodiversity', 'species', 'wildlife', 'forest', 'tiger', 'sanctuary'],
  },
];

/**
 * Get feeds for a specific category
 */
export function getFeedsForCategory(section: string, category: string): CategoryFeeds | undefined {
  return CATEGORY_FEEDS.find(cf => cf.section === section && cf.category === category);
}

/**
 * Get all unique feed URLs (for bulk fetching)
 */
export function getAllUniqueFeedUrls(): string[] {
  const urls = new Set<string>();
  CATEGORY_FEEDS.forEach(cf => {
    cf.feeds.forEach(feed => urls.add(feed.url));
  });
  return Array.from(urls);
}
