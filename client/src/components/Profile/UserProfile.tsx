import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCVStore } from '../../store/cvStore';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const { setActiveSection } = useCVStore();

  const getInitials = (email?: string): string => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const getDisplayName = (email?: string): string => {
    if (!email) return 'User';
    const username = email.split('@')[0];
    // Convert dots and underscores to spaces and capitalize
    return username
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!user) return null;

  return (
    <button
      onClick={() => setActiveSection('profile')}
      className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
      title={`${getDisplayName(user.email)} - ${user.email}`}
    >
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold relative">
        {getInitials(user.email)}
        {user.emailConfirmed && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      
      {/* Hover tooltip */}
      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        <div className="font-medium">{getDisplayName(user.email)}</div>
        <div className="text-gray-300">{user.email}</div>
        <div className="text-gray-400 text-xs mt-1">Click to manage profile</div>
      </div>
    </button>
  );
};

export default UserProfile;