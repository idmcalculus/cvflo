import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCVStore } from '../../store/cvStore';
import { Skill } from '../../types/cv.types';
import { Plus, Trash2, Edit2 } from 'lucide-react';

type SkillFormData = Omit<Skill, 'id'>;

const SkillsForm: React.FC = () => {
  const { data, addSkill, updateSkill, removeSkill } = useCVStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SkillFormData>({
    defaultValues: {
      name: '',
      level: 3,
    }
  });
  
  const onSubmit = (formData: SkillFormData) => {
    if (editingId) {
      updateSkill(editingId, formData);
      setEditingId(null);
    } else {
      addSkill(formData);
    }
    reset();
  };
  
  const handleEdit = (skill: Skill) => {
    setEditingId(skill.id);
    setValue('name', skill.name);
    setValue('level', skill.level);
  };
  
  const handleDelete = (id: string) => {
    removeSkill(id);
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
      <h2 className="text-xl font-bold text-gray-800 mb-4">Skills</h2>
      <p className="text-sm text-gray-600 mb-4">
        Add your skills and rate your proficiency level from 1 (Beginner) to 5 (Expert).
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Skill Name *
          </label>
          <input
            id="name"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., JavaScript, Project Management, etc."
            {...register('name', { required: 'Skill name is required' })}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
            Proficiency Level
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Beginner</span>
            <input
              id="level"
              type="range"
              min="1"
              max="5"
              step="1"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              {...register('level', { valueAsNumber: true })}
            />
            <span className="text-xs text-gray-500">Expert</span>
          </div>
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
            {editingId ? 'Update Skill' : 'Add Skill'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Added Skills</h3>
        {data.skills.length === 0 ? (
          <p className="text-gray-500">No skills added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.skills.map((skill) => (
              <div 
                key={skill.id} 
                className={`p-3 border rounded-md flex justify-between items-center ${
                  editingId === skill.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-xs text-gray-500">Level {skill.level}/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${(skill.level / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex ml-4 space-x-1">
                  <button
                    onClick={() => handleEdit(skill)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(skill.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsForm;