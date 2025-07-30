import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileIconProps {
  className?: string;
}

const ProfileIcon: React.FC<ProfileIconProps> = ({ className = "w-5 h-5" }) => {
  const { user } = useAuth();

  const getInitials = (email?: string): string => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  if (!user) {
    return (
      <div className={`${className} bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
        U
      </div>
    );
  }

  return (
    <div className={`${className} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold relative`}>
      {getInitials(user.email)}
      {user.emailConfirmed && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-white rounded-full" />
      )}
    </div>
  );
};

export default ProfileIcon;