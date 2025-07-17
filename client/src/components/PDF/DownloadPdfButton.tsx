import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useCVStore } from '../../store/cvStore';

interface DownloadPdfButtonProps {
  className?: string;
  id?: string;
  iconOnly?: boolean;
}

const DownloadPdfButton: React.FC<DownloadPdfButtonProps> = ({ className, id, iconOnly = false }): React.ReactElement => {
  const { data, visibility, selectedTemplate } = useCVStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const hasData = Object.values(data).some(
    (value) => 
      (typeof value === 'string' && value.length > 0) || 
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === 'object' && value !== null && Object.values(value).some(v => Boolean(v) && typeof v === 'string' && v.length > 0))
  );

  const handleDownload = async () => {
    try {
      setIsLoading(true);

      let response: Response;

      if (selectedTemplate === 'default') {
        // For default template, capture the current preview HTML
        const previewElement = document.getElementById('cv-preview');
        if (!previewElement) {
          throw new Error('Preview element not found');
        }

        // Get the computed styles and HTML content
        const htmlContent = previewElement.outerHTML;

        // Get all stylesheets to include in the PDF
        const stylesheets = Array.from(document.styleSheets)
          .map(sheet => {
            try {
              return Array.from(sheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n');
            } catch {
              // Handle CORS issues with external stylesheets
              // Try to get the href and include it as a link
              if (sheet.href) {
                return `@import url("${sheet.href}");`;
              }
              return '';
            }
          })
          .join('\n');

        // Get computed styles for the preview element to ensure accurate rendering
        const computedStyles = window.getComputedStyle(previewElement);
        const elementStyles = Array.from(computedStyles).map(property =>
          `${property}: ${computedStyles.getPropertyValue(property)};`
        ).join(' ');

        const additionalStyles = `
          #cv-preview {
            ${elementStyles}
          }
          /* Ensure Tailwind utilities are preserved */
          .bg-white { background-color: #ffffff !important; }
          .text-gray-800 { color: #1f2937 !important; }
          .text-gray-600 { color: #4b5563 !important; }
          .text-gray-500 { color: #6b7280 !important; }
          .font-bold { font-weight: 700 !important; }
          .font-semibold { font-weight: 600 !important; }
          .font-medium { font-weight: 500 !important; }
          .text-xl { font-size: 1.25rem !important; }
          .text-lg { font-size: 1.125rem !important; }
          .text-sm { font-size: 0.875rem !important; }
          .mb-2 { margin-bottom: 0.5rem !important; }
          .mb-4 { margin-bottom: 1rem !important; }
          .mb-6 { margin-bottom: 1.5rem !important; }
          .p-8 { padding: 2rem !important; }
          .space-y-6 > * + * { margin-top: 1.5rem !important; }
          .space-y-4 > * + * { margin-top: 1rem !important; }
          .border-b { border-bottom-width: 1px !important; }
          .border-gray-200 { border-color: #e5e7eb !important; }
          .max-w-800px { max-width: 800px !important; }
          .mx-auto { margin-left: auto !important; margin-right: auto !important; }
        `;

        // Call the new endpoint for HTML-based PDF generation
        response = await fetch('/api/generate-pdf-from-html', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            htmlContent,
            styles: stylesheets + '\n' + additionalStyles,
            cvData: data // For filename generation
          }),
        });
      } else {
        // For other templates, use the existing template-based generation
        response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cvData: data, visibility, templateName: selectedTemplate }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a download link and trigger it
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.personalInfo?.firstName || 'CV'}_${data.personalInfo?.lastName || 'Resume'}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
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
      {isLoading ? (
        <Loader2 className={iconOnly ? "w-5 h-5 animate-spin" : "w-4 h-4 mr-2 animate-spin"} aria-hidden="true" />
      ) : (
        <Download className={iconOnly ? "w-5 h-5" : "w-4 h-4 mr-2"} aria-hidden="true" />
      )}
      {!iconOnly && (isLoading ? 'Generating...' : 'Download PDF')}
    </button>
  );
};

export default DownloadPdfButton;
