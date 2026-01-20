import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export const CategoryCard = ({ categoryId, categoryName, sectionName }: CategoryCardProps) => {
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
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{categoryName}</CardTitle>
            <p className="text-sm text-muted-foreground">{sectionName}</p>
          </div>
          <div className="flex items-center gap-2">
            {category?.fetched && (
              <Badge variant="secondary">
                {selectedCount}/{totalCount} selected
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleFetch}
              disabled={category?.loading}
            >
              {category?.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : category?.fetched ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                "Fetch News"
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
      </CardHeader>
      
      {expanded && category?.news && category.news.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {category.news.map(item => (
              <NewsItemCard
                key={item.id}
                newsItem={item}
                categoryId={categoryId}
              />
            ))}
          </div>
        </CardContent>
      )}
      
      {expanded && category?.fetched && category.news.length === 0 && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">No news found for this category.</p>
        </CardContent>
      )}
    </Card>
  );
};
