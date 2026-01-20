/**
 * RSS/Feed source mapping for news acquisition
 * Multi-source feeds per category for breadth without LLM cost
 */

export interface Feed {
  id: string;
  name: string;
  url: string;
  lang: "en" | "hi" | "mixed";
  weight: number;     // Higher = more trusted/relevant (1-10)
  tags?: string[];    // Quick categorization
}

export interface CategoryConfig {
  section: string;
  category: string;
  feeds: Feed[];
  keywords: string[]; // For optional filtering
}

// =============================================================================
// PRIMARY SOURCES (Government - High Signal)
// =============================================================================

// PIB (Press Information Bureau) - Ministry-specific feeds
// URL Structure: https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid={ministry_id}
// Lang=1 is English, Lang=2 is Hindi
// Regid varies by ministry/region
const PIB_BASE = 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1';
const PIB = {
  // Central/Main releases
  delhi: { id: 'pib-delhi', name: 'PIB Delhi', url: `${PIB_BASE}&Regid=1`, lang: 'en' as const, weight: 10 },
  
  // Ministry-specific (these use different Regid values)
  defence: { id: 'pib-defence', name: 'PIB Defence', url: `${PIB_BASE}&Regid=1`, lang: 'en' as const, weight: 9, tags: ['defence', 'military'] },
  finance: { id: 'pib-finance', name: 'PIB Finance', url: `${PIB_BASE}&Regid=1`, lang: 'en' as const, weight: 9, tags: ['finance', 'economy'] },
  external: { id: 'pib-external', name: 'PIB External Affairs', url: `${PIB_BASE}&Regid=1`, lang: 'en' as const, weight: 9, tags: ['international', 'diplomacy'] },
  commerce: { id: 'pib-commerce', name: 'PIB Commerce', url: `${PIB_BASE}&Regid=1`, lang: 'en' as const, weight: 9, tags: ['trade', 'business'] },
  education: { id: 'pib-education', name: 'PIB Education', url: `${PIB_BASE}&Regid=1`, lang: 'en' as const, weight: 9, tags: ['education'] },
  health: { id: 'pib-health', name: 'PIB Health', url: `${PIB_BASE}&Regid=1`, lang: 'en' as const, weight: 9, tags: ['health'] },
  environment: { id: 'pib-environment', name: 'PIB Environment', url: `${PIB_BASE}&Regid=1`, lang: 'en' as const, weight: 9, tags: ['environment'] },
  science: { id: 'pib-science', name: 'PIB Science', url: `${PIB_BASE}&Regid=1`, lang: 'en' as const, weight: 9, tags: ['science', 'tech'] },
  agriculture: { id: 'pib-agriculture', name: 'PIB Agriculture', url: `${PIB_BASE}&Regid=1`, lang: 'en' as const, weight: 9, tags: ['agriculture'] },
  sports: { id: 'pib-sports', name: 'PIB Sports', url: `${PIB_BASE}&Regid=1`, lang: 'en' as const, weight: 9, tags: ['sports'] },
};

// RBI (Reserve Bank of India)
const RBI = {
  press: { id: 'rbi-press', name: 'RBI Press Releases', url: 'https://rbi.org.in/Scripts/BS_PressReleasesRssData.aspx', lang: 'en' as const, weight: 10, tags: ['banking', 'policy'] },
  notifications: { id: 'rbi-notif', name: 'RBI Notifications', url: 'https://rbi.org.in/Scripts/BS_NotificationsRssData.aspx', lang: 'en' as const, weight: 9, tags: ['banking', 'regulation'] },
  circulars: { id: 'rbi-circ', name: 'RBI Circulars', url: 'https://rbi.org.in/Scripts/BS_CircularRssData.aspx', lang: 'en' as const, weight: 8, tags: ['banking'] },
};

// SEBI
const SEBI = {
  press: { id: 'sebi-press', name: 'SEBI Press', url: 'https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doGet=yes&method=getRSSFeed', lang: 'en' as const, weight: 10, tags: ['markets', 'regulation'] },
};

// PRS Legislative Research
const PRS = {
  bills: { id: 'prs-bills', name: 'PRS Bills', url: 'https://prsindia.org/billtrack/rss', lang: 'en' as const, weight: 10, tags: ['legislation', 'parliament'] },
  general: { id: 'prs-general', name: 'PRS India', url: 'https://prsindia.org/rss', lang: 'en' as const, weight: 9, tags: ['policy', 'legislation'] },
};

// =============================================================================
// SECONDARY SOURCES (National News - Broad Coverage)
// =============================================================================

const NEWS = {
  // The Hindu sections
  hinduNational: { id: 'hindu-national', name: 'The Hindu National', url: 'https://www.thehindu.com/news/national/feeder/default.rss', lang: 'en' as const, weight: 8, tags: ['national'] },
  hinduInternational: { id: 'hindu-intl', name: 'The Hindu International', url: 'https://www.thehindu.com/news/international/feeder/default.rss', lang: 'en' as const, weight: 8, tags: ['international'] },
  hinduBusiness: { id: 'hindu-biz', name: 'The Hindu Business', url: 'https://www.thehindu.com/business/feeder/default.rss', lang: 'en' as const, weight: 7, tags: ['business', 'economy'] },
  hinduSciTech: { id: 'hindu-scitech', name: 'The Hindu Sci-Tech', url: 'https://www.thehindu.com/sci-tech/feeder/default.rss', lang: 'en' as const, weight: 7, tags: ['science', 'tech'] },
  hinduSports: { id: 'hindu-sports', name: 'The Hindu Sports', url: 'https://www.thehindu.com/sport/feeder/default.rss', lang: 'en' as const, weight: 7, tags: ['sports'] },
  
  // Indian Express
  ieNational: { id: 'ie-national', name: 'Indian Express India', url: 'https://indianexpress.com/section/india/feed/', lang: 'en' as const, weight: 8, tags: ['national'] },
  ieBusiness: { id: 'ie-business', name: 'Indian Express Business', url: 'https://indianexpress.com/section/business/feed/', lang: 'en' as const, weight: 7, tags: ['business'] },
  ieSports: { id: 'ie-sports', name: 'Indian Express Sports', url: 'https://indianexpress.com/section/sports/feed/', lang: 'en' as const, weight: 7, tags: ['sports'] },
  ieTech: { id: 'ie-tech', name: 'Indian Express Tech', url: 'https://indianexpress.com/section/technology/feed/', lang: 'en' as const, weight: 7, tags: ['tech'] },
  
  // LiveMint
  mintPolitics: { id: 'mint-politics', name: 'LiveMint Politics', url: 'https://www.livemint.com/rss/politics', lang: 'en' as const, weight: 7, tags: ['politics'] },
  mintEconomy: { id: 'mint-economy', name: 'LiveMint Economy', url: 'https://www.livemint.com/rss/economy', lang: 'en' as const, weight: 8, tags: ['economy'] },
  mintCompanies: { id: 'mint-companies', name: 'LiveMint Companies', url: 'https://www.livemint.com/rss/companies', lang: 'en' as const, weight: 7, tags: ['business'] },
  
  // Business Standard
  bsEconomy: { id: 'bs-economy', name: 'Business Standard Economy', url: 'https://www.business-standard.com/rss/economy-policy-104.rss', lang: 'en' as const, weight: 8, tags: ['economy', 'policy'] },
  bsFinance: { id: 'bs-finance', name: 'Business Standard Finance', url: 'https://www.business-standard.com/rss/finance-102.rss', lang: 'en' as const, weight: 8, tags: ['finance', 'banking'] },
  bsMarkets: { id: 'bs-markets', name: 'Business Standard Markets', url: 'https://www.business-standard.com/rss/markets-103.rss', lang: 'en' as const, weight: 7, tags: ['markets'] },
};

// =============================================================================
// SECTORAL SOURCES
// =============================================================================

const SECTORAL = {
  // Environment
  downToEarth: { id: 'dte', name: 'Down To Earth', url: 'https://www.downtoearth.org.in/rss.xml', lang: 'en' as const, weight: 9, tags: ['environment', 'climate'] },
};

// =============================================================================
// CATEGORY MAPPINGS - Multiple feeds per category
// =============================================================================

export const CATEGORY_FEEDS: CategoryConfig[] = [
  // =========== NATIONAL AFFAIRS ===========
  {
    section: 'national',
    category: 'cabinet-approvals',
    feeds: [PIB.delhi, NEWS.hinduNational, NEWS.ieNational, NEWS.mintPolitics],
    keywords: ['cabinet', 'approval', 'decision', 'union cabinet', 'ccea', 'pm modi'],
  },
  {
    section: 'national',
    category: 'government-schemes',
    feeds: [PIB.delhi, NEWS.hinduNational, NEWS.ieNational],
    keywords: ['scheme', 'yojana', 'mission', 'programme', 'initiative', 'launch', 'welfare'],
  },
  {
    section: 'national',
    category: 'launches-inaugurations',
    feeds: [PIB.delhi, NEWS.hinduNational, NEWS.ieNational],
    keywords: ['launch', 'inaugurate', 'unveil', 'dedicate', 'foundation stone', 'commence'],
  },
  {
    section: 'national',
    category: 'statewise-news',
    feeds: [PIB.delhi, NEWS.hinduNational, NEWS.ieNational],
    keywords: ['state', 'chief minister', 'cm', 'assembly', 'governor'],
  },
  {
    section: 'national',
    category: 'festivals',
    feeds: [PIB.delhi, NEWS.hinduNational],
    keywords: ['festival', 'celebration', 'diwali', 'holi', 'eid', 'christmas', 'pongal', 'onam'],
  },
  {
    section: 'national',
    category: 'other-national',
    feeds: [PIB.delhi, NEWS.hinduNational, NEWS.ieNational, NEWS.mintPolitics],
    keywords: [],
  },

  // =========== INTERNATIONAL AFFAIRS ===========
  {
    section: 'international',
    category: 'visits-to-india',
    feeds: [PIB.external, NEWS.hinduInternational, NEWS.hinduNational],
    keywords: ['visit', 'arrival', 'state visit', 'official visit', 'india tour', 'bilateral'],
  },
  {
    section: 'international',
    category: 'foreign-visits',
    feeds: [PIB.external, NEWS.hinduInternational],
    keywords: ['pm visit', 'president visit', 'minister visit', 'foreign tour', 'abroad'],
  },
  {
    section: 'international',
    category: 'bilateral-multilateral',
    feeds: [PIB.external, NEWS.hinduInternational],
    keywords: ['bilateral', 'multilateral', 'g20', 'brics', 'quad', 'asean', 'saarc', 'un', 'summit'],
  },
  {
    section: 'international',
    category: 'international-news',
    feeds: [PIB.external, NEWS.hinduInternational],
    keywords: [],
  },

  // =========== BANKING & FINANCE ===========
  {
    section: 'banking-finance',
    category: 'rbi-news',
    feeds: [RBI.press, RBI.notifications, RBI.circulars, NEWS.bsFinance, NEWS.mintEconomy],
    keywords: ['rbi', 'reserve bank', 'monetary policy', 'repo rate', 'inflation', 'interest rate'],
  },
  {
    section: 'banking-finance',
    category: 'sebi-news',
    feeds: [SEBI.press, NEWS.bsMarkets],
    keywords: ['sebi', 'securities', 'ipo', 'listing', 'market regulation', 'stock'],
  },
  {
    section: 'banking-finance',
    category: 'bank-loans',
    feeds: [RBI.press, PIB.finance, NEWS.bsFinance],
    keywords: ['loan', 'credit', 'lending', 'interest rate', 'borrowing', 'npa'],
  },
  {
    section: 'banking-finance',
    category: 'bank-agreements',
    feeds: [PIB.finance, RBI.press, NEWS.bsFinance],
    keywords: ['agreement', 'mou', 'partnership', 'collaboration', 'bank'],
  },
  {
    section: 'banking-finance',
    category: 'other-banking',
    feeds: [RBI.press, PIB.finance, NEWS.bsFinance],
    keywords: ['bank', 'banking', 'financial', 'credit'],
  },
  {
    section: 'banking-finance',
    category: 'finance-news',
    feeds: [PIB.finance, NEWS.bsFinance, NEWS.mintEconomy],
    keywords: ['finance', 'budget', 'tax', 'revenue', 'fiscal', 'gst'],
  },

  // =========== ECONOMY & BUSINESS ===========
  {
    section: 'economy-business',
    category: 'gdp-growth',
    feeds: [PIB.finance, NEWS.bsEconomy, NEWS.mintEconomy, NEWS.hinduBusiness],
    keywords: ['gdp', 'growth', 'economy', 'economic', 'nso', 'statistics'],
  },
  {
    section: 'economy-business',
    category: 'economy-news',
    feeds: [PIB.finance, PIB.commerce, NEWS.bsEconomy, NEWS.mintEconomy],
    keywords: ['economy', 'economic', 'trade', 'export', 'import', 'inflation'],
  },
  {
    section: 'economy-business',
    category: 'business-news',
    feeds: [PIB.commerce, NEWS.mintCompanies, NEWS.hinduBusiness, NEWS.ieBusiness],
    keywords: ['business', 'company', 'corporate', 'industry', 'startup'],
  },

  // =========== MOUs & AGREEMENTS ===========
  {
    section: 'mous-agreements',
    category: 'mou-countries',
    feeds: [PIB.external, PIB.delhi, NEWS.hinduInternational],
    keywords: ['mou', 'agreement', 'bilateral', 'country', 'nation', 'treaty'],
  },
  {
    section: 'mous-agreements',
    category: 'mou-states',
    feeds: [PIB.delhi, NEWS.hinduNational],
    keywords: ['mou', 'agreement', 'state', 'government'],
  },
  {
    section: 'mous-agreements',
    category: 'mou-organizations',
    feeds: [PIB.delhi, NEWS.hinduNational],
    keywords: ['mou', 'agreement', 'organization', 'institution', 'partnership'],
  },

  // =========== APPOINTMENTS ===========
  {
    section: 'appointments',
    category: 'national-appointments',
    feeds: [PIB.delhi, NEWS.hinduNational, NEWS.ieNational],
    keywords: ['appoint', 'appointment', 'named', 'designate', 'assume office', 'chief'],
  },
  {
    section: 'appointments',
    category: 'international-appointments',
    feeds: [PIB.external, NEWS.hinduInternational],
    keywords: ['appoint', 'un', 'who', 'imf', 'world bank', 'international', 'ambassador'],
  },
  {
    section: 'appointments',
    category: 'brand-ambassadors',
    feeds: [PIB.delhi, NEWS.hinduNational],
    keywords: ['ambassador', 'brand', 'spokesperson', 'campaign', 'endorsement'],
  },
  {
    section: 'appointments',
    category: 'resignations',
    feeds: [PIB.delhi, NEWS.hinduNational, NEWS.ieNational],
    keywords: ['resign', 'retirement', 'step down', 'quit', 'demise', 'passes away'],
  },

  // =========== AWARDS & HONOURS ===========
  {
    section: 'awards',
    category: 'sports-awards',
    feeds: [PIB.sports, NEWS.hinduSports, NEWS.ieSports],
    keywords: ['award', 'arjuna', 'khel ratna', 'dronacharya', 'sports award', 'medal'],
  },
  {
    section: 'awards',
    category: 'national-awards',
    feeds: [PIB.delhi, NEWS.hinduNational],
    keywords: ['padma', 'bharat ratna', 'national award', 'civilian award', 'gallantry'],
  },
  {
    section: 'awards',
    category: 'international-awards',
    feeds: [PIB.external, NEWS.hinduInternational],
    keywords: ['nobel', 'booker', 'grammy', 'oscar', 'international award', 'pulitzer'],
  },
  {
    section: 'awards',
    category: 'other-awards',
    feeds: [PIB.delhi, NEWS.hinduNational],
    keywords: ['award', 'honour', 'recognition', 'prize', 'felicitation'],
  },

  // =========== SUMMITS & EVENTS ===========
  {
    section: 'summits-events',
    category: 'summits',
    feeds: [PIB.external, PIB.delhi, NEWS.hinduInternational],
    keywords: ['summit', 'g20', 'brics', 'sco', 'asean', 'saarc', 'cop'],
  },
  {
    section: 'summits-events',
    category: 'conferences',
    feeds: [PIB.delhi, NEWS.hinduNational],
    keywords: ['conference', 'conclave', 'seminar', 'symposium', 'convention'],
  },
  {
    section: 'summits-events',
    category: 'events',
    feeds: [PIB.delhi, NEWS.hinduNational],
    keywords: ['event', 'celebration', 'ceremony', 'function', 'expo'],
  },

  // =========== COMMITTEES ===========
  {
    section: 'committees',
    category: 'committees',
    feeds: [PIB.delhi, PRS.bills, PRS.general],
    keywords: ['committee', 'panel', 'commission', 'task force', 'parliamentary'],
  },
  {
    section: 'committees',
    category: 'meetings',
    feeds: [PIB.delhi, PRS.general],
    keywords: ['meeting', 'session', 'assembly', 'parliament'],
  },

  // =========== RANKINGS & REPORTS ===========
  {
    section: 'rankings-reports',
    category: 'rankings',
    feeds: [PIB.delhi, NEWS.hinduNational, NEWS.bsEconomy],
    keywords: ['ranking', 'rank', 'index', 'top', 'best', 'list', 'survey'],
  },
  {
    section: 'rankings-reports',
    category: 'reports',
    feeds: [PIB.delhi, RBI.press, NEWS.bsEconomy, PRS.general],
    keywords: ['report', 'survey', 'study', 'analysis', 'findings', 'data'],
  },

  // =========== ACQUISITIONS & MERGERS ===========
  {
    section: 'acquisitions-mergers',
    category: 'acquisitions',
    feeds: [PIB.commerce, NEWS.mintCompanies, NEWS.bsMarkets],
    keywords: ['acquisition', 'acquire', 'takeover', 'buy', 'stake'],
  },
  {
    section: 'acquisitions-mergers',
    category: 'mergers',
    feeds: [PIB.commerce, NEWS.mintCompanies, NEWS.bsMarkets],
    keywords: ['merger', 'merge', 'consolidation', 'amalgamation'],
  },

  // =========== DEFENCE ===========
  {
    section: 'defence',
    category: 'defence-exercises',
    feeds: [PIB.defence, NEWS.hinduNational],
    keywords: ['exercise', 'drill', 'military exercise', 'joint exercise', 'wargame'],
  },
  {
    section: 'defence',
    category: 'defence-acquisitions',
    feeds: [PIB.defence, NEWS.hinduNational],
    keywords: ['procurement', 'acquisition', 'purchase', 'contract', 'deal', 'order'],
  },
  {
    section: 'defence',
    category: 'defence-news',
    feeds: [PIB.defence, NEWS.hinduNational, NEWS.ieNational],
    keywords: ['defence', 'defense', 'military', 'armed forces', 'army', 'navy', 'air force'],
  },

  // =========== SCIENCE & TECH ===========
  {
    section: 'science-tech',
    category: 'space',
    feeds: [PIB.science, NEWS.hinduSciTech, NEWS.ieTech],
    keywords: ['isro', 'space', 'satellite', 'rocket', 'launch', 'mission', 'chandrayaan', 'gaganyaan'],
  },
  {
    section: 'science-tech',
    category: 'technology',
    feeds: [PIB.science, NEWS.hinduSciTech, NEWS.ieTech],
    keywords: ['technology', 'digital', 'ai', 'artificial intelligence', 'innovation', '5g', 'semiconductor'],
  },
  {
    section: 'science-tech',
    category: 'science-discoveries',
    feeds: [PIB.science, NEWS.hinduSciTech],
    keywords: ['discovery', 'research', 'scientist', 'breakthrough', 'innovation', 'iit', 'iisc'],
  },

  // =========== SPORTS ===========
  {
    section: 'sports',
    category: 'cricket',
    feeds: [PIB.sports, NEWS.hinduSports, NEWS.ieSports],
    keywords: ['cricket', 'bcci', 'icc', 'test', 'odi', 't20', 'ipl'],
  },
  {
    section: 'sports',
    category: 'football',
    feeds: [PIB.sports, NEWS.hinduSports, NEWS.ieSports],
    keywords: ['football', 'fifa', 'aiff', 'isl', 'premier league'],
  },
  {
    section: 'sports',
    category: 'tennis',
    feeds: [PIB.sports, NEWS.hinduSports, NEWS.ieSports],
    keywords: ['tennis', 'atp', 'wta', 'grand slam', 'wimbledon'],
  },
  {
    section: 'sports',
    category: 'badminton',
    feeds: [PIB.sports, NEWS.hinduSports, NEWS.ieSports],
    keywords: ['badminton', 'bwf', 'shuttler', 'sindhu', 'lakshya'],
  },
  {
    section: 'sports',
    category: 'chess',
    feeds: [PIB.sports, NEWS.hinduSports],
    keywords: ['chess', 'fide', 'grandmaster', 'praggnanandhaa', 'gukesh'],
  },
  {
    section: 'sports',
    category: 'athletics',
    feeds: [PIB.sports, NEWS.hinduSports, NEWS.ieSports],
    keywords: ['athletics', 'olympic', 'asian games', 'commonwealth', 'world championship'],
  },
  {
    section: 'sports',
    category: 'hockey',
    feeds: [PIB.sports, NEWS.hinduSports],
    keywords: ['hockey', 'fih', 'indian hockey'],
  },
  {
    section: 'sports',
    category: 'other-sports',
    feeds: [PIB.sports, NEWS.hinduSports, NEWS.ieSports],
    keywords: ['sports', 'game', 'championship', 'medal', 'tournament'],
  },

  // =========== ENVIRONMENT ===========
  {
    section: 'environment',
    category: 'environment-news',
    feeds: [PIB.environment, SECTORAL.downToEarth, NEWS.hinduNational],
    keywords: ['environment', 'climate', 'pollution', 'forest', 'biodiversity', 'wildlife'],
  },
  {
    section: 'environment',
    category: 'climate-change',
    feeds: [PIB.environment, SECTORAL.downToEarth],
    keywords: ['climate', 'carbon', 'emission', 'renewable', 'solar', 'green'],
  },

  // =========== EDUCATION ===========
  {
    section: 'education',
    category: 'education-news',
    feeds: [PIB.education, NEWS.hinduNational, NEWS.ieNational],
    keywords: ['education', 'school', 'university', 'nep', 'exam', 'result'],
  },

  // =========== HEALTH ===========
  {
    section: 'health',
    category: 'health-news',
    feeds: [PIB.health, NEWS.hinduNational],
    keywords: ['health', 'medical', 'hospital', 'disease', 'vaccine', 'who'],
  },

  // =========== AGRICULTURE ===========
  {
    section: 'agriculture',
    category: 'agriculture-news',
    feeds: [PIB.agriculture, NEWS.hinduNational, SECTORAL.downToEarth],
    keywords: ['agriculture', 'farmer', 'crop', 'msp', 'irrigation', 'kisan'],
  },

  // =========== LEGISLATION ===========
  {
    section: 'legislation',
    category: 'bills-acts',
    feeds: [PRS.bills, PRS.general, PIB.delhi],
    keywords: ['bill', 'act', 'law', 'parliament', 'legislation', 'amendment'],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get feeds for a specific category
 */
export function getFeedsForCategory(section: string, category: string): CategoryConfig | undefined {
  return CATEGORY_FEEDS.find(
    cf => cf.section === section && cf.category === category
  );
}

/**
 * Get all unique feeds across all categories
 */
export function getAllFeeds(): Feed[] {
  const feedMap = new Map<string, Feed>();
  
  for (const config of CATEGORY_FEEDS) {
    for (const feed of config.feeds) {
      if (!feedMap.has(feed.id)) {
        feedMap.set(feed.id, feed);
      }
    }
  }
  
  return Array.from(feedMap.values());
}

/**
 * Get feeds by tags
 */
export function getFeedsByTag(tag: string): Feed[] {
  const feeds: Feed[] = [];
  const seen = new Set<string>();
  
  for (const config of CATEGORY_FEEDS) {
    for (const feed of config.feeds) {
      if (!seen.has(feed.id) && feed.tags?.includes(tag)) {
        feeds.push(feed);
        seen.add(feed.id);
      }
    }
  }
  
  return feeds;
}
