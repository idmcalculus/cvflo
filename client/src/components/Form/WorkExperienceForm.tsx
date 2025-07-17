import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCVStore } from '../../store/cvStore';
import { WorkExperience } from '../../types/cv.types';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import QuillEditor from '../QuillEditor';

type WorkExperienceFormData = Omit<WorkExperience, 'id'>;

const WorkExperienceForm: React.FC = () => {
  const { data, addWorkExperience, updateWorkExperience, removeWorkExperience } = useCVStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<WorkExperienceFormData>({
    defaultValues: {
      position: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    }
  });
  
  const isCurrent = watch('current');
  
  const onSubmit = (formData: WorkExperienceFormData) => {
    if (editingId) {
      updateWorkExperience(editingId, formData);
      setEditingId(null);
    } else {
      addWorkExperience(formData);
    }
    reset();
  };
  
  const handleEdit = (experience: WorkExperience) => {
    setEditingId(experience.id);
    Object.entries(experience).forEach(([key, value]) => {
      if (key !== 'id') {
        setValue(key as keyof WorkExperienceFormData, value);
      }
    });
  };
  
  const handleDelete = (id: string) => {
    removeWorkExperience(id);
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
      <h2 className="text-xl font-bold text-gray-800 mb-4">Work Experience</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              Position *
            </label>
            <input
              id="position"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              {...register('position', { required: 'Position is required' })}
            />
            {errors.position && (
              <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
              Company *
            </label>
            <input
              id="company"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              {...register('company', { required: 'Company is required' })}
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            id="location"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="City, Country"
            {...register('location')}
          />
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
            I currently work here
          </label>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <QuillEditor
            value={watch('description')}
            onChange={(content) => setValue('description', content)}
            className="bg-white"
          />
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
            {editingId ? 'Update Experience' : 'Add Experience'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Added Experiences</h3>
        {(data.workExperience || []).length === 0 ? (
          <p className="text-gray-500">No work experiences added yet.</p>
        ) : (
          <div className="space-y-3">
            {(data.workExperience || []).map((experience) => (
              <div 
                key={experience.id} 
                className={`p-4 border rounded-md ${editingId === experience.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">{experience.position}</h4>
                    <p className="text-gray-600">{experience.company} • {experience.location}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(experience.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - {
                        experience.current 
                          ? 'Present' 
                          : new Date(experience.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                      }
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(experience)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(experience.id)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {experience.description && (
                  <div 
                    className="mt-2 text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: experience.description }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkExperienceForm;