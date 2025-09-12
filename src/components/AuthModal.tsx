import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { signUp, signIn, loading: authLoading, error: authError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setLocalError('Full name is required');
          return;
        }
        await signUp(email, password);
        setSuccess('Account created successfully! Please check your email to verify your account.');
      } else {
        await signIn(email, password);
        onClose();
        onSuccess?.();
      }
    } catch (err: any) {
      setLocalError(err.message || 'An unexpected error occurred');
    }
  };


  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setLocalError(null);
    setSuccess(null);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {isSignUp ? 'Join the magic!' : 'Ready to create?'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-rose-100 rounded-full flex items-center justify-center text-gray-500 hover:text-rose-600 transition-all duration-300 text-xl"
            >
              ×
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            {isSignUp 
              ? 'Join thousands of couples creating magical pre-wedding photos!'
              : 'Sign in to access your saved projects and continue creating magic!'
            }
          </p>

          {(localError || authError) && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{localError || authError}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Enter your password"
                minLength={6}
                required
              />
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-700 hover:via-pink-700 hover:to-purple-700 text-white py-3 sm:py-4 px-4 rounded-2xl font-semibold transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {authLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  {isSignUp ? (
                    <>
                      <span className="text-xl mr-2">🚀</span>
                      Create Account
                    </>
                  ) : (
                    <>
                      <span className="text-xl mr-2">🔑</span>
                      Sign In
                    </>
                  )}
                </span>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={toggleMode}
                className="ml-2 text-rose-600 hover:text-rose-700 font-semibold"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {isSignUp && (
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;