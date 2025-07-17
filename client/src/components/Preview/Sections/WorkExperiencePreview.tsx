import React from 'react';
import { WorkExperience } from '../../../types/cv.types';

interface WorkExperiencePreviewProps {
  experiences: WorkExperience[];
}

const WorkExperiencePreview: React.FC<WorkExperiencePreviewProps> = ({ experiences }) => {
  if (!experiences.length) return null;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-1 mb-3">
        Work Experience
      </h2>
      
      <div className="space-y-4">
        {experiences.map((experience) => (
          <div key={experience.id} className="mb-3">
            <div className="flex justify-between mb-1">
              <h3 className="font-semibold text-gray-800">{experience.position}</h3>
              <span className="text-sm text-gray-600">
                {formatDate(experience.startDate)} - {experience.current ? 'Present' : formatDate(experience.endDate)}
              </span>
            </div>
            
            <div className="flex justify-between mb-2">
              <p className="text-gray-700">{experience.company}</p>
              {experience.location && (
                <p className="text-sm text-gray-600">{experience.location}</p>
              )}
            </div>
            
            {experience.description && (
              <div
                className="text-sm text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: experience.description }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkExperiencePreview;