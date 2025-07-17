import React from 'react';
import { useCVStore } from '../../store/cvStore';
import { Check, Circle } from 'lucide-react';

const sections = [
  { id: 'personalInfo', label: 'Personal Info', required: true },
  { id: 'summary', label: 'Summary', required: false },
  { id: 'workExperience', label: 'Experience', required: false },
  { id: 'education', label: 'Education', required: false },
  { id: 'projects', label: 'Projects', required: false },
  { id: 'skills', label: 'Skills', required: false },
  { id: 'interests', label: 'Interests', required: false },
  { id: 'references', label: 'References', required: false },
];

const ProgressIndicator: React.FC = () => {
  const { data, activeSection } = useCVStore();

  const getSectionCompletion = (sectionId: string): boolean => {
    switch (sectionId) {
      case 'personalInfo':
        return !!(data.personalInfo.firstName && data.personalInfo.lastName && data.personalInfo.email);
      case 'summary':
        return !!(data.summary && data.summary.trim().length > 0);
      case 'workExperience':
        return data.workExperience.length > 0;
      case 'education':
        return data.education.length > 0;
      case 'projects':
        return data.projects.length > 0;
      case 'skills':
        return data.skills.length > 0;
      case 'interests':
        return data.interests.length > 0;
      case 'references':
        return data.references.length > 0;
      default:
        return false;
    }
  };

  const completedSections = sections.filter(section => getSectionCompletion(section.id));
  const progressPercentage = Math.round((completedSections.length / sections.length) * 100);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">CV Completion</h3>
        <span className="text-xs text-gray-500">{completedSections.length}/{sections.length}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-lg" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Section Status */}
      <div className="grid grid-cols-2 gap-2">
        {sections.map((section) => {
          const isCompleted = getSectionCompletion(section.id);
          const isActive = activeSection === section.id;
          
          return (
            <div
              key={section.id}
              className={`flex items-center gap-2 text-xs p-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : isCompleted 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-gray-50 text-gray-500'
              }`}
            >
              {isCompleted ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Circle className={`w-3 h-3 ${isActive ? 'text-blue-500' : 'text-gray-300'}`} />
              )}
              <span className="font-medium truncate">{section.label}</span>
              {section.required && !isCompleted && (
                <span className="text-red-500">*</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Motivational Message */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-600 text-center">
          {progressPercentage === 100 
            ? "🎉 Your CV is complete! Ready to download."
            : progressPercentage >= 75 
              ? "Almost there! Just a few more sections to go."
              : progressPercentage >= 50 
                ? "Great progress! Keep adding more details."
                : progressPercentage >= 25 
                  ? "Good start! Continue building your CV."
                  : "Let's build an amazing CV together!"
          }
        </p>
      </div>
    </div>
  );
};

export default ProgressIndicator;