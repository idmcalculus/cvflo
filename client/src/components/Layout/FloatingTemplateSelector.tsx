import React, { useState } from 'react';
import { useCVStore } from '../../store/cvStore';
import { Palette, ChevronUp, ChevronDown } from 'lucide-react';

const templates = [
  { id: 'default', name: 'Default Preview', color: 'bg-gradient-to-r from-gray-500 to-blue-500' },
  { id: 'modern-0', name: 'Modern 0', color: 'bg-gradient-to-r from-blue-500 to-purple-500' },
  { id: 'classic-0', name: 'Classic 0', color: 'bg-blue-500' },
  { id: 'modern-1', name: 'Modern 1', color: 'bg-purple-500' },
  { id: 'academic-0', name: 'Academic 0', color: 'bg-green-500' },
];

const FloatingTemplateSelector: React.FC = () => {
  const { selectedTemplate, setSelectedTemplate } = useCVStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 text-sm font-medium text-gray-700"
      >
        <div className={`w-3 h-3 rounded-full ${currentTemplate?.id === 'default' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : currentTemplate?.color}`} />
        <span>{currentTemplate?.name}</span>
        <Palette className="w-4 h-4" />
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[200px]">
          <div className="text-xs text-gray-500 font-medium mb-2 px-2">Choose Template</div>
          <div className="space-y-1">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template.id);
                  setIsExpanded(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                  selectedTemplate === template.id
                    ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${template.id === 'default' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : template.color}`} />
                <span className="font-medium">{template.name}</span>
                {selectedTemplate === template.id && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingTemplateSelector;