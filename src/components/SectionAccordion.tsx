import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/lib/categories";
import { CategoryCard } from "./CategoryCard";
import { useNewsStore } from "@/hooks/useNewsStore";
import { CheckSquare, Square } from "lucide-react";

interface SectionAccordionProps {
  section: Section;
}

export const SectionAccordion = ({ section }: SectionAccordionProps) => {
  const { getSectionCounts, selectAllInSection } = useNewsStore();
  const SectionIcon = section.icon;
  
  const { total, selected } = getSectionCounts(section.id);
  const allSelected = total > 0 && selected === total;

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectAllInSection(section.id, !allSelected);
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={section.id} className="border border-border/50 rounded-xl px-4 bg-card/30 hover:bg-card/50 transition-colors">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <SectionIcon className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">{section.name}</span>
            <Badge variant="outline" className="font-normal text-xs border-border/50">
              {section.categories.length}
            </Badge>
            {total > 0 && (
              <>
                <Badge variant="secondary" className="text-xs">
                  {selected}/{total}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="ml-auto mr-2 gap-1 h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                >
                  {allSelected ? (
                    <>
                      <CheckSquare className="h-3 w-3" />
                      Unselect
                    </>
                  ) : (
                    <>
                      <Square className="h-3 w-3" />
                      Select All
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-3 pt-2 pb-4 md:grid-cols-2 lg:grid-cols-3">
            {section.categories.map(category => (
              <CategoryCard
                key={category.id}
                categoryId={category.id}
                categoryName={category.name}
                sectionName={section.name}
                icon={category.icon}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
