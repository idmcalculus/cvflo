import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCVStore } from '../../store/cvStore';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import DownloadPdfButton from '../PDF/DownloadPdfButton';
import TemplateSelector from '../TemplateSelector';
import { X, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

const TemplatePreview: React.FC = () => {
  const { data, visibility, selectedTemplate, ui, toggleFullscreen, setFullscreen } = useCVStore();
  const { authenticatedFetch } = useAuthenticatedApi();
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for preview HTML to avoid unnecessary API calls
  const cacheRef = useRef<Map<string, string>>(new Map());
  const lastRequestTimeRef = useRef<number>(0);

  const hasData = Object.values(data).some(
    (value) => 
      (typeof value === 'string' && value.length > 0) || 
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === 'object' && value !== null && Object.values(value).some(v => Boolean(v) && typeof v === 'string' && v.length > 0))
  );

  // Create a cache key based on data, visibility, and template
  const cacheKey = useMemo(() => {
    if (!hasData) return '';
    return JSON.stringify({ data, visibility, selectedTemplate });
  }, [data, visibility, selectedTemplate, hasData]);

  // Keyboard shortcuts for fullscreen mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (ui.isFullscreen) {
        // Escape key to exit fullscreen
        if (event.key === 'Escape') {
          event.preventDefault();
          setFullscreen(false);
        }
        // Plus/Minus for zoom
        if (event.key === '+' || event.key === '=') {
          event.preventDefault();
          setZoomLevel(prev => Math.min(prev + 10, 200));
        }
        if (event.key === '-') {
          event.preventDefault();
          setZoomLevel(prev => Math.max(prev - 10, 50));
        }
        // 0 to reset zoom
        if (event.key === '0') {
          event.preventDefault();
          setZoomLevel(100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ui.isFullscreen, setFullscreen]);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (ui.isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [ui.isFullscreen]);

  useEffect(() => {
    if (!hasData) {
      setPreviewHtml('');
      setError(null);
      return;
    }

    // Check cache first
    if (cacheKey && cacheRef.current.has(cacheKey)) {
      const cachedHtml = cacheRef.current.get(cacheKey)!;
      setPreviewHtml(cachedHtml);
      setError(null);
      return;
    }

    const generatePreview = async () => {
      const currentTime = Date.now();
      
      // Rate limiting: prevent more than one request per 2 seconds
      if (currentTime - lastRequestTimeRef.current < 2000) {
        return;
      }
      
      lastRequestTimeRef.current = currentTime;
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await authenticatedFetch('/api/generate-preview', {
          method: 'POST',
          body: JSON.stringify({ 
            cvData: data, 
            visibility, 
            templateName: selectedTemplate 
          }),
        });

        if (response.ok) {
          const html = await response.text();
          setPreviewHtml(html);
          
          // Cache the result
          if (cacheKey) {
            cacheRef.current.set(cacheKey, html);
            
            // Limit cache size to prevent memory issues
            if (cacheRef.current.size > 10) {
              const firstKey = cacheRef.current.keys().next().value;
              cacheRef.current.delete(firstKey);
            }
          }
        } else {
          const errorText = await response.text();
          if (response.status === 429) {
            setError('Too many requests. Please wait a moment before making changes.');
          } else {
            setError(`Failed to generate preview: ${response.statusText}`);
          }
          console.error('Failed to generate preview:', errorText);
          setPreviewHtml('');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Error generating preview: ${errorMessage}`);
        console.error('Error generating preview:', error);
        setPreviewHtml('');
      } finally {
        setIsLoading(false);
      }
    };

    // Increased debounce time to 1.5 seconds to reduce API calls
    const timeoutId = setTimeout(generatePreview, 1500);
    return () => clearTimeout(timeoutId);
  }, [cacheKey, data, visibility, selectedTemplate, hasData, authenticatedFetch]);

  if (!hasData) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <Maximize2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">CV Preview</h3>
          <p className="text-gray-500 mb-4">
            Start filling out your information to see a preview of your CV here.
          </p>
          <div className="space-y-4">
            <TemplateSelector />
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Maximize2 className="w-4 h-4" />
              Fullscreen Preview
            </button>
          </div>
        </div>
      </div>
    );
  }

  const containerClasses = ui.isFullscreen
    ? "fixed inset-0 z-50 bg-white"
    : "bg-white shadow-md rounded-lg overflow-hidden h-full flex flex-col";

  const contentClasses = ui.isFullscreen
    ? "h-screen overflow-y-auto bg-gray-900 preview-container"
    : "overflow-y-auto flex-1 min-h-0 preview-container";

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Fullscreen Header */}
        {ui.isFullscreen && (
          <div className="sticky top-0 z-20 bg-white shadow-sm border-b px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-800">CV Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 10, 50))}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 10, 200))}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Reset zoom"
                >
                  Reset
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <TemplateSelector />
              <DownloadPdfButton 
                className="flex items-center gap-2 py-2 px-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
              />
              <button
                onClick={() => setFullscreen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Exit fullscreen (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Regular Mode Header */}
        {!ui.isFullscreen && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <TemplateSelector />
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-white text-gray-600 rounded-lg shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 hover:shadow-md"
                title="Enter fullscreen mode"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <DownloadPdfButton
                className="flex items-center py-1.5 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
              />
            </div>
          </div>
        )}

        {/* Preview Content */}
        <div className={`${ui.isFullscreen ? 'p-6 bg-gray-900' : ''} flex-1 min-h-0 relative`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center bg-red-50 rounded-lg p-6 max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-red-700 mb-2">Preview Error</h3>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : previewHtml ? (
            <div 
              className={`${ui.isFullscreen ? 'mx-auto transition-all duration-200 my-8' : 'h-full bg-gray-50 overflow-hidden'}`}
              style={{ 
                transform: ui.isFullscreen ? `scale(${zoomLevel / 100})` : 'none',
                transformOrigin: 'top center'
              }}
            >
              <div 
                id="cv-preview" 
                data-template-preview
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                style={{
                  fontFamily: 'inherit',
                  lineHeight: 'inherit',
                  minHeight: ui.isFullscreen ? 'auto' : '100%'
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Unable to generate preview</p>
            </div>
          )}
        </div>

        {/* Fullscreen Footer */}
        {ui.isFullscreen && (
          <div className="sticky bottom-0 bg-white border-t px-6 py-2 text-center">
            <p className="text-xs text-gray-500">
              Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">Esc</kbd> to exit fullscreen • 
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600 ml-1">+/-</kbd> to zoom • 
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600 ml-1">0</kbd> to reset
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatePreview;