
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';

const Header: React.FC = () => {
  const { user, loading, signOut } = useAuth();

  const handleSignOut = () => {
    console.log('Sign out clicked - Force logout');
    // Clear all storage and cookies
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    // Call signOut in background but don't wait for it
    signOut().catch(error => console.error('Background signout error:', error));
    // Force immediate redirect
    window.location.replace('/');
  };

  return (
    <header className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white shadow-2xl sticky top-0 z-30 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center text-center sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mr-3 backdrop-blur-sm">
              <span className="text-2xl">💖</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
                Pre-wedding Look AI
              </h1>
              <p className="text-sm sm:text-base text-rose-100 mt-1">
                Craft your perfect pre-wedding story with AI magic
              </p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              ) : (
                <>
                  <UserProfile />
                  <button
                    onClick={handleSignOut}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
