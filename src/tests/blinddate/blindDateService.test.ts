import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlindDateService } from '../../services/blindDateService';

// Mock Supabase
const mockInvoke = vi.fn();
const mockChannel = vi.fn();
const mockOn = vi.fn().mockReturnThis();
const mockSubscribe = vi.fn().mockReturnValue(() => {});
const mockRemoveChannel = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke
    },
    channel: mockChannel.mockReturnValue({
      on: mockOn,
      subscribe: mockSubscribe
    }),
    removeChannel: mockRemoveChannel
  }
}));

describe('BlindDateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.mockReturnValue({
      on: mockOn,
      subscribe: mockSubscribe
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('joinGame', () => {
    it('should join a quick match game successfully', async () => {
      const mockResponse = {
        session_id: 'test-session-id',
        role: 'A' as const,
        avatar_name: 'Purple Butterfly',
        status: 'waiting' as const,
        participant_count: 1
      };

      mockInvoke.mockResolvedValueOnce({ data: mockResponse, error: null });

      const result = await BlindDateService.joinGame();

      expect(mockInvoke).toHaveBeenCalledWith('blinddate-matchmaking', {
        body: {
          action: 'join',
          invite_code: undefined
        }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should join a private game with invite code', async () => {
      const mockResponse = {
        session_id: 'private-session-id',
        role: 'B' as const,
        avatar_name: 'Golden Star',
        status: 'active' as const,
        participant_count: 2
      };

      mockInvoke.mockResolvedValueOnce({ data: mockResponse, error: null });

      const result = await BlindDateService.joinGame('ABC123');

      expect(mockInvoke).toHaveBeenCalledWith('blinddate-matchmaking', {
        body: {
          action: 'join',
          invite_code: 'ABC123'
        }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when join fails', async () => {
      mockInvoke.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Session not found' } 
      });

      await expect(BlindDateService.joinGame('INVALID')).rejects.toEqual({
        message: 'Session not found'
      });
    });
  });

  describe('createPrivateGame', () => {
    it('should create private game successfully', async () => {
      const mockResponse = {
        session_id: 'new-private-session',
        invite_code: 'XYZ789',
        role: 'A' as const,
        avatar_name: 'Mystery Host',
        status: 'waiting' as const
      };

      mockInvoke.mockResolvedValueOnce({ data: mockResponse, error: null });

      const result = await BlindDateService.createPrivateGame();

      expect(mockInvoke).toHaveBeenCalledWith('blinddate-matchmaking', {
        body: {
          action: 'create_private'
        }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('submitDesign', () => {
    it('should submit design successfully', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: null });

      const styleChoices = [
        { category: 'attire' as const, option: 'red_lehenga', value: { type: 'lehenga', color: 'red' } }
      ];

      await BlindDateService.submitDesign(
        'session-id',
        'round-id',
        'A',
        styleChoices,
        'https://example.com/image.jpg'
      );

      expect(mockInvoke).toHaveBeenCalledWith('blinddate-game', {
        body: {
          action: 'submit_design',
          session_id: 'session-id',
          round_id: 'round-id',
          design_data: {
            target_role: 'A',
            prompt: styleChoices,
            image_url: 'https://example.com/image.jpg'
          }
        }
      });
    });
  });

  describe('getGameState', () => {
    it('should get game state successfully', async () => {
      const mockGameState = {
        session: {
          id: 'test-session',
          status: 'active',
          is_private: false,
          created_at: '2024-01-01T00:00:00Z'
        },
        my_role: 'A',
        my_avatar_name: 'Purple Butterfly',
        participants: [],
        rounds: [],
        designs: [],
        my_designs: []
      };

      mockInvoke.mockResolvedValueOnce({ data: mockGameState, error: null });

      const result = await BlindDateService.getGameState('test-session');

      expect(mockInvoke).toHaveBeenCalledWith('blinddate-game', {
        body: {
          action: 'get_session',
          session_id: 'test-session'
        }
      });
      expect(result).toEqual(mockGameState);
    });
  });

  describe('subscribeToGame', () => {
    it('should set up real-time subscriptions', () => {
      const mockCallback = vi.fn();
      const sessionId = 'test-session-id';

      const unsubscribe = BlindDateService.subscribeToGame(sessionId, mockCallback);

      expect(mockChannel).toHaveBeenCalledWith(`session_${sessionId}`);
      expect(mockOn).toHaveBeenCalledTimes(4); // 4 different table subscriptions
      expect(mockSubscribe).toHaveBeenCalled();

      // Test unsubscribe function
      unsubscribe();
      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  describe('utility functions', () => {
    it('should generate avatar name', () => {
      const avatarName = BlindDateService.generateAvatarName();
      expect(typeof avatarName).toBe('string');
      expect(avatarName).toMatch(/^(Purple|Golden|Silver|Pink|Blue|Green|Red|Orange) (Butterfly|Star|Moon|Rose|Ocean|Forest|Phoenix|Sunset)$/);
    });

    it('should format time remaining correctly', () => {
      expect(BlindDateService.formatTimeRemaining(125)).toBe('2:05');
      expect(BlindDateService.formatTimeRemaining(60)).toBe('1:00');
      expect(BlindDateService.formatTimeRemaining(5)).toBe('0:05');
      expect(BlindDateService.formatTimeRemaining(0)).toBe('0:00');
    });

    it('should check if design submitted correctly', () => {
      const myDesigns = [
        {
          id: 'design-1',
          round_id: 'round-1',
          target_role: 'A' as const,
          session_id: 'session-1',
          designer_user_id: 'user-1',
          prompt: {},
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      expect(BlindDateService.hasSubmittedDesign(myDesigns, 'round-1', 'A')).toBe(true);
      expect(BlindDateService.hasSubmittedDesign(myDesigns, 'round-1', 'B')).toBe(false);
      expect(BlindDateService.hasSubmittedDesign(myDesigns, 'round-2', 'A')).toBe(false);
    });
  });

  describe('getStyleOptionsForTopic', () => {
    it('should return attire options', () => {
      const options = BlindDateService.getStyleOptionsForTopic('attire');
      expect(options).toHaveLength(4);
      expect(options[0]).toMatchObject({
        id: 'red_lehenga',
        label: '🔴 Red Lehenga',
        value: { type: 'lehenga', color: 'red', style: 'traditional' }
      });
    });

    it('should return hair options', () => {
      const options = BlindDateService.getStyleOptionsForTopic('hair');
      expect(options).toHaveLength(4);
      expect(options[0]).toMatchObject({
        id: 'updo_flowers',
        label: '🌺 Updo with Flowers',
        value: { style: 'updo', accessories: 'flowers' }
      });
    });

    it('should return location options', () => {
      const options = BlindDateService.getStyleOptionsForTopic('location');
      expect(options).toHaveLength(4);
      expect(options[0]).toMatchObject({
        id: 'taj_mahal',
        label: '🕌 Taj Mahal',
        value: { location: 'taj_mahal', mood: 'romantic', time: 'sunrise' }
      });
    });

    it('should return empty array for invalid topic', () => {
      // @ts-ignore - Testing invalid input
      const options = BlindDateService.getStyleOptionsForTopic('invalid');
      expect(options).toEqual([]);
    });
  });

  describe('getReactionOptions', () => {
    it('should return all reaction options', () => {
      const reactions = BlindDateService.getReactionOptions();
      expect(reactions).toHaveLength(4);
      expect(reactions).toEqual([
        { type: 'heart', emoji: '❤️', label: 'Love it!' },
        { type: 'fire', emoji: '🔥', label: 'So hot!' },
        { type: 'laugh', emoji: '😂', label: 'Hilarious!' },
        { type: 'surprise', emoji: '😱', label: 'Unexpected!' }
      ]);
    });
  });
});