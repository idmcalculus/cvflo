import React, { useState } from 'react';
import { useCVStore } from '../../store/cvStore';
import { Palette, ChevronUp, ChevronDown, Star, RotateCcw } from 'lucide-react';

const templates = [
  { id: 'classic-0', name: 'Classic Professional', color: 'bg-blue-500' },
  { id: 'modern-0', name: 'Modern Minimal', color: 'bg-gradient-to-r from-blue-500 to-purple-500' },
  { id: 'modern-1', name: 'Modern Creative', color: 'bg-purple-500' },
  { id: 'academic-0', name: 'Academic Formal', color: 'bg-green-500' },
];

const FloatingTemplateSelector: React.FC = () => {
  const { selectedTemplate, defaultTemplate, setSelectedTemplate, setDefaultTemplate, resetToDefaultTemplate } = useCVStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 text-sm font-medium text-gray-700"
      >
        <div className={`w-3 h-3 rounded-full ${currentTemplate?.color}`} />
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
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="text-xs text-gray-500 font-medium">Choose Template</div>
            {selectedTemplate !== defaultTemplate && (
              <button
                onClick={() => {
                  resetToDefaultTemplate();
                  setIsExpanded(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                title="Use default template"
              >
                <RotateCcw className="w-3 h-3" />
                Default
              </button>
            )}
          </div>
          <div className="space-y-1">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template.id);
                  setIsExpanded(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                  selectedTemplate === template.id
                    ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${template.color}`} />
                  <span className="font-medium">{template.name}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    {defaultTemplate === template.id && (
                      <Star className="w-3 h-3 text-amber-500 fill-current" title="Default template" />
                    )}
                    {selectedTemplate === template.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" title="Currently selected" />
                    )}
                  </div>
                </div>
                {defaultTemplate !== template.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDefaultTemplate(template.id);
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-amber-500 transition-colors"
                    title="Set as default"
                  >
                    <Star className="w-3 h-3" />
                  </button>
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