import { useEffect, useState } from "react";
import { Loader2, Zap, Brain, Globe, BookOpen, Newspaper, TrendingUp, Users, Building2 } from "lucide-react";

const LOADING_MESSAGES = [
  { text: "Scanning government announcements...", icon: Building2 },
  { text: "Analyzing policy changes...", icon: Brain },
  { text: "Fetching international relations updates...", icon: Globe },
  { text: "Processing economic indicators...", icon: TrendingUp },
  { text: "Gathering science & tech breakthroughs...", icon: Zap },
  { text: "Compiling social development news...", icon: Users },
  { text: "Curating exam-relevant content...", icon: BookOpen },
  { text: "Filtering important current affairs...", icon: Newspaper },
  { text: "Almost there, organizing by topics...", icon: Brain },
];

interface BulkFetchLoaderProps {
  totalCategories: number;
  fetchedCount: number;
  currentCategory?: string;
}

export const BulkFetchLoader = ({ totalCategories, fetchedCount, currentCategory }: BulkFetchLoaderProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const progress = totalCategories > 0 ? (fetchedCount / totalCategories) * 100 : 0;
  const CurrentIcon = LOADING_MESSAGES[messageIndex].icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Main loader animation */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full border-4 border-primary/20 animate-pulse" />
        <div 
          className="absolute inset-0 w-32 h-32 rounded-full border-4 border-transparent border-t-primary animate-spin"
          style={{ animationDuration: '1.5s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Fetching news...</span>
          <span className="text-primary font-semibold">{fetchedCount} / {totalCategories}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current category */}
      {currentCategory && (
        <p className="text-sm text-primary/80 mb-4 animate-pulse">
          Currently: <span className="font-semibold">{currentCategory}</span>
        </p>
      )}

      {/* Rotating messages */}
      <div className="flex items-center gap-3 px-6 py-3 rounded-lg bg-card/50 border border-primary/20 animate-fade-in">
        <CurrentIcon className="h-5 w-5 text-primary shrink-0" />
        <p className="text-muted-foreground text-sm">
          {LOADING_MESSAGES[messageIndex].text}
        </p>
      </div>

      {/* Fun fact */}
      <div className="mt-8 max-w-lg text-center">
        <p className="text-xs text-muted-foreground/70">
          💡 This fetches news from <span className="text-primary">{totalCategories} categories</span> across{" "}
          multiple sections. Sit back while we curate exam-relevant current affairs for you!
        </p>
      </div>
    </div>
  );
};
