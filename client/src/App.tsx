import React from 'react';
import { useCVStore } from './store/cvStore';
import Sidebar from './components/Layout/Sidebar';
import FloatingTemplateSelector from './components/Layout/FloatingTemplateSelector';
import AutoSaveIndicator from './components/Layout/AutoSaveIndicator';
import CVPreview from './components/Preview/CVPreview';
import TemplatePreview from './components/Preview/TemplatePreview';
import PersonalInfoForm from './components/Form/PersonalInfoForm';
import SummaryForm from './components/Form/SummaryForm';
import WorkExperienceForm from './components/Form/WorkExperienceForm';
import EducationForm from './components/Form/EducationForm';
import ProjectsForm from './components/Form/ProjectsForm';
import SkillsForm from './components/Form/SkillsForm';
import InterestsForm from './components/Form/InterestsForm';
import ReferencesForm from './components/Form/ReferencesForm';

const App: React.FC = (): React.ReactElement => {
  const { activeSection, ui, selectedTemplate } = useCVStore();

  const renderActiveForm = (): React.ReactNode => {
    switch (activeSection) {
      case 'personalInfo':
        return <PersonalInfoForm />;
      case 'summary':
        return <SummaryForm />;
      case 'workExperience':
        return <WorkExperienceForm />;
      case 'education':
        return <EducationForm />;
      case 'projects':
        return <ProjectsForm />;
      case 'skills':
        return <SkillsForm />;
      case 'interests':
        return <InterestsForm />;
      case 'references':
        return <ReferencesForm />;
      default:
        return null;
    }
  };

  // Don't render main layout when in fullscreen mode
  if (ui.isFullscreen) {
    return <CVPreview />;
  }

  // Dynamic layout calculations
  const sidebarWidth = ui.sidebarCollapsed 
    ? (ui.sidebarCompactMode ? 'lg:w-20' : 'lg:w-24') 
    : 'lg:w-64';
  
  const formWidth = ui.sidebarCollapsed
    ? 'lg:w-2/5'
    : 'lg:w-1/3';

  const previewWidth = ui.sidebarCollapsed
    ? 'lg:w-3/5'
    : 'lg:w-1/2';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-6">
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-3rem)]">
          {/* Left Sidebar */}
          <div className={`${sidebarWidth} transition-all duration-300 ease-in-out`}>
            <div className="h-full">
              <Sidebar />
            </div>
          </div>

          {/* Middle Form Section */}
          <div className={`${formWidth} transition-all duration-300 ease-in-out`}>
            <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="p-6">
                  {/* Form Header */}
                  <div className="mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800 capitalize">
                          {activeSection === 'personalInfo' 
                            ? 'Personal Information' 
                            : activeSection === 'workExperience' 
                              ? 'Work Experience' 
                              : activeSection.replace(/([A-Z])/g, ' $1').trim()
                          }
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {getFormDescription(activeSection)}
                        </p>
                      </div>
                      <AutoSaveIndicator />
                    </div>
                  </div>
                  
                  {/* Form Content */}
                  <div className="space-y-4">
                    {renderActiveForm()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Preview Section */}
          <div className={`${previewWidth} transition-all duration-300 ease-in-out`}>
            <div className="h-[calc(100vh-3rem)] min-h-[600px] flex flex-col">
              {selectedTemplate === 'default' ? (
                <CVPreview />
              ) : (
                <TemplatePreview />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Template Selector */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <FloatingTemplateSelector />
      </div>
    </div>
  );
};

// Helper function for form descriptions
const getFormDescription = (section: string): string => {
  const descriptions: Record<string, string> = {
    personalInfo: 'Add your basic contact information and professional title',
    summary: 'Write a brief overview of your professional background',
    workExperience: 'List your work history and key achievements',
    education: 'Add your educational background and qualifications',
    projects: 'Showcase your notable projects and accomplishments',
    skills: 'List your technical and professional skills',
    interests: 'Share your hobbies and personal interests',
    references: 'Add professional references who can vouch for your work'
  };
  
  return descriptions[section] || 'Complete this section to enhance your CV';
};

export default App;
