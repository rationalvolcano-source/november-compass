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
      <AccordionItem value={section.id} className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg">{section.name}</span>
            <Badge variant="outline" className="font-normal">
              {section.categories.length} categories
            </Badge>
            {totalFetched > 0 && (
              <Badge variant="secondary">
                {totalSelected}/{totalFetched} selected
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pt-2">
            {section.categories.map(category => (
              <CategoryCard
                key={category.id}
                categoryId={category.id}
                categoryName={category.name}
                sectionName={section.name}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
