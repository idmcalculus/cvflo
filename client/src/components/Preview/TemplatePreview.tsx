import React, { useState, useEffect } from 'react';
import { useCVStore } from '../../store/cvStore';
import DownloadPdfButton from '../PDF/DownloadPdfButton';
import TemplateSelector from '../TemplateSelector';

const TemplatePreview: React.FC = () => {
  const { data, visibility, selectedTemplate } = useCVStore();
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const hasData = Object.values(data).some(
    (value) => 
      (typeof value === 'string' && value.length > 0) || 
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === 'object' && value !== null && Object.values(value).some(v => Boolean(v) && typeof v === 'string' && v.length > 0))
  );

  useEffect(() => {
    if (!hasData) {
      setPreviewHtml('');
      return;
    }

    const generatePreview = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/generate-preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            cvData: data, 
            visibility, 
            templateName: selectedTemplate 
          }),
        });

        if (response.ok) {
          const html = await response.text();
          setPreviewHtml(html);
        } else {
          console.error('Failed to generate preview');
          setPreviewHtml('');
        }
      } catch (error) {
        console.error('Error generating preview:', error);
        setPreviewHtml('');
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();
  }, [data, visibility, selectedTemplate, hasData]);

  if (!hasData) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-gray-50 rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">CV Preview</h3>
          <p className="text-gray-500 mb-4">
            Start filling out your information to see a preview of your CV here.
          </p>
          <TemplateSelector />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <TemplateSelector />
        <DownloadPdfButton
          className="flex items-center py-1.5 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
        />
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 preview-container">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : previewHtml ? (
          <div className="h-full bg-gray-50 overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              title="CV Preview"
              sandbox="allow-same-origin"
              style={{
                minHeight: '100%',
                scrollBehavior: 'smooth'
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Unable to generate preview</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatePreview;