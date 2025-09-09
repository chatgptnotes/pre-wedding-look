import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserId } from '../utils/tokenStorage';

export interface GameState {
  sessionId: string;
  status: 'waiting' | 'active' | 'completed' | 'timeout';
  participants: GameParticipant[];
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  scores: Record<string, number>;
  isHost: boolean;
  gameConfig: GameConfig;
}

export interface GameParticipant {
  id: string;
  userId: string;
  role: 'host' | 'participant';
  avatarName: string;
  isConnected: boolean;
  lastSeen: string;
  score: number;
}

export interface GameConfig {
  maxParticipants: number;
  roundDuration: number; // seconds
  totalRounds: number;
  gameMode: 'style-off' | 'quick-match' | 'tournament';
}

export interface GameAction {
  type: 'START_GAME' | 'END_ROUND' | 'UPDATE_SCORE' | 'PLAYER_JOIN' | 'PLAYER_LEAVE' | 'TIMEOUT';
  payload?: any;
  timestamp: string;
  userId: string;
}

export const useGameState = (initialSessionId?: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  const userId = getUserId();

  // Real-time game state subscription
  useEffect(() => {
    if (!initialSessionId || !userId) return;

    let subscription: any;
    let heartbeatInterval: NodeJS.Timeout;

    const setupRealtimeSubscription = async () => {
      try {
        setConnectionStatus('connected');

        // Subscribe to game state changes
        subscription = supabase
          .channel(`game_session_${initialSessionId}`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'blinddate_sessions',
              filter: `id=eq.${initialSessionId}`
            }, 
            (payload) => {
              console.log('🎮 Game session update:', payload);
              handleGameStateUpdate(payload);
            }
          )
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public', 
              table: 'blinddate_participants',
              filter: `session_id=eq.${initialSessionId}`
            },
            (payload) => {
              console.log('👥 Participant update:', payload);
              handleParticipantUpdate(payload);
            }
          )
          .on('broadcast', 
            { event: 'game_action' },
            (payload) => {
              console.log('🎯 Game action received:', payload);
              handleGameAction(payload.payload as GameAction);
            }
          )
          .subscribe((status) => {
            console.log('📡 Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              setConnectionStatus('connected');
            } else if (status === 'CLOSED') {
              setConnectionStatus('disconnected');
            }
          });

        // Set up heartbeat to maintain connection
        heartbeatInterval = setInterval(() => {
          if (subscription) {
            updatePlayerHeartbeat();
          }
        }, 30000); // Every 30 seconds

      } catch (err) {
        console.error('❌ Failed to setup realtime subscription:', err);
        setConnectionStatus('disconnected');
        setError('Failed to connect to game server');
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [initialSessionId, userId]);

  const handleGameStateUpdate = useCallback((payload: any) => {
    const { new: newSession } = payload;
    if (newSession && gameState) {
      setGameState(prev => prev ? {
        ...prev,
        status: newSession.status,
        currentRound: newSession.current_round || 0,
        timeRemaining: newSession.time_remaining || 0
      } : null);
    }
  }, [gameState]);

  const handleParticipantUpdate = useCallback((payload: any) => {
    const { eventType, new: newParticipant, old: oldParticipant } = payload;
    
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;

      let updatedParticipants = [...prev.participants];

      if (eventType === 'INSERT' && newParticipant) {
        // New participant joined
        const participant: GameParticipant = {
          id: newParticipant.id,
          userId: newParticipant.user_id,
          role: newParticipant.role,
          avatarName: newParticipant.avatar_name,
          isConnected: true,
          lastSeen: newParticipant.joined_at,
          score: 0
        };
        updatedParticipants.push(participant);
      } else if (eventType === 'UPDATE' && newParticipant) {
        // Participant updated
        const index = updatedParticipants.findIndex(p => p.id === newParticipant.id);
        if (index !== -1) {
          updatedParticipants[index] = {
            ...updatedParticipants[index],
            isConnected: true,
            lastSeen: new Date().toISOString()
          };
        }
      } else if (eventType === 'DELETE' && oldParticipant) {
        // Participant left
        updatedParticipants = updatedParticipants.filter(p => p.id !== oldParticipant.id);
      }

      return {
        ...prev,
        participants: updatedParticipants
      };
    });
  }, [gameState]);

  const handleGameAction = useCallback((action: GameAction) => {
    if (!gameState) return;

    switch (action.type) {
      case 'START_GAME':
        setGameState(prev => prev ? { ...prev, status: 'active', currentRound: 1 } : null);
        break;
      
      case 'END_ROUND':
        setGameState(prev => {
          if (!prev) return null;
          const nextRound = prev.currentRound + 1;
          return {
            ...prev,
            currentRound: nextRound,
            status: nextRound > prev.totalRounds ? 'completed' : 'active'
          };
        });
        break;

      case 'UPDATE_SCORE':
        if (action.payload && action.payload.userId && action.payload.score) {
          setGameState(prev => prev ? {
            ...prev,
            scores: {
              ...prev.scores,
              [action.payload.userId]: action.payload.score
            }
          } : null);
        }
        break;

      case 'TIMEOUT':
        setGameState(prev => prev ? { ...prev, status: 'timeout' } : null);
        break;
    }
  }, [gameState]);

  const updatePlayerHeartbeat = useCallback(async () => {
    if (!initialSessionId || !userId) return;

    try {
      await supabase
        .from('blinddate_participants')
        .update({ 
          last_seen: new Date().toISOString(),
          is_connected: true 
        })
        .eq('session_id', initialSessionId)
        .eq('user_id', userId);
    } catch (err) {
      console.error('❌ Failed to update heartbeat:', err);
    }
  }, [initialSessionId, userId]);

  const broadcastGameAction = useCallback(async (action: Omit<GameAction, 'timestamp' | 'userId'>) => {
    if (!initialSessionId || !userId) return;

    const fullAction: GameAction = {
      ...action,
      timestamp: new Date().toISOString(),
      userId
    };

    try {
      await supabase.channel(`game_session_${initialSessionId}`)
        .send({
          type: 'broadcast',
          event: 'game_action',
          payload: fullAction
        });
    } catch (err) {
      console.error('❌ Failed to broadcast game action:', err);
    }
  }, [initialSessionId, userId]);

  const startGame = useCallback(async () => {
    if (!gameState || !gameState.isHost) return;
    
    setLoading(true);
    try {
      await supabase
        .from('blinddate_sessions')
        .update({ 
          status: 'active',
          current_round: 1,
          started_at: new Date().toISOString()
        })
        .eq('id', gameState.sessionId);

      await broadcastGameAction({ type: 'START_GAME' });
    } catch (err) {
      console.error('❌ Failed to start game:', err);
      setError('Failed to start game');
    }
    setLoading(false);
  }, [gameState, broadcastGameAction]);

  const endRound = useCallback(async () => {
    if (!gameState || !gameState.isHost) return;

    setLoading(true);
    try {
      const nextRound = gameState.currentRound + 1;
      const isGameComplete = nextRound > gameState.totalRounds;

      await supabase
        .from('blinddate_sessions')
        .update({ 
          current_round: nextRound,
          status: isGameComplete ? 'completed' : 'active'
        })
        .eq('id', gameState.sessionId);

      await broadcastGameAction({ type: 'END_ROUND' });
    } catch (err) {
      console.error('❌ Failed to end round:', err);
      setError('Failed to end round');
    }
    setLoading(false);
  }, [gameState, broadcastGameAction]);

  const updateScore = useCallback(async (participantUserId: string, score: number) => {
    if (!gameState) return;

    try {
      await broadcastGameAction({ 
        type: 'UPDATE_SCORE', 
        payload: { userId: participantUserId, score } 
      });
    } catch (err) {
      console.error('❌ Failed to update score:', err);
      setError('Failed to update score');
    }
  }, [gameState, broadcastGameAction]);

  const leaveGame = useCallback(async () => {
    if (!gameState || !userId) return;

    setLoading(true);
    try {
      await supabase
        .from('blinddate_participants')
        .delete()
        .eq('session_id', gameState.sessionId)
        .eq('user_id', userId);

      await broadcastGameAction({ type: 'PLAYER_LEAVE' });
    } catch (err) {
      console.error('❌ Failed to leave game:', err);
      setError('Failed to leave game');
    }
    setLoading(false);
  }, [gameState, userId, broadcastGameAction]);

  return {
    gameState,
    loading,
    error,
    connectionStatus,
    actions: {
      startGame,
      endRound,
      updateScore,
      leaveGame,
      broadcastGameAction
    }
  };
};