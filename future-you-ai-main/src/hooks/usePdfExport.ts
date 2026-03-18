import { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from './use-toast';

interface UsePdfExportOptions {
  filename?: string;
  margin?: number;
}

export function usePdfExport(options: UsePdfExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { filename = 'report.pdf', margin = 10 } = options;

  const exportToPdf = async (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast({
        title: "Export Failed",
        description: "Could not find the content to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Temporarily store original styles to ensure the element captures well
      const originalWidth = element.style.width;
      const originalHeight = element.style.height;
      const originalMaxWidth = element.style.maxWidth;
      const originalMaxHeight = element.style.maxHeight;
      const originalOverflow = element.style.overflow;

      // Force element to expand fully to capture everything
      element.style.width = '1200px'; 
      element.style.maxWidth = 'none';
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
      element.style.padding = '20px'; // Add some padding so content doesn't touch the edges

      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Ensure a white background, useful for dark mode
      });

      // Restore original styles immediately
      element.style.width = originalWidth;
      element.style.height = originalHeight;
      element.style.maxWidth = originalMaxWidth;
      element.style.maxHeight = originalMaxHeight;
      element.style.overflow = originalOverflow;
      element.style.padding = '';

      const imgWidth = 210 - (margin * 2); // A4 width inside margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297 - (margin * 2); // A4 height inside margins
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = margin;
      
      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add extra pages if content overflows
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(filename);
      
      toast({
        title: "Success",
        description: "PDF report has been downloaded successfully.",
      });
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast({
        title: "Export Failed",
        description: "An error occurred while generating the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPdf, isExporting };
}
