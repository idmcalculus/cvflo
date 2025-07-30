import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import PasswordResetForm from './PasswordResetForm';

type AuthMode = 'login' | 'signup' | 'reset';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {mode === 'login' && (
          <LoginForm
            onSwitchToSignUp={() => setMode('signup')}
            onSwitchToReset={() => setMode('reset')}
          />
        )}
        
        {mode === 'signup' && (
          <SignUpForm
            onSwitchToLogin={() => setMode('login')}
          />
        )}
        
        {mode === 'reset' && (
          <PasswordResetForm
            onSwitchToLogin={() => setMode('login')}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;