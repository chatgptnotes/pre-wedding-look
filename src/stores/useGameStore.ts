import { create } from 'zustand';
import { BlindDateGameState, StyleChoice, GameReaction } from '../types';
import { BlindDateService } from '../services/blindDateService';

interface GameStore {
  // Game State
  currentSessionId: string | null;
  gameState: BlindDateGameState | null;
  gamePhase: 'matching' | 'waiting' | 'playing' | 'reveal' | 'finished';
  
  // Timer
  timer: {
    minutes: number;
    seconds: number;
    isActive: boolean;
    totalSeconds: number;
  };
  
  // UI State
  isLoading: boolean;
  error: string | null;
  inviteCode: string | null;
  showConsentDialog: boolean;
  consentGiven: boolean;
  
  // Actions
  setCurrentSessionId: (id: string | null) => void;
  setGameState: (state: BlindDateGameState | null) => void;
  setGamePhase: (phase: 'matching' | 'waiting' | 'playing' | 'reveal' | 'finished') => void;
  setTimer: (timer: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInviteCode: (code: string | null) => void;
  setShowConsentDialog: (show: boolean) => void;
  setConsentGiven: (given: boolean) => void;
  
  // Game Actions
  createPrivateGame: () => Promise<void>;
  joinGame: (inviteCode?: string) => Promise<void>;
  leaveGame: () => Promise<void>;
  submitDesign: (roundId: string, choices: StyleChoice[]) => Promise<void>;
  sendReaction: (reaction: GameReaction) => Promise<void>;
  updateConsentStatus: (showFace: boolean) => Promise<void>;
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  tickTimer: () => void;
  
  // Realtime subscription
  subscribeToGame: () => () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial State
  currentSessionId: null,
  gameState: null,
  gamePhase: 'matching',
  timer: {
    minutes: 0,
    seconds: 0,
    isActive: false,
    totalSeconds: 0,
  },
  isLoading: false,
  error: null,
  inviteCode: null,
  showConsentDialog: false,
  consentGiven: false,
  
  // Setters
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setGameState: (state) => set({ gameState: state }),
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setTimer: (timer) => set({ timer }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setInviteCode: (code) => set({ inviteCode: code }),
  setShowConsentDialog: (show) => set({ showConsentDialog: show }),
  setConsentGiven: (given) => set({ consentGiven: given }),
  
  // Game Actions
  createPrivateGame: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await BlindDateService.createPrivateGame();
      set({
        currentSessionId: result.session_id,
        inviteCode: result.invite_code,
        gamePhase: 'waiting',
      });
      
      const fullState = await BlindDateService.getGameState(result.session_id);
      set({ gameState: fullState });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  joinGame: async (inviteCode) => {
    set({ isLoading: true, error: null });
    try {
      const result = await BlindDateService.joinGame(inviteCode);
      set({
        currentSessionId: result.session_id,
        gamePhase: result.status === 'waiting' ? 'waiting' : 'playing',
      });
      
      const fullState = await BlindDateService.getGameState(result.session_id);
      set({ gameState: fullState });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  leaveGame: async () => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;
    
    try {
      await BlindDateService.leaveGame();
      set({
        currentSessionId: null,
        gameState: null,
        gamePhase: 'matching',
        timer: {
          minutes: 0,
          seconds: 0,
          isActive: false,
          totalSeconds: 0,
        },
        inviteCode: null,
        consentGiven: false,
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  submitDesign: async (roundId, choices) => {
    const { currentSessionId } = get();
    if (!currentSessionId) throw new Error('No active session');
    
    set({ isLoading: true, error: null });
    try {
      await BlindDateService.submitDesign(currentSessionId, roundId, choices);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  sendReaction: async (reaction) => {
    const { currentSessionId } = get();
    if (!currentSessionId) throw new Error('No active session');
    
    try {
      await BlindDateService.sendReaction(currentSessionId, reaction);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateConsentStatus: async (showFace) => {
    const { currentSessionId } = get();
    if (!currentSessionId) throw new Error('No active session');
    
    try {
      await BlindDateService.updateParticipantConsent(currentSessionId, showFace);
      set({ consentGiven: showFace });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  startTimer: (seconds) => {
    set({
      timer: {
        totalSeconds: seconds,
        minutes: Math.floor(seconds / 60),
        seconds: seconds % 60,
        isActive: true,
      },
    });
  },
  
  stopTimer: () => {
    set((state) => ({
      timer: {
        ...state.timer,
        isActive: false,
      },
    }));
  },
  
  tickTimer: () => {
    const { timer, currentSessionId, gameState } = get();
    if (!timer.isActive || timer.totalSeconds <= 0) return;
    
    const newTotal = timer.totalSeconds - 1;
    
    if (newTotal <= 0) {
      // Time's up! Auto-advance round
      if (currentSessionId && gameState?.current_round) {
        BlindDateService.advanceRound(currentSessionId).catch(console.error);
      }
      set({
        timer: {
          isActive: false,
          totalSeconds: 0,
          minutes: 0,
          seconds: 0,
        },
      });
    } else {
      set({
        timer: {
          isActive: true,
          totalSeconds: newTotal,
          minutes: Math.floor(newTotal / 60),
          seconds: newTotal % 60,
        },
      });
    }
  },
  
  subscribeToGame: () => {
    const { currentSessionId } = get();
    if (!currentSessionId) return () => {};
    
    return BlindDateService.subscribeToGame(currentSessionId, (updatedState) => {
      set((state) => ({
        gameState: state.gameState ? { ...state.gameState, ...updatedState } : null,
      }));
      
      // Update game phase based on session status
      if (updatedState.session) {
        const phaseMap: Record<string, typeof get extends () => infer R ? R['gamePhase'] : never> = {
          'waiting': 'waiting',
          'active': 'playing',
          'reveal': 'reveal',
          'finished': 'finished',
        };
        
        const phase = phaseMap[updatedState.session.status];
        if (phase) {
          set({ gamePhase: phase });
        }
      }
    });
  },
}));