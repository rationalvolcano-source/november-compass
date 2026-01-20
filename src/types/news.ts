// Exam hints structure for study-focused metadata
export interface ExamHints {
  what?: string;
  who?: string;
  where?: string;
  when?: string;
  why?: string;
  numbers?: string[];
  ministry?: string;
  relatedSchemes?: string[];
}

// Draft item from RSS feeds (pre-LLM)
export interface DraftItem {
  id: string;
  month: number;
  year: number;
  section: string;
  category: string;
  title: string;
  url: string | null;
  source: string;
  published_at: string | null;
  snippet: string | null;
  hash: string;
  created_at: string;
}

// Enriched item from LLM
export interface EnrichedItem {
  draft_id: string;
  summary: string;
  exam_points: string[];
  mcqs?: any[];
}

// Combined news item for display (draft + optional enrichment)
export interface NewsItem {
  id: string;
  headline: string;
  date: string;
  description: string;
  examHints: ExamHints;
  source: string;
  verified: boolean;
  selected: boolean;
  categoryId: string;
  sectionId: string;
  // New fields for draft-first architecture
  draftId?: string;
  url?: string;
  enriched: boolean;
  enrichment?: EnrichedItem;
}

// Category news state
export interface CategoryNews {
  categoryId: string;
  categoryName: string;
  sectionId: string;
  sectionName: string;
  news: NewsItem[];
  loading: boolean;
  fetched: boolean;
  // New: track enrichment status
  enriching: boolean;
}

// User entitlement from database
export interface UserEntitlement {
  plan: 'free' | 'pro';
  export_enabled: boolean;
  enrich_quota_daily: number;
}

// Daily usage tracking
export interface DailyUsage {
  draft_fetch_count: number;
  enrich_count: number;
  export_count: number;
}
