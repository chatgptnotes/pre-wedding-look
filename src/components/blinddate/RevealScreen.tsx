import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlindDateGameState, GameReaction } from '../../types';
import { BlindDateService } from '../../services/blindDateService';

interface RevealScreenProps {
  gameState: BlindDateGameState;
  onAddReaction: (vote?: 'A' | 'B' | 'tie', reaction?: GameReaction['type']) => void;
  onPlayAgain: () => void;
}

const RevealScreen: React.FC<RevealScreenProps> = ({
  gameState,
  onAddReaction,
  onPlayAgain
}) => {
  const [selectedVote, setSelectedVote] = useState<'A' | 'B' | 'tie' | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<GameReaction['type'] | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const reactionOptions = BlindDateService.getReactionOptions();
  const playerA = gameState.participants.find(p => p.role === 'A');
  const playerB = gameState.participants.find(p => p.role === 'B');
  
  // Group designs by target role and round
  const designsByTarget = {
    A: gameState.designs.filter(d => d.target_role === 'A'),
    B: gameState.designs.filter(d => d.target_role === 'B')
  };

  const handleVote = (vote: 'A' | 'B' | 'tie') => {
    setSelectedVote(vote);
    onAddReaction(vote, selectedReaction || undefined);
  };

  const handleReaction = (reaction: GameReaction['type']) => {
    setSelectedReaction(reaction);
    onAddReaction(selectedVote || undefined, reaction);
  };

  const handleShare = async () => {
    try {
      const shareContent = await BlindDateService.generateShareContent(gameState.session.id);
      
      if (navigator.share) {
        await navigator.share({
          title: '🎭 Blind Date Style-Off Results!',
          text: shareContent.caption,
          url: shareContent.video_url
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `🎭 Just played Blind Date Style-Off!\n${shareContent.caption}\n${shareContent.video_url}`
        );
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            🎭
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            The Big Reveal!
          </h1>
          <p className="text-xl text-gray-600">
            See how you styled each other across all 3 rounds
          </p>
        </motion.div>

        {/* Side-by-Side Comparison */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Player A Results */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                A
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {playerA?.avatar_name}
              </h3>
              <p className="text-gray-600">
                {playerA?.is_me ? "That's you!" : "Your styling partner"}
              </p>
            </div>

            {/* Show designs for Player A */}
            <div className="space-y-6">
              {designsByTarget.A.map((design, index) => {
                const round = gameState.rounds.find(r => r.id === design.round_id);
                const isMyDesign = design.designer_user_id === gameState.participants.find(p => p.is_me)?.user_id;
                
                return (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-2xl border-2 ${
                      isMyDesign 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-blue-300 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800 capitalize">
                          Round {round?.round_no}: {round?.topic}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {isMyDesign ? 'Your styling' : 'Their styling of you'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isMyDesign 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-blue-200 text-blue-800'
                      }`}>
                        {isMyDesign ? 'Your choice' : 'Their choice'}
                      </div>
                    </div>

                    {/* Design preview */}
                    {design.image_url ? (
                      <img
                        src={design.image_url}
                        alt={`${round?.topic} styling`}
                        className="w-full h-40 object-cover rounded-xl mb-3"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                        <div className="text-gray-400 text-center">
                          <div className="text-3xl mb-2">🎨</div>
                          <p className="text-sm">Style Choice</p>
                        </div>
                      </div>
                    )}

                    {/* Style details */}
                    <div className="text-sm text-gray-700">
                      <p><strong>Style:</strong> {JSON.stringify(design.prompt[0]?.value || {}, null, 2)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Player B Results */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                B
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {playerB?.avatar_name}
              </h3>
              <p className="text-gray-600">
                {playerB?.is_me ? "That's you!" : "Your styling partner"}
              </p>
            </div>

            {/* Show designs for Player B */}
            <div className="space-y-6">
              {designsByTarget.B.map((design, index) => {
                const round = gameState.rounds.find(r => r.id === design.round_id);
                const isMyDesign = design.designer_user_id === gameState.participants.find(p => p.is_me)?.user_id;
                
                return (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-2xl border-2 ${
                      isMyDesign 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-purple-300 bg-purple-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800 capitalize">
                          Round {round?.round_no}: {round?.topic}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {isMyDesign ? 'Your styling' : 'Their styling of you'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isMyDesign 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-purple-200 text-purple-800'
                      }`}>
                        {isMyDesign ? 'Your choice' : 'Their choice'}
                      </div>
                    </div>

                    {/* Design preview */}
                    {design.image_url ? (
                      <img
                        src={design.image_url}
                        alt={`${round?.topic} styling`}
                        className="w-full h-40 object-cover rounded-xl mb-3"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                        <div className="text-gray-400 text-center">
                          <div className="text-3xl mb-2">🎨</div>
                          <p className="text-sm">Style Choice</p>
                        </div>
                      </div>
                    )}

                    {/* Style details */}
                    <div className="text-sm text-gray-700">
                      <p><strong>Style:</strong> {JSON.stringify(design.prompt[0]?.value || {}, null, 2)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Reactions Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🎉 What did you think?
          </h2>

          {/* Vote Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
              Whose styling felt more "you"?
            </h3>
            <div className="flex justify-center gap-4">
              {['A', 'B', 'tie'].map((vote) => (
                <motion.button
                  key={vote}
                  onClick={() => handleVote(vote as 'A' | 'B' | 'tie')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    selectedVote === vote
                      ? vote === 'A'
                        ? 'bg-pink-500 text-white'
                        : vote === 'B'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-green-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {vote === 'A' ? `Player A` : vote === 'B' ? `Player B` : `It\'s a tie!`}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Reaction Emojis */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Quick reaction:
            </h3>
            <div className="flex justify-center gap-4">
              {reactionOptions.map((reaction) => (
                <motion.button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-16 h-16 rounded-full text-2xl transition-all ${
                    selectedReaction === reaction.type
                      ? 'bg-yellow-200 ring-4 ring-yellow-300'
                      : 'bg-gray-100 hover:bg-yellow-100'
                  }`}
                  title={reaction.label}
                >
                  {reaction.emoji}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={handleShare}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
          >
            📤 Share Results
          </button>
          
          <button
            onClick={onPlayAgain}
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold rounded-2xl hover:from-indigo-600 hover:to-blue-600 transition-all shadow-lg"
          >
            🎮 Play Again
          </button>
        </motion.div>

        {/* Final Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-2">
            Thanks for playing Blind Date Style-Off! 🎭
          </p>
          <p className="text-sm text-gray-500">
            Your game session will auto-expire in 24 hours for privacy.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RevealScreen;