import React, { useState } from 'react';
import { Palette, Check, Star, RotateCcw } from 'lucide-react';
import { useCVStore } from '../store/cvStore';

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
}

const availableTemplates: Template[] = [
  {
    id: 'classic-0',
    name: 'Classic Professional',
    description: 'Professional design with blue accents and clean layout',
    preview: '🏛️ Traditional & Professional'
  },
  {
    id: 'modern-0',
    name: 'Modern 0',
    description: 'Clean, minimalistic design with a touch of modernity',
    preview: '🚀 Minimalist & Modern'
  },
  {
    id: 'modern-1',
    name: 'Modern 1',
    description: 'Contemporary design with gradients and modern styling',
    preview: '🎨 Contemporary & Creative'
  },
  {
    id: 'academic-0',
    name: 'Academic 0',
    description: 'Clean, print-optimized design perfect for academic settings',
    preview: '📚 Academic & Formal'
  }
];

const TemplateSelector: React.FC = () => {
  const { selectedTemplate, defaultTemplate, setSelectedTemplate, setDefaultTemplate, resetToDefaultTemplate } = useCVStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentTemplate = availableTemplates.find(t => t.id === selectedTemplate) || availableTemplates[0];
  const defaultTemplateData = availableTemplates.find(t => t.id === defaultTemplate) || availableTemplates[0];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsOpen(false);
  };

  const handleSetAsDefault = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultTemplate(templateId);
  };

  const handleUseDefault = () => {
    resetToDefaultTemplate();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        type="button"
      >
        <Palette className="w-4 h-4 text-gray-600" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{currentTemplate.name}</span>
          {selectedTemplate === defaultTemplate && (
            <Star className="w-3 h-3 text-amber-500 fill-current" title="Using default template" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {selectedTemplate !== defaultTemplate && (
            <span className="text-xs text-gray-500">Default: {defaultTemplateData.name}</span>
          )}
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Choose Template</h3>
                {selectedTemplate !== defaultTemplate && (
                  <button
                    onClick={handleUseDefault}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    title="Use default template"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Use Default
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {availableTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    type="button"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{template.name}</span>
                          <div className="flex items-center gap-1">
                            {defaultTemplate === template.id && (
                              <Star className="w-4 h-4 text-amber-500 fill-current" title="Default template" />
                            )}
                            {selectedTemplate === template.id && (
                              <Check className="w-4 h-4 text-blue-600" title="Currently selected" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">{template.preview}</div>
                          {defaultTemplate !== template.id && (
                            <button
                              onClick={(e) => handleSetAsDefault(template.id, e)}
                              className="text-xs text-gray-400 hover:text-amber-500 transition-colors flex items-center gap-1"
                              title="Set as default template"
                            >
                              <Star className="w-3 h-3" />
                              Set Default
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TemplateSelector;