import { 
  Landmark, Globe, Banknote, TrendingUp, Handshake, Users, Award, 
  CalendarDays, UsersRound, BarChart3, Building2, Shield, Atom, 
  Trophy, BookOpen, Heart, Calendar, Smartphone, Leaf,
  Building, Plane, CreditCard, FileText, Briefcase, UserCheck,
  Medal, Flag, ClipboardList, LineChart, GitMerge, Rocket, Cpu,
  Dumbbell, BookMarked, Clock, AppWindow, TreePine
} from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: any;
  subcategories?: string[];
}

export interface Section {
  id: string;
  name: string;
  icon: any;
  categories: Category[];
}

export const CURRENT_AFFAIRS_SECTIONS: Section[] = [
  {
    id: "national",
    name: "NATIONAL AFFAIRS",
    icon: Landmark,
    categories: [
      { id: "cabinet-approvals", name: "Cabinet Approvals", icon: Building },
      { id: "festivals", name: "Festivals", icon: Flag },
      { id: "statewise-news", name: "Statewise News", icon: Landmark },
      { id: "launches-inaugurations", name: "Launches & Inaugurations", icon: Rocket },
      { id: "other-national", name: "Other National", icon: FileText },
      { id: "government-schemes", name: "Government Schemes", icon: ClipboardList },
    ],
  },
  {
    id: "international",
    name: "INTERNATIONAL AFFAIRS",
    icon: Globe,
    categories: [
      { id: "visits-to-india", name: "Visits to India", icon: Plane },
      { id: "foreign-visits", name: "Foreign Visits", icon: Globe },
      { id: "bilateral-multilateral", name: "Bilateral/Multilateral", icon: Handshake },
      { id: "international-news", name: "Other International", icon: Globe },
    ],
  },
  {
    id: "banking-finance",
    name: "BANKING & FINANCE",
    icon: Banknote,
    categories: [
      { id: "rbi-news", name: "RBI News", icon: Landmark },
      { id: "sebi-news", name: "SEBI News", icon: LineChart },
      { id: "bank-loans", name: "Bank Loans", icon: CreditCard },
      { id: "bank-agreements", name: "Banking Agreements", icon: Handshake },
      { id: "other-banking", name: "Other Banking", icon: Banknote },
      { id: "finance-news", name: "Finance News", icon: TrendingUp },
    ],
  },
  {
    id: "economy-business",
    name: "ECONOMY & BUSINESS",
    icon: TrendingUp,
    categories: [
      { id: "gdp-growth", name: "GDP & Growth", icon: BarChart3 },
      { id: "economy-news", name: "Economy News", icon: TrendingUp },
      { id: "business-news", name: "Business News", icon: Briefcase },
    ],
  },
  {
    id: "mous-agreements",
    name: "MoUs & AGREEMENTS",
    icon: Handshake,
    categories: [
      { id: "mou-countries", name: "With Countries", icon: Globe },
      { id: "mou-states", name: "With States", icon: Landmark },
      { id: "mou-organizations", name: "Between Orgs", icon: Building2 },
    ],
  },
  {
    id: "appointments",
    name: "APPOINTMENTS",
    icon: Users,
    categories: [
      { id: "national-appointments", name: "National", icon: UserCheck },
      { id: "international-appointments", name: "International", icon: Globe },
      { id: "brand-ambassadors", name: "Brand Ambassadors", icon: Users },
      { id: "resignations", name: "Resignations", icon: UsersRound },
    ],
  },
  {
    id: "awards",
    name: "AWARDS & HONOURS",
    icon: Award,
    categories: [
      { id: "sports-awards", name: "Sports Awards", icon: Medal },
      { id: "national-awards", name: "National Awards", icon: Award },
      { id: "international-awards", name: "International Awards", icon: Globe },
      { id: "other-awards", name: "Other Awards", icon: Award },
    ],
  },
  {
    id: "summits-events",
    name: "SUMMITS & EVENTS",
    icon: CalendarDays,
    categories: [
      { id: "summits", name: "Summits", icon: UsersRound },
      { id: "conferences", name: "Conferences", icon: Users },
      { id: "events", name: "Events", icon: CalendarDays },
    ],
  },
  {
    id: "committees",
    name: "COMMITTEES",
    icon: UsersRound,
    categories: [
      { id: "committees", name: "Committees", icon: UsersRound },
      { id: "meetings", name: "Meetings", icon: Users },
    ],
  },
  {
    id: "rankings-reports",
    name: "RANKINGS & REPORTS",
    icon: BarChart3,
    categories: [
      { id: "rankings", name: "Rankings", icon: BarChart3 },
      { id: "reports", name: "Reports", icon: FileText },
    ],
  },
  {
    id: "acquisitions-mergers",
    name: "ACQUISITIONS & MERGERS",
    icon: Building2,
    categories: [
      { id: "acquisitions", name: "Acquisitions", icon: GitMerge },
      { id: "mergers", name: "Mergers", icon: Building2 },
    ],
  },
  {
    id: "defence",
    name: "DEFENCE",
    icon: Shield,
    categories: [
      { id: "defence-exercises", name: "Exercises", icon: Shield },
      { id: "defence-acquisitions", name: "Acquisitions", icon: Rocket },
      { id: "defence-news", name: "Other Defence", icon: Shield },
    ],
  },
  {
    id: "science-tech",
    name: "SCIENCE & TECH",
    icon: Atom,
    categories: [
      { id: "space", name: "Space", icon: Rocket },
      { id: "technology", name: "Technology", icon: Cpu },
      { id: "science-discoveries", name: "Discoveries", icon: Atom },
    ],
  },
  {
    id: "sports",
    name: "SPORTS",
    icon: Trophy,
    categories: [
      { id: "cricket", name: "Cricket", icon: Trophy },
      { id: "football", name: "Football", icon: Dumbbell },
      { id: "tennis", name: "Tennis", icon: Trophy },
      { id: "badminton", name: "Badminton", icon: Trophy },
      { id: "chess", name: "Chess", icon: Trophy },
      { id: "athletics", name: "Athletics", icon: Dumbbell },
      { id: "other-sports", name: "Other Sports", icon: Trophy },
    ],
  },
  {
    id: "books-authors",
    name: "BOOKS & AUTHORS",
    icon: BookOpen,
    categories: [
      { id: "books", name: "Books Released", icon: BookMarked },
    ],
  },
  {
    id: "obituary",
    name: "OBITUARY",
    icon: Heart,
    categories: [
      { id: "obituary", name: "Obituary", icon: Heart },
    ],
  },
  {
    id: "important-days",
    name: "IMPORTANT DAYS",
    icon: Calendar,
    categories: [
      { id: "important-days", name: "Important Days", icon: Clock },
    ],
  },
  {
    id: "apps-portals",
    name: "APPS & PORTALS",
    icon: Smartphone,
    categories: [
      { id: "apps-portals", name: "Apps & Portals", icon: AppWindow },
    ],
  },
  {
    id: "environment",
    name: "ENVIRONMENT",
    icon: Leaf,
    categories: [
      { id: "environment-news", name: "Environment", icon: Leaf },
      { id: "climate", name: "Climate", icon: TreePine },
      { id: "biodiversity", name: "Biodiversity", icon: Leaf },
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
