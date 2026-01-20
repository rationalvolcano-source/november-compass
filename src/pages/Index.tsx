import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CURRENT_AFFAIRS_SECTIONS } from "@/lib/categories";
import { SectionAccordion } from "@/components/SectionAccordion";
import { PDFExport } from "@/components/PDFExport";
import { useNewsStore } from "@/hooks/useNewsStore";
import { FileText, Zap, CheckSquare, Square, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = ["2024", "2025", "2026"];

const Index = () => {
  const { 
    month, 
    year, 
    setMonth, 
    setYear, 
    initializeCategories, 
    selectAllNews, 
    getTotalCounts,
  } = useNewsStore();
  
  useEffect(() => {
    initializeCategories();
  }, [initializeCategories]);

  const { total, selected: selectedCount } = getTotalCounts();
  const allSelected = total > 0 && selectedCount === total;
  const totalCategories = CURRENT_AFFAIRS_SECTIONS.reduce((sum, s) => sum + s.categories.length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Date Selector */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Current Affairs Curation Tool</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-3 neon-text">
              <span className="text-primary">CURRENT AFFAIRS</span>
              <br />
              <span className="text-foreground">POCKET PDF</span>
            </h1>
            <p className="text-muted-foreground">For Indian Competitive Exams • UPSC • SSC • Banking</p>
          </div>

          {/* Centerpiece Date Selector */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-primary/30 neon-glow">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[180px] h-14 text-lg font-semibold bg-background/50 border-primary/50 focus:ring-primary">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => (
                    <SelectItem key={m} value={m} className="text-lg">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-3xl font-bold text-primary">–</span>
              
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[120px] h-14 text-lg font-semibold bg-background/50 border-primary/50 focus:ring-primary">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y} value={y} className="text-lg">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instructions */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>Expand sections below and click <strong className="text-primary">Fetch</strong> on each topic to load news</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-4 py-2 text-sm border-muted-foreground/30">
                <FileText className="h-4 w-4 mr-2" />
                {CURRENT_AFFAIRS_SECTIONS.length} Sections
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm border-muted-foreground/30">
                {totalCategories} Categories
              </Badge>
              {total > 0 && (
                <Badge 
                  variant={selectedCount > 0 ? "default" : "outline"} 
                  className={`px-4 py-2 text-sm ${selectedCount > 0 ? 'neon-glow' : 'border-muted-foreground/30'}`}
                >
                  {selectedCount} Selected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rate Limit Info Banner */}
      <div className="border-b border-border/50 bg-amber-500/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              <strong>Tip:</strong> Due to API rate limits, fetch topics one at a time and wait 30-60 seconds between fetches for best results.
            </span>
          </div>
        </div>
      </div>

      {/* Export Bar - only show when has news */}
      {total > 0 && (
        <div className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectAllNews(!allSelected)}
              className="gap-2 text-muted-foreground hover:text-primary"
            >
              {allSelected ? (
                <>
                  <CheckSquare className="h-4 w-4" />
                  Unselect All ({selectedCount})
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  Select All ({total})
                </>
              )}
            </Button>
            <PDFExport />
          </div>
        </div>
      )}

      {/* Sections */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-3">
          {CURRENT_AFFAIRS_SECTIONS.map(section => (
            <SectionAccordion key={section.id} section={section} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12 py-6 bg-card/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="text-primary/80">Current Affairs Pocket PDF Generator</p>
          <p className="mt-1 text-xs">Verify all facts before finalizing</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
