import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Download, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { useNewsStore } from '@/hooks/useNewsStore';
import { NewsItemCard } from './NewsItemCard';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  categoryId: string;
  categoryName: string;
  icon: React.ElementType;
}

const LOADING_TIPS = [
  "💡 Tip: Government RSS feeds provide the most reliable exam content",
  "📚 Pro tip: Focus on dates, numbers, and key people for MCQs",
  "🎯 Remember: Quality over quantity - select only exam-relevant items",
  "⚡ Hint: Enriched items have AI-generated exam summaries",
  "📊 Note: RSS feeds are cached for fast repeat access",
];

export const CategoryCard = ({ categoryId, categoryName, icon: Icon }: CategoryCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const { categoryNews, fetchDraft, enrichSelected, selectAllInCategory } = useNewsStore();
  const category = categoryNews[categoryId];

  const selectedCount = category?.news.filter(n => n.selected).length || 0;
  const totalCount = category?.news.length || 0;
  const enrichedCount = category?.news.filter(n => n.enriched).length || 0;
  const hasNews = category?.fetched && totalCount > 0;
  const isLoading = category?.loading || false;
  const isEnriching = category?.enriching || false;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  // Rotate tips during loading
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setTipIndex(prev => (prev + 1) % LOADING_TIPS.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleFetch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await fetchDraft(categoryId);
  };

  const handleEnrich = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await enrichSelected(categoryId);
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectAllInCategory(categoryId, !allSelected);
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      expanded && "ring-1 ring-primary/20"
    )}>
      <CardHeader 
        className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-medium">{categoryName}</CardTitle>
            
            {hasNews && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {totalCount} items
                </Badge>
                {enrichedCount > 0 && (
                  <Badge variant="default" className="text-xs bg-emerald-500/20 text-emerald-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {enrichedCount} enriched
                  </Badge>
                )}
                {selectedCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {selectedCount} selected
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!hasNews && !isLoading && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleFetch}
                className="h-8"
              >
                <Download className="h-4 w-4 mr-1" />
                Build Draft
              </Button>
            )}
            
            {hasNews && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleFetch}
                  className="h-8"
                  title="Refresh from RSS"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                {selectedCount > 0 && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleEnrich}
                    disabled={isEnriching}
                    className="h-8"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    {isEnriching ? 'Enriching...' : `Enrich (${Math.min(selectedCount, 5)})`}
                  </Button>
                )}
              </>
            )}

            {expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {/* Loading state */}
      {isLoading && (
        <CardContent className="pt-2">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground text-center animate-pulse">
              {LOADING_TIPS[tipIndex]}
            </p>
            <p className="text-xs text-muted-foreground">
              Fetching from government RSS feeds...
            </p>
          </div>
        </CardContent>
      )}

      {/* Expanded content */}
      {expanded && hasNews && !isLoading && (
        <CardContent className="pt-2">
          {/* Select all checkbox */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={handleSelectAll}
            >
              <Checkbox 
                checked={allSelected} 
                onCheckedChange={() => selectAllInCategory(categoryId, !allSelected)}
              />
              <span className="text-sm text-muted-foreground">
                Select all ({totalCount})
              </span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {enrichedCount}/{totalCount} enriched
            </div>
          </div>

          {/* News items */}
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

      {/* Empty state when expanded but no news */}
      {expanded && !hasNews && !isLoading && (
        <CardContent className="pt-2">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Download className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              No draft items yet
            </p>
            <Button size="sm" onClick={handleFetch}>
              Build Draft from RSS
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
