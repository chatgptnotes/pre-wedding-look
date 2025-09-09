import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState, GameState, GameParticipant } from '../../hooks/useGameState';
import AvatarSystem from './AvatarSystem';

interface GameFlowProps {
  sessionId: string;
  onGameComplete: (results: GameResults) => void;
  onError: (error: string) => void;
}

interface GameResults {
  winner: string;
  scores: Record<string, number>;
  duration: number;
  rounds: RoundResult[];
}

interface RoundResult {
  roundNumber: number;
  submissions: Record<string, StyleSubmission>;
  winner: string;
  votes: Record<string, string>; // voter -> voted_for
}

interface StyleSubmission {
  userId: string;
  avatarConfig: any;
  timestamp: string;
  stylePoints: number;
}

const ROUND_DURATION = 60; // seconds per round
const VOTING_DURATION = 30; // seconds for voting

const GameFlow: React.FC<GameFlowProps> = ({
  sessionId,
  onGameComplete,
  onError
}) => {
  const { gameState, loading, error, connectionStatus, actions } = useGameState(sessionId);
  const [currentPhase, setCurrentPhase] = useState<'waiting' | 'styling' | 'voting' | 'results'>('waiting');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submissions, setSubmissions] = useState<Record<string, StyleSubmission>>({});
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);

  // Memoized participant data for performance
  const participantMap = useMemo(() => {
    if (!gameState?.participants) return new Map();
    return new Map(gameState.participants.map(p => [p.userId, p]));
  }, [gameState?.participants]);

  const currentUser = useMemo(() => {
    const userId = gameState?.participants.find(p => p.isConnected)?.userId;
    return userId ? participantMap.get(userId) : null;
  }, [participantMap]);

  // Game timer effect
  useEffect(() => {
    if (!gameState || gameState.status !== 'active') return;

    let interval: NodeJS.Timeout;

    if (currentPhase === 'styling') {
      setTimeRemaining(ROUND_DURATION);
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setCurrentPhase('voting');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (currentPhase === 'voting') {
      setTimeRemaining(VOTING_DURATION);
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            calculateRoundResults();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentPhase, gameState]);

  // Game state change handler
  useEffect(() => {
    if (!gameState) return;

    if (gameState.status === 'active' && currentPhase === 'waiting') {
      setCurrentPhase('styling');
    } else if (gameState.status === 'completed') {
      completeGame();
    }
  }, [gameState?.status]);

  const calculateRoundResults = useCallback(() => {
    if (!gameState) return;

    // Calculate votes for each submission
    const voteCount: Record<string, number> = {};
    Object.values(votes).forEach(votedFor => {
      voteCount[votedFor] = (voteCount[votedFor] || 0) + 1;
    });

    // Find winner (most votes, tie-breaker by style points)
    let winner = '';
    let maxVotes = -1;
    let maxStylePoints = -1;

    Object.entries(submissions).forEach(([userId, submission]) => {
      const userVotes = voteCount[userId] || 0;
      if (userVotes > maxVotes || 
          (userVotes === maxVotes && submission.stylePoints > maxStylePoints)) {
        winner = userId;
        maxVotes = userVotes;
        maxStylePoints = submission.stylePoints;
      }
    });

    const roundResult: RoundResult = {
      roundNumber: gameState.currentRound,
      submissions: { ...submissions },
      winner,
      votes: { ...votes }
    };

    setRoundResults(prev => [...prev, roundResult]);

    // Update scores
    if (winner && winner !== '') {
      actions.updateScore(winner, (gameState.scores[winner] || 0) + 10);
    }

    // Reset for next round or show results
    setSubmissions({});
    setVotes({});
    
    if (gameState.currentRound >= gameState.totalRounds) {
      setCurrentPhase('results');
    } else {
      setCurrentPhase('results');
      setTimeout(() => {
        if (gameState.isHost) {
          actions.endRound();
        }
        setCurrentPhase('styling');
      }, 3000); // 3 second break between rounds
    }
  }, [gameState, submissions, votes, actions]);

  const completeGame = useCallback(() => {
    if (!gameState) return;

    // Find overall winner
    const winner = Object.entries(gameState.scores)
      .reduce((prev, current) => prev[1] > current[1] ? prev : current)[0];

    const results: GameResults = {
      winner,
      scores: gameState.scores,
      duration: Date.now() - (gameState as any).startTime, // This would need to be tracked
      rounds: roundResults
    };

    onGameComplete(results);
  }, [gameState, roundResults, onGameComplete]);

  const submitStyle = useCallback((avatarConfig: any) => {
    if (!currentUser || currentPhase !== 'styling') return;

    const submission: StyleSubmission = {
      userId: currentUser.userId,
      avatarConfig,
      timestamp: new Date().toISOString(),
      stylePoints: Math.floor(Math.random() * 100) // This would be calculated based on style choices
    };

    setSubmissions(prev => ({
      ...prev,
      [currentUser.userId]: submission
    }));

    // Broadcast submission to other players
    actions.broadcastGameAction({
      type: 'UPDATE_SCORE', // Reusing this for simplicity
      payload: { submission }
    });
  }, [currentUser, currentPhase, actions]);

  const castVote = useCallback((votedForUserId: string) => {
    if (!currentUser || currentPhase !== 'voting' || votedForUserId === currentUser.userId) return;

    setVotes(prev => ({
      ...prev,
      [currentUser.userId]: votedForUserId
    }));
  }, [currentUser, currentPhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const ConnectionStatus = () => (
    <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
      connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
      connectionStatus === 'reconnecting' ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
          connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-spin' :
          'bg-red-500'
        }`}></div>
        <span className="capitalize">{connectionStatus}</span>
      </div>
    </div>
  );

  const GameHeader = () => (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-xl mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Style-Off Challenge</h2>
          <p className="opacity-90">
            Round {gameState?.currentRound || 1} of {gameState?.totalRounds || 3}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{formatTime(timeRemaining)}</div>
          <p className="text-sm opacity-90 capitalize">{currentPhase} Phase</p>
        </div>
      </div>
    </div>
  );

  const ParticipantsList = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {gameState?.participants.map(participant => (
        <motion.div
          key={participant.userId}
          className={`p-3 rounded-xl text-center ${
            participant.isConnected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
          } border`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-lg mb-1">{participant.avatarName}</div>
          <div className="text-sm text-gray-600">
            Score: {gameState.scores[participant.userId] || 0}
          </div>
          <div className={`text-xs mt-1 ${
            participant.isConnected ? 'text-green-600' : 'text-gray-500'
          }`}>
            {participant.isConnected ? 'Online' : 'Offline'}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const StylingPhase = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Create Your Look!</h3>
        <p className="text-gray-600">Choose the perfect avatar style for this round</p>
      </div>

      <AvatarSystem
        userId={currentUser?.userId || ''}
        gameMode="selection"
        onAvatarSelect={(avatar) => submitStyle(avatar)}
        isAnimated={true}
      />

      {submissions[currentUser?.userId || ''] && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-green-800 font-medium">✨ Style Submitted!</div>
          <div className="text-green-600 text-sm mt-1">
            Waiting for other players to finish...
          </div>
        </div>
      )}
    </motion.div>
  );

  const VotingPhase = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Vote for the Best Style!</h3>
        <p className="text-gray-600">Choose your favorite look (excluding your own)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(submissions).map(([userId, submission]) => {
          const participant = participantMap.get(userId);
          const isCurrentUser = userId === currentUser?.userId;
          const hasVoted = votes[currentUser?.userId || ''] === userId;

          return (
            <motion.div
              key={userId}
              className={`p-4 rounded-xl border-2 transition-colors ${
                isCurrentUser ? 'bg-gray-100 border-gray-300' :
                hasVoted ? 'bg-purple-100 border-purple-400' :
                'bg-white border-gray-200 hover:border-purple-300 cursor-pointer'
              }`}
              onClick={() => !isCurrentUser && castVote(userId)}
              whileHover={!isCurrentUser ? { scale: 1.02 } : {}}
              whileTap={!isCurrentUser ? { scale: 0.98 } : {}}
            >
              <div className="text-center">
                <div className="mb-3">
                  {/* Avatar display would go here */}
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                </div>
                <div className="font-medium">{participant?.avatarName || 'Unknown'}</div>
                <div className="text-sm text-gray-600">
                  Style Points: {submission.stylePoints}
                </div>
                {isCurrentUser && (
                  <div className="text-xs text-gray-500 mt-1">Your Submission</div>
                )}
                {hasVoted && !isCurrentUser && (
                  <div className="text-xs text-purple-600 mt-1 font-medium">Voted!</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {votes[currentUser?.userId || ''] && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-blue-800 font-medium">🗳️ Vote Cast!</div>
          <div className="text-blue-600 text-sm mt-1">
            Waiting for all votes to be submitted...
          </div>
        </div>
      )}
    </motion.div>
  );

  const ResultsPhase = () => {
    const latestRound = roundResults[roundResults.length - 1];
    const roundWinner = latestRound ? participantMap.get(latestRound.winner) : null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="bg-gradient-to-r from-gold-400 to-yellow-400 text-white rounded-xl p-6">
          <h3 className="text-2xl font-bold mb-2">🎉 Round Winner!</h3>
          <div className="text-xl">{roundWinner?.avatarName || 'Unknown'}</div>
          <div className="text-sm opacity-90 mt-1">
            {Object.values(latestRound?.votes || {}).filter(v => v === latestRound?.winner).length} votes
          </div>
        </div>

        {gameState?.status === 'completed' && (
          <div className="bg-purple-100 rounded-xl p-6">
            <h4 className="text-xl font-bold mb-4">🏆 Game Complete!</h4>
            <div className="space-y-2">
              {Object.entries(gameState.scores)
                .sort(([,a], [,b]) => b - a)
                .map(([userId, score], index) => {
                  const participant = participantMap.get(userId);
                  return (
                    <div key={userId} className="flex justify-between items-center">
                      <span className="font-medium">
                        {index === 0 && '👑 '}{participant?.avatarName || 'Unknown'}
                      </span>
                      <span className="font-bold">{score} points</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    onError(error);
    return null;
  }

  if (!gameState) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">No game session found</div>
      </div>
    );
  }

  return (
    <div className="game-flow max-w-4xl mx-auto p-6">
      <ConnectionStatus />
      
      {gameState.status === 'active' && <GameHeader />}
      
      <ParticipantsList />

      <AnimatePresence mode="wait">
        {currentPhase === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="text-xl mb-4">🎮 Waiting for game to start...</div>
            {gameState.isHost && (
              <button
                onClick={actions.startGame}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                Start Game
              </button>
            )}
          </motion.div>
        )}

        {currentPhase === 'styling' && (
          <motion.div key="styling">
            <StylingPhase />
          </motion.div>
        )}

        {currentPhase === 'voting' && (
          <motion.div key="voting">
            <VotingPhase />
          </motion.div>
        )}

        {currentPhase === 'results' && (
          <motion.div key="results">
            <ResultsPhase />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameFlow;