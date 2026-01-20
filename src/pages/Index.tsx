import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CURRENT_AFFAIRS_SECTIONS } from "@/lib/categories";
import { SectionAccordion } from "@/components/SectionAccordion";
import { PDFExport } from "@/components/PDFExport";
import { useNewsStore } from "@/hooks/useNewsStore";
import { FileText, BookOpen } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = ["2024", "2025", "2026"];

const Index = () => {
  const { month, year, setMonth, setYear, initializeCategories, getSelectedNews } = useNewsStore();
  
  useEffect(() => {
    initializeCategories();
  }, [initializeCategories]);

  const selectedCount = getSelectedNews().length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Current Affairs Curation Tool</h1>
                <p className="text-sm text-muted-foreground">For Indian Competitive Exams</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <PDFExport />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Card */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{CURRENT_AFFAIRS_SECTIONS.length}</span> sections
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {CURRENT_AFFAIRS_SECTIONS.reduce((sum, s) => sum + s.categories.length, 0)}
                    </span> categories
                  </span>
                </div>
              </div>
              <Badge variant={selectedCount > 0 ? "default" : "secondary"}>
                {selectedCount} news selected for export
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Select the month and year for which you want to curate news</li>
              <li>Expand a section and click "Fetch News" on any category to get AI-suggested news</li>
              <li>Review each news item, verify the facts, and edit if needed</li>
              <li>Check the checkbox to select news items you want to include</li>
              <li>Click "Export PDF" to generate a printable document</li>
            </ol>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-4">
          {CURRENT_AFFAIRS_SECTIONS.map(section => (
            <SectionAccordion key={section.id} section={section} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Current Affairs Pocket PDF Generator • Following AffairsCloud Format</p>
          <p className="mt-1">Remember to verify all facts before finalizing</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
