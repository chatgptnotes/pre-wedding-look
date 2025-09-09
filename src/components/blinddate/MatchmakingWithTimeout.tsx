import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface MatchmakingWithTimeoutProps {
  onGameStarted: (sessionData: any) => void;
  onError: (error: string) => void;
}

type MatchState = 'idle' | 'searching' | 'waiting' | 'timeout' | 'found' | 'bot_demo';

const MatchmakingWithTimeout: React.FC<MatchmakingWithTimeoutProps> = ({
  onGameStarted,
  onError
}) => {
  const { user, loading } = useAuth();
  const [matchState, setMatchState] = useState<MatchState>('idle');

  // Show authentication prompt if user is not signed in
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl text-center max-w-md">
          <div className="text-5xl mb-6">🔐</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Sign In Required
          </h3>
          <p className="text-gray-600 mb-6">
            You need to be signed in to play the Blind Date Style-Off multiplayer game.
          </p>
          <button
            onClick={() => onError('Please sign in to continue')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Go Back to Sign In
          </button>
        </div>
      </div>
    );
  }
  const [searchTime, setSearchTime] = useState(0);
  const [sessionData, setSessionData] = useState<any>(null);
  const [queueETA, setQueueETA] = useState<number>(30);
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteJoin, setShowInviteJoin] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

  // Timer for search duration with 45-second timeout
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (matchState === 'searching' || matchState === 'waiting') {
      interval = setInterval(() => {
        setSearchTime(prev => {
          const newTime = prev + 1;
          // Trigger timeout after 15 seconds for testing (change to 45 for production)
          if (newTime >= 15) {
            setMatchState('timeout');
            return newTime;
          }
          return newTime;
        });
      }, 1000);
    } else {
      setSearchTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [matchState]);

  // Subscribe to realtime events when waiting
  useEffect(() => {
    if (matchState === 'waiting' && sessionData?.sessionId) {
      const channel = supabase
        .channel(`blinddate:session:${sessionData.sessionId}`)
        .on('broadcast', { event: 'participant_joined' }, (payload) => {
          console.log('Participant joined:', payload);
          setMatchState('found');
          onGameStarted(sessionData);
        })
        .on('broadcast', { event: 'waiting_timeout' }, (payload) => {
          console.log('Waiting timeout:', payload);
          setMatchState('timeout');
        })
        .on('broadcast', { event: 'bot_attached' }, (payload) => {
          console.log('Bot attached:', payload);
          setMatchState('bot_demo');
          onGameStarted({ ...sessionData, botDemo: true });
        })
        .subscribe();

      setRealtimeChannel(channel);

      return () => {
        supabase.removeChannel(channel);
        setRealtimeChannel(null);
      };
    }
  }, [matchState, sessionData, onGameStarted]);

  const handleQuickMatch = useCallback(async () => {
    if (!user) {
      onError('Please sign in to play Blind Date Style-Off');
      return;
    }

    setMatchState('searching');
    console.log('Starting quick match for user:', user.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('blinddate-matchmaking-enhanced', {
        body: { 
          action: 'join',
          isPrivate: false 
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        console.error('Matchmaking error:', error);
        throw error;
      }

      console.log('Matchmaking response:', data);
      setSessionData(data);
      setQueueETA(data.queueETA || 30);

      if (data.status === 'active') {
        setMatchState('found');
        onGameStarted(data);
      } else {
        setMatchState('waiting');
      }
    } catch (error: any) {
      console.error('Quick match error:', error);
      onError(error.message || 'Failed to start matchmaking');
      setMatchState('idle');
    }
  }, [user, onGameStarted, onError]);

  const handlePrivateGame = useCallback(async () => {
    setMatchState('searching');
    
    try {
      const { data, error } = await supabase.functions.invoke('blinddate-matchmaking-enhanced', {
        body: { isPrivate: true }
      });

      if (error) throw error;

      setSessionData(data);
      setMatchState('waiting');
    } catch (error: any) {
      onError(error.message);
      setMatchState('idle');
    }
  }, [onError]);

  const handleJoinWithCode = useCallback(async (code: string) => {
    setMatchState('searching');
    
    try {
      const { data, error } = await supabase.functions.invoke('blinddate-matchmaking-enhanced', {
        body: { inviteCode: code }
      });

      if (error) throw error;

      setSessionData(data);
      
      if (data.status === 'active') {
        setMatchState('found');
        onGameStarted(data);
      } else {
        setMatchState('waiting');
      }
    } catch (error: any) {
      onError(error.message);
      setMatchState('idle');
    }
  }, [onGameStarted, onError]);

  const handleBotDemo = useCallback(() => {
    console.log('🤖 AI Style Buddy button clicked!');
    console.log('handleBotDemo function called');
    
    try {
      // Create a mock session for bot demo
      const mockBotSession = {
        sessionId: `bot-demo-${Date.now()}`,
        role: 'A',
        avatar_name: 'Style Explorer',
        status: 'active',
        participant_count: 2,
        bot_mode: true,
        opponent: {
          role: 'B',
          avatar_name: 'AI Style Buddy',
          is_bot: true
        }
      };
      
      console.log('Mock bot session created:', mockBotSession);
      
      // Immediately start the game - don't stay in matchmaking component
      onGameStarted(mockBotSession);
      console.log('onGameStarted called with mock session');
    } catch (error) {
      console.error('Error in handleBotDemo:', error);
      onError('Failed to start bot demo');
    }
  }, [onGameStarted, onError]);

  const handleTryAgain = useCallback(() => {
    setMatchState('idle');
    setSessionData(null);
    setSearchTime(0);
  }, []);

  const copyInviteLink = useCallback(async () => {
    if (!user) {
      onError('Please sign in to create an invite link');
      return;
    }

    try {
      console.log('Creating private game for invite link...');
      
      // If no session exists, create a private game first
      if (!sessionData?.inviteCode) {
        const { data, error } = await supabase.functions.invoke('blinddate-matchmaking-enhanced', {
          body: { 
            action: 'create_private',
            isPrivate: true 
          },
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });

        if (error) {
          console.error('Error creating private game:', error);
          throw new Error(error.message || 'Failed to create private game');
        }

        console.log('Private game created:', data);
        setSessionData(data);
        setMatchState('waiting');
        
        // Use the newly created invite code
        const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${data.inviteCode}`;
        await copyToClipboard(inviteLink);
        
      } else {
        // Use existing invite code
        const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${sessionData.inviteCode}`;
        await copyToClipboard(inviteLink);
      }
      
    } catch (error: any) {
      console.error('Error creating invite link:', error);
      onError(error.message || 'Failed to create invite link');
    }
  }, [user, sessionData, onError]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Invite link copied to clipboard:', text);
      // Could show a toast notification here
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('Invite link copied to clipboard (fallback):', text);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSearchMessage = () => {
    if (searchTime < 5) return "🔍 Searching for players...";
    if (searchTime < 15) return "🌍 Looking worldwide...";
    if (searchTime < 30) return "⏰ Still searching...";
    if (searchTime < 45) return `⏱️ ${formatTime(45 - searchTime)} left`;
    return "🎯 Preparing options...";
  };

  if (matchState === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1
              className="text-6xl mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              🎭
            </motion.h1>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Blind Date Style-Off
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Style each other secretly, then reveal the results!
            </p>
            <p className="text-gray-500">
              3 rounds • 8 minutes • Endless fun
            </p>
          </div>

          {/* Game modes */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Quick Match */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Quick Match</h3>
                <p className="text-gray-600 mb-4">
                  Get matched instantly or play with AI
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    ⏱️ Usually takes less than {queueETA}s. If no match, play with AI buddy!
                  </p>
                </div>
              </div>

              <button
                onClick={handleQuickMatch}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-4 px-6 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
              >
                🎯 Find Match or AI Demo
              </button>
            </motion.div>

            {/* Private Game */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">👫</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Play with Friend</h3>
                <p className="text-gray-600 mb-4">
                  Create a private room and invite someone
                </p>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-green-800">
                    ✅ Guaranteed match! Perfect for couples or friends.
                  </p>
                </div>
              </div>

              <button
                onClick={handlePrivateGame}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-4 px-6 rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg mb-4"
              >
                🔗 Create Private Room
              </button>

              <div className="text-center">
                <button
                  onClick={() => setShowInviteJoin(!showInviteJoin)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Have an invite code?
                </button>
              </div>
            </motion.div>
          </div>

          {/* Invite code input */}
          {showInviteJoin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Join Private Game
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={6}
                />
                <button
                  onClick={() => inviteCode.trim() && handleJoinWithCode(inviteCode.trim())}
                  disabled={!inviteCode.trim()}
                  className="bg-indigo-500 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  if (matchState === 'searching' || matchState === 'waiting') {
    const timeLeft = Math.max(0, 45 - searchTime);
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 shadow-xl text-white">
            <motion.div
              className="text-5xl mb-4"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              🔄
            </motion.div>
            
            <h3 className="text-2xl font-bold mb-4">
              {getSearchMessage()}
            </h3>
            
            <div className="text-lg font-mono mb-2">
              {formatTime(searchTime)}
            </div>
            
            {matchState === 'waiting' && (
              <div className="text-purple-200 text-sm mb-4">
                {timeLeft > 0 ? `${timeLeft}s remaining` : 'Preparing options...'}
              </div>
            )}
            
            {/* Progress bar */}
            <div className="bg-white/20 rounded-full h-3 overflow-hidden mb-6">
              <motion.div
                className="h-full bg-white/60"
                animate={{ width: `${(searchTime / 45) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <p className="text-purple-100 text-sm">
              {searchTime < 30 
                ? "Looking for other players worldwide..." 
                : "Don't worry - we'll find you a great match or AI buddy!"
              }
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (matchState === 'timeout') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl text-center">
            <div className="text-5xl mb-6">🤔</div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              No matches right now
            </h3>
            
            <p className="text-gray-600 mb-8">
              Couldn't find someone to play with, but that's okay! You have options:
            </p>
            
            <div className="space-y-4">
              <button
                onClick={(e) => {
                  console.log('Button clicked!', e);
                  e.preventDefault();
                  e.stopPropagation();
                  handleBotDemo();
                }}
                onMouseDown={() => console.log('Button mouse down')}
                onMouseUp={() => console.log('Button mouse up')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-4 px-6 rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg cursor-pointer"
                style={{ pointerEvents: 'auto', zIndex: 10 }}
              >
                🤖 Play with AI Style Buddy
                <div className="text-sm opacity-90 mt-1">Instant fun - Recommended!</div>
              </button>
              
              <button
                onClick={copyInviteLink}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-4 px-6 rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
              >
                📤 Invite a Friend
                <div className="text-sm opacity-90 mt-1">Copy link to share</div>
              </button>
              
              <button
                onClick={handleTryAgain}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default MatchmakingWithTimeout;