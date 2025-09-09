import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/useGameStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import MatchmakingWithTimeout from '../components/blinddate/MatchmakingWithTimeout';

const MatchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { 
    createPrivateGame, 
    joinGame, 
    currentSessionId,
    inviteCode,
    gamePhase,
    isLoading,
    error 
  } = useGameStore();
  const { addToast } = useUIStore();
  
  const [matchType, setMatchType] = useState<'invite' | 'quick' | null>(null);
  const [inputCode, setInputCode] = useState('');
  
  useEffect(() => {
    // Navigate to room when game starts
    if (currentSessionId && gamePhase === 'playing') {
      navigate(`/room/${currentSessionId}`);
    }
  }, [currentSessionId, gamePhase, navigate]);
  
  const handleCreateInvite = async () => {
    try {
      await createPrivateGame();
      addToast({
        type: 'success',
        message: 'Private game created! Share the invite code with your partner.',
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        message: error.message || 'Failed to create private game',
      });
    }
  };
  
  const handleJoinInvite = async () => {
    if (!inputCode) {
      addToast({
        type: 'warning',
        message: 'Please enter an invite code',
      });
      return;
    }
    
    try {
      await joinGame(inputCode);
      addToast({
        type: 'success',
        message: 'Joining game...',
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        message: error.message || 'Failed to join game',
      });
    }
  };
  
  const handleQuickMatch = () => {
    setMatchType('quick');
  };
  
  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/match?invite=${inviteCode}`;
    navigator.clipboard.writeText(link);
    addToast({
      type: 'success',
      message: 'Invite link copied to clipboard!',
    });
  };
  
  // Check for invite code in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlInviteCode = params.get('invite');
    
    if (urlInviteCode) {
      setInputCode(urlInviteCode);
      // Auto-join if there's an invite code in URL
      joinGame(urlInviteCode).catch((error) => {
        addToast({
          type: 'error',
          message: 'Invalid or expired invite code',
        });
      });
    }
  }, []);
  
  if (matchType === 'quick') {
    return <MatchmakingWithTimeout onCancel={() => setMatchType(null)} />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent px-2">
            Blind Date Style-Off
          </h1>
          
          {!inviteCode && !inputCode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Invite Friends Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-2xl shadow-xl p-6 sm:p-8"
              >
                <div className="text-center mb-6">
                  <div className="text-4xl sm:text-6xl mb-4">💌</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                    Play with Friends
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Create a private game and invite someone special
                  </p>
                </div>
                
                <button
                  onClick={handleCreateInvite}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold sm:font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
                >
                  {isLoading ? 'Creating...' : 'Create Private Game'}
                </button>
                
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">Have an invite code?</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center sm:text-left text-sm sm:text-base"
                      maxLength={6}
                    />
                    <button
                      onClick={handleJoinInvite}
                      disabled={isLoading || !inputCode}
                      className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                    >
                      Join Game
                    </button>
                  </div>
                </div>
              </motion.div>
              
              {/* Quick Match Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-2xl shadow-xl p-6 sm:p-8"
              >
                <div className="text-center mb-6">
                  <div className="text-4xl sm:text-6xl mb-4">⚡</div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                    Quick Match
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Get matched with a random player instantly
                  </p>
                </div>
                
                <button
                  onClick={handleQuickMatch}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold sm:font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
                >
                  {isLoading ? 'Finding Match...' : 'Find Match'}
                </button>
                
                <div className="mt-4 sm:mt-6 text-center">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Average wait time: 30 seconds
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    You'll be matched based on preferences
                  </p>
                </div>
              </motion.div>
            </div>
          )}
          
          {/* Waiting for Partner */}
          {inviteCode && gamePhase === 'waiting' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-sm sm:max-w-md mx-auto"
            >
              <div className="text-center">
                <div className="text-4xl sm:text-6xl mb-4 animate-pulse">⏳</div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                  Waiting for Partner
                </h2>
                
                <div className="bg-gray-100 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Invite Code</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600 tracking-wider">
                    {inviteCode}
                  </p>
                </div>
                
                <button
                  onClick={handleCopyInviteLink}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold sm:font-bold py-3 px-4 sm:px-6 rounded-lg hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
                >
                  Copy Invite Link 📋
                </button>
                
                <p className="text-xs sm:text-sm text-gray-500 mt-4 px-2">
                  Share this code or link with your partner to start the game
                </p>
              </div>
            </motion.div>
          )}
          
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4"
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MatchPage;