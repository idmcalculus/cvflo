import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCVStore } from '../../store/cvStore';
import { Education } from '../../types/cv.types';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import QuillEditor from '../QuillEditor';

type EducationFormData = Omit<Education, 'id'>;

const EducationForm: React.FC = () => {
  const { data, addEducation, updateEducation, removeEducation } = useCVStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<EducationFormData>({
    defaultValues: {
      institution: '',
      degree: '',
      field: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    }
  });
  
  const isCurrent = watch('current');
  
  const onSubmit = (formData: EducationFormData) => {
    if (editingId) {
      updateEducation(editingId, formData);
      setEditingId(null);
    } else {
      addEducation(formData);
    }
    reset();
  };
  
  const handleEdit = (education: Education) => {
    setEditingId(education.id);
    Object.entries(education).forEach(([key, value]) => {
      if (key !== 'id') {
        setValue(key as keyof EducationFormData, value);
      }
    });
  };
  
  const handleDelete = (id: string) => {
    removeEducation(id);
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
      <h2 className="text-xl font-bold text-gray-800 mb-4">Education</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
            Institution *
          </label>
          <input
            id="institution"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            {...register('institution', { required: 'Institution is required' })}
          />
          {errors.institution && (
            <p className="mt-1 text-sm text-red-600">{errors.institution.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">
              Degree *
            </label>
            <input
              id="degree"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Bachelor's, Master's, PhD, etc."
              {...register('degree', { required: 'Degree is required' })}
            />
            {errors.degree && (
              <p className="mt-1 text-sm text-red-600">{errors.degree.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-1">
              Field of Study *
            </label>
            <input
              id="field"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Computer Science, Business, etc."
              {...register('field', { required: 'Field of study is required' })}
            />
            {errors.field && (
              <p className="mt-1 text-sm text-red-600">{errors.field.message}</p>
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
            I am currently studying here
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
            {editingId ? 'Update Education' : 'Add Education'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Added Education</h3>
        {(data.education || []).length === 0 ? (
          <p className="text-gray-500">No education entries added yet.</p>
        ) : (
          <div className="space-y-3">
            {(data.education || []).map((edu) => (
              <div 
                key={edu.id} 
                className={`p-4 border rounded-md ${editingId === edu.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">{edu.degree} in {edu.field}</h4>
                    <p className="text-gray-600">{edu.institution} • {edu.location}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - {
                        edu.current 
                          ? 'Present' 
                          : new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                      }
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(edu)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(edu.id)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {edu.description && (
                  <div 
                    className="mt-2 text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: edu.description }}
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

export default EducationForm;