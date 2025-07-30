import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'info';

interface CustomToastProps {
  t: {
    id: string;
    visible: boolean;
  };
  type: ToastType;
  message: string;
}

const CustomToast: React.FC<CustomToastProps> = ({ t, type, message }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div
      className={`
        ${t.visible ? 'animate-enter' : 'animate-leave'}
        max-w-md w-full bg-white shadow-xl rounded-lg pointer-events-auto 
        border-l-4 ${getBorderColor()} ${getBackgroundColor()}
        transition-all duration-300 ease-in-out transform
      `}
      style={{
        transform: t.visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: t.visible ? 1 : 0,
      }}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    CVFlo
                  </h3>
                  <span className="ml-1 text-xs text-gray-500 font-normal">by Jaydeetech</span>
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {type === 'success' ? 'Success' : type === 'error' ? 'Action Required' : 'Info'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {message}
                </p>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="ml-4 flex-shrink-0 bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                aria-label="Dismiss notification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* CVFlo branding footer */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Professional CV Builder</span>
          <span className="font-medium text-blue-600">by Jaydeetech</span>
        </div>
      </div>
    </div>
  );
};

// Helper functions to create toasts
export const showSuccessToast = (message: string) => {
  return toast.custom(
    (t) => <CustomToast t={t} type="success" message={message} />,
    { 
      duration: Infinity,
      position: 'top-center' // Override global position for auth toasts
    }
  );
};

export const showErrorToast = (message: string) => {
  return toast.custom(
    (t) => <CustomToast t={t} type="error" message={message} />,
    { 
      duration: Infinity,
      position: 'top-center' // Override global position for auth toasts
    }
  );
};

export const showInfoToast = (message: string) => {
  return toast.custom(
    (t) => <CustomToast t={t} type="info" message={message} />,
    { 
      duration: Infinity,
      position: 'top-center' // Override global position for auth toasts
    }
  );
};

export default CustomToast;