import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { NewsItem } from "@/types/news";
import { useNewsStore } from "@/hooks/useNewsStore";

interface NewsEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newsItem: NewsItem;
  categoryId: string;
}

export const NewsEditDialog = ({ open, onOpenChange, newsItem, categoryId }: NewsEditDialogProps) => {
  const { updateNewsItem } = useNewsStore();
  const [formData, setFormData] = useState({
    headline: newsItem.headline,
    date: newsItem.date,
    description: newsItem.description,
    source: newsItem.source,
    what: newsItem.examHints?.what || '',
    who: newsItem.examHints?.who || '',
    where: newsItem.examHints?.where || '',
    when: newsItem.examHints?.when || '',
    why: newsItem.examHints?.why || '',
    ministry: newsItem.examHints?.ministry || '',
    numbers: (newsItem.examHints?.numbers || []).join(", "),
    relatedSchemes: (newsItem.examHints?.relatedSchemes || []).join(", "),
  });

  useEffect(() => {
    setFormData({
      headline: newsItem.headline,
      date: newsItem.date,
      description: newsItem.description,
      source: newsItem.source,
      what: newsItem.examHints?.what || '',
      who: newsItem.examHints?.who || '',
      where: newsItem.examHints?.where || '',
      when: newsItem.examHints?.when || '',
      why: newsItem.examHints?.why || '',
      ministry: newsItem.examHints?.ministry || '',
      numbers: (newsItem.examHints?.numbers || []).join(", "),
      relatedSchemes: (newsItem.examHints?.relatedSchemes || []).join(", "),
    });
  }, [newsItem]);

  const handleSave = () => {
    updateNewsItem(categoryId, newsItem.id, {
      headline: formData.headline,
      date: formData.date,
      description: formData.description,
      source: formData.source,
      examHints: {
        what: formData.what,
        who: formData.who,
        where: formData.where,
        when: formData.when,
        why: formData.why,
        ministry: formData.ministry,
        numbers: formData.numbers.split(",").map(s => s.trim()).filter(Boolean),
        relatedSchemes: formData.relatedSchemes.split(",").map(s => s.trim()).filter(Boolean),
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit News Item</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="border-t pt-4">
            <p className="font-medium mb-3">Exam Hints</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="what">What</Label>
                <Input
                  id="what"
                  value={formData.what}
                  onChange={(e) => setFormData({ ...formData, what: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="who">Who</Label>
                <Input
                  id="who"
                  value={formData.who}
                  onChange={(e) => setFormData({ ...formData, who: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="where">Where</Label>
                <Input
                  id="where"
                  value={formData.where}
                  onChange={(e) => setFormData({ ...formData, where: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="when">When</Label>
                <Input
                  id="when"
                  value={formData.when}
                  onChange={(e) => setFormData({ ...formData, when: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="why">Why</Label>
                <Input
                  id="why"
                  value={formData.why}
                  onChange={(e) => setFormData({ ...formData, why: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ministry">Ministry</Label>
                <Input
                  id="ministry"
                  value={formData.ministry}
                  onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="numbers">Key Numbers (comma-separated)</Label>
              <Input
                id="numbers"
                value={formData.numbers}
                onChange={(e) => setFormData({ ...formData, numbers: e.target.value })}
                placeholder="₹5000 crore, 15%, 100 km"
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="schemes">Related Schemes (comma-separated)</Label>
              <Input
                id="schemes"
                value={formData.relatedSchemes}
                onChange={(e) => setFormData({ ...formData, relatedSchemes: e.target.value })}
                placeholder="PM Kisan, Make in India"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
