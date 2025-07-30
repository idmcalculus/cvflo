import React from 'react';
import { useForm } from 'react-hook-form';
import { useCVStore } from '../../store/cvStore';
import { PersonalInfo, CustomField } from '../../types/cv.types';
import { Plus, X } from 'lucide-react';

const PersonalInfoForm: React.FC = () => {
  const { data, updatePersonalInfo, addCustomField, updateCustomField, removeCustomField } = useCVStore();
  const { register, handleSubmit, formState: { errors } } = useForm<PersonalInfo>({
    defaultValues: data.personalInfo,
  });

  const onSubmit = (formData: PersonalInfo) => {
    updatePersonalInfo(formData);
  };

  return (
    <form onChange={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            id="firstName"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            {...register('firstName', { required: 'First name is required' })}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
            Middle Name
          </label>
          <input
            id="middleName"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            {...register('middleName')}
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            id="lastName"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            {...register('lastName', { required: 'Last name is required' })}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Professional Title *
        </label>
        <input
          id="title"
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Senior Software Engineer"
          {...register('title', { required: 'Professional title is required' })}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
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
            Phone *
          </label>
          <input
            id="phone"
            type="tel"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            {...register('phone', { required: 'Phone number is required' })}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <input
          id="address"
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          {...register('address')}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            id="city"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            {...register('city')}
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <input
            id="state"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            {...register('state')}
          />
        </div>

        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
            Zip Code
          </label>
          <input
            id="zipCode"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            {...register('zipCode')}
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            id="country"
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            {...register('country')}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Links & Social Media</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              id="website"
              type="url"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com"
              {...register('website', {
                pattern: {
                  value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                  message: 'Invalid URL',
                }
              })}
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn
            </label>
            <input
              id="linkedin"
              type="url"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://linkedin.com/in/yourprofile"
              {...register('linkedin', {
                pattern: {
                  value: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
                  message: 'Invalid LinkedIn URL',
                }
              })}
            />
            {errors.linkedin && (
              <p className="mt-1 text-sm text-red-600">{errors.linkedin.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">
              GitHub
            </label>
            <input
              id="github"
              type="url"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://github.com/yourusername"
              {...register('github', {
                pattern: {
                  value: /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/?$/,
                  message: 'Invalid GitHub URL',
                }
              })}
            />
            {errors.github && (
              <p className="mt-1 text-sm text-red-600">{errors.github.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="x" className="block text-sm font-medium text-gray-700 mb-1">
              X (Twitter)
            </label>
            <input
              id="x"
              type="url"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://x.com/yourusername"
              {...register('x', {
                pattern: {
                  value: /^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\/[\w-]+\/?$/,
                  message: 'Invalid X/Twitter URL',
                }
              })}
            />
            {errors.x && (
              <p className="mt-1 text-sm text-red-600">{errors.x.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
              Instagram
            </label>
            <input
              id="instagram"
              type="url"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://instagram.com/yourusername"
              {...register('instagram', {
                pattern: {
                  value: /^(https?:\/\/)?(www\.)?instagram\.com\/[\w.-]+\/?$/,
                  message: 'Invalid Instagram URL',
                }
              })}
            />
            {errors.instagram && (
              <p className="mt-1 text-sm text-red-600">{errors.instagram.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Custom Fields Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Custom Fields</h3>
          <button
            type="button"
            onClick={() => addCustomField({ label: '', value: '' })}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>
        
        {data.personalInfo.customFields && data.personalInfo.customFields.length > 0 && (
          <div className="space-y-3">
            {data.personalInfo.customFields.map((field) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Behance, Portfolio"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://behance.net/yourprofile"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeCustomField(field.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                    title="Remove field"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
};

export default PersonalInfoForm;