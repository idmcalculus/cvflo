import React from 'react';
import { Skill } from '../../../types/cv.types';

interface SkillsPreviewProps {
  skills: Skill[];
}

const SkillsPreview: React.FC<SkillsPreviewProps> = ({ skills }) => {
  if (!skills.length) return null;

  // Sort skills by level (highest first)
  const sortedSkills = [...skills].sort((a, b) => b.level - a.level);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-1 mb-3">
        Skills
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        {sortedSkills.map((skill) => (
          <div key={skill.id} className="flex items-center">
            <span className="text-gray-700 mr-2">{skill.name}</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${(skill.level / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsPreview;