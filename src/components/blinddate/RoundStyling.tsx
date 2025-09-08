import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlindDateGameState, StyleChoice } from '../../types';
import { BlindDateService } from '../../services/blindDateService';

interface RoundStylingProps {
  gameState: BlindDateGameState;
  onSubmitDesign: (targetRole: 'A' | 'B', styleChoices: StyleChoice[], imageUrl?: string) => void;
  onLeaveGame: () => void;
}

const RoundStyling: React.FC<RoundStylingProps> = ({ 
  gameState, 
  onSubmitDesign, 
  onLeaveGame 
}) => {
  const [selectedTargetRole, setSelectedTargetRole] = useState<'A' | 'B' | null>(null);
  const [styleChoices, setStyleChoices] = useState<Record<string, StyleChoice>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentRound = gameState.current_round;
  const otherParticipant = gameState.participants.find(p => !p.is_me);
  
  if (!currentRound || !otherParticipant) {
    return <div>Loading round...</div>;
  }

  const styleOptions = BlindDateService.getStyleOptionsForTopic(currentRound.topic);
  const roundTitle = {
    'attire': '👗 Choose Outfits',
    'hair': '💇‍♀️ Style Hair & Accessories', 
    'location': '🏖️ Pick Location & Vibe'
  }[currentRound.topic];

  const hasSubmittedForRole = (role: 'A' | 'B') => {
    return BlindDateService.hasSubmittedDesign(
      gameState.my_designs,
      currentRound.id,
      role
    );
  };

  const handleStyleSelect = (optionId: string, option: any) => {
    setStyleChoices(prev => ({
      ...prev,
      [selectedTargetRole || 'A']: {
        category: currentRound.topic,
        option: optionId,
        value: option.value
      }
    }));
  };

  const handleSubmit = async () => {
    if (!selectedTargetRole || !styleChoices[selectedTargetRole]) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitDesign(
        selectedTargetRole,
        [styleChoices[selectedTargetRole]]
      );
      
      // Clear selection to allow styling the other role
      setSelectedTargetRole(null);
      setStyleChoices(prev => ({
        ...prev,
        [selectedTargetRole]: undefined
      }));
    } catch (error) {
      console.error('Failed to submit design:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bothPlayersSubmitted = gameState.participants.every(p => 
    hasSubmittedForRole('A') && hasSubmittedForRole('B')
  );

  return (
    <div className="space-y-6">
      {/* Round Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {roundTitle}
        </h2>
        <p className="text-gray-600">
          Round {currentRound.round_no} of 3 • Style both players secretly!
        </p>
      </div>

      {/* Role Selection */}
      <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {/* Style Player A */}
        <motion.button
          onClick={() => setSelectedTargetRole('A')}
          whileHover={{ scale: 1.02 }}
          className={`p-6 rounded-2xl border-2 transition-all ${
            selectedTargetRole === 'A'
              ? 'border-pink-500 bg-pink-50'
              : hasSubmittedForRole('A')
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:border-pink-300'
          }`}
        >
          <div className="text-4xl mb-3">
            {hasSubmittedForRole('A') ? '✅' : '👤'}
          </div>
          <h3 className="font-bold text-lg mb-2">
            Style Player A
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {gameState.participants.find(p => p.role === 'A')?.avatar_name}
          </p>
          {hasSubmittedForRole('A') ? (
            <span className="text-green-600 font-medium">✨ Styled!</span>
          ) : (
            <span className="text-gray-500">Tap to style</span>
          )}
        </motion.button>

        {/* Style Player B */}
        <motion.button
          onClick={() => setSelectedTargetRole('B')}
          whileHover={{ scale: 1.02 }}
          className={`p-6 rounded-2xl border-2 transition-all ${
            selectedTargetRole === 'B'
              ? 'border-indigo-500 bg-indigo-50'
              : hasSubmittedForRole('B')
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:border-indigo-300'
          }`}
        >
          <div className="text-4xl mb-3">
            {hasSubmittedForRole('B') ? '✅' : '👤'}
          </div>
          <h3 className="font-bold text-lg mb-2">
            Style Player B
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {gameState.participants.find(p => p.role === 'B')?.avatar_name}
          </p>
          {hasSubmittedForRole('B') ? (
            <span className="text-green-600 font-medium">✨ Styled!</span>
          ) : (
            <span className="text-gray-500">Tap to style</span>
          )}
        </motion.button>
      </div>

      {/* Style Options */}
      <AnimatePresence>
        {selectedTargetRole && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
              Choose {currentRound.topic} for {' '}
              <span className={selectedTargetRole === 'A' ? 'text-pink-600' : 'text-indigo-600'}>
                Player {selectedTargetRole}
              </span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {styleOptions.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleStyleSelect(option.id, option)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    styleChoices[selectedTargetRole]?.option === option.id
                      ? selectedTargetRole === 'A'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">
                    {option.label.split(' ')[0]}
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {option.label.replace(/^[^\s]+ /, '')}
                  </p>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setSelectedTargetRole(null)}
                className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!styleChoices[selectedTargetRole] || isSubmitting}
                className={`px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 ${
                  selectedTargetRole === 'A'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
                    : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600'
                }`}
              >
                {isSubmitting ? 'Submitting...' : '✨ Submit Style'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Status */}
      <div className="text-center">
        {bothPlayersSubmitted ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-4 max-w-md mx-auto"
          >
            <div className="text-green-600 text-xl mb-2">🎉</div>
            <p className="text-green-800 font-semibold">
              All styles submitted!
            </p>
            <p className="text-green-600 text-sm">
              Waiting for round to end or advance to next round...
            </p>
          </motion.div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 max-w-md mx-auto">
            <div className="text-blue-600 text-xl mb-2">⏳</div>
            <p className="text-blue-800 font-semibold">
              Keep styling!
            </p>
            <p className="text-blue-600 text-sm">
              Submit styles for both players to complete the round
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center">
        <button
          onClick={onLeaveGame}
          className="px-6 py-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-colors"
        >
          Leave Game
        </button>
      </div>
    </div>
  );
};

export default RoundStyling;