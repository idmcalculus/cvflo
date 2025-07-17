import React from 'react';
import { Interest } from '../../../types/cv.types';

interface InterestsPreviewProps {
  interests: Interest[];
}

const InterestsPreview: React.FC<InterestsPreviewProps> = ({ interests }) => {
  if (!interests.length) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-1 mb-3">
        Interests
      </h2>
      
      <div className="flex flex-wrap gap-2">
        {interests.map((interest) => (
          <span 
            key={interest.id} 
            className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
          >
            {interest.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default InterestsPreview;