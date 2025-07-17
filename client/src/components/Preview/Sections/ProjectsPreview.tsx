import React from 'react';
import { Project } from '../../../types/cv.types';
import { Link, Github } from 'lucide-react';

interface ProjectsPreviewProps {
  projects: Project[];
}

const ProjectsPreview: React.FC<ProjectsPreviewProps> = ({ projects }) => {
  if (!projects.length) return null;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-1 mb-3">
        Projects
      </h2>
      
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="mb-3">
            <div className="flex justify-between mb-1">
              <h3 className="font-semibold text-gray-800">{project.title}</h3>
              <span className="text-sm text-gray-600">
                {formatDate(project.startDate)} - {project.current ? 'Present' : formatDate(project.endDate)}
              </span>
            </div>
            
            <div
              className="text-sm text-gray-700 mb-2 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: project.description }}
            />
            
            <div className="flex flex-wrap gap-2 mb-2">
              {project.technologies.map((tech, index) => (
                <span 
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>
            
            <div className="flex gap-4 text-sm text-gray-600">
              {project.liveUrl && (
                <a 
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-blue-600"
                >
                  <Link className="w-3 h-3 mr-1" />
                  Live Demo
                </a>
              )}
              {project.githubUrl && (
                <a 
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-blue-600"
                >
                  <Github className="w-3 h-3 mr-1" />
                  GitHub
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPreview;