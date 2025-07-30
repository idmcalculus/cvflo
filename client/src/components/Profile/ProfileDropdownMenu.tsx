import React from 'react';
import { LogOut, Lock, Settings, Mail } from 'lucide-react';

interface ProfileDropdownMenuProps {
  user: {
    email?: string;
    emailConfirmed?: boolean;
  };
  getDisplayName: (email?: string) => string;
  getInitials: (email?: string) => string;
  handleSignOut: () => void;
  setShowPasswordModal: (show: boolean) => void;
  setIsDropdownOpen: (isOpen: boolean) => void;
  className?: string;
}

const ProfileDropdownMenu: React.FC<ProfileDropdownMenuProps> = ({
  user,
  getDisplayName,
  getInitials,
  handleSignOut,
  setShowPasswordModal,
  setIsDropdownOpen,
  className,
}) => {
  return (
    <div className={className}>
      {/* User Info Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {getInitials(user.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getDisplayName(user.email)}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            {user.emailConfirmed && (
              <div className="flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-2">
        <button
          onClick={() => {
            setShowPasswordModal(true);
            setIsDropdownOpen(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-md"
        >
          <Lock className="w-4 h-4" />
          Change Password
        </button>

        <button
          disabled
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
          title="Coming soon"
        >
          <Settings className="w-4 h-4" />
          Account Settings
          <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded-full">Soon</span>
        </button>

        <div className="border-t border-gray-100 my-1" />

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-md"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdownMenu;
