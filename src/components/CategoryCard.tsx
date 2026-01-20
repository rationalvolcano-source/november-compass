import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Loader2, Download, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNewsStore } from "@/hooks/useNewsStore";
import { NewsItemCard } from "./NewsItemCard";

interface CategoryCardProps {
  categoryId: string;
  categoryName: string;
  sectionName: string;
  icon: any;
}

const FETCH_TIPS = [
  "Gathering news from reliable sources...",
  "Analyzing for exam relevance...",
  "Extracting key facts & figures...",
  "Formatting exam hints...",
  "Almost ready...",
];

export const CategoryCard = ({ categoryId, categoryName, icon: Icon }: CategoryCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { categoryNews, fetchNews } = useNewsStore();
  const category = categoryNews[categoryId];

  const selectedCount = category?.news.filter(n => n.selected).length || 0;
  const totalCount = category?.news.length || 0;
  const hasNews = category?.fetched && totalCount > 0;
  const isLoading = category?.loading || false;

  // Rotate tips while loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % FETCH_TIPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleFetch = async () => {
    if (isLoading || cooldownSeconds > 0) return;
    
    try {
      await fetchNews(categoryId);
    } catch (error: any) {
      // Check for rate limit and set cooldown
      const body = error?.context?.body;
      if (error?.context?.status === 429 && body?.retryAfterSeconds) {
        setCooldownSeconds(Math.ceil(body.retryAfterSeconds));
      }
    }
  };

  return (
    <Card className={`border-border/50 bg-background/50 hover:bg-background/80 transition-all ${hasNews ? 'col-span-full' : ''}`}>
      <CardContent className="p-4">
        <div 
          className={`flex items-center justify-between gap-3 ${hasNews ? 'cursor-pointer' : ''}`}
          onClick={() => hasNews && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-medium truncate">{categoryName}</span>
            
            {hasNews && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {selectedCount}/{totalCount}
              </Badge>
            )}
            {category?.fetched && totalCount === 0 && (
              <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">
                No news
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Fetch Button - show if not fetched yet */}
            {!category?.fetched && !isLoading && (
              <Button
                size="sm"
                variant={cooldownSeconds > 0 ? "outline" : "default"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFetch();
                }}
                disabled={cooldownSeconds > 0}
                className="gap-1.5 text-xs"
              >
                {cooldownSeconds > 0 ? (
                  <>
                    <Clock className="h-3 w-3" />
                    Wait {cooldownSeconds}s
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3" />
                    Fetch
                  </>
                )}
              </Button>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs hidden sm:inline animate-pulse">
                  {FETCH_TIPS[tipIndex]}
                </span>
              </div>
            )}

            {/* Expand/Collapse */}
            {hasNews && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Loading encouragement message */}
        {isLoading && (
          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-primary mb-1">Fetching in progress...</p>
                <p>AI is analyzing news for "{categoryName}". This may take 10-30 seconds due to API rate limits. Thank you for your patience!</p>
              </div>
            </div>
            <div className="mt-2 h-1 bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-accent animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
        
        {expanded && category?.news && category.news.length > 0 && (
          <div className="mt-4 space-y-3">
            {category.news.map(item => (
              <NewsItemCard
                key={item.id}
                newsItem={item}
                categoryId={categoryId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
