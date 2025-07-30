import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, RefreshCw, AlertCircle, LogOut, Loader2 } from 'lucide-react';

const EmailVerificationRequired: React.FC = () => {
  const { user, signOut, resendConfirmation } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResendConfirmation = async () => {
    if (!user?.email) return;

    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

    try {
      const { error } = await resendConfirmation(user.email);
      
      if (error) {
        setResendError(error.message);
      } else {
        setResendMessage('Confirmation email has been resent. Please check your inbox.');
      }
    } catch {
      setResendError('Failed to resend confirmation email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="mb-6">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verification Required</h1>
            <p className="text-gray-600 mb-4">
              Please verify your email address to access CVFlo.
            </p>
            <p className="text-lg font-semibold text-gray-900 mb-6 break-all">
              {user?.email}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">What to do next:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>You'll be automatically signed in to CVFlo</li>
                </ol>
              </div>
            </div>
          </div>

          {resendMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{resendMessage}</p>
            </div>
          )}

          {resendError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{resendError}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleResendConfirmation}
              disabled={isResending || !user?.email}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isResending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              {isResending ? 'Resending...' : 'Resend Verification Email'}
            </button>

            <button
              onClick={handleSignOut}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or click resend above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationRequired;