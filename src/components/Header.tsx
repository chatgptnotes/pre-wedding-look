
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClaudeCode } from '../contexts/ClaudeCodeContext';
import UserProfile from './UserProfile';

interface HeaderProps {
  onShowFavorites?: () => void;
  onShowComparison?: () => void;
  onShowClaudeCodeSettings?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowFavorites, onShowComparison, onShowClaudeCodeSettings }) => {
  const { user, loading, signOut } = useAuth();
  const { isEnabled, getStatus } = useClaudeCode();

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
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Feature Navigation Buttons */}
            {onShowFavorites && (
              <button
                onClick={onShowFavorites}
                className="bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 flex items-center"
                title="My Favorites"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="hidden sm:inline">Favorites</span>
              </button>
            )}
            
            {onShowComparison && (
              <button
                onClick={onShowComparison}
                className="bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 flex items-center"
                title="Compare Looks"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Compare</span>
              </button>
            )}

            {/* Claude Code Settings Button */}
            {onShowClaudeCodeSettings && (
              <button
                onClick={onShowClaudeCodeSettings}
                className={`${
                  isEnabled 
                    ? 'bg-green-500/20 hover:bg-green-500/30 border border-green-400/50' 
                    : 'bg-white/20 hover:bg-white/30'
                } text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 flex items-center`}
                title="Claude Code Settings"
              >
                <span className="text-base mr-1">{isEnabled ? '🟢' : '⚪'}</span>
                <span className="hidden sm:inline">Claude Code</span>
              </button>
            )}

            {user && (
              <>
                {loading ? (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                ) : (
                  <>
                    <UserProfile />
                    <button
                      onClick={handleSignOut}
                      className="bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
