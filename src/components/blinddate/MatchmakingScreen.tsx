import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface MatchmakingScreenProps {
  onJoinGame: (inviteCode?: string) => void;
  onCreatePrivateGame: () => void;
  isLoading: boolean;
}

const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({
  onJoinGame,
  onCreatePrivateGame,
  isLoading
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [showPrivateJoin, setShowPrivateJoin] = useState(false);

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

        {/* Game modes */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Quick Match */}
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50"
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Quick Match</h3>
              <p className="text-gray-600 mb-6">
                Get matched with someone random instantly
              </p>
            </div>

            <button
              onClick={() => onJoinGame()}
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
              <p className="text-gray-600 mb-6">
                Create a private room and invite your partner
              </p>
            </div>

            <button
              onClick={onCreatePrivateGame}
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
        </div>

        {/* Private join form */}
        {showPrivateJoin && (
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

export default MatchmakingScreen;