import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || error);
          return;
        }

        if (accessToken && refreshToken) {
          // The AuthContext will automatically handle the session
          // Wait a moment for the auth state to update
          setTimeout(() => {
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            // Redirect to main app after a brief delay
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          }, 1000);
        } else {
          setStatus('error');
          setMessage('No authentication tokens found in the callback URL');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('An error occurred during authentication');
      }
    };

    handleAuthCallback();
  }, []);

  // If we already have a user, redirect immediately
  useEffect(() => {
    if (user && status === 'loading') {
      setStatus('success');
      setMessage('Already authenticated! Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  }, [user, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-xl rounded-2xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-6 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Authentication</h1>
              <p className="text-gray-600">Please wait while we complete your authentication...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Successful</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Redirecting to CVFlo...</span>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <button
                onClick={() => window.location.href = '/auth/login'}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
              >
                Return to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;