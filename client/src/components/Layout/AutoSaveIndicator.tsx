import React, { useEffect, useState } from 'react';
import { Save, Check, Cloud } from 'lucide-react';
import { useCVStore } from '../../store/cvStore';

const AutoSaveIndicator: React.FC = () => {
  const { data } = useCVStore();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'pending'>('saved');
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  useEffect(() => {
    setSaveStatus('pending');
    
    const timeoutId = setTimeout(() => {
      setSaveStatus('saving');
      
      // Simulate save delay
      setTimeout(() => {
        setSaveStatus('saved');
        setLastSaved(new Date());
      }, 500);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [data]);

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Save className="w-3 h-3 animate-pulse text-blue-500" />;
      case 'saved':
        return <Check className="w-3 h-3 text-green-500" />;
      case 'pending':
        return <Cloud className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      case 'pending':
        return 'Changes pending';
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
};

export default AutoSaveIndicator;