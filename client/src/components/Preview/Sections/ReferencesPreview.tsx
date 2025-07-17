import React from 'react';
import { Reference } from '../../../types/cv.types';

interface ReferencesPreviewProps {
  references: Reference[];
}

const ReferencesPreview: React.FC<ReferencesPreviewProps> = ({ references }) => {
  if (!references.length) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-1 mb-3">
        References
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {references.map((reference) => (
          <div key={reference.id} className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-1">{reference.name}</h3>
            <p className="text-gray-700">{reference.position}</p>
            <p className="text-gray-600 text-sm mb-2">{reference.company}</p>
            
            <div className="text-sm text-gray-600">
              <p>Email: {reference.email}</p>
              {reference.phone && <p>Phone: {reference.phone}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferencesPreview;