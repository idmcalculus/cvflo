import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCVStore } from '../../store/cvStore';
import { Reference } from '../../types/cv.types';
import { Plus, Trash2, Edit2 } from 'lucide-react';

type ReferenceFormData = Omit<Reference, 'id'>;

const ReferencesForm: React.FC = () => {
  const { data, addReference, updateReference, removeReference } = useCVStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ReferenceFormData>({
    defaultValues: {
      name: '',
      company: '',
      position: '',
      email: '',
      phone: '',
    }
  });
  
  const onSubmit = (formData: ReferenceFormData) => {
    if (editingId) {
      updateReference(editingId, formData);
      setEditingId(null);
    } else {
      addReference(formData);
    }
    reset();
  };
  
  const handleEdit = (reference: Reference) => {
    setEditingId(reference.id);
    Object.entries(reference).forEach(([key, value]) => {
      if (key !== 'id') {
        setValue(key as keyof ReferenceFormData, value);
      }
    });
  };
  
  const handleDelete = (id: string) => {
    removeReference(id);
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
      <h2 className="text-xl font-bold text-gray-800 mb-4">References</h2>
      <p className="text-sm text-gray-600 mb-4">
        Add professional references who can vouch for your skills and work ethic. Always ask for permission before listing someone as a reference.
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Reference Name *
          </label>
          <input
            id="name"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            {...register('name', { required: 'Reference name is required' })}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              id="email"
              type="email"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                }
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              {...register('phone')}
            />
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
            {editingId ? 'Update Reference' : 'Add Reference'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Added References</h3>
        {data.references.length === 0 ? (
          <p className="text-gray-500">No references added yet.</p>
        ) : (
          <div className="space-y-3">
            {data.references.map((reference) => (
              <div 
                key={reference.id} 
                className={`p-4 border rounded-md ${editingId === reference.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">{reference.name}</h4>
                    <p className="text-gray-600">{reference.position} at {reference.company}</p>
                    <div className="text-sm text-gray-500 mt-1">
                      <p>Email: {reference.email}</p>
                      {reference.phone && <p>Phone: {reference.phone}</p>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(reference)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(reference.id)}
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

export default ReferencesForm;