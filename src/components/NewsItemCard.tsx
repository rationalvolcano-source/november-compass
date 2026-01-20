import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { NewsItem } from "@/types/news";
import { useNewsStore } from "@/hooks/useNewsStore";
import { NewsEditDialog } from "./NewsEditDialog";

interface NewsItemCardProps {
  newsItem: NewsItem;
  categoryId: string;
}

export const NewsItemCard = ({ newsItem, categoryId }: NewsItemCardProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const { toggleNewsSelection, toggleNewsVerified, deleteNewsItem } = useNewsStore();

  return (
    <>
      <Card className={`border transition-all ${newsItem.selected ? 'border-primary/50 bg-primary/5 neon-border' : 'border-border/30 bg-card/50'} ${newsItem.verified ? 'ring-1 ring-green-500/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={newsItem.selected}
              onCheckedChange={() => toggleNewsSelection(categoryId, newsItem.id)}
              className="mt-1 border-primary data-[state=checked]:bg-primary"
            />
            
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-foreground leading-tight">{newsItem.headline}</h4>
                <Badge 
                  variant={newsItem.verified ? "default" : "outline"} 
                  className={`text-xs shrink-0 ${newsItem.verified ? 'bg-green-600' : 'border-muted-foreground/30'}`}
                >
                  {newsItem.verified ? <Check className="h-3 w-3" /> : "?"}
                </Badge>
              </div>
              
              <p className="text-xs text-primary/70">{newsItem.date}</p>
              <p className="text-sm text-muted-foreground">{newsItem.description}</p>
              
              {newsItem.examHints && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border/30 space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Exam Hints</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {newsItem.examHints.what && (
                      <div><span className="text-muted-foreground">What:</span> <span className="text-foreground">{newsItem.examHints.what}</span></div>
                    )}
                    {newsItem.examHints.who && (
                      <div><span className="text-muted-foreground">Who:</span> <span className="text-foreground">{newsItem.examHints.who}</span></div>
                    )}
                    {newsItem.examHints.where && (
                      <div><span className="text-muted-foreground">Where:</span> <span className="text-foreground">{newsItem.examHints.where}</span></div>
                    )}
                    {newsItem.examHints.when && (
                      <div><span className="text-muted-foreground">When:</span> <span className="text-foreground">{newsItem.examHints.when}</span></div>
                    )}
                    {newsItem.examHints.ministry && (
                      <div className="col-span-2"><span className="text-muted-foreground">Ministry:</span> <span className="text-foreground">{newsItem.examHints.ministry}</span></div>
                    )}
                    {newsItem.examHints.numbers && newsItem.examHints.numbers.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Numbers:</span>{" "}
                        <span className="text-primary">{newsItem.examHints.numbers.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground/70 truncate">Source: {newsItem.source}</p>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={newsItem.verified ? "default" : "outline"}
                    onClick={() => toggleNewsVerified(categoryId, newsItem.id)}
                    className={`h-7 text-xs ${newsItem.verified ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    {newsItem.verified ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditOpen(true)}
                    className="h-7"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteNewsItem(categoryId, newsItem.id)}
                    className="h-7 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <NewsEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        newsItem={newsItem}
        categoryId={categoryId}
      />
    </>
  );
};
