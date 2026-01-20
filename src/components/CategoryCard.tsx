import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useNewsStore } from "@/hooks/useNewsStore";
import { NewsItemCard } from "./NewsItemCard";

interface CategoryCardProps {
  categoryId: string;
  categoryName: string;
  sectionName: string;
  icon: any;
}

export const CategoryCard = ({ categoryId, categoryName, sectionName, icon: Icon }: CategoryCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const { categoryNews, fetchNews } = useNewsStore();
  const category = categoryNews[categoryId];

  const handleFetch = async () => {
    await fetchNews(categoryId);
    setExpanded(true);
  };

  const selectedCount = category?.news.filter(n => n.selected).length || 0;
  const totalCount = category?.news.length || 0;

  return (
    <Card className={`border-border/50 bg-background/50 hover:bg-background/80 transition-all ${category?.fetched && totalCount > 0 ? 'col-span-full' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-medium truncate">{categoryName}</span>
            {category?.fetched && totalCount > 0 && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {selectedCount}/{totalCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={category?.fetched ? "ghost" : "default"}
              onClick={handleFetch}
              disabled={category?.loading}
              className={!category?.fetched ? "neon-glow" : ""}
            >
              {category?.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : category?.fetched ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                "Fetch"
              )}
            </Button>
            {category?.fetched && totalCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
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
        
        {expanded && category?.fetched && category.news.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">No news found.</p>
        )}
      </CardContent>
    </Card>
  );
};
