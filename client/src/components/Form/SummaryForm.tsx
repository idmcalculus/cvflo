import React from 'react';
import { useCVStore } from '../../store/cvStore';

const SummaryForm: React.FC = () => {
  const { data, updateSummary } = useCVStore();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSummary(e.target.value);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Professional Summary</h2>
      <p className="text-sm text-gray-600 mb-4">
        Write a concise summary of your professional background, skills, and career goals.
        This will appear at the top of your CV and provide an overview of your qualifications.
      </p>
      
      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
          Summary
        </label>
        <textarea
          id="summary"
          rows={6}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Experienced software engineer with 5+ years of expertise in developing scalable web applications..."
          value={data.summary}
          onChange={handleChange}
        />
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Tips:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Keep it concise (3-5 sentences)</li>
          <li>Highlight your most relevant skills and experience</li>
          <li>Tailor it to the position you're applying for</li>
          <li>Avoid using first-person pronouns (I, me, my)</li>
        </ul>
      </div>
    </div>
  );
};

export default SummaryForm;