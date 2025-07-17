import React from 'react';
import { useForm } from 'react-hook-form';
import { useCVStore } from '../../store/cvStore';
import { Plus, X } from 'lucide-react';

type InterestFormData = {
  name: string;
};

const InterestsForm: React.FC = () => {
  const { data, addInterest, removeInterest } = useCVStore();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InterestFormData>({
    defaultValues: {
      name: '',
    }
  });
  
  const onSubmit = (formData: InterestFormData) => {
    addInterest(formData);
    reset();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Interests</h2>
      <p className="text-sm text-gray-600 mb-4">
        Add your personal interests and hobbies to give employers a better sense of who you are beyond your professional skills.
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Interest/Hobby
          </label>
          <div className="flex space-x-2">
            <input
              id="name"
              type="text"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Photography, Running, Chess"
              {...register('name', { required: 'Interest name is required' })}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </button>
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
      </form>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Added Interests</h3>
        {data.interests.length === 0 ? (
          <p className="text-gray-500">No interests added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.interests.map((interest) => (
              <div 
                key={interest.id} 
                className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
              >
                <span>{interest.name}</span>
                <button
                  onClick={() => removeInterest(interest.id)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-500 mt-4">
        <p>Tips:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Include interests that demonstrate valuable soft skills</li>
          <li>Consider mentioning team activities to show collaboration skills</li>
          <li>Be specific rather than general (e.g., "Mountain hiking" instead of just "Outdoors")</li>
          <li>Avoid controversial topics unless relevant to the job</li>
        </ul>
      </div>
    </div>
  );
};

export default InterestsForm;