import React, { useEffect } from 'react';
import { useCVStore } from '../../store/cvStore';
import { 
  User, FileText, Briefcase, GraduationCap, 
  Star, Heart, BookUser, FolderGit2, Check, X,
  LucideIcon, ChevronLeft, ChevronRight, Menu,
  Maximize2, Minimize2, Settings
} from 'lucide-react';
import DownloadPdfButton from '../PDF/DownloadPdfButton';
import ProgressIndicator from './ProgressIndicator';
import { SectionVisibility } from '../../types/cv.types';

interface SectionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  toggleable?: boolean;
}

const sections: SectionItem[] = [
  { id: 'personalInfo', label: 'Personal Info', icon: User },
  { id: 'summary', label: 'Summary', icon: FileText, toggleable: true },
  { id: 'workExperience', label: 'Work Experience', icon: Briefcase, toggleable: true },
  { id: 'education', label: 'Education', icon: GraduationCap, toggleable: true },
  { id: 'projects', label: 'Projects', icon: FolderGit2, toggleable: true },
  { id: 'skills', label: 'Skills', icon: Star, toggleable: true },
  { id: 'interests', label: 'Interests', icon: Heart, toggleable: true },
  { id: 'references', label: 'References', icon: BookUser, toggleable: true },
];

const Sidebar: React.FC = (): React.ReactElement => {
  const { 
    activeSection, 
    setActiveSection, 
    visibility, 
    toggleSectionVisibility,
    ui,
    toggleSidebar,
    toggleSidebarCompactMode,
    toggleFullscreen
  } = useCVStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
      // Ctrl/Cmd + Shift + F to toggle fullscreen
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, toggleFullscreen]);

  const sidebarWidth = ui.sidebarCollapsed 
    ? (ui.sidebarCompactMode ? 'w-16' : 'w-20') 
    : 'w-full lg:w-64';

  return (
    <div 
      className={`${sidebarWidth} bg-white shadow-lg h-auto lg:h-full overflow-hidden transition-all duration-300 ease-in-out relative group`}
      style={{ 
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)'
      }}
    >
      {/* Desktop Collapse Toggle Button */}
      <button
        className="hidden lg:flex absolute -right-3 top-4 z-10 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl items-center justify-center transition-all duration-200 hover:scale-110 border-2 border-white"
        onClick={toggleSidebar}
        title={ui.sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        type="button"
      >
        {ui.sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {!ui.sidebarCollapsed && (
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CVFlo
              </h2>
              {/* Mobile Toggle Button */}
              <button
                className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                onClick={toggleSidebar}
                title="Collapse menu"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {ui.sidebarCollapsed && (
            <button
              className="w-full flex justify-center p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
              onClick={toggleSidebar}
              title="Expand menu"
              type="button"
            >
              <Menu className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        {!ui.sidebarCollapsed && (
          <ProgressIndicator />
        )}

        {/* Quick Actions */}
        {!ui.sidebarCollapsed && (
          <div className="flex gap-2 mb-4">
            <button
              className="flex-1 p-2 text-xs bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all duration-200 flex items-center justify-center gap-1"
              onClick={toggleFullscreen}
              title="Toggle fullscreen preview"
            >
              {ui.isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              <span>Preview</span>
            </button>
            <button
              className="p-2 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200"
              onClick={toggleSidebarCompactMode}
              title="Toggle compact mode"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {/* Navigation Sections */}
        <div className="space-y-1 flex-1 overflow-y-auto">
          {sections.map((section, index) => (
            <div key={section.id} className="relative">
              {/* Section Button */}
              <div className="flex items-center">
                <button
                  className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 relative overflow-hidden group ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 shadow-md scale-[1.02]'
                      : 'text-gray-600 hover:bg-gray-50 hover:scale-[1.01]'
                  }`}
                  onClick={(): void => setActiveSection(section.id)}
                  type="button"
                  aria-label={`Edit ${section.label} section`}
                  aria-pressed={activeSection === section.id}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  {/* Active section indicator */}
                  {activeSection === section.id && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-600 to-purple-600 rounded-r-full" />
                  )}
                  
                  <section.icon 
                    className={`w-5 h-5 transition-all duration-200 ${
                      ui.sidebarCollapsed ? 'mx-auto' : 'mr-3'
                    } ${activeSection === section.id ? 'text-blue-600' : ''}`} 
                    aria-hidden="true" 
                  />
                  
                  {!ui.sidebarCollapsed && (
                    <span className="font-medium text-sm">{section.label}</span>
                  )}

                  {/* Hover tooltip for collapsed mode */}
                  {ui.sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {section.label}
                    </div>
                  )}
                </button>
                
                {/* Visibility Toggle */}
                {section.toggleable && !ui.sidebarCollapsed && (
                  <button
                    className={`ml-2 p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                      visibility[section.id as keyof SectionVisibility]
                        ? 'text-green-600 hover:bg-green-50 bg-green-50/50'
                        : 'text-red-500 hover:bg-red-50 bg-red-50/50'
                    }`}
                    onClick={(): void => toggleSectionVisibility(section.id as keyof SectionVisibility)}
                    title={`${visibility[section.id as keyof SectionVisibility] ? 'Hide' : 'Show'} section in CV`}
                    type="button"
                    aria-label={`${visibility[section.id as keyof SectionVisibility] ? 'Hide' : 'Show'} ${section.label} section in CV`}
                    aria-pressed={visibility[section.id as keyof SectionVisibility]}
                  >
                    {visibility[section.id as keyof SectionVisibility] ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <X className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                )}

                {/* Compact mode visibility indicator */}
                {section.toggleable && ui.sidebarCollapsed && (
                  <div 
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      visibility[section.id as keyof SectionVisibility] 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    }`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Download Button */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          {ui.sidebarCollapsed ? (
            <div className="flex justify-center">
              <DownloadPdfButton 
                className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105"
                id="downloadPdfBtn"
                iconOnly
              />
            </div>
          ) : (
            <DownloadPdfButton 
              className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] font-medium"
              id="downloadPdfBtn"
            />
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        {!ui.sidebarCollapsed && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">Ctrl+B</kbd> to toggle
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
