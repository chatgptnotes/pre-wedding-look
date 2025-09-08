import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BlindDateService } from '../../services/blindDateService';
import BlindDateTab from '../../components/tabs/BlindDateTab';

// Mock the AuthContext
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User'
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: () => ({ user: mockUser })
}));

// Mock BlindDateService
vi.mock('../../services/blindDateService', () => ({
  BlindDateService: {
    joinGame: vi.fn(),
    createPrivateGame: vi.fn(),
    leaveGame: vi.fn(),
    getGameState: vi.fn(),
    submitDesign: vi.fn(),
    advanceRound: vi.fn(),
    addReaction: vi.fn(),
    subscribeToGame: vi.fn(() => () => {}),
    getStyleOptionsForTopic: vi.fn(() => []),
    getReactionOptions: vi.fn(() => [])
  }
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}));

describe('BlindDate Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Matchmaking Flow', () => {
    it('should render matchmaking screen initially', () => {
      render(<BlindDateTab />);
      
      expect(screen.getByText('Blind Date Style-Off')).toBeInTheDocument();
      expect(screen.getByText('Quick Match')).toBeInTheDocument();
      expect(screen.getByText('Play with Partner')).toBeInTheDocument();
    });

    it('should handle quick match successfully', async () => {
      const mockJoinResponse = {
        session_id: 'test-session',
        role: 'A' as const,
        avatar_name: 'Purple Butterfly',
        status: 'waiting' as const,
        participant_count: 1
      };

      const mockGameState = {
        session: {
          id: 'test-session',
          status: 'waiting' as const,
          is_private: false,
          created_at: '2024-01-01T00:00:00Z'
        },
        my_role: 'A' as const,
        my_avatar_name: 'Purple Butterfly',
        participants: [
          {
            session_id: 'test-session',
            user_id: 'test-user-id',
            role: 'A' as const,
            joined_at: '2024-01-01T00:00:00Z',
            is_revealed: false,
            avatar_name: 'Purple Butterfly',
            is_me: true
          }
        ],
        rounds: [],
        designs: [],
        my_designs: []
      };

      vi.mocked(BlindDateService.joinGame).mockResolvedValueOnce(mockJoinResponse);
      vi.mocked(BlindDateService.getGameState).mockResolvedValueOnce(mockGameState);

      render(<BlindDateTab />);
      
      const quickMatchButton = screen.getByText('🎯 Find Random Match');
      fireEvent.click(quickMatchButton);

      await waitFor(() => {
        expect(BlindDateService.joinGame).toHaveBeenCalledWith(undefined);
        expect(BlindDateService.getGameState).toHaveBeenCalledWith('test-session');
      });
    });

    it('should handle private game creation', async () => {
      const mockCreateResponse = {
        session_id: 'private-session',
        invite_code: 'ABC123',
        role: 'A' as const,
        avatar_name: 'Mystery Host',
        status: 'waiting' as const
      };

      const mockGameState = {
        session: {
          id: 'private-session',
          status: 'waiting' as const,
          is_private: true,
          invite_code: 'ABC123',
          created_at: '2024-01-01T00:00:00Z'
        },
        my_role: 'A' as const,
        my_avatar_name: 'Mystery Host',
        participants: [
          {
            session_id: 'private-session',
            user_id: 'test-user-id',
            role: 'A' as const,
            joined_at: '2024-01-01T00:00:00Z',
            is_revealed: false,
            avatar_name: 'Mystery Host',
            is_me: true
          }
        ],
        rounds: [],
        designs: [],
        my_designs: []
      };

      vi.mocked(BlindDateService.createPrivateGame).mockResolvedValueOnce(mockCreateResponse);
      vi.mocked(BlindDateService.getGameState).mockResolvedValueOnce(mockGameState);

      render(<BlindDateTab />);
      
      const privateGameButton = screen.getByText('🔗 Create Private Room');
      fireEvent.click(privateGameButton);

      await waitFor(() => {
        expect(BlindDateService.createPrivateGame).toHaveBeenCalled();
        expect(BlindDateService.getGameState).toHaveBeenCalledWith('private-session');
      });
    });

    it('should handle join with invite code', async () => {
      render(<BlindDateTab />);
      
      // Show invite code input
      const inviteCodeButton = screen.getByText('Have an invite code?');
      fireEvent.click(inviteCodeButton);

      // Enter invite code
      const inviteInput = screen.getByPlaceholderText('Enter invite code (e.g. ABC123)');
      fireEvent.change(inviteInput, { target: { value: 'xyz789' } });

      // Should convert to uppercase
      expect(inviteInput.value).toBe('XYZ789');

      // Mock successful join
      const mockJoinResponse = {
        session_id: 'invite-session',
        role: 'B' as const,
        avatar_name: 'Golden Star',
        status: 'active' as const,
        participant_count: 2
      };

      vi.mocked(BlindDateService.joinGame).mockResolvedValueOnce(mockJoinResponse);
      vi.mocked(BlindDateService.getGameState).mockResolvedValueOnce({
        session: { id: 'invite-session', status: 'active' as const, is_private: true, created_at: '2024-01-01T00:00:00Z' },
        my_role: 'B' as const,
        my_avatar_name: 'Golden Star',
        participants: [],
        rounds: [],
        designs: [],
        my_designs: []
      });

      const joinButton = screen.getByText('Join');
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(BlindDateService.joinGame).toHaveBeenCalledWith('XYZ789');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when join fails', async () => {
      vi.mocked(BlindDateService.joinGame).mockRejectedValueOnce(new Error('Session not found'));

      render(<BlindDateTab />);
      
      const quickMatchButton = screen.getByText('🎯 Find Random Match');
      fireEvent.click(quickMatchButton);

      await waitFor(() => {
        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Session not found')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      vi.mocked(BlindDateService.joinGame).mockRejectedValueOnce(new Error('Network error'));

      render(<BlindDateTab />);
      
      const quickMatchButton = screen.getByText('🎯 Find Random Match');
      fireEvent.click(quickMatchButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      // Should return to matchmaking screen
      expect(screen.getByText('Quick Match')).toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    it('should show login prompt when user is not authenticated', () => {
      // Mock no user
      vi.mocked(vi.mocked(vi.doMock)('../../contexts/AuthContext', () => ({
        useAuthContext: () => ({ user: null })
      })));

      render(<BlindDateTab />);
      
      expect(screen.getByText('Sign in to Play!')).toBeInTheDocument();
      expect(screen.getByText('You need to be logged in to join the Blind Date Style-Off game.')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should set up subscription when session is joined', async () => {
      const mockSubscribe = vi.fn(() => vi.fn()); // returns unsubscribe function
      vi.mocked(BlindDateService.subscribeToGame).mockImplementation(mockSubscribe);

      const mockJoinResponse = {
        session_id: 'test-session',
        role: 'A' as const,
        avatar_name: 'Purple Butterfly',
        status: 'waiting' as const,
        participant_count: 1
      };

      vi.mocked(BlindDateService.joinGame).mockResolvedValueOnce(mockJoinResponse);
      vi.mocked(BlindDateService.getGameState).mockResolvedValueOnce({
        session: { id: 'test-session', status: 'waiting' as const, is_private: false, created_at: '2024-01-01T00:00:00Z' },
        my_role: 'A' as const,
        my_avatar_name: 'Purple Butterfly',
        participants: [],
        rounds: [],
        designs: [],
        my_designs: []
      });

      render(<BlindDateTab />);
      
      const quickMatchButton = screen.getByText('🎯 Find Random Match');
      fireEvent.click(quickMatchButton);

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledWith('test-session', expect.any(Function));
      });
    });
  });
});