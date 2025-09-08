import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlindDateGameState } from '../../types';

interface WaitingRoomProps {
  gameState: BlindDateGameState;
  onLeaveGame: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ gameState, onLeaveGame }) => {
  const [showInviteCode, setShowInviteCode] = useState(false);
  
  const isPrivateGame = gameState.session.is_private;
  const inviteCode = gameState.session.invite_code;
  const participantCount = gameState.participants.length;
  const myParticipant = gameState.participants.find(p => p.is_me);
  const otherParticipant = gameState.participants.find(p => !p.is_me);

  const copyInviteCode = async () => {
    if (inviteCode) {
      try {
        await navigator.clipboard.writeText(inviteCode);
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy invite code:', err);
      }
    }
  };

  const shareInviteCode = () => {
    if (inviteCode) {
      const text = `🎭 Join my Blind Date Style-Off game! Use invite code: ${inviteCode}\n\nhttps://your-app-url.com/blinddate?code=${inviteCode}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Blind Date Style-Off Invite',
          text: text,
        });
      } else {
        // Fallback to copying
        copyInviteCode();
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="text-8xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            ⏳
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Waiting for {participantCount === 1 ? 'someone to join' : 'game to start'}...
          </h1>
          <p className="text-gray-600">
            {participantCount === 1 
              ? 'Share the invite code or wait for a random match'
              : 'Both players are here! Game starting soon...'
            }
          </p>
        </div>

        {/* Participants Display */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            👥 Players ({participantCount}/2)
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Player A */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                A
              </div>
              {myParticipant?.role === 'A' ? (
                <div>
                  <p className="font-semibold text-gray-800">You</p>
                  <p className="text-sm text-gray-600">{myParticipant.avatar_name}</p>
                </div>
              ) : otherParticipant?.role === 'A' ? (
                <div>
                  <p className="font-semibold text-gray-800">{otherParticipant.avatar_name}</p>
                  <p className="text-sm text-gray-600">Your styling partner</p>
                </div>
              ) : (
                <div>
                  <motion.p 
                    className="text-gray-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    Waiting...
                  </motion.p>
                </div>
              )}
            </div>

            {/* Player B */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-indigo-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                B
              </div>
              {myParticipant?.role === 'B' ? (
                <div>
                  <p className="font-semibold text-gray-800">You</p>
                  <p className="text-sm text-gray-600">{myParticipant.avatar_name}</p>
                </div>
              ) : otherParticipant?.role === 'B' ? (
                <div>
                  <p className="font-semibold text-gray-800">{otherParticipant.avatar_name}</p>
                  <p className="text-sm text-gray-600">Your styling partner</p>
                </div>
              ) : (
                <div>
                  <motion.p 
                    className="text-gray-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    Waiting...
                  </motion.p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invite Code Section (for private games) */}
        {isPrivateGame && inviteCode && participantCount === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 shadow-xl mb-6"
          >
            <div className="text-center text-white">
              <h3 className="text-lg font-semibold mb-4">Share Your Invite Code</h3>
              
              <div className="bg-white/20 rounded-2xl p-4 mb-4">
                <div className="text-3xl font-mono font-bold tracking-wider mb-2">
                  {inviteCode}
                </div>
                <p className="text-sm opacity-90">
                  Your partner needs this code to join
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={copyInviteCode}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                >
                  📋 Copy Code
                </button>
                <button
                  onClick={shareInviteCode}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                >
                  📤 Share
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Game Rules */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            🎯 Game Rules
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-xs flex-shrink-0 mt-0.5">1</span>
              <p><strong>Round 1:</strong> Choose attire for each other (3 minutes)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0 mt-0.5">2</span>
              <p><strong>Round 2:</strong> Select hair & accessories (3 minutes)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0 mt-0.5">3</span>
              <p><strong>Round 3:</strong> Pick location & vibe (2 minutes)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs flex-shrink-0 mt-0.5">🎉</span>
              <p><strong>Reveal:</strong> See the final results and react!</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onLeaveGame}
            className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
          >
            Leave Game
          </button>
          
          {participantCount === 2 && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold"
            >
              Starting soon! 🚀
            </motion.div>
          )}
        </div>

        {/* Loading animation for single player */}
        {participantCount === 1 && !isPrivateGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 text-gray-600">
              <motion.div
                className="w-2 h-2 bg-purple-400 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 bg-pink-400 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-indigo-400 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
              />
              <span className="ml-2 text-sm">Looking for a match...</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default WaitingRoom;