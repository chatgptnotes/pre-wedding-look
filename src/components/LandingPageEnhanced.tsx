import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import WaitlistModal from './WaitlistModal';

interface LandingPageEnhancedProps {
  onGetStarted: () => void;
  onExploreMode?: (modeId: string) => void;
}

const LandingPageEnhanced: React.FC<LandingPageEnhancedProps> = ({ onGetStarted, onExploreMode }) => {
  const { user, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  
  // Bypass authentication in development mode
  const BYPASS_AUTH = false; // Set to false to re-enable authentication

  const handleGetStarted = () => {
    if (BYPASS_AUTH || user) {
      onGetStarted();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleExploreMode = (modeId: string) => {
    if (BYPASS_AUTH || user) {
      // Navigate to specific mode
      onGetStarted();
      onExploreMode?.(modeId);
    } else {
      setShowAuthModal(true);
    }
  };

  const handlePlayBlindDate = () => {
    setShowWaitlistModal(true);
  };

  const primaryModes = [
    {
      id: 'classic',
      title: 'Classic Pre-Wedding',
      icon: '💑',
      description: 'Traditional step-by-step pre-wedding photo creation with romantic styling',
      color: 'from-rose-500 to-pink-500',
      isPopular: true
    },
    {
      id: 'blind-date',
      title: 'Blind Date Style-Off',
      icon: '🎭',
      description: 'Style each other secretly in 3 rounds → Big reveal & reactions!',
      color: 'from-purple-500 to-pink-500',
      isNew: true,
      isHot: true
    }
  ];

  const features = [
    {
      id: 'storyboard',
      title: 'Cinematic Storyboard',
      icon: '🎬',
      description: 'Create movie-like journeys! Seamlessly transition through iconic locations like Taj Mahal → Paris → Goa Beach.',
      steps: ['Select multiple locations', 'Create scene transitions', 'Generate cinematic sequences'],
      color: 'from-purple-500 to-blue-500',
      isNew: true
    },
    {
      id: 'fusion',
      title: 'Fusion Reality Magic',
      icon: '✨',
      description: 'Revolutionary live editing! Use brush tools to instantly transform casual clothes into wedding attire with perfect lighting.',
      steps: ['Upload any photo', 'Brush select areas', 'Transform clothes instantly'],
      color: 'from-cyan-500 to-teal-500',
      isNew: true
    },
    {
      id: 'future-vision',
      title: 'Future Vision Journey',
      icon: '👴👵',
      description: 'See your love story unfold! Generate silver anniversary photos, family portraits with kids, and milestone celebrations.',
      steps: ['Upload couple photo', 'Choose future timeline', 'Generate aged portraits'],
      color: 'from-amber-500 to-orange-500',
      isNew: true
    },
    {
      id: 'banana-challenge',
      title: 'Banana Challenge Mode',
      icon: '🍌',
      description: 'Go wild and creative! Fantasy themes, cyberpunk weddings, underwater ceremonies - unlimited creative freedom!',
      steps: ['Pick crazy themes', 'Experiment freely', 'Have fun creating'],
      color: 'from-yellow-500 to-orange-500',
      isNew: true
    },
    {
      id: 'voice-slideshow',
      title: 'AI Voice Storytelling',
      icon: '🎤',
      description: 'Tell your love story! Record voices, choose romantic scripts, and generate AI-narrated video slideshows.',
      steps: ['Record your voices', 'Choose romantic scripts', 'Generate video slideshows'],
      color: 'from-indigo-500 to-purple-500',
      isNew: true
    },
    {
      id: 'magic-button',
      title: 'One-Click Magic',
      icon: '🪄',
      description: 'Ultimate convenience! Upload photos → click magic button → AI handles styling, backgrounds, effects & voice automatically.',
      steps: ['Upload photos', 'Click magic button', 'Get complete package'],
      color: 'from-emerald-500 to-cyan-500',
      isNew: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header with Sign In */}
      <div className="absolute top-0 right-0 z-10 p-4">
        {user ? (
          <button
            onClick={signOut}
            className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 backdrop-blur-sm"
          >
            Sign Out
          </button>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 backdrop-blur-sm"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Hero Banner for Blind Date Style-Off */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm font-medium mb-4"
              >
                🔥 NEW FEATURE 🔥
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl lg:text-6xl font-bold mb-4"
              >
                Blind Date Style-Off
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl lg:text-2xl mb-6 text-purple-100"
              >
                Style each other secretly in 3 rounds → Big Reveal! 🎉
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <button
                  onClick={handlePlayBlindDate}
                  className="bg-white text-purple-600 font-bold py-4 px-8 rounded-2xl hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  📝 Join Waitlist
                </button>
                <div className="text-sm text-purple-200 self-center">
                  Invite your partner or Quick-Match with others 🔗
                </div>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex-shrink-0"
            >
              <div className="relative">
                <div className="text-8xl lg:text-9xl animate-bounce">🎭</div>
                <div className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</div>
                <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse">🎉</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent mb-6">
            Pre-Wedding Look AI
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Craft your perfect pre-wedding story with AI magic! Choose from revolutionary modes, from classic romance to multiplayer style battles.
          </p>
        </motion.div>

        {/* Choose Your Experience Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Choose Your Experience
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {primaryModes.map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -5 }}
                className="relative"
              >
                <div className={`bg-gradient-to-r ${mode.color} rounded-3xl p-8 text-white shadow-2xl cursor-pointer transform transition-all duration-300 hover:shadow-3xl`}
                     onClick={() => mode.id === 'blind-date' ? setShowWaitlistModal(true) : handleExploreMode(mode.id)}>
                  
                  {/* Badge */}
                  {mode.isNew && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full animate-pulse">
                      🔥 NEW!
                    </div>
                  )}
                  {mode.isPopular && !mode.isNew && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-400 to-cyan-500 text-white text-sm font-bold px-4 py-2 rounded-full">
                      ⭐ Popular
                    </div>
                  )}
                  
                  <div className="text-6xl mb-4">{mode.icon}</div>
                  <h3 className="text-2xl font-bold mb-4">{mode.title}</h3>
                  <p className="text-lg opacity-90 mb-6">{mode.description}</p>
                  
                  <div className="bg-white/20 rounded-2xl px-6 py-3 inline-block">
                    <span className="font-semibold">
                      {mode.id === 'blind-date' ? '📝 Join Waitlist' : '✨ Get Started'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* New Feature Spotlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 rounded-3xl p-8 mb-20 border border-purple-200"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500 text-white rounded-full px-4 py-2 text-sm font-bold mb-4">
              ✨ New Feature Spotlight ✨
            </div>
            
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="text-6xl lg:text-8xl">🎭</div>
              
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">
                  Multiplayer Style Battle Experience
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  The first-ever multiplayer styling game! Style each other secretly in 3 timed rounds, 
                  then see the hilarious results. Perfect for couples, friends, or random matches worldwide.
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-6">
                  <div className="bg-white rounded-xl px-4 py-2 text-sm font-medium text-purple-600">
                    ⏱️ 3 Timed Rounds
                  </div>
                  <div className="bg-white rounded-xl px-4 py-2 text-sm font-medium text-purple-600">
                    🤝 Multiplayer
                  </div>
                  <div className="bg-white rounded-xl px-4 py-2 text-sm font-medium text-purple-600">
                    🎉 Big Reveal
                  </div>
                  <div className="bg-white rounded-xl px-4 py-2 text-sm font-medium text-purple-600">
                    😂 Reactions
                  </div>
                </div>
              </div>
              
              <button
                onClick={handlePlayBlindDate}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                📝 Join Waitlist
              </button>
            </div>
          </div>
        </motion.div>

        {/* All Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            More Amazing Features
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -5 }}
                className="relative group cursor-pointer"
                onClick={() => handleExploreMode(feature.id)}
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 h-full group-hover:shadow-2xl transition-all duration-300">
                  {feature.isNew && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-400 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                      ✨ NEW
                    </div>
                  )}
                  
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{feature.description}</p>
                  
                  {feature.steps && (
                    <div className="space-y-2">
                      {feature.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                          {step}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Ready to Create Magic?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands creating stunning pre-wedding memories with AI
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white font-bold py-4 px-12 rounded-2xl text-lg hover:from-purple-700 hover:via-pink-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🎨 Start Creating Now
          </button>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => {
              setShowAuthModal(false);
              // Navigate directly to classic mode (bride step)
              onGetStarted();
              onExploreMode?.('classic');
            }}
          />
        )}
      </AnimatePresence>

      {/* Waitlist Modal */}
      <WaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        source="blind_date_game"
      />
    </div>
  );
};

export default LandingPageEnhanced;