import React from 'react';
import { Education } from '../../../types/cv.types';

interface EducationPreviewProps {
  education: Education[];
}

const EducationPreview: React.FC<EducationPreviewProps> = ({ education }) => {
  if (!education.length) return null;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-1 mb-3">
        Education
      </h2>
      
      <div className="space-y-4">
        {education.map((edu) => (
          <div key={edu.id} className="mb-3">
            <div className="flex justify-between mb-1">
              <h3 className="font-semibold text-gray-800">{edu.degree} in {edu.field}</h3>
              <span className="text-sm text-gray-600">
                {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
              </span>
            </div>
            
            <div className="flex justify-between mb-2">
              <p className="text-gray-700">{edu.institution}</p>
              {edu.location && (
                <p className="text-sm text-gray-600">{edu.location}</p>
              )}
            </div>
            
            {edu.description && (
              <div
                className="text-sm text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: edu.description }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EducationPreview;