import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteAccount, user } = useAuth();

  const expectedText = 'delete my cvflo account';
  const isConfirmTextValid = confirmText.toLowerCase().trim() === expectedText;

  const handleDelete = async () => {
    if (!isConfirmTextValid) {
      toast.error('Please enter the confirmation text exactly as shown');
      return;
    }

    setIsDeleting(true);
    
    try {
      const { error } = await deleteAccount();
      
      if (error) {
        toast.error(`Failed to delete account: ${error.message}`);
      } else {
        toast.success('Your account has been permanently deleted. We\'re sorry to see you go!', {
          duration: 6000,
        });
        onClose();
      }
    } catch {
      toast.error('An unexpected error occurred while deleting your account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Delete Account</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="mb-6 space-y-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  This action cannot be undone
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Deleting your account will permanently:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Remove all your CV data and templates</li>
                    <li>Delete your profile information</li>
                    <li>Cancel any active subscriptions</li>
                    <li>Remove access to CVFlo by Jaydeetech</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Current account:</strong> {user?.email}
            </p>
            <p className="text-sm text-gray-600">
              All data associated with this account will be permanently deleted from our servers.
            </p>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700 mb-2">
            To confirm deletion, please type: <span className="font-mono text-red-600 bg-red-50 px-2 py-1 rounded">delete my cvflo account</span>
          </label>
          <input
            id="confirm-delete"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={isDeleting}
            placeholder="Type the confirmation text here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmTextValid || isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Account
              </>
            )}
          </button>
        </div>

        {/* Additional Warning */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Alternative:</strong> If you're having issues with CVFlo, consider reaching out to our support team at{' '}
            <a href="mailto:support@jaydeetechltd.com" className="underline">
              support@jaydeetechltd.com
            </a>{' '}
            before deleting your account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;