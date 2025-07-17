import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCVStore } from '../../store/cvStore';
import { Project } from '../../types/cv.types';
import { Plus, Trash2, Edit2, Link, Github } from 'lucide-react';
import QuillEditor from '../QuillEditor';

type ProjectFormData = Omit<Project, 'id'>;

const ProjectsForm: React.FC = () => {
  const { data, addProject, updateProject, removeProject } = useCVStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProjectFormData>({
    defaultValues: {
      title: '',
      description: '',
      technologies: [],
      liveUrl: '',
      githubUrl: '',
      startDate: '',
      endDate: '',
      current: false,
    }
  });
  
  const isCurrent = watch('current');
  
  const onSubmit = (formData: ProjectFormData) => {
    // Convert technologies string to array
    const technologies = formData.technologies as unknown as string;
    const processedData = {
      ...formData,
      technologies: technologies.split(',').map(tech => tech.trim()),
    };

    if (editingId) {
      updateProject(editingId, processedData);
      setEditingId(null);
    } else {
      addProject(processedData);
    }
    reset();
  };
  
  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    Object.entries(project).forEach(([key, value]) => {
      if (key !== 'id') {
        if (key === 'technologies') {
          setValue(key as keyof ProjectFormData, (value as string[]).join(', '));
        } else {
          setValue(key as keyof ProjectFormData, value);
        }
      }
    });
  };
  
  const handleDelete = (id: string) => {
    removeProject(id);
    if (editingId === id) {
      setEditingId(null);
      reset();
    }
  };
  
  const handleCancel = () => {
    setEditingId(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Projects</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Project Title *
          </label>
          <input
            id="title"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            {...register('title', { required: 'Project title is required' })}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <QuillEditor
            value={watch('description')}
            onChange={(content) => setValue('description', content)}
            className="bg-white"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="technologies" className="block text-sm font-medium text-gray-700 mb-1">
            Technologies Used *
          </label>
          <input
            id="technologies"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="React, TypeScript, Node.js, etc. (comma-separated)"
            {...register('technologies', { required: 'Technologies are required' })}
          />
          {errors.technologies && (
            <p className="mt-1 text-sm text-red-600">{errors.technologies.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="liveUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Live Demo URL
            </label>
            <input
              id="liveUrl"
              type="url"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com"
              {...register('liveUrl', {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL',
                }
              })}
            />
            {errors.liveUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.liveUrl.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Repository
            </label>
            <input
              id="githubUrl"
              type="url"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://github.com/username/repo"
              {...register('githubUrl', {
                pattern: {
                  value: /^https?:\/\/github\.com\/.+/,
                  message: 'Please enter a valid GitHub URL',
                }
              })}
            />
            {errors.githubUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.githubUrl.message}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              id="startDate"
              type="month"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              {...register('startDate', { required: 'Start date is required' })}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date {!isCurrent && '*'}
            </label>
            <input
              id="endDate"
              type="month"
              disabled={isCurrent}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              {...register('endDate', { 
                required: isCurrent ? false : 'End date is required'
              })}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            id="current"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            {...register('current')}
          />
          <label htmlFor="current" className="ml-2 block text-sm text-gray-700">
            This is an ongoing project
          </label>
        </div>
        
        <div className="flex justify-end space-x-2">
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            {editingId ? 'Update Project' : 'Add Project'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Added Projects</h3>
        {(data.projects || []).length === 0 ? (
          <p className="text-gray-500">No projects added yet.</p>
        ) : (
          <div className="space-y-3">
            {(data.projects || []).map((project) => (
              <div 
                key={project.id} 
                className={`p-4 border rounded-md ${editingId === project.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{project.title}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(project.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - {
                          project.current 
                            ? 'Present' 
                            : new Date(project.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                        }
                      </p>
                    </div>
                    
                    <div 
                      className="text-sm text-gray-700 mb-2"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.technologies.map((tech, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
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
                          <Link className="w-4 h-4 mr-1" />
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
                          <Github className="w-4 h-4 mr-1" />
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex ml-4 space-x-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsForm;