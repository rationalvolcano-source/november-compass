export interface ExamHints {
  what: string;
  who: string;
  where: string;
  when: string;
  why: string;
  numbers: string[];
  ministry: string;
  relatedSchemes: string[];
}

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
}

export interface CategoryNews {
  categoryId: string;
  categoryName: string;
  sectionId: string;
  sectionName: string;
  news: NewsItem[];
  loading: boolean;
  fetched: boolean;
}
