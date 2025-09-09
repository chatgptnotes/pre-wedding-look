import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlindDateService } from '../../services/blindDateService';
import { BlindDateGameState, GameTimer, StyleChoice, GameReaction } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { default as GameTimerComponent } from '../blinddate/GameTimer';
import RoundStyling from '../blinddate/RoundStyling';
import RevealScreen from '../blinddate/RevealScreen';
import MatchmakingWithTimeout from '../blinddate/MatchmakingWithTimeout';
import WaitingRoom from '../blinddate/WaitingRoom';

const BlindDateTab: React.FC = () => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<BlindDateGameState | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<'matching' | 'waiting' | 'playing' | 'reveal' | 'finished'>('matching');
  const [timer, setTimer] = useState<GameTimer>({ minutes: 0, seconds: 0, isActive: false, totalSeconds: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timer.isActive && timer.totalSeconds > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          const newTotal = prev.totalSeconds - 1;
          if (newTotal <= 0) {
            // Time's up! Auto-advance round
            if (currentSessionId && gameState?.current_round) {
              BlindDateService.advanceRound(currentSessionId).catch(console.error);
            }
            return { ...prev, isActive: false, totalSeconds: 0, minutes: 0, seconds: 0 };
          }
          return {
            ...prev,
            totalSeconds: newTotal,
            minutes: Math.floor(newTotal / 60),
            seconds: newTotal % 60
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isActive, timer.totalSeconds, currentSessionId, gameState?.current_round]);

  // Subscribe to game state changes
  useEffect(() => {
    if (!currentSessionId) return;

    const unsubscribe = BlindDateService.subscribeToGame(currentSessionId, (updatedState) => {
      setGameState(prev => prev ? { ...prev, ...updatedState } : null);
      
      // Update game phase based on session status
      if (updatedState.session) {
        switch (updatedState.session.status) {
          case 'waiting':
            setGamePhase('waiting');
            break;
          case 'active':
            setGamePhase('playing');
            break;
          case 'reveal':
            setGamePhase('reveal');
            break;
          case 'finished':
            setGamePhase('finished');
            break;
        }
      }
    });

    return unsubscribe;
  }, [currentSessionId]);

  // Start timer when round begins
  useEffect(() => {
    if (gameState?.current_round && gamePhase === 'playing' && !gameState.current_round.ended_at) {
      const timeLimit = gameState.current_round.time_limit_seconds;
      setTimer({
        totalSeconds: timeLimit,
        minutes: Math.floor(timeLimit / 60),
        seconds: timeLimit % 60,
        isActive: true
      });
    }
  }, [gameState?.current_round, gamePhase]);

  const handleJoinGame = useCallback(async (inviteCode?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await BlindDateService.joinGame(inviteCode);
      setCurrentSessionId(result.session_id);
      
      if (result.status === 'waiting') {
        setGamePhase('waiting');
      } else {
        setGamePhase('playing');
      }

      // Fetch full game state
      const fullState = await BlindDateService.getGameState(result.session_id);
      setGameState(fullState);

    } catch (err: any) {
      setError(err.message || 'Failed to join game');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreatePrivateGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await BlindDateService.createPrivateGame();
      setCurrentSessionId(result.session_id);
      setGamePhase('waiting');

      // Fetch full game state
      const fullState = await BlindDateService.getGameState(result.session_id);
      setGameState(fullState);

    } catch (err: any) {
      setError(err.message || 'Failed to create private game');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLeaveGame = useCallback(async () => {
    if (!currentSessionId) return;
    
    try {
      await BlindDateService.leaveGame();
      setCurrentSessionId(null);
      setGameState(null);
      setGamePhase('matching');
      setTimer({ minutes: 0, seconds: 0, isActive: false, totalSeconds: 0 });
    } catch (err: any) {
      setError(err.message || 'Failed to leave game');
    }
  }, [currentSessionId]);

  const handleSubmitDesign = useCallback(async (
    targetRole: 'A' | 'B',
    styleChoices: StyleChoice[],
    imageUrl?: string
  ) => {
    if (!currentSessionId || !gameState?.current_round) return;

    try {
      // Check if this is a bot demo session
      const isBotDemo = currentSessionId.startsWith('bot-demo-');
      
      if (isBotDemo) {
        console.log('Bot demo submission:', { targetRole, styleChoices, imageUrl });
        
        // For bot demo, just update local state instead of calling server
        const newDesign = {
          id: `design-${Date.now()}`,
          session_id: currentSessionId,
          round_id: gameState.current_round.id,
          designer_user_id: 'current-user',
          target_role: targetRole,
          prompt: styleChoices,
          image_url: imageUrl || null,
          created_at: new Date().toISOString()
        };
        
        // Update the game state with the new design
        setGameState(prevState => ({
          ...prevState,
          designs: [...(prevState?.designs || []), newDesign],
          my_designs: [...(prevState?.my_designs || []), newDesign]
        }));
        
        console.log('Bot demo design submitted successfully');
        return;
      }

      // Real multiplayer mode - call server
      await BlindDateService.submitDesign(
        currentSessionId,
        gameState.current_round.id,
        targetRole,
        styleChoices,
        imageUrl
      );

      // Refresh game state from server
      const updatedState = await BlindDateService.getGameState(currentSessionId);
      setGameState(updatedState);

    } catch (err: any) {
      setError(err.message || 'Failed to submit design');
    }
  }, [currentSessionId, gameState?.current_round]);

  const handleAddReaction = useCallback(async (
    vote?: 'A' | 'B' | 'tie',
    reaction?: GameReaction['type']
  ) => {
    if (!currentSessionId) return;

    try {
      await BlindDateService.addReaction(currentSessionId, vote, reaction);
      
      // Refresh game state
      const updatedState = await BlindDateService.getGameState(currentSessionId);
      setGameState(updatedState);

    } catch (err: any) {
      setError(err.message || 'Failed to add reaction');
    }
  }, [currentSessionId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign in to Play!</h2>
          <p className="text-gray-600">You need to be logged in to join the Blind Date Style-Off game.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Oops! Something went wrong</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setGamePhase('matching');
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100">
      <AnimatePresence mode="wait">
        {gamePhase === 'matching' && (
          <motion.div
            key="matching"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <MatchmakingWithTimeout
              onGameStarted={async (sessionData) => {
                console.log('BlindDateTab onGameStarted called with:', sessionData);
                setCurrentSessionId(sessionData.sessionId);
                setError(null);
                
                try {
                  // Handle bot demo mode differently
                  if (sessionData.bot_mode) {
                    console.log('Setting up bot demo game state');
                    
                    // Create mock game state for bot demo
                    const mockGameState = {
                      session: {
                        id: sessionData.sessionId,
                        status: 'active',
                        is_private: false,
                        created_at: new Date().toISOString(),
                        ended_at: null
                      },
                      participants: [
                        {
                          session_id: sessionData.sessionId,
                          user_id: 'current-user',
                          role: 'A',
                          joined_at: new Date().toISOString(),
                          is_revealed: false,
                          avatar_name: sessionData.avatar_name,
                          is_me: true
                        },
                        {
                          session_id: sessionData.sessionId,
                          user_id: 'ai-bot',
                          role: 'B',
                          joined_at: new Date().toISOString(),
                          is_revealed: false,
                          avatar_name: 'AI Style Buddy',
                          is_me: false
                        }
                      ],
                      current_round: {
                        id: `round-1-${Date.now()}`,
                        session_id: sessionData.sessionId,
                        round_no: 1,
                        topic: 'attire',
                        started_at: new Date().toISOString(),
                        ended_at: null,
                        time_limit_seconds: 180
                      },
                      rounds: [],
                      designs: [],
                      my_designs: [],
                      my_role: 'A'
                    };
                    
                    setGameState(mockGameState);
                    setGamePhase('playing');
                    console.log('Bot demo game state set, transitioning to playing phase');
                    
                  } else {
                    // Regular multiplayer mode - fetch from server
                    console.log('Fetching real game state from server');
                    const state = await BlindDateService.getGameState(sessionData.sessionId);
                    setGameState(state);
                    
                    // Determine phase based on game state
                    if (state.session.status === 'waiting') {
                      setGamePhase('waiting');
                    } else if (state.session.status === 'active') {
                      setGamePhase('playing');
                    } else if (state.session.status === 'reveal') {
                      setGamePhase('reveal');
                    }
                  }
                  
                } catch (err) {
                  console.error('Error fetching game state:', err);
                  setError('Failed to load game state');
                }
              }}
              onError={(error) => {
                setError(error);
                setIsLoading(false);
              }}
            />
          </motion.div>
        )}

        {gamePhase === 'waiting' && gameState && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <WaitingRoom
              gameState={gameState}
              onLeaveGame={handleLeaveGame}
            />
          </motion.div>
        )}

        {gamePhase === 'playing' && gameState && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="container mx-auto px-4 py-8">
              {/* Header with timer */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 mb-8 shadow-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                      🎭 Blind Date Style-Off
                    </h1>
                    <p className="text-gray-600">
                      Round {gameState.current_round?.round_no} of 3: {' '}
                      <span className="capitalize font-semibold">
                        {gameState.current_round?.topic}
                      </span>
                    </p>
                  </div>
                  <GameTimerComponent timer={timer} />
                </div>
              </div>

              {/* Game content */}
              <RoundStyling
                gameState={gameState}
                onSubmitDesign={handleSubmitDesign}
                onLeaveGame={handleLeaveGame}
              />
            </div>
          </motion.div>
        )}

        {(gamePhase === 'reveal' || gamePhase === 'finished') && gameState && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <RevealScreen
              gameState={gameState}
              onAddReaction={handleAddReaction}
              onPlayAgain={() => {
                setGamePhase('matching');
                setCurrentSessionId(null);
                setGameState(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlindDateTab;