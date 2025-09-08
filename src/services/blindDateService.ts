import { supabase } from '../lib/supabase';
import {
  BlindDateSession,
  BlindDateGameState,
  BlindDateDesign,
  StyleChoice,
  GameReaction
} from '../types';

export class BlindDateService {
  // Join or create a game session
  static async joinGame(inviteCode?: string): Promise<{
    session_id: string;
    role: 'A' | 'B';
    avatar_name: string;
    status: 'waiting' | 'active';
    participant_count: number;
  }> {
    const { data, error } = await supabase.functions.invoke('blinddate-matchmaking', {
      body: {
        action: 'join',
        invite_code: inviteCode
      }
    });

    if (error) throw error;
    return data;
  }

  // Create a private game with invite code
  static async createPrivateGame(): Promise<{
    session_id: string;
    invite_code: string;
    role: 'A' | 'B';
    avatar_name: string;
    status: 'waiting';
  }> {
    const { data, error } = await supabase.functions.invoke('blinddate-matchmaking', {
      body: {
        action: 'create_private'
      }
    });

    if (error) throw error;
    return data;
  }

  // Leave current game
  static async leaveGame(): Promise<void> {
    const { error } = await supabase.functions.invoke('blinddate-matchmaking', {
      body: {
        action: 'leave'
      }
    });

    if (error) throw error;
  }

  // Get current game state
  static async getGameState(sessionId: string): Promise<BlindDateGameState> {
    const { data, error } = await supabase.functions.invoke('blinddate-game', {
      body: {
        action: 'get_session',
        session_id: sessionId
      }
    });

    if (error) throw error;
    return data;
  }

  // Submit a design for the current round
  static async submitDesign(
    sessionId: string, 
    roundId: string, 
    targetRole: 'A' | 'B',
    styleChoices: StyleChoice[],
    imageUrl?: string
  ): Promise<void> {
    const { error } = await supabase.functions.invoke('blinddate-game', {
      body: {
        action: 'submit_design',
        session_id: sessionId,
        round_id: roundId,
        design_data: {
          target_role: targetRole,
          prompt: styleChoices,
          image_url: imageUrl
        }
      }
    });

    if (error) throw error;
  }

  // Advance to next round
  static async advanceRound(sessionId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('blinddate-game', {
      body: {
        action: 'advance_round',
        session_id: sessionId
      }
    });

    if (error) throw error;
  }

  // Reveal all results
  static async revealResults(sessionId: string): Promise<{ designs: BlindDateDesign[] }> {
    const { data, error } = await supabase.functions.invoke('blinddate-game', {
      body: {
        action: 'reveal_results',
        session_id: sessionId
      }
    });

    if (error) throw error;
    return data;
  }

  // Add reaction/vote
  static async addReaction(
    sessionId: string,
    vote?: 'A' | 'B' | 'tie',
    reaction?: GameReaction['type']
  ): Promise<void> {
    const { error } = await supabase.functions.invoke('blinddate-game', {
      body: {
        action: 'add_reaction',
        session_id: sessionId,
        reaction_data: {
          vote,
          reaction
        }
      }
    });

    if (error) throw error;
  }

  // Real-time subscription to game state changes
  static subscribeToGame(
    sessionId: string,
    callback: (gameState: Partial<BlindDateGameState>) => void
  ) {
    // Subscribe to session updates
    const sessionChannel = supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blinddate_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          callback({ session: payload.new as BlindDateSession });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blinddate_participants',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          // Participant joined/left - fetch fresh data
          BlindDateService.getGameState(sessionId).then(callback);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blinddate_designs',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          // New design submitted - fetch fresh data
          BlindDateService.getGameState(sessionId).then(callback);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blinddate_rounds',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          // Round ended - fetch fresh data
          BlindDateService.getGameState(sessionId).then(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }

  // Generate social sharing content
  static async generateShareContent(sessionId: string): Promise<{
    video_url: string;
    caption: string;
  }> {
    // This would integrate with a video generation service
    // For now, return mock data
    return {
      video_url: `/api/generate-reel/${sessionId}`,
      caption: `🎉 Just played Blind Date Style-Off! See how my partner styled me vs how I styled them! #PrewedAI #BlindDateStyleOff`
    };
  }

  // Get available style options for a round topic
  static getStyleOptionsForTopic(topic: 'attire' | 'hair' | 'location'): {
    id: string;
    label: string;
    preview?: string;
    value: any;
  }[] {
    switch (topic) {
      case 'attire':
        return [
          { id: 'red_lehenga', label: '🔴 Red Lehenga', value: { type: 'lehenga', color: 'red', style: 'traditional' } },
          { id: 'pink_saree', label: '🌸 Pink Saree', value: { type: 'saree', color: 'pink', style: 'elegant' } },
          { id: 'cream_sherwani', label: '🤵 Cream Sherwani', value: { type: 'sherwani', color: 'cream', style: 'classic' } },
          { id: 'blue_suit', label: '💙 Blue Suit', value: { type: 'suit', color: 'blue', style: 'modern' } }
        ];
      
      case 'hair':
        return [
          { id: 'updo_flowers', label: '🌺 Updo with Flowers', value: { style: 'updo', accessories: 'flowers' } },
          { id: 'loose_curls', label: '💫 Loose Curls', value: { style: 'curls', length: 'long' } },
          { id: 'traditional_bun', label: '👑 Traditional Bun', value: { style: 'bun', type: 'traditional' } },
          { id: 'modern_style', label: '✨ Modern Style', value: { style: 'modern', type: 'sleek' } }
        ];
      
      case 'location':
        return [
          { id: 'taj_mahal', label: '🕌 Taj Mahal', value: { location: 'taj_mahal', mood: 'romantic', time: 'sunrise' } },
          { id: 'beach_sunset', label: '🏖️ Beach Sunset', value: { location: 'beach', mood: 'romantic', time: 'sunset' } },
          { id: 'palace_courtyard', label: '🏰 Palace Courtyard', value: { location: 'palace', mood: 'royal', architecture: 'indian' } },
          { id: 'garden_party', label: '🌸 Garden Party', value: { location: 'garden', mood: 'cheerful', season: 'spring' } }
        ];
      
      default:
        return [];
    }
  }

  // Get reaction options
  static getReactionOptions(): GameReaction[] {
    return [
      { type: 'heart', emoji: '❤️', label: 'Love it!' },
      { type: 'fire', emoji: '🔥', label: 'So hot!' },
      { type: 'laugh', emoji: '😂', label: 'Hilarious!' },
      { type: 'surprise', emoji: '😱', label: 'Unexpected!' }
    ];
  }

  // Generate fun avatar names
  static generateAvatarName(): string {
    const adjectives = ['Purple', 'Golden', 'Silver', 'Pink', 'Blue', 'Green', 'Red', 'Orange'];
    const nouns = ['Butterfly', 'Star', 'Moon', 'Rose', 'Ocean', 'Forest', 'Phoenix', 'Sunset'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective} ${noun}`;
  }

  // Format time remaining
  static formatTimeRemaining(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Check if user has already submitted design for round
  static hasSubmittedDesign(
    myDesigns: BlindDateDesign[],
    roundId: string,
    targetRole: 'A' | 'B'
  ): boolean {
    return myDesigns.some(
      design => design.round_id === roundId && design.target_role === targetRole
    );
  }
}