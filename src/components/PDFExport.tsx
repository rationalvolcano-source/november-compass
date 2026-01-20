import { Button } from "@/components/ui/button";
import { FileDown, FileText } from "lucide-react";
import { useNewsStore } from "@/hooks/useNewsStore";
import { CURRENT_AFFAIRS_SECTIONS } from "@/lib/categories";
import { NewsItem } from "@/types/news";

export const PDFExport = () => {
  const { getSelectedNews, month, year, categoryNews } = useNewsStore();
  
  const selectedNews = getSelectedNews();
  
  const generatePrintableHTML = () => {
    // Group news by section
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

    // Generate table of contents
    let tocHTML = `<h2 style="text-align: center; margin-bottom: 20px;">TABLE OF CONTENTS</h2><ul style="list-style: none; padding: 0;">`;
    let pageNum = 3;
    
    Object.entries(groupedNews).forEach(([sectionId, section]) => {
      tocHTML += `<li style="margin: 10px 0; font-weight: bold;">${section.sectionName} ............... ${pageNum}</li>`;
      Object.entries(section.categories).forEach(([catId, category]) => {
        tocHTML += `<li style="margin: 5px 0 5px 20px;">${category.categoryName} (${category.news.length} items)</li>`;
      });
      pageNum += Math.ceil(Object.values(section.categories).reduce((sum, cat) => sum + cat.news.length, 0) / 3);
    });
    tocHTML += `</ul>`;

    // Generate content
    let contentHTML = '';
    
    Object.entries(groupedNews).forEach(([sectionId, section]) => {
      contentHTML += `
        <div style="page-break-before: always;">
          <h2 style="background: #1a365d; color: white; padding: 15px; margin: 0 0 20px 0; text-align: center;">
            ${section.sectionName}
          </h2>
      `;
      
      Object.entries(section.categories).forEach(([catId, category]) => {
        contentHTML += `<h3 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin: 20px 0 15px 0;">${category.categoryName}</h3>`;
        
        category.news.forEach((item, index) => {
          contentHTML += `
            <div style="margin-bottom: 25px; border-left: 3px solid #3b82f6; padding-left: 15px;">
              <h4 style="margin: 0 0 8px 0; color: #1e40af;">${index + 1}. ${item.headline}</h4>
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">${item.date}</p>
              <p style="margin: 0 0 12px 0; line-height: 1.6;">${item.description}</p>
              
              <div style="background: #f3f4f6; padding: 12px; border-radius: 6px;">
                <p style="font-weight: bold; color: #374151; margin: 0 0 8px 0; font-size: 13px;">📝 EXAM HINTS:</p>
                <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                  ${item.examHints.what ? `<tr><td style="padding: 3px 0; width: 80px; font-weight: 600;">What:</td><td>${item.examHints.what}</td></tr>` : ''}
                  ${item.examHints.who ? `<tr><td style="padding: 3px 0; font-weight: 600;">Who:</td><td>${item.examHints.who}</td></tr>` : ''}
                  ${item.examHints.where ? `<tr><td style="padding: 3px 0; font-weight: 600;">Where:</td><td>${item.examHints.where}</td></tr>` : ''}
                  ${item.examHints.when ? `<tr><td style="padding: 3px 0; font-weight: 600;">When:</td><td>${item.examHints.when}</td></tr>` : ''}
                  ${item.examHints.why ? `<tr><td style="padding: 3px 0; font-weight: 600;">Why:</td><td>${item.examHints.why}</td></tr>` : ''}
                  ${item.examHints.ministry ? `<tr><td style="padding: 3px 0; font-weight: 600;">Ministry:</td><td>${item.examHints.ministry}</td></tr>` : ''}
                  ${item.examHints.numbers?.length > 0 ? `<tr><td style="padding: 3px 0; font-weight: 600;">Key Numbers:</td><td>${item.examHints.numbers.join(', ')}</td></tr>` : ''}
                  ${item.examHints.relatedSchemes?.length > 0 ? `<tr><td style="padding: 3px 0; font-weight: 600;">Related:</td><td>${item.examHints.relatedSchemes.join(', ')}</td></tr>` : ''}
                </table>
              </div>
              <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">Source: ${item.source}</p>
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
            @top-center {
              content: "CURRENT AFFAIRS POCKET PDF ${month.toUpperCase()} – ${year}";
              font-size: 10px;
              color: #666;
            }
            @bottom-center {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 10px;
              color: #666;
            }
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
          }
          .cover {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            margin: -20mm;
            padding: 20mm;
          }
          .cover h1 {
            font-size: 36px;
            margin-bottom: 20px;
          }
          .cover .subtitle {
            font-size: 24px;
            opacity: 0.9;
          }
          .cover .date {
            font-size: 20px;
            margin-top: 30px;
            opacity: 0.8;
          }
          .cover .count {
            margin-top: 40px;
            padding: 10px 30px;
            background: rgba(255,255,255,0.2);
            border-radius: 25px;
          }
        </style>
      </head>
      <body>
        <div class="cover">
          <h1>CURRENT AFFAIRS<br/>POCKET PDF</h1>
          <div class="subtitle">${month.toUpperCase()} – ${year}</div>
          <div class="date">Curated for Competitive Exams</div>
          <div class="count">${selectedNews.length} News Items</div>
        </div>
        
        <div style="page-break-before: always;">
          ${tocHTML}
        </div>
        
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
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{selectedNews.length}</span> news items selected
      </div>
      <Button onClick={handleExport} disabled={selectedNews.length === 0}>
        <FileDown className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
};
