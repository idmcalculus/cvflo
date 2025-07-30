import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, RefreshCw, CheckCircle, ArrowLeft, Loader2, ExternalLink, LogIn } from 'lucide-react';

interface EmailConfirmationScreenProps {
  email: string;
  onBack: () => void;
  onSwitchToLogin?: () => void;
}

const EmailConfirmationScreen: React.FC<EmailConfirmationScreenProps> = ({ email, onBack, onSwitchToLogin }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const { resendConfirmation } = useAuth();

  // Email provider detection and quick links
  const getEmailProvider = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    const providers = [
      { name: 'Gmail', domains: ['gmail.com', 'googlemail.com'], url: 'https://mail.google.com' },
      { name: 'Outlook', domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'], url: 'https://outlook.live.com' },
      { name: 'Yahoo', domains: ['yahoo.com', 'yahoo.co.uk', 'ymail.com'], url: 'https://mail.yahoo.com' },
      { name: 'iCloud', domains: ['icloud.com', 'me.com', 'mac.com'], url: 'https://www.icloud.com/mail' },
      { name: 'ProtonMail', domains: ['protonmail.com', 'proton.me'], url: 'https://mail.proton.me' },
    ];
    
    return providers.find(provider => provider.domains.includes(domain));
  };

  const emailProvider = getEmailProvider(email);

  const handleResendConfirmation = async () => {
    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

    try {
      const { error } = await resendConfirmation(email);
      
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

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-xl rounded-2xl p-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          disabled={isResending}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign Up
        </button>

        <div className="text-center mb-8">
          <div className="mb-6">
            <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-gray-600 mb-4">
            We've sent a confirmation link to:
          </p>
          <p className="text-lg font-semibold text-gray-900 mb-6 break-all">
            {email}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the confirmation link in the email</li>
                <li>You'll be redirected back to CVFlo</li>
                <li>Start building your professional CV!</li>
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

        {/* Quick Email Access */}
        {emailProvider && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 text-center mb-3">Quick access to your email:</p>
            <a
              href={emailProvider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gray-100 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200"
            >
              <Mail className="w-5 h-5" />
              Open {emailProvider.name}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleResendConfirmation}
            disabled={isResending}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isResending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            {isResending ? 'Resending...' : 'Resend Confirmation Email'}
          </button>

          {onSwitchToLogin && (
            <button
              onClick={onSwitchToLogin}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Already Confirmed? Sign In
            </button>
          )}

          <p className="text-xs text-gray-500 text-center">
            Didn't receive the email? Check your spam folder or click resend above.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            Having trouble?{' '}
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Try a different email address
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationScreen;