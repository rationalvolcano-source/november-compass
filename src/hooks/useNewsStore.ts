import { create } from 'zustand';
import { NewsItem, CategoryNews } from '@/types/news';
import { CURRENT_AFFAIRS_SECTIONS } from '@/lib/categories';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type InvokeError = {
  message?: string;
  context?: { status?: number; body?: any };
} & Error;

async function invokeFetchNewsWithBackoff(params: { category: string; month: string; year: string }) {
  // Free-tier Gemini quotas are very tight; a small backoff prevents error loops.
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { data, error } = await supabase.functions.invoke("fetch-news", { body: params });

    if (!error) return { data };

    const err = error as unknown as InvokeError;
    const status = err?.context?.status;
    const body = err?.context?.body;

    // If it's a daily quota exhaustion, retries won't help.
    if (status === 429 && typeof body?.details === "string" && body.details.includes("PerDay")) {
      throw error;
    }

    if (status === 429 && attempt < MAX_RETRIES) {
      const retryAfterSeconds =
        typeof body?.retryAfterSeconds === "number" ? body.retryAfterSeconds : 20;
      await sleep((retryAfterSeconds + 1) * 1000);
      continue;
    }

    throw error;
  }

  // Should never reach here
  throw new Error("Failed to fetch news after retries");
}

interface NewsStore {
  month: string;
  year: string;
  categoryNews: Record<string, CategoryNews>;
  isBulkFetching: boolean;
  bulkFetchProgress: { total: number; fetched: number; activeCategories: string[] };
  setMonth: (month: string) => void;
  setYear: (year: string) => void;
  fetchNews: (categoryId: string) => Promise<void>;
  fetchAllNews: () => Promise<void>;
  toggleNewsSelection: (categoryId: string, newsId: string) => void;
  toggleNewsVerified: (categoryId: string, newsId: string) => void;
  updateNewsItem: (categoryId: string, newsId: string, updates: Partial<NewsItem>) => void;
  deleteNewsItem: (categoryId: string, newsId: string) => void;
  getSelectedNews: () => NewsItem[];
  initializeCategories: () => void;
  selectAllNews: (select: boolean) => void;
  selectAllInSection: (sectionId: string, select: boolean) => void;
  getTotalCounts: () => { total: number; selected: number };
  getSectionCounts: (sectionId: string) => { total: number; selected: number };
}

export const useNewsStore = create<NewsStore>((set, get) => ({
  month: 'November',
  year: '2025',
  categoryNews: {},
  isBulkFetching: false,
  bulkFetchProgress: { total: 0, fetched: 0, activeCategories: [] },

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
        };
      });
    });

    set({ categoryNews });
  },

  fetchNews: async (categoryId: string) => {
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
      const { data } = await invokeFetchNewsWithBackoff({
        category: category.categoryName,
        month,
        year,
      });

      const newsItems: NewsItem[] = (data.news || []).map((item: any, index: number) => ({
        id: `${categoryId}-${index}-${Date.now()}`,
        headline: item.headline || '',
        date: item.date || '',
        description: item.description || '',
        examHints: {
          what: item.examHints?.what || '',
          who: item.examHints?.who || '',
          where: item.examHints?.where || '',
          when: item.examHints?.when || '',
          why: item.examHints?.why || '',
          numbers: item.examHints?.numbers || [],
          ministry: item.examHints?.ministry || '',
          relatedSchemes: item.examHints?.relatedSchemes || [],
        },
        source: item.source || '',
        verified: false,
        selected: false,
        categoryId,
        sectionId: category.sectionId,
      }));

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
      const err = error as any;
      const status = err?.context?.status;
      const body = err?.context?.body;

      if (status === 429) {
        const retryAfterSeconds = typeof body?.retryAfterSeconds === "number" ? body.retryAfterSeconds : null;
        toast({
          title: "Rate limit hit",
          description: retryAfterSeconds
            ? `Please wait ~${retryAfterSeconds}s and try again.`
            : "Please wait a bit and try again.",
        });
      } else {
        toast({
          title: "Failed to fetch news",
          description: typeof body?.error === "string" ? body.error : "Please try again.",
        });
      }

      console.error('Error fetching news:', error);
      set({
        categoryNews: {
          ...get().categoryNews,
          [categoryId]: { ...category, loading: false, fetched: true },
        },
      });
    }
  },

  fetchAllNews: async () => {
    const { categoryNews, month, year } = get();
    const categoryIds = Object.keys(categoryNews);
    const totalCategories = categoryIds.length;
    const CONCURRENCY = 1; // Keep low to avoid free-tier Gemini rate limits

    set({
      isBulkFetching: true,
      bulkFetchProgress: { total: totalCategories, fetched: 0, activeCategories: [] },
    });

    let fetchedCount = 0;
    let rateLimitToastShown = false;

    // Helper to fetch a single category
    const fetchCategory = async (categoryId: string) => {
      const category = get().categoryNews[categoryId];
      if (!category) return;

      // Add to active categories
      set({
        bulkFetchProgress: {
          ...get().bulkFetchProgress,
          activeCategories: [...get().bulkFetchProgress.activeCategories, category.categoryName],
        },
        categoryNews: {
          ...get().categoryNews,
          [categoryId]: { ...get().categoryNews[categoryId], loading: true },
        },
      });

      try {
        const { data } = await invokeFetchNewsWithBackoff({
          category: category.categoryName,
          month,
          year,
        });

        const newsItems: NewsItem[] = (data.news || []).map((item: any, index: number) => ({
          id: `${categoryId}-${index}-${Date.now()}`,
          headline: item.headline || "",
          date: item.date || "",
          description: item.description || "",
          examHints: {
            what: item.examHints?.what || "",
            who: item.examHints?.who || "",
            where: item.examHints?.where || "",
            when: item.examHints?.when || "",
            why: item.examHints?.why || "",
            numbers: item.examHints?.numbers || [],
            ministry: item.examHints?.ministry || "",
            relatedSchemes: item.examHints?.relatedSchemes || [],
          },
          source: item.source || "",
          verified: false,
          selected: false,
          categoryId,
          sectionId: category.sectionId,
        }));

        set({
          categoryNews: {
            ...get().categoryNews,
            [categoryId]: {
              ...get().categoryNews[categoryId],
              news: newsItems,
              loading: false,
              fetched: true,
            },
          },
        });
      } catch (error) {
        const err = error as any;
        const status = err?.context?.status;
        const body = err?.context?.body;

        const isDailyQuota = status === 429 && typeof body?.details === "string" && body.details.includes("PerDay");

        if (status === 429 && !rateLimitToastShown) {
          rateLimitToastShown = true;
          const retryAfterSeconds = typeof body?.retryAfterSeconds === "number" ? body.retryAfterSeconds : null;
          toast({
            title: isDailyQuota ? "Daily quota reached" : "Rate limit hit during bulk fetch",
            description: isDailyQuota
              ? "Google free tier daily limit is exhausted for today. Try tomorrow or enable billing."
              : retryAfterSeconds
                ? `Waiting ~${retryAfterSeconds}s before continuing...`
                : "Waiting a bit before continuing...",
          });
        }

        console.error("Error fetching news for category:", categoryId, error);

        set({
          categoryNews: {
            ...get().categoryNews,
            [categoryId]: { ...get().categoryNews[categoryId], loading: false, fetched: true },
          },
        });

        // If daily quota is exhausted, abort the whole bulk run.
        if (isDailyQuota) throw error;
      } finally {
        fetchedCount++;
        const currentActive = get().bulkFetchProgress.activeCategories.filter((name) => name !== category.categoryName);
        set({
          bulkFetchProgress: {
            total: totalCategories,
            fetched: fetchedCount,
            activeCategories: currentActive,
          },
        });

        // Gentle pacing to stay within free-tier quotas
        await sleep(1200);
      }
    };

    try {
      // Process in batches with concurrency limit
      for (let i = 0; i < categoryIds.length; i += CONCURRENCY) {
        const batch = categoryIds.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(fetchCategory));
      }
    } catch (e) {
      // Ensure we don't leave the UI in a broken/loading state
      console.error("Bulk fetch aborted:", e);
    } finally {
      set({
        isBulkFetching: false,
        bulkFetchProgress: { total: totalCategories, fetched: fetchedCount, activeCategories: [] },
      });
    }
  },

  toggleNewsSelection: (categoryId, newsId) => {
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

  toggleNewsVerified: (categoryId, newsId) => {
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

  updateNewsItem: (categoryId, newsId, updates) => {
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

  deleteNewsItem: (categoryId, newsId) => {
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

  getSelectedNews: () => {
    const { categoryNews } = get();
    const selectedNews: NewsItem[] = [];

    Object.values(categoryNews).forEach(category => {
      category.news.forEach(item => {
        if (item.selected) {
          selectedNews.push(item);
        }
      });
    });

    return selectedNews;
  },

  selectAllNews: (select: boolean) => {
    const { categoryNews } = get();
    const updated: Record<string, CategoryNews> = {};

    Object.entries(categoryNews).forEach(([key, category]) => {
      updated[key] = {
        ...category,
        news: category.news.map(item => ({ ...item, selected: select })),
      };
    });

    set({ categoryNews: updated });
  },

  selectAllInSection: (sectionId: string, select: boolean) => {
    const { categoryNews } = get();
    const updated: Record<string, CategoryNews> = {};

    Object.entries(categoryNews).forEach(([key, category]) => {
      if (category.sectionId === sectionId) {
        updated[key] = {
          ...category,
          news: category.news.map(item => ({ ...item, selected: select })),
        };
      } else {
        updated[key] = category;
      }
    });

    set({ categoryNews: updated });
  },

  getTotalCounts: () => {
    const { categoryNews } = get();
    let total = 0;
    let selected = 0;

    Object.values(categoryNews).forEach(category => {
      total += category.news.length;
      selected += category.news.filter(n => n.selected).length;
    });

    return { total, selected };
  },

  getSectionCounts: (sectionId: string) => {
    const { categoryNews } = get();
    let total = 0;
    let selected = 0;

    Object.values(categoryNews).forEach(category => {
      if (category.sectionId === sectionId) {
        total += category.news.length;
        selected += category.news.filter(n => n.selected).length;
      }
    });

    return { total, selected };
  },
}));
