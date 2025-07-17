import React, { useEffect } from 'react';
import { useCVStore } from '../../store/cvStore';
import { X, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import PersonalInfoPreview from './Sections/PersonalInfoPreview';
import SummaryPreview from './Sections/SummaryPreview';
import WorkExperiencePreview from './Sections/WorkExperiencePreview';
import EducationPreview from './Sections/EducationPreview';
import ProjectsPreview from './Sections/ProjectsPreview';
import SkillsPreview from './Sections/SkillsPreview';
import InterestsPreview from './Sections/InterestsPreview';
import ReferencesPreview from './Sections/ReferencesPreview';
import DownloadPdfButton from '../PDF/DownloadPdfButton';

const CVPreview: React.FC = (): React.ReactElement => {
  const { data, visibility, ui, toggleFullscreen, setFullscreen } = useCVStore();
  const [zoomLevel, setZoomLevel] = React.useState(100);
  
  const hasData = Object.values(data).some(
    (value) => 
      (typeof value === 'string' && value.length > 0) || 
      (Array.isArray(value) && value.length > 0) ||
      (typeof value === 'object' && value !== null && Object.values(value).some(v => Boolean(v) && typeof v === 'string' && v.length > 0))
  );

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
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Maximize2 className="w-4 h-4" />
            Fullscreen Preview
          </button>
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

        {/* Preview Content */}
        <div className={`p-6 ${ui.isFullscreen ? 'bg-gray-900' : 'bg-gray-50'} relative`}>
          {/* Regular mode controls */}
          {!ui.isFullscreen && (
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-white text-gray-600 rounded-lg shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-all duration-200 hover:shadow-md"
                title="Enter fullscreen mode"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <DownloadPdfButton 
                className="flex items-center py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
              />
            </div>
          )}
          
          <div 
            id="cv-preview" 
            className={`max-w-[800px] mx-auto bg-white shadow-lg rounded-lg transition-all duration-200 ${
              ui.isFullscreen ? 'my-8' : ''
            }`}
            style={{ 
              transform: ui.isFullscreen ? `scale(${zoomLevel / 100})` : 'none',
              transformOrigin: 'top center'
            }}
          >
            <div className="p-8">
              <PersonalInfoPreview personalInfo={data.personalInfo} />
              
              {visibility.summary && data.summary && (
                <SummaryPreview summary={data.summary} />
              )}
              
              {visibility.workExperience && data.workExperience.length > 0 && (
                <WorkExperiencePreview experiences={data.workExperience} />
              )}
              
              {visibility.education && data.education.length > 0 && (
                <EducationPreview education={data.education} />
              )}
              
              {visibility.projects && data.projects.length > 0 && (
                <ProjectsPreview projects={data.projects} />
              )}
              
              {visibility.skills && data.skills.length > 0 && (
                <SkillsPreview skills={data.skills} />
              )}
              
              {visibility.interests && data.interests.length > 0 && (
                <InterestsPreview interests={data.interests} />
              )}
              
              {visibility.references && data.references.length > 0 && (
                <ReferencesPreview references={data.references} />
              )}
            </div>
          </div>
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

export default CVPreview;
