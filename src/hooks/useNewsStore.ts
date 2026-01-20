import { create } from 'zustand';
import { NewsItem, CategoryNews } from '@/types/news';
import { CURRENT_AFFAIRS_SECTIONS } from '@/lib/categories';
import { supabase } from '@/integrations/supabase/client';

interface NewsStore {
  month: string;
  year: string;
  categoryNews: Record<string, CategoryNews>;
  setMonth: (month: string) => void;
  setYear: (year: string) => void;
  fetchNews: (categoryId: string) => Promise<void>;
  toggleNewsSelection: (categoryId: string, newsId: string) => void;
  toggleNewsVerified: (categoryId: string, newsId: string) => void;
  updateNewsItem: (categoryId: string, newsId: string, updates: Partial<NewsItem>) => void;
  deleteNewsItem: (categoryId: string, newsId: string) => void;
  getSelectedNews: () => NewsItem[];
  initializeCategories: () => void;
}

export const useNewsStore = create<NewsStore>((set, get) => ({
  month: 'November',
  year: '2025',
  categoryNews: {},

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
}));
