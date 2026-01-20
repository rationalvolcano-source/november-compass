import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { CURRENT_AFFAIRS_SECTIONS } from '@/lib/categories';
import { toast } from '@/hooks/use-toast';
import type { NewsItem, CategoryNews, DraftItem, EnrichedItem, UserEntitlement, DailyUsage } from '@/types/news';

// Helper function to convert month name to number
const monthNameToNumber = (monthName: string): number => {
  const months: Record<string, number> = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
  };
  return months[monthName] || 1;
};

// Convert draft item to display NewsItem
const draftToNewsItem = (
  draft: DraftItem, 
  sectionId: string, 
  categoryId: string,
  enrichment?: EnrichedItem
): NewsItem => {
  return {
    id: draft.id,
    headline: draft.title,
    date: draft.published_at 
      ? new Date(draft.published_at).toLocaleDateString('en-IN', { 
          day: 'numeric', month: 'short', year: 'numeric' 
        })
      : 'Date unknown',
    description: enrichment?.summary || draft.snippet || '',
    examHints: {
      what: enrichment?.exam_points?.[0],
      numbers: enrichment?.exam_points?.slice(1) || [],
    },
    source: draft.source,
    verified: false,
    selected: false,
    categoryId,
    sectionId,
    draftId: draft.id,
    url: draft.url || undefined,
    enriched: !!enrichment,
    enrichment,
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
  fetchDraft: (categoryId: string) => Promise<void>;
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

  fetchDraft: async (categoryId: string) => {
    const { month, year, categoryNews } = get();
    const category = categoryNews[categoryId];
    
    if (!category) return;

    set({
      categoryNews: {
        ...categoryNews,
        [categoryId]: { ...category, loading: true },
      },
    });

    try {
      const monthNum = monthNameToNumber(month);
      const yearNum = parseInt(year);

      const { data, error } = await supabase.functions.invoke('fetch-draft', {
        body: {
          section: category.sectionId,
          category: categoryId,
          month: monthNum,
          year: yearNum,
        },
      });

      if (error) throw error;

      const items: DraftItem[] = data?.items || [];
      const newsItems = items.map(item => 
        draftToNewsItem(item, category.sectionId, categoryId)
      );

      const source = data?.source || 'unknown';
      if (source === 'cache') {
        toast({
          title: "📦 Cached",
          description: `Loaded ${newsItems.length} items from cache`,
        });
      } else {
        toast({
          title: "📰 Draft Built",
          description: `Found ${newsItems.length} items from RSS feeds`,
        });
      }

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

    } catch (error) {
      console.error('Error fetching draft:', error);
      
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

      const enrichments: EnrichedItem[] = data?.enrichments || [];
      const enrichmentMap = new Map(enrichments.map(e => [e.draft_id, e]));

      // Update news items with enrichments
      const updatedNews = category.news.map(item => {
        if (item.draftId && enrichmentMap.has(item.draftId)) {
          const enrichment = enrichmentMap.get(item.draftId)!;
          return {
            ...item,
            description: enrichment.summary,
            examHints: {
              what: enrichment.exam_points?.[0],
              numbers: enrichment.exam_points?.slice(1) || [],
            },
            enriched: true,
            enrichment,
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
      
      const errorMessage = error instanceof Error ? error.message : "Failed to enrich items";
      
      toast({
        title: "Enrichment Failed",
        description: errorMessage,
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
        description: "All categories already have drafts",
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

      await get().fetchDraft(catId);
      
      // Small delay between requests
      if (i < unfetched.length - 1) {
        await sleep(500);
      }
    }

    set({
      isBulkFetching: false,
      bulkFetchProgress: { total: unfetched.length, fetched: unfetched.length, activeCategories: [] },
    });

    toast({
      title: "✅ Bulk fetch complete",
      description: `Fetched drafts for ${unfetched.length} categories`,
    });
  },

  // Legacy compatibility - alias for fetchDraft
  fetchNews: async (categoryId: string) => {
    return get().fetchDraft(categoryId);
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
    const category = categoryNews[categoryId];
    
    if (!category) return { total: 0, selected: 0 };

    return {
      total: category.news.length,
      selected: category.news.filter(n => n.selected).length,
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

      // Fetch entitlement using the database function
      const { data } = await supabase.rpc('get_user_entitlement', { p_user_id: user.id });
      
      if (data && data.length > 0) {
        set({
          entitlement: {
            plan: data[0].plan,
            export_enabled: data[0].export_enabled,
            enrich_quota_daily: data[0].enrich_quota_daily,
          },
        });
      } else {
        set({ entitlement: { plan: 'free', export_enabled: false, enrich_quota_daily: 10 } });
      }
    } catch (error) {
      console.error('Error loading entitlement:', error);
      set({ entitlement: { plan: 'free', export_enabled: false, enrich_quota_daily: 10 } });
    }
  },
}));
