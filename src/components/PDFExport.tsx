import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useNewsStore } from "@/hooks/useNewsStore";
import { CURRENT_AFFAIRS_SECTIONS } from "@/lib/categories";
import { NewsItem } from "@/types/news";

export const PDFExport = () => {
  const { getSelectedNews, month, year, categoryNews } = useNewsStore();
  
  const selectedNews = getSelectedNews();
  
  const generatePrintableHTML = () => {
    const groupedNews: Record<string, { sectionName: string; categories: Record<string, { categoryName: string; news: NewsItem[] }> }> = {};
    
    selectedNews.forEach(item => {
      if (!groupedNews[item.sectionId]) {
        const section = CURRENT_AFFAIRS_SECTIONS.find(s => s.id === item.sectionId);
        groupedNews[item.sectionId] = {
          sectionName: section?.name || item.sectionId,
          categories: {},
        };
      }
      
      if (!groupedNews[item.sectionId].categories[item.categoryId]) {
        const category = categoryNews[item.categoryId];
        groupedNews[item.sectionId].categories[item.categoryId] = {
          categoryName: category?.categoryName || item.categoryId,
          news: [],
        };
      }
      
      groupedNews[item.sectionId].categories[item.categoryId].news.push(item);
    });

    let tocHTML = `<h2 style="text-align: center; margin-bottom: 20px; color: #0891b2;">TABLE OF CONTENTS</h2><ul style="list-style: none; padding: 0;">`;
    let pageNum = 3;
    
    Object.entries(groupedNews).forEach(([sectionId, section]) => {
      tocHTML += `<li style="margin: 10px 0; font-weight: bold; color: #0e7490;">${section.sectionName} ............... ${pageNum}</li>`;
      Object.entries(section.categories).forEach(([catId, category]) => {
        tocHTML += `<li style="margin: 5px 0 5px 20px; color: #333;">${category.categoryName} (${category.news.length} items)</li>`;
      });
      pageNum += Math.ceil(Object.values(section.categories).reduce((sum, cat) => sum + cat.news.length, 0) / 3);
    });
    tocHTML += `</ul>`;

    let contentHTML = '';
    
    Object.entries(groupedNews).forEach(([sectionId, section]) => {
      contentHTML += `
        <div style="page-break-before: always;">
          <h2 style="background: linear-gradient(135deg, #0e7490 0%, #06b6d4 100%); color: white; padding: 15px; margin: 0 0 20px 0; text-align: center; border-radius: 8px;">
            ${section.sectionName}
          </h2>
      `;
      
      Object.entries(section.categories).forEach(([catId, category]) => {
        contentHTML += `<h3 style="color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 5px; margin: 20px 0 15px 0;">${category.categoryName}</h3>`;
        
        category.news.forEach((item, index) => {
          contentHTML += `
            <div style="margin-bottom: 25px; border-left: 3px solid #06b6d4; padding-left: 15px;">
              <h4 style="margin: 0 0 8px 0; color: #0e7490;">${index + 1}. ${item.headline}</h4>
              <p style="color: #06b6d4; font-size: 12px; margin: 0 0 8px 0;">${item.date}</p>
              <p style="margin: 0 0 12px 0; line-height: 1.6; color: #333;">${item.description}</p>
              
              <div style="background: #f0fdfa; padding: 12px; border-radius: 6px; border: 1px solid #99f6e4;">
                <p style="font-weight: bold; color: #0e7490; margin: 0 0 8px 0; font-size: 13px;">📝 EXAM HINTS:</p>
                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                  ${item.examHints.what ? `<tr><td style="padding: 3px 0; width: 80px; font-weight: 600; color: #0891b2;">What:</td><td style="color: #333;">${item.examHints.what}</td></tr>` : ''}
                  ${item.examHints.who ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #0891b2;">Who:</td><td style="color: #333;">${item.examHints.who}</td></tr>` : ''}
                  ${item.examHints.where ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #0891b2;">Where:</td><td style="color: #333;">${item.examHints.where}</td></tr>` : ''}
                  ${item.examHints.when ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #0891b2;">When:</td><td style="color: #333;">${item.examHints.when}</td></tr>` : ''}
                  ${item.examHints.why ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #0891b2;">Why:</td><td style="color: #333;">${item.examHints.why}</td></tr>` : ''}
                  ${item.examHints.ministry ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #0891b2;">Ministry:</td><td style="color: #333;">${item.examHints.ministry}</td></tr>` : ''}
                  ${item.examHints.numbers?.length > 0 ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #0891b2;">Key Numbers:</td><td style="color: #0e7490; font-weight: 600;">${item.examHints.numbers.join(', ')}</td></tr>` : ''}
                  ${item.examHints.relatedSchemes?.length > 0 ? `<tr><td style="padding: 3px 0; font-weight: 600; color: #0891b2;">Related:</td><td style="color: #333;">${item.examHints.relatedSchemes.join(', ')}</td></tr>` : ''}
                </table>
              </div>
              <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0 0;">Source: ${item.source}</p>
            </div>
          `;
        });
      });
      
      contentHTML += `</div>`;
    });

    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CURRENT AFFAIRS POCKET PDF ${month.toUpperCase()} – ${year}</title>
        <style>
          @page {
            margin: 20mm;
            @top-center { content: "CURRENT AFFAIRS POCKET PDF ${month.toUpperCase()} – ${year}"; font-size: 10px; color: #666; }
            @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 10px; color: #666; }
          }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; }
          .cover { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: linear-gradient(135deg, #0c4a6e 0%, #0891b2 50%, #06b6d4 100%); color: white; margin: -20mm; padding: 20mm; }
          .cover h1 { font-size: 36px; margin-bottom: 20px; text-shadow: 0 0 20px rgba(6, 182, 212, 0.5); }
          .cover .subtitle { font-size: 24px; opacity: 0.9; }
          .cover .date { font-size: 20px; margin-top: 30px; opacity: 0.8; }
          .cover .count { margin-top: 40px; padding: 10px 30px; background: rgba(255,255,255,0.2); border-radius: 25px; border: 1px solid rgba(255,255,255,0.3); }
        </style>
      </head>
      <body>
        <div class="cover">
          <h1>CURRENT AFFAIRS<br/>POCKET PDF</h1>
          <div class="subtitle">${month.toUpperCase()} – ${year}</div>
          <div class="date">Curated for Competitive Exams</div>
          <div class="count">${selectedNews.length} News Items</div>
        </div>
        <div style="page-break-before: always;">${tocHTML}</div>
        ${contentHTML}
      </body>
      </html>
    `;

    return fullHTML;
  };

  const handleExport = () => {
    const html = generatePrintableHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  return (
    <Button onClick={handleExport} disabled={selectedNews.length === 0} className="neon-glow">
      <FileDown className="h-4 w-4 mr-2" />
      Export PDF ({selectedNews.length})
    </Button>
  );
};
