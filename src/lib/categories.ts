export interface Category {
  id: string;
  name: string;
  subcategories?: string[];
}

export interface Section {
  id: string;
  name: string;
  categories: Category[];
}

export const CURRENT_AFFAIRS_SECTIONS: Section[] = [
  {
    id: "national",
    name: "NATIONAL AFFAIRS",
    categories: [
      { id: "cabinet-approvals", name: "Cabinet Approvals" },
      { id: "festivals", name: "Festivals" },
      { id: "statewise-news", name: "Statewise National News" },
      { id: "launches-inaugurations", name: "Launches & Inaugurations" },
      { id: "other-national", name: "Other National News" },
      { id: "government-schemes", name: "Government Schemes" },
    ],
  },
  {
    id: "international",
    name: "INTERNATIONAL AFFAIRS",
    categories: [
      { id: "visits-to-india", name: "Visits to India" },
      { id: "foreign-visits", name: "Foreign Visits by Indian Leaders" },
      { id: "bilateral-multilateral", name: "Bilateral / Multilateral Actions" },
      { id: "international-news", name: "Other International News" },
    ],
  },
  {
    id: "banking-finance",
    name: "BANKING & FINANCE",
    categories: [
      { id: "rbi-news", name: "RBI in News" },
      { id: "sebi-news", name: "SEBI in News" },
      { id: "bank-loans", name: "Loans Issued by Banks" },
      { id: "bank-agreements", name: "Agreements & MoUs (Banking)" },
      { id: "other-banking", name: "Other Banking News" },
      { id: "finance-news", name: "Finance News" },
    ],
  },
  {
    id: "economy-business",
    name: "ECONOMY & BUSINESS",
    categories: [
      { id: "gdp-growth", name: "GDP & Growth" },
      { id: "economy-news", name: "Economy News" },
      { id: "business-news", name: "Business News" },
    ],
  },
  {
    id: "mous-agreements",
    name: "MoUs & AGREEMENTS",
    categories: [
      { id: "mou-countries", name: "With Countries" },
      { id: "mou-states", name: "With States" },
      { id: "mou-organizations", name: "Between Organizations" },
    ],
  },
  {
    id: "appointments",
    name: "APPOINTMENTS & RESIGNATIONS",
    categories: [
      { id: "national-appointments", name: "National Appointments" },
      { id: "international-appointments", name: "International Appointments" },
      { id: "brand-ambassadors", name: "Brand & Campaign Ambassadors" },
      { id: "resignations", name: "Resignations" },
    ],
  },
  {
    id: "awards",
    name: "AWARDS & HONOURS",
    categories: [
      { id: "sports-awards", name: "Sports Awards" },
      { id: "national-awards", name: "National Awards" },
      { id: "international-awards", name: "International Awards" },
      { id: "other-awards", name: "Other Awards & Honours" },
    ],
  },
  {
    id: "summits-events",
    name: "SUMMITS, EVENTS & CONFERENCES",
    categories: [
      { id: "summits", name: "Summits" },
      { id: "conferences", name: "Conferences" },
      { id: "events", name: "Events" },
    ],
  },
  {
    id: "committees",
    name: "COMMITTEES & MEETINGS",
    categories: [
      { id: "committees", name: "Committees" },
      { id: "meetings", name: "Meetings" },
    ],
  },
  {
    id: "rankings-reports",
    name: "RANKINGS & REPORTS",
    categories: [
      { id: "rankings", name: "Rankings" },
      { id: "reports", name: "Reports" },
    ],
  },
  {
    id: "acquisitions-mergers",
    name: "ACQUISITIONS & MERGERS",
    categories: [
      { id: "acquisitions", name: "Acquisitions" },
      { id: "mergers", name: "Mergers" },
    ],
  },
  {
    id: "defence",
    name: "DEFENCE",
    categories: [
      { id: "defence-exercises", name: "Defence Exercises" },
      { id: "defence-acquisitions", name: "Defence Acquisitions" },
      { id: "defence-news", name: "Other Defence News" },
    ],
  },
  {
    id: "science-tech",
    name: "SCIENCE & TECHNOLOGY",
    categories: [
      { id: "space", name: "Space" },
      { id: "technology", name: "Technology" },
      { id: "science-discoveries", name: "Scientific Discoveries" },
    ],
  },
  {
    id: "sports",
    name: "SPORTS",
    categories: [
      { id: "cricket", name: "Cricket" },
      { id: "football", name: "Football" },
      { id: "tennis", name: "Tennis" },
      { id: "badminton", name: "Badminton" },
      { id: "chess", name: "Chess" },
      { id: "athletics", name: "Athletics" },
      { id: "other-sports", name: "Other Sports" },
    ],
  },
  {
    id: "books-authors",
    name: "BOOKS & AUTHORS",
    categories: [
      { id: "books", name: "Books Released" },
    ],
  },
  {
    id: "obituary",
    name: "OBITUARY",
    categories: [
      { id: "obituary", name: "Obituary" },
    ],
  },
  {
    id: "important-days",
    name: "IMPORTANT DAYS",
    categories: [
      { id: "important-days", name: "Important Days" },
    ],
  },
  {
    id: "apps-portals",
    name: "APPS & WEB PORTALS",
    categories: [
      { id: "apps-portals", name: "Apps & Web Portals" },
    ],
  },
  {
    id: "environment",
    name: "ENVIRONMENT",
    categories: [
      { id: "environment-news", name: "Environment News" },
      { id: "climate", name: "Climate" },
      { id: "biodiversity", name: "Biodiversity" },
    ],
  },
];

export const getAllCategories = (): Category[] => {
  return CURRENT_AFFAIRS_SECTIONS.flatMap(section => section.categories);
};

export const getCategoryById = (id: string): Category | undefined => {
  return getAllCategories().find(cat => cat.id === id);
};

export const getSectionById = (id: string): Section | undefined => {
  return CURRENT_AFFAIRS_SECTIONS.find(section => section.id === id);
};
