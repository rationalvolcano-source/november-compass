import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { CURRENT_AFFAIRS_SECTIONS } from '@/lib/categories';
import { toast } from '@/hooks/use-toast';
import type { NewsItem, CategoryNews, UserEntitlement, DailyUsage } from '@/types/news';

// Candidate from new architecture
interface Candidate {
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
}

// Helper function to convert month name to number
const monthNameToNumber = (monthName: string): number => {
  const months: Record<string, number> = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
  };
  return months[monthName] || 1;
};

// Convert candidate to display NewsItem
const candidateToNewsItem = (
  candidate: Candidate, 
  sectionId: string, 
  categoryId: string,
): NewsItem => {
  return {
    id: candidate.id,
    headline: candidate.title,
    date: candidate.published_at 
      ? new Date(candidate.published_at).toLocaleDateString('en-IN', { 
          day: 'numeric', month: 'short', year: 'numeric' 
        })
      : 'Date unknown',
    description: candidate.snippet || '',
    examHints: {
      what: undefined,
      numbers: [],
    },
    source: candidate.source,
    verified: false,
    selected: false,
    categoryId,
    sectionId,
    draftId: candidate.id,
    url: candidate.url || undefined,
    enriched: false,
  };
};

interface BulkFetchProgress {
  total: number;
  fetched: number;
  activeCategories: string[];
}

interface NewsStore {
  // State
  month: string;
  year: string;
  categoryNews: Record<string, CategoryNews>;
  isBulkFetching: boolean;
  bulkFetchProgress: BulkFetchProgress;
  entitlement: UserEntitlement | null;
  usage: DailyUsage | null;
  
  // Actions
  setMonth: (month: string) => void;
  setYear: (year: string) => void;
  initializeCategories: () => void;
  fetchCandidates: (categoryId: string) => Promise<void>;
  rerankCandidates: (categoryId: string) => Promise<{ source: string; selectedCount: number }>;
  fetchAndRerank: (categoryId: string) => Promise<void>;
  enrichSelected: (categoryId: string) => Promise<void>;
  bulkFetchDrafts: (categoryIds: string[]) => Promise<void>;
  toggleNewsSelection: (categoryId: string, newsId: string) => void;
  toggleNewsVerified: (categoryId: string, newsId: string) => void;
  deleteNewsItem: (categoryId: string, newsId: string) => void;
  updateNewsItem: (categoryId: string, newsId: string, updates: Partial<NewsItem>) => void;
  selectAllInCategory: (categoryId: string, selected: boolean) => void;
  selectAllInSection: (sectionId: string, selected: boolean) => void;
  selectAllNews: (selected: boolean) => void;
  getSelectedNews: () => NewsItem[];
  getTotalCounts: () => { total: number; selected: number };
  getCategoryCounts: (categoryId: string) => { total: number; selected: number };
  getSectionCounts: (sectionId: string) => { total: number; selected: number };
  loadEntitlement: () => Promise<void>;
  
  // Legacy compatibility
  fetchNews: (categoryId: string) => Promise<void>;
  fetchDraft: (categoryId: string) => Promise<void>;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useNewsStore = create<NewsStore>((set, get) => ({
  month: 'January',
  year: '2026',
  categoryNews: {},
  isBulkFetching: false,
  bulkFetchProgress: { total: 0, fetched: 0, activeCategories: [] },
  entitlement: null,
  usage: null,

  setMonth: (month) => set({ month }),
  setYear: (year) => set({ year }),

  initializeCategories: () => {
    const categoryNews: Record<string, CategoryNews> = {};
    
    CURRENT_AFFAIRS_SECTIONS.forEach(section => {
      section.categories.forEach(category => {
        categoryNews[category.id] = {
          categoryId: category.id,
          categoryName: category.name,
          sectionId: section.id,
          sectionName: section.name,
          news: [],
          loading: false,
          fetched: false,
          enriching: false,
        };
      });
    });
    
    set({ categoryNews });
  },

  // Step 1: Fetch candidates from multiple sources
  fetchCandidates: async (categoryId: string) => {
    const { month, year, categoryNews } = get();
    const category = categoryNews[categoryId];
    
    if (!category) return;

    const monthNum = monthNameToNumber(month);
    const yearNum = parseInt(year);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-candidates', {
        body: {
          section: category.sectionId,
          category: categoryId,
          month: monthNum,
          year: yearNum,
        },
      });

      if (error) throw error;

      console.log(`Fetched candidates: ${data?.total || 0} (${data?.source})`);
      return data;
    } catch (error) {
      console.error('Error fetching candidates:', error);
      throw error;
    }
  },

  // Step 2: Rerank candidates using Gemini (with fallback)
  rerankCandidates: async (categoryId: string): Promise<{ source: string; selectedCount: number }> => {
    const { month, year, categoryNews } = get();
    const category = categoryNews[categoryId];
    
    if (!category) return { source: 'empty', selectedCount: 0 };

    const monthNum = monthNameToNumber(month);
    const yearNum = parseInt(year);

    try {
      const { data, error } = await supabase.functions.invoke('rerank-candidates', {
        body: {
          section: category.sectionId,
          category: categoryId,
          month: monthNum,
          year: yearNum,
        },
      });

      if (error) throw error;

      const items: Candidate[] = data?.items || [];
      const newsItems = items.map(item => 
        candidateToNewsItem(item, category.sectionId, categoryId)
      );

      set({
        categoryNews: {
          ...get().categoryNews,
          [categoryId]: {
            ...category,
            news: newsItems,
            loading: false,
            fetched: true,
          },
        },
      });

      return { 
        source: data?.source || 'fresh', 
        selectedCount: data?.selectedCount || items.length 
      };
    } catch (error) {
      console.error('Error reranking candidates:', error);
      throw error;
    }
  },

  // Combined: Fetch candidates then rerank
  fetchAndRerank: async (categoryId: string) => {
    const { categoryNews } = get();
    const category = categoryNews[categoryId];
    
    if (!category) return;

    set({
      categoryNews: {
        ...categoryNews,
        [categoryId]: { ...category, loading: true },
      },
    });

    try {
      // Step 1: Fetch candidates
      await get().fetchCandidates(categoryId);
      
      // Step 2: Rerank
      const result = await get().rerankCandidates(categoryId);

      const source = result?.source || 'unknown';
      const count = result?.selectedCount || 0;
      
      toast({
        title: source === 'cache' ? "📦 Cached" : "✨ Curated",
        description: `${count} exam-relevant items selected`,
      });

    } catch (error) {
      console.error('Error in fetchAndRerank:', error);
      
      toast({
        title: "Fetch Failed",
        description: error instanceof Error ? error.message : "Failed to fetch news",
        variant: "destructive",
      });

      set({
        categoryNews: {
          ...get().categoryNews,
          [categoryId]: { ...category, loading: false },
        },
      });
    }
  },

  enrichSelected: async (categoryId: string) => {
    const { categoryNews } = get();
    const category = categoryNews[categoryId];
    
    if (!category) return;

    const selectedNews = category.news.filter(n => n.selected && !n.enriched);
    if (selectedNews.length === 0) {
      toast({
        title: "Nothing to enrich",
        description: "Select some items that haven't been enriched yet",
      });
      return;
    }

    // Limit to 5 items per request
    const itemsToEnrich = selectedNews.slice(0, 5);
    const draftIds = itemsToEnrich.map(n => n.draftId).filter(Boolean);

    if (draftIds.length === 0) {
      toast({
        title: "Invalid items",
        description: "Selected items don't have draft IDs",
        variant: "destructive",
      });
      return;
    }

    set({
      categoryNews: {
        ...categoryNews,
        [categoryId]: { ...category, enriching: true },
      },
    });

    try {
      const { data, error } = await supabase.functions.invoke('enrich-items', {
        body: { draft_ids: draftIds },
      });

      if (error) throw error;

      const enrichments: Array<{ draft_id: string; summary: string; exam_points: string[] }> = data?.enrichments || [];
      const enrichmentMap = new Map(enrichments.map(e => [e.draft_id, e]));

      // Update news items with enrichments
      const updatedNews: NewsItem[] = category.news.map(item => {
        if (item.draftId && enrichmentMap.has(item.draftId)) {
          const enrichment = enrichmentMap.get(item.draftId)!;
          return {
            ...item,
            description: enrichment.summary || item.description,
            examHints: {
              what: enrichment.exam_points?.[0],
              numbers: enrichment.exam_points?.slice(1) || [],
            },
            enriched: true,
          };
        }
        return item;
      });

      toast({
        title: "✨ Enriched",
        description: `Enhanced ${enrichments.length} items with exam summaries`,
      });

      set({
        categoryNews: {
          ...get().categoryNews,
          [categoryId]: {
            ...category,
            news: updatedNews,
            enriching: false,
          },
        },
      });

    } catch (error) {
      console.error('Error enriching items:', error);
      
      toast({
        title: "Enrichment Failed",
        description: error instanceof Error ? error.message : "Failed to enrich items",
        variant: "destructive",
      });

      set({
        categoryNews: {
          ...get().categoryNews,
          [categoryId]: { ...category, enriching: false },
        },
      });
    }
  },

  bulkFetchDrafts: async (categoryIds: string[]) => {
    const { categoryNews } = get();
    
    // Filter to only unfetched categories
    const unfetched = categoryIds.filter(id => {
      const cat = categoryNews[id];
      return cat && !cat.fetched && !cat.loading;
    });

    if (unfetched.length === 0) {
      toast({
        title: "All fetched",
        description: "All categories already have news",
      });
      return;
    }

    set({
      isBulkFetching: true,
      bulkFetchProgress: { total: unfetched.length, fetched: 0, activeCategories: [] },
    });

    // Process sequentially with delay to avoid rate limits
    for (let i = 0; i < unfetched.length; i++) {
      const catId = unfetched[i];
      
      set({
        bulkFetchProgress: {
          total: unfetched.length,
          fetched: i,
          activeCategories: [catId],
        },
      });

      await get().fetchAndRerank(catId);
      
      // Delay between requests to avoid rate limits
      if (i < unfetched.length - 1) {
        await sleep(1000);
      }
    }

    set({
      isBulkFetching: false,
      bulkFetchProgress: { total: unfetched.length, fetched: unfetched.length, activeCategories: [] },
    });

    toast({
      title: "✅ Bulk fetch complete",
      description: `Curated news for ${unfetched.length} categories`,
    });
  },

  // Legacy compatibility - alias for fetchAndRerank
  fetchNews: async (categoryId: string) => {
    return get().fetchAndRerank(categoryId);
  },

  // Legacy compatibility
  fetchDraft: async (categoryId: string) => {
    return get().fetchAndRerank(categoryId);
  },

  toggleNewsSelection: (categoryId: string, newsId: string) => {
    const { categoryNews } = get();
    const category = categoryNews[categoryId];
    
    if (!category) return;

    const updatedNews = category.news.map(item =>
      item.id === newsId ? { ...item, selected: !item.selected } : item
    );

    set({
      categoryNews: {
        ...categoryNews,
        [categoryId]: { ...category, news: updatedNews },
      },
    });
  },

  toggleNewsVerified: (categoryId: string, newsId: string) => {
    const { categoryNews } = get();
    const category = categoryNews[categoryId];
    
    if (!category) return;

    const updatedNews = category.news.map(item =>
      item.id === newsId ? { ...item, verified: !item.verified } : item
    );

    set({
      categoryNews: {
        ...categoryNews,
        [categoryId]: { ...category, news: updatedNews },
      },
    });
  },

  deleteNewsItem: (categoryId: string, newsId: string) => {
    const { categoryNews } = get();
    const category = categoryNews[categoryId];
    
    if (!category) return;

    const updatedNews = category.news.filter(item => item.id !== newsId);

    set({
      categoryNews: {
        ...categoryNews,
        [categoryId]: { ...category, news: updatedNews },
      },
    });
  },

  updateNewsItem: (categoryId: string, newsId: string, updates: Partial<NewsItem>) => {
    const { categoryNews } = get();
    const category = categoryNews[categoryId];
    
    if (!category) return;

    const updatedNews = category.news.map(item =>
      item.id === newsId ? { ...item, ...updates } : item
    );

    set({
      categoryNews: {
        ...categoryNews,
        [categoryId]: { ...category, news: updatedNews },
      },
    });
  },

  selectAllInCategory: (categoryId: string, selected: boolean) => {
    const { categoryNews } = get();
    const category = categoryNews[categoryId];
    
    if (!category) return;

    const updatedNews = category.news.map(item => ({ ...item, selected }));

    set({
      categoryNews: {
        ...categoryNews,
        [categoryId]: { ...category, news: updatedNews },
      },
    });
  },

  selectAllInSection: (sectionId: string, selected: boolean) => {
    const { categoryNews } = get();
    const updatedCategoryNews = { ...categoryNews };

    Object.keys(updatedCategoryNews).forEach(catId => {
      const cat = updatedCategoryNews[catId];
      if (cat.sectionId === sectionId) {
        updatedCategoryNews[catId] = {
          ...cat,
          news: cat.news.map(item => ({ ...item, selected })),
        };
      }
    });

    set({ categoryNews: updatedCategoryNews });
  },

  selectAllNews: (selected: boolean) => {
    const { categoryNews } = get();
    const updatedCategoryNews = { ...categoryNews };

    Object.keys(updatedCategoryNews).forEach(catId => {
      const cat = updatedCategoryNews[catId];
      updatedCategoryNews[catId] = {
        ...cat,
        news: cat.news.map(item => ({ ...item, selected })),
      };
    });

    set({ categoryNews: updatedCategoryNews });
  },

  getSelectedNews: () => {
    const { categoryNews } = get();
    const selected: NewsItem[] = [];

    Object.values(categoryNews).forEach(cat => {
      cat.news.forEach(item => {
        if (item.selected) {
          selected.push(item);
        }
      });
    });

    return selected;
  },

  getTotalCounts: () => {
    const { categoryNews } = get();
    let total = 0;
    let selected = 0;

    Object.values(categoryNews).forEach(cat => {
      total += cat.news.length;
      selected += cat.news.filter(n => n.selected).length;
    });

    return { total, selected };
  },

  getCategoryCounts: (categoryId: string) => {
    const { categoryNews } = get();
    const cat = categoryNews[categoryId];
    
    if (!cat) return { total: 0, selected: 0 };

    return {
      total: cat.news.length,
      selected: cat.news.filter(n => n.selected).length,
    };
  },

  getSectionCounts: (sectionId: string) => {
    const { categoryNews } = get();
    let total = 0;
    let selected = 0;

    Object.values(categoryNews).forEach(cat => {
      if (cat.sectionId === sectionId) {
        total += cat.news.length;
        selected += cat.news.filter(n => n.selected).length;
      }
    });

    return { total, selected };
  },

  loadEntitlement: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ entitlement: { plan: 'free', export_enabled: false, enrich_quota_daily: 10 } });
        return;
      }

      const { data, error } = await supabase.rpc('get_user_entitlement', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error loading entitlement:', error);
        set({ entitlement: { plan: 'free', export_enabled: false, enrich_quota_daily: 10 } });
        return;
      }

      if (data && data.length > 0) {
        set({ entitlement: data[0] as UserEntitlement });
      } else {
        set({ entitlement: { plan: 'free', export_enabled: false, enrich_quota_daily: 10 } });
      }
    } catch (error) {
      console.error('Error in loadEntitlement:', error);
      set({ entitlement: { plan: 'free', export_enabled: false, enrich_quota_daily: 10 } });
    }
  },
}));
