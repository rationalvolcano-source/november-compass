import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit2, Trash2, ExternalLink } from "lucide-react";
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
      <Card className={`border ${newsItem.selected ? 'border-primary bg-primary/5' : 'border-border'} ${newsItem.verified ? 'ring-2 ring-green-500/30' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={newsItem.selected}
              onCheckedChange={() => toggleNewsSelection(categoryId, newsItem.id)}
              className="mt-1"
            />
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-foreground">{newsItem.headline}</h4>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant={newsItem.verified ? "default" : "outline"} className="text-xs">
                    {newsItem.verified ? (
                      <><Check className="h-3 w-3 mr-1" /> Verified</>
                    ) : (
                      "Unverified"
                    )}
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">{newsItem.date}</p>
              <p className="text-sm">{newsItem.description}</p>
              
              {newsItem.examHints && (
                <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Exam Hints</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {newsItem.examHints.what && (
                      <div><span className="font-medium">What:</span> {newsItem.examHints.what}</div>
                    )}
                    {newsItem.examHints.who && (
                      <div><span className="font-medium">Who:</span> {newsItem.examHints.who}</div>
                    )}
                    {newsItem.examHints.where && (
                      <div><span className="font-medium">Where:</span> {newsItem.examHints.where}</div>
                    )}
                    {newsItem.examHints.when && (
                      <div><span className="font-medium">When:</span> {newsItem.examHints.when}</div>
                    )}
                    {newsItem.examHints.ministry && (
                      <div className="col-span-2"><span className="font-medium">Ministry:</span> {newsItem.examHints.ministry}</div>
                    )}
                    {newsItem.examHints.numbers && newsItem.examHints.numbers.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium">Key Numbers:</span>{" "}
                        {newsItem.examHints.numbers.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">Source: {newsItem.source}</p>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={newsItem.verified ? "default" : "outline"}
                    onClick={() => toggleNewsVerified(categoryId, newsItem.id)}
                    className="h-7 text-xs"
                  >
                    {newsItem.verified ? <X className="h-3 w-3 mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                    {newsItem.verified ? "Unmark" : "Mark Verified"}
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
