import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/useGameStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import RevealScreen from '../components/blinddate/RevealScreen';
import VideoGenerator from '../components/VideoGenerator';

const RevealPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { gameState, gamePhase, sendReaction, consentGiven } = useGameStore();
  const { addToast, openModal } = useUIStore();
  
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  
  const handleReaction = async (emoji: string) => {
    try {
      await sendReaction({
        emoji,
        target_design_id: gameState?.partner_design?.id || '',
      });
      addToast({
        type: 'success',
        message: 'Reaction sent!',
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        message: 'Failed to send reaction',
      });
    }
  };
  
  const handleRemix = () => {
    addToast({
      type: 'info',
      message: 'Remix feature coming soon!',
    });
  };
  
  const handleGenerateReel = () => {
    setShowVideoGenerator(true);
  };

  const getGameResults = () => {
    if (!gameState) return undefined;
    
    return {
      sessionId: sessionId || '',
      participants: [
        {
          avatar: gameState.current_player?.avatar_name || 'Player 1',
          designs: gameState.user_design?.generated_image_url ? [gameState.user_design.generated_image_url] : [],
          reveals: []
        },
        {
          avatar: gameState.partner_design?.avatar_name || 'Player 2',
          designs: gameState.partner_design?.generated_image_url ? [gameState.partner_design.generated_image_url] : [],
          reveals: []
        }
      ],
      rounds: [
        {
          theme: gameState.current_round?.theme || 'Style Challenge',
          designs: [
            {
              image: gameState.user_design?.generated_image_url || '',
              participant: gameState.current_player?.avatar_name || 'You'
            },
            {
              image: gameState.partner_design?.generated_image_url || '',
              participant: gameState.partner_design?.avatar_name || 'Partner'
            }
          ].filter(design => design.image)
        }
      ]
    };
  };
  
  const handleShareReel = (platform: string) => {
    const shareUrl = `${window.location.origin}/reveal/${sessionId}`;
    
    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        addToast({
          type: 'success',
          message: 'Link copied to clipboard!',
        });
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=Check out our Blind Date Style-Off results!`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`Check out our Blind Date Style-Off results! ${shareUrl}`)}`);
        break;
    }
  };
  
  const handlePlayAgain = () => {
    navigate('/match');
  };
  
  const handleReport = () => {
    openModal('report', { sessionId });
  };
  
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reveal...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="container mx-auto px-4 py-8">
        {/* Use existing RevealScreen component */}
        <RevealScreen />
        
        {/* Additional Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            What's Next?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Generate Reel */}
            <button
              onClick={handleGenerateReel}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              🎬 Generate Reel
            </button>
            
            {/* Play Again */}
            <button
              onClick={handlePlayAgain}
              className="bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300"
            >
              🎮 Play Again
            </button>
            
            {/* View Gallery */}
            <button
              onClick={() => navigate('/features')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300"
            >
              🖼️ View Gallery
            </button>
          </div>
          
          {/* Share Options */}
          {showShareOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Share Your Style-Off
              </h3>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleShareReel('copy')}
                  className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Copy Link"
                >
                  📋
                </button>
                <button
                  onClick={() => handleShareReel('twitter')}
                  className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Share on Twitter"
                >
                  🐦
                </button>
                <button
                  onClick={() => handleShareReel('facebook')}
                  className="p-3 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Share on Facebook"
                >
                  📘
                </button>
                <button
                  onClick={() => handleShareReel('whatsapp')}
                  className="p-3 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                  title="Share on WhatsApp"
                >
                  💬
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Report/Block Options */}
          <div className="mt-6 text-center">
            <button
              onClick={handleReport}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Report inappropriate content
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Video Generator Modal */}
      {showVideoGenerator && (
        <VideoGenerator
          gameResults={getGameResults()}
          onClose={() => setShowVideoGenerator(false)}
        />
      )}
    </div>
  );
};

export default RevealPage;