import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/useGameStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import GameTimer from '../components/blinddate/GameTimer';
import RoundStyling from '../components/blinddate/RoundStyling';

const RoomPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    gameState,
    gamePhase,
    timer,
    subscribeToGame,
    startTimer,
    tickTimer,
    submitDesign,
    setShowConsent,
    consentGiven,
    updateConsentStatus
  } = useGameStore();
  const { addToast } = useUIStore();
  
  const [currentRoundChoices, setCurrentRoundChoices] = useState<any[]>([]);
  
  // Subscribe to game updates
  useEffect(() => {
    if (!sessionId) return;
    
    const unsubscribe = subscribeToGame();
    return unsubscribe;
  }, [sessionId]);
  
  // Timer management
  useEffect(() => {
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Start timer when round begins
  useEffect(() => {
    if (gameState?.current_round && gamePhase === 'playing' && !gameState.current_round.ended_at) {
      const timeLimit = gameState.current_round.time_limit_seconds;
      startTimer(timeLimit);
    }
  }, [gameState?.current_round, gamePhase]);
  
  // Navigate to reveal when game reaches reveal phase
  useEffect(() => {
    if (gamePhase === 'reveal' && sessionId) {
      navigate(`/reveal/${sessionId}`);
    }
  }, [gamePhase, sessionId, navigate]);
  
  const handleSubmitDesign = async () => {
    if (!gameState?.current_round) return;
    
    try {
      await submitDesign(gameState.current_round.id, currentRoundChoices);
      addToast({
        type: 'success',
        message: 'Design submitted successfully!',
      });
      setCurrentRoundChoices([]);
    } catch (error: any) {
      addToast({
        type: 'error',
        message: error.message || 'Failed to submit design',
      });
    }
  };
  
  const handleConsentToggle = async () => {
    const newConsent = !consentGiven;
    await updateConsentStatus(newConsent);
    addToast({
      type: 'info',
      message: newConsent ? 'Face reveal enabled' : 'Face reveal disabled',
    });
  };
  
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Round {gameState.current_round?.round_number || 0} of 3
              </h1>
              <p className="text-gray-600">
                {gameState.current_round?.theme_category || 'Loading...'}
              </p>
            </div>
            
            <GameTimer />
            
            {/* Consent Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show Face at Reveal</label>
              <button
                onClick={handleConsentToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  consentGiven ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    consentGiven ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Game Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Partner's Photo */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Style Your Partner
              </h3>
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                {gameState.partner_photo ? (
                  <img 
                    src={gameState.partner_photo} 
                    alt="Partner"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-2">👤</div>
                    <p className="text-gray-500 text-sm">Partner's photo</p>
                    <p className="text-gray-400 text-xs mt-1">Hidden until reveal</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          
          {/* Styling Options */}
          <div className="lg:col-span-2">
            <RoundStyling
              round={gameState.current_round}
              onChoicesChange={setCurrentRoundChoices}
              disabled={timer.totalSeconds === 0}
            />
            
            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <button
                onClick={handleSubmitDesign}
                disabled={currentRoundChoices.length === 0 || timer.totalSeconds === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {timer.totalSeconds === 0 ? 'Time\'s Up!' : 'Submit Design'}
              </button>
            </motion.div>
          </div>
        </div>
        
        {/* Round Progress */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress</h3>
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((roundNum) => (
              <div
                key={roundNum}
                className={`flex-1 text-center ${
                  roundNum <= (gameState.current_round?.round_number || 0)
                    ? 'text-purple-600'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center font-bold ${
                    roundNum < (gameState.current_round?.round_number || 0)
                      ? 'bg-purple-600 text-white'
                      : roundNum === (gameState.current_round?.round_number || 0)
                      ? 'bg-purple-100 text-purple-600 border-2 border-purple-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {roundNum}
                </div>
                <p className="text-sm mt-2">
                  {roundNum === 1 && 'Attire'}
                  {roundNum === 2 && 'Hair & Accessories'}
                  {roundNum === 3 && 'Location & Vibe'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;