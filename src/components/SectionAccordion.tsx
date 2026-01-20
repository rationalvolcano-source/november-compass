import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/lib/categories";
import { CategoryCard } from "./CategoryCard";
import { useNewsStore } from "@/hooks/useNewsStore";

interface SectionAccordionProps {
  section: Section;
}

export const SectionAccordion = ({ section }: SectionAccordionProps) => {
  const { categoryNews } = useNewsStore();
  const SectionIcon = section.icon;
  
  const totalSelected = section.categories.reduce((sum, cat) => {
    const catNews = categoryNews[cat.id];
    return sum + (catNews?.news.filter(n => n.selected).length || 0);
  }, 0);

  const totalFetched = section.categories.reduce((sum, cat) => {
    const catNews = categoryNews[cat.id];
    return sum + (catNews?.news.length || 0);
  }, 0);

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={section.id} className="border border-border/50 rounded-xl px-4 bg-card/30 hover:bg-card/50 transition-colors">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <SectionIcon className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">{section.name}</span>
            <Badge variant="outline" className="font-normal text-xs border-border/50">
              {section.categories.length}
            </Badge>
            {totalFetched > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalSelected}/{totalFetched}
              </Badge>
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
