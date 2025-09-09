import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchmakingEnhancedProps {
  onJoinGame: (inviteCode?: string) => void;
  onCreatePrivateGame: () => void;
  isLoading: boolean;
}

const MatchmakingEnhanced: React.FC<MatchmakingEnhancedProps> = ({
  onJoinGame,
  onCreatePrivateGame,
  isLoading
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [showPrivateJoin, setShowPrivateJoin] = useState(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState<'idle' | 'searching' | 'creating' | 'waiting'>('idle');
  const [searchTime, setSearchTime] = useState(0);

  // Timer for search duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (matchmakingStatus === 'searching') {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [matchmakingStatus]);

  const handleQuickMatch = () => {
    setMatchmakingStatus('searching');
    onJoinGame();
  };

  const handleCreatePrivate = () => {
    setMatchmakingStatus('creating');
    onCreatePrivateGame();
  };

  const formatSearchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getSearchMessage = () => {
    if (searchTime < 10) return "🔍 Searching for players...";
    if (searchTime < 20) return "🌍 Expanding search globally...";
    if (searchTime < 30) return "⏰ Still looking, hang tight...";
    if (searchTime < 45) return "🎮 Creating your own game room...";
    return "🎯 Almost ready! Preparing your session...";
  };

  const getSearchTip = () => {
    if (searchTime < 15) return "Most matches happen within 30 seconds!";
    if (searchTime < 30) return "Try creating a private room and share the code with friends!";
    return "You'll be placed in a waiting room where others can join.";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            🎭
          </motion.h1>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Blind Date Style-Off
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Style each other secretly, then reveal the results!
          </p>
          <p className="text-gray-500">
            3 rounds • 8 minutes • Endless fun
          </p>
        </div>

        {/* Search Status */}
        <AnimatePresence>
          {matchmakingStatus === 'searching' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 shadow-xl mb-8 text-white text-center"
            >
              <motion.div
                className="text-3xl mb-3"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                🔄
              </motion.div>
              <h3 className="text-xl font-bold mb-2">
                {getSearchMessage()}
              </h3>
              <p className="text-purple-100 mb-3">
                Search time: {formatSearchTime(searchTime)}
              </p>
              <p className="text-sm text-purple-200">
                💡 {getSearchTip()}
              </p>
              
              {/* Progress bar */}
              <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-white/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((searchTime / 60) * 100, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              
              {searchTime > 30 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <p className="text-sm text-purple-200 mb-3">
                    No matches found yet. You'll be put in a waiting room where others can join!
                  </p>
                  <button
                    onClick={() => setMatchmakingStatus('idle')}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-colors"
                  >
                    ← Back to Menu
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game modes */}
        {matchmakingStatus === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            {/* Quick Match */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Quick Match</h3>
                <p className="text-gray-600 mb-4">
                  Get matched with someone random instantly
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>No matches?</strong> Don't worry! You'll enter a waiting room where others can join you.
                  </p>
                </div>
              </div>

              <button
                onClick={handleQuickMatch}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-4 px-6 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Finding match...
                  </span>
                ) : (
                  '🎯 Find Random Match'
                )}
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Anonymous • Safe • Fun
                </p>
              </div>
            </motion.div>

            {/* Private Game */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">👫</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Play with Partner</h3>
                <p className="text-gray-600 mb-4">
                  Create a private room and invite your partner
                </p>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-green-800">
                    ✅ <strong>Guaranteed match!</strong> Share your invite code with friends or your partner.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCreatePrivate}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-4 px-6 rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 shadow-lg mb-4"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating room...
                  </span>
                ) : (
                  '🔗 Create Private Room'
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setShowPrivateJoin(!showPrivateJoin)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Have an invite code?
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Private join form */}
        {showPrivateJoin && matchmakingStatus === 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Join Private Game
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter invite code (e.g. ABC123)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={6}
              />
              <button
                onClick={() => inviteCode.trim() && onJoinGame(inviteCode.trim())}
                disabled={!inviteCode.trim() || isLoading}
                className="bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </motion.div>
        )}

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            🎮 How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                1
              </div>
              <p className="text-gray-700 font-medium mb-1">Match & Upload</p>
              <p className="text-gray-500">Upload photos and get matched</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                2
              </div>
              <p className="text-gray-700 font-medium mb-1">Style Secretly</p>
              <p className="text-gray-500">3 rounds of styling each other</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                3
              </div>
              <p className="text-gray-700 font-medium mb-1">Reveal & React</p>
              <p className="text-gray-500">See results and share reactions</p>
            </div>
          </div>
        </motion.div>

        {/* Safety note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-6"
        >
          <p className="text-xs text-gray-500">
            🔒 Your privacy is protected. Anonymous matching available. Photos auto-delete in 24hrs.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MatchmakingEnhanced;