import { create } from 'zustand';
import { NewsItem, CategoryNews } from '@/types/news';
import { CURRENT_AFFAIRS_SECTIONS } from '@/lib/categories';
import { supabase } from '@/integrations/supabase/client';

interface NewsStore {
  month: string;
  year: string;
  categoryNews: Record<string, CategoryNews>;
  isBulkFetching: boolean;
  bulkFetchProgress: { total: number; fetched: number; currentCategory: string };
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
  bulkFetchProgress: { total: 0, fetched: 0, currentCategory: '' },

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
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { 
          category: category.categoryName, 
          month, 
          year 
        },
      });

      if (error) throw error;

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

    set({
      isBulkFetching: true,
      bulkFetchProgress: { total: totalCategories, fetched: 0, currentCategory: '' },
    });

    for (let i = 0; i < categoryIds.length; i++) {
      const categoryId = categoryIds[i];
      const category = categoryNews[categoryId];

      set({
        bulkFetchProgress: { 
          total: totalCategories, 
          fetched: i, 
          currentCategory: category?.categoryName || '' 
        },
      });

      // Update loading state for this category
      set({
        categoryNews: {
          ...get().categoryNews,
          [categoryId]: { ...get().categoryNews[categoryId], loading: true },
        },
      });

      try {
        const { data, error } = await supabase.functions.invoke('fetch-news', {
          body: { 
            category: category?.categoryName, 
            month, 
            year 
          },
        });

        if (error) throw error;

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
          sectionId: category?.sectionId || '',
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
        console.error('Error fetching news for category:', categoryId, error);
        set({
          categoryNews: {
            ...get().categoryNews,
            [categoryId]: { 
              ...get().categoryNews[categoryId], 
              loading: false, 
              fetched: true 
            },
          },
        });
      }
    }

    set({
      isBulkFetching: false,
      bulkFetchProgress: { total: totalCategories, fetched: totalCategories, currentCategory: '' },
    });
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
