import React, { Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { useCVStore } from './store/cvStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import FloatingTemplateSelector from './components/Layout/FloatingTemplateSelector';
import AutoSaveIndicator from './components/Layout/AutoSaveIndicator';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import CVDataSync from './components/CVDataSync';

// Lazy load heavy components
const AuthPage = React.lazy(() => import('./components/Auth/AuthPage'));
const AuthCallback = React.lazy(() => import('./components/Auth/AuthCallback'));
const UpdatePasswordForm = React.lazy(() => import('./components/Auth/UpdatePasswordForm'));
const TemplatePreview = React.lazy(() => import('./components/Preview/TemplatePreview'));
const ProfileForm = React.lazy(() => import('./components/Form/ProfileForm'));
const PersonalInfoForm = React.lazy(() => import('./components/Form/PersonalInfoForm'));
const SummaryForm = React.lazy(() => import('./components/Form/SummaryForm'));
const WorkExperienceForm = React.lazy(() => import('./components/Form/WorkExperienceForm'));
const EducationForm = React.lazy(() => import('./components/Form/EducationForm'));
const ProjectsForm = React.lazy(() => import('./components/Form/ProjectsForm'));
const SkillsForm = React.lazy(() => import('./components/Form/SkillsForm'));
const InterestsForm = React.lazy(() => import('./components/Form/InterestsForm'));
const ReferencesForm = React.lazy(() => import('./components/Form/ReferencesForm'));

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
  </div>
);

const CVBuilder: React.FC = (): React.ReactElement => {
  const { activeSection, ui, initializeTemplate } = useCVStore();
  const { user, loading } = useAuth();

  // Initialize template on app load
  React.useEffect(() => {
    initializeTemplate();
  }, [initializeTemplate]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading CVFlo by Jaydeetech...</p>
        </div>
      </div>
    );
  }

  // Show auth page if user is not authenticated
  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AuthPage />
      </Suspense>
    );
  }


  const renderActiveForm = (): React.ReactNode => {
    const FormComponent = (() => {
      switch (activeSection) {
        case 'profile':
          return ProfileForm;
        case 'personalInfo':
          return PersonalInfoForm;
        case 'summary':
          return SummaryForm;
        case 'workExperience':
          return WorkExperienceForm;
        case 'education':
          return EducationForm;
        case 'projects':
          return ProjectsForm;
        case 'skills':
          return SkillsForm;
        case 'interests':
          return InterestsForm;
        case 'references':
          return ReferencesForm;
        default:
          return null;
      }
    })();

    if (!FormComponent) return null;

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <FormComponent />
      </Suspense>
    );
  };

  // Don't render main layout when in fullscreen mode
  if (ui.isFullscreen) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <TemplatePreview />
      </Suspense>
    );
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
      {/* CV Data Sync Component */}
      <CVDataSync />
      
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
                          {activeSection === 'profile' 
                            ? 'Account Profile'
                            : activeSection === 'personalInfo' 
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
              <Suspense fallback={<LoadingSpinner />}>
                <TemplatePreview />
              </Suspense>
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
    profile: 'Manage your account settings and preferences',
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

const App: React.FC = (): React.ReactElement => {
  // Handle auth callback route
  if (window.location.pathname === '/auth/callback') {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <AuthCallback />
          </Suspense>
          <Toaster position="top-right" containerStyle={{ top: 80, right: 20 }} />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    );
  }

  // Handle password reset route
  if (window.location.pathname === '/auth/reset-password' || window.location.hash.includes('type=recovery')) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <UpdatePasswordForm />
          </Suspense>
          <Toaster position="top-right" containerStyle={{ top: 80, right: 20 }} />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CVBuilder />
        <Toaster 
          position="top-right"
          containerStyle={{
            top: 80,
            right: 20,
          }}
          toastOptions={{
            duration: 4000,
          }}
        />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;
