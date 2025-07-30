import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useCVStore } from '../../store/cvStore';
import { useGeneratePDF } from '../../hooks/useApiQuery';
import toast from 'react-hot-toast';

interface DownloadPdfButtonProps {
  className?: string;
  id?: string;
  iconOnly?: boolean;
}

const DownloadPdfButton: React.FC<DownloadPdfButtonProps> = ({ className, id, iconOnly = false }): React.ReactElement => {
  const { data, selectedTemplate } = useCVStore();
  const generatePDFMutation = useGeneratePDF();
  
  const hasData = Object.values(data).some(
    (value) => 
      (typeof value === 'string' && value.length > 0) || 
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === 'object' && value !== null && Object.values(value).some(v => Boolean(v) && typeof v === 'string' && v.length > 0))
  );

  // Enhanced style extraction for better PDF rendering
  const extractStyles = async (): Promise<string> => {
    const styles: string[] = [];

    // 1. Extract inline styles from all stylesheets  
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules);
        const cssText = rules.map(rule => rule.cssText).join('\n');
        styles.push(cssText);
      } catch {
        // Handle CORS issues with external stylesheets by including critical external styles
        if (sheet.href) {
          // Include Tailwind CSS directly since CORS prevents access
          if (sheet.href.includes('tailwindcss.com')) {
            // Tailwind will be handled by our custom CSS below
          } else {
            styles.push(`@import url("${sheet.href}");`);
          }
        }
      }
    });

    // 2. Add Google Fonts
    styles.push(`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    `);

    // 2. Add comprehensive Tailwind CSS utilities for PDF consistency
    const tailwindOverrides = `
      /* Reset and Base Styles */
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      
      /* Layout */
      .max-w-4xl { max-width: 56rem !important; }
      .max-w-800px { max-width: 800px !important; }
      .mx-auto { margin-left: auto !important; margin-right: auto !important; }
      .p-6 { padding: 1.5rem !important; }
      .p-8 { padding: 2rem !important; }
      .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
      .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
      .m-0 { margin: 0 !important; }
      .mb-2 { margin-bottom: 0.5rem !important; }
      .mb-3 { margin-bottom: 0.75rem !important; }
      .mb-4 { margin-bottom: 1rem !important; }
      .mb-6 { margin-bottom: 1.5rem !important; }
      .mb-8 { margin-bottom: 2rem !important; }
      .mt-1 { margin-top: 0.25rem !important; }
      .mt-2 { margin-top: 0.5rem !important; }
      .mt-3 { margin-top: 0.75rem !important; }
      .mt-4 { margin-top: 1rem !important; }
      
      /* Spacing */
      .space-y-4 > * + * { margin-top: 1rem !important; }
      .space-y-6 > * + * { margin-top: 1.5rem !important; }
      .space-y-8 > * + * { margin-top: 2rem !important; }
      .gap-2 { gap: 0.5rem !important; }
      .gap-3 { gap: 0.75rem !important; }
      .gap-4 { gap: 1rem !important; }
      .gap-6 { gap: 1.5rem !important; }
      .gap-8 { gap: 2rem !important; }
      
      /* Typography */
      .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
      .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
      .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
      .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
      .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
      .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
      .text-3xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
      .text-4xl { font-size: 2.25rem !important; line-height: 2.5rem !important; }
      .text-5xl { font-size: 3rem !important; line-height: 1 !important; }
      
      .font-medium { font-weight: 500 !important; }
      .font-semibold { font-weight: 600 !important; }
      .font-bold { font-weight: 700 !important; }
      .font-serif { font-family: 'Lora', ui-serif, Georgia, serif !important; }
      
      /* Colors */
      .bg-white { background-color: #ffffff !important; }
      .bg-gray-50 { background-color: #f9fafb !important; }
      .bg-gray-100 { background-color: #f3f4f6 !important; }
      .bg-gray-700 { background-color: #374151 !important; }
      .bg-gray-800 { background-color: #1f2937 !important; }
      .bg-gray-900 { background-color: #111827 !important; }
      .bg-blue-50 { background-color: #eff6ff !important; }
      .bg-blue-100 { background-color: #dbeafe !important; }
      .bg-green-50 { background-color: #f0fdf4 !important; }
      .bg-purple-50 { background-color: #faf5ff !important; }
      
      .text-white { color: #ffffff !important; }
      .text-gray-300 { color: #d1d5db !important; }
      .text-gray-400 { color: #9ca3af !important; }
      .text-gray-500 { color: #6b7280 !important; }
      .text-gray-600 { color: #4b5563 !important; }
      .text-gray-700 { color: #374151 !important; }
      .text-gray-800 { color: #1f2937 !important; }
      .text-blue-600 { color: #2563eb !important; }
      .text-blue-700 { color: #1d4ed8 !important; }
      .text-blue-800 { color: #1e40af !important; }
      .text-green-600 { color: #16a34a !important; }
      .text-green-700 { color: #15803d !important; }
      .text-green-800 { color: #166534 !important; }
      .text-purple-400 { color: #a855f7 !important; }
      .text-purple-600 { color: #9333ea !important; }
      .text-purple-700 { color: #7c3aed !important; }
      
      /* Layout & Display */
      .flex { display: flex !important; }
      .grid { display: grid !important; }
      .hidden { display: none !important; }
      .block { display: block !important; }
      .inline-flex { display: inline-flex !important; }
      
      .flex-col { flex-direction: column !important; }
      .flex-wrap { flex-wrap: wrap !important; }
      .items-center { align-items: center !important; }
      .items-start { align-items: flex-start !important; }
      .justify-center { justify-content: center !important; }
      .justify-between { justify-content: space-between !important; }
      
      .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
      .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
      .col-span-1 { grid-column: span 1 / span 1 !important; }
      .col-span-2 { grid-column: span 2 / span 2 !important; }
      .col-span-3 { grid-column: span 3 / span 3 !important; }
      
      /* Responsive breakpoints - lg: (1024px+) */
      @media (min-width: 1024px) {
        .lg\\:grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
        .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
        .lg\\:col-span-1 { grid-column: span 1 / span 1 !important; }
        .lg\\:col-span-2 { grid-column: span 2 / span 2 !important; }
        .lg\\:col-span-3 { grid-column: span 3 / span 3 !important; }
      }
      
      /* md: breakpoint (768px+) */
      @media (min-width: 768px) {
        .md\\:grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
        .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        .md\\:col-span-1 { grid-column: span 1 / span 1 !important; }
        .md\\:col-span-2 { grid-column: span 2 / span 2 !important; }
        .md\\:col-span-3 { grid-column: span 3 / span 3 !important; }
      }
      
      /* Borders & Shadows */
      .border { border-width: 1px !important; }
      .border-b { border-bottom-width: 1px !important; }
      .border-b-2 { border-bottom-width: 2px !important; }
      .border-b-4 { border-bottom-width: 4px !important; }
      .border-l-4 { border-left-width: 4px !important; }
      .border-gray-200 { border-color: #e5e7eb !important; }
      .border-green-200 { border-color: #bbf7d0 !important; }
      .border-green-600 { border-color: #16a34a !important; }
      .border-blue-200 { border-color: #dbeafe !important; }
      .border-blue-400 { border-color: #60a5fa !important; }
      .border-blue-500 { border-color: #3b82f6 !important; }
      .border-purple-400 { border-color: #c084fc !important; }
      .border-purple-500 { border-color: #a855f7 !important; }
      
      .rounded { border-radius: 0.25rem !important; }
      .rounded-lg { border-radius: 0.5rem !important; }
      .rounded-xl { border-radius: 0.75rem !important; }
      .rounded-2xl { border-radius: 1rem !important; }
      .rounded-full { border-radius: 9999px !important; }
      
      .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important; }
      .shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important; }
      .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important; }
      .shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important; }
      .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25) !important; }
      
      /* Gradients */
      .bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)) !important; }
      .from-blue-600 { --tw-gradient-from: #2563eb !important; --tw-gradient-to: rgb(37 99 235 / 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
      .to-purple-600 { --tw-gradient-to: #9333ea !important; }
      .from-purple-600 { --tw-gradient-from: #9333ea !important; --tw-gradient-to: rgb(147 51 234 / 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
      .to-pink-600 { --tw-gradient-to: #db2777 !important; }
      .from-blue-50 { --tw-gradient-from: #eff6ff !important; --tw-gradient-to: rgb(239 246 255 / 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
      .to-purple-50 { --tw-gradient-to: #faf5ff !important; }
      .from-green-50 { --tw-gradient-from: #f0fdf4 !important; --tw-gradient-to: rgb(240 253 244 / 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
      .to-blue-50 { --tw-gradient-to: #eff6ff !important; }
      
      /* Opacity */
      .opacity-90 { opacity: 0.9 !important; }
      
      /* Positioning */
      .text-center { text-align: center !important; }
      .text-right { text-align: right !important; }
      .text-left { text-align: left !important; }
      
      /* Misc */
      .leading-relaxed { line-height: 1.625 !important; }
      .overflow-hidden { overflow: hidden !important; }
      .italic { font-style: italic !important; }
      .underline { text-decoration-line: underline !important; }
      .hover\\:underline:hover { text-decoration-line: underline !important; }
      
      /* Minimal print adjustments - preserve all colors and styling */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;

    styles.push(tailwindOverrides);

    return styles.join('\n');
  };

  const handleDownload = async () => {
    try {
      // Always use HTML snapshot approach for consistency
      const previewElement = document.getElementById('cv-preview');
      if (!previewElement) {
        // Debug: List all elements with potential preview IDs
        const allElements = document.querySelectorAll('[id*="preview"], [data-template-preview]');
        console.error('Preview element not found. Available elements:', Array.from(allElements).map(el => ({
          id: el.id,
          tagName: el.tagName,
          className: el.className
        })));
        throw new Error('CV preview element not found. Please make sure the preview is fully loaded before downloading the PDF.');
      }

      // Ensure the preview is fully rendered before capturing
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Get the HTML content with computed styles preserved
      const htmlContent = previewElement.outerHTML;

      // Enhanced CSS extraction for better PDF rendering
      const extractedStyles = await extractStyles();

      console.log('🔍 PDF Generation Debug:');
      console.log('- HTML Content Length:', htmlContent.length);
      console.log('- Selected Template:', selectedTemplate);
      console.log('- Preview Element Found:', !!previewElement);
      console.log('- Styles Extracted Length:', extractedStyles.length);

      // Use React Query mutation for PDF generation
      generatePDFMutation.mutate({
        htmlContent,
        styles: extractedStyles,
        cvData: data,
        templateName: selectedTemplate
      });
    } catch (error) {
      console.error('Error preparing PDF generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Use toast for error notification
      toast.error(`Failed to prepare PDF: ${errorMessage}`);
    }
  };

  if (!hasData) {
    return (
      <button 
        className={className}
        disabled
        title="Add some content to your CV first"
        id={id}
        type="button"
        aria-label="Download PDF (disabled)"
      >
        <Download className={iconOnly ? "w-5 h-5" : "w-4 h-4 mr-2"} aria-hidden="true" />
        {!iconOnly && "Download PDF"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={className}
      id={id}
      aria-label="Download PDF"
      title={iconOnly ? "Download PDF" : undefined}
    >
      {generatePDFMutation.isPending ? (
        <Loader2 className={iconOnly ? "w-5 h-5 animate-spin" : "w-4 h-4 mr-2 animate-spin"} aria-hidden="true" />
      ) : (
        <Download className={iconOnly ? "w-5 h-5" : "w-4 h-4 mr-2"} aria-hidden="true" />
      )}
      {!iconOnly && (generatePDFMutation.isPending ? 'Generating...' : 'Download PDF')}
    </button>
  );
};

export default DownloadPdfButton;
