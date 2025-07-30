import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Lock, Settings, Mail, User, ChevronRight, Trash2 } from 'lucide-react';
import ChangePasswordModal from '../Profile/ChangePasswordModal';
import DeleteAccountModal from '../Profile/DeleteAccountModal';

const ProfileForm: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
    return username
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* User Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-semibold relative">
            {getInitials(user.email)}
            {user.emailConfirmed && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">
              {getDisplayName(user.email)}
            </h3>
            <p className="text-gray-600 mb-2">{user.email}</p>
            
            {user.emailConfirmed ? (
              <div className="flex items-center gap-2 text-green-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Email Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Email Verification Pending</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="space-y-3">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h4>
        
        {/* Change Password */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Change Password</p>
              <p className="text-sm text-gray-500">Update your account password</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>

        {/* Account Settings (Coming Soon) */}
        <div className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-60 cursor-not-allowed">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-600">Advanced Settings</p>
              <p className="text-sm text-gray-400">Manage your account preferences</p>
            </div>
          </div>
          <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-500">
            Coming Soon
          </span>
        </div>

        {/* Account Information */}
        <div className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-60 cursor-not-allowed">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-600">Personal Information</p>
              <p className="text-sm text-gray-400">Update your profile details</p>
            </div>
          </div>
          <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-500">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h4>
        
        {/* Sign Out Button - Toned Down */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <LogOut className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-700">Sign Out</p>
              <p className="text-sm text-gray-500">Sign out of your account</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>

        {/* Delete Account Button - More Red */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-between p-4 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-colors group mt-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-700" />
            </div>
            <div className="text-left">
              <p className="font-medium text-red-800">Delete Account</p>
              <p className="text-sm text-red-700">Permanently delete your account and all data</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-red-500 group-hover:text-red-700 transition-colors" />
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default ProfileForm;