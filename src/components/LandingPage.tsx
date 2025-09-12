import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface LandingPageProps {
  onGetStarted: () => void;
  onExploreMode?: (modeId: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onExploreMode }) => {
  const { user, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Bypass authentication in development mode
  const BYPASS_AUTH = true; // Set to false to re-enable authentication

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

  const features = [
    {
      id: 'classic',
      title: 'Classic Pre-Wedding Mode',
      icon: '💑',
      description: 'Perfect for beginners! Upload bride & groom photos, style with traditional attire, and generate romantic wedding scenes.',
      steps: ['Upload photos', 'Choose traditional styling', 'Generate romantic scenes'],
      color: 'from-rose-500 to-pink-500',
      isPopular: true
    },
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
      description: 'Go wild and creative! Experiment with fantasy themes like cyberpunk weddings, underwater ceremonies, and Bollywood posters.',
      steps: ['Pick crazy themes', 'Customize wildly', 'Have unlimited fun!'],
      color: 'from-yellow-500 to-lime-500',
      isFun: true
    },
    {
      id: 'voice-slideshow',
      title: 'AI Voice Storytelling',
      icon: '🎤',
      description: 'Tell your love story! Record your voices, choose romantic scripts, and create AI-narrated video slideshows.',
      steps: ['Record your voices', 'Choose love scripts', 'Generate narrated videos'],
      color: 'from-indigo-500 to-purple-500',
      isNew: true
    },
    {
      id: 'magic-button',
      title: 'One-Click Magic',
      icon: '🪄',
      description: 'Ultimate convenience! Upload photos and let AI handle everything: styling, backgrounds, effects, and voice automatically.',
      steps: ['Upload photos', 'Click magic button', 'Get complete package'],
      color: 'from-pink-500 to-rose-500',
      isNew: true
    },
    {
      id: 'regional-styles',
      title: 'Regional Cultural Styles',
      icon: '🏛️',
      description: 'Authentic cultural weddings! Choose from Marathi, Tamil, Punjabi, Bengali traditions with perfect attire and rituals.',
      steps: ['Select your culture', 'Authentic styling', 'Traditional ceremonies'],
      color: 'from-emerald-500 to-green-500',
      isNew: true
    },
    {
      id: 'beyond-pre-wedding',
      title: 'Complete Relationship Journey',
      icon: '🎯',
      description: 'Expand beyond pre-wedding! Create anniversary shoots, maternity photos, destination weddings, and family milestones.',
      steps: ['Choose occasion type', 'Select timeline', 'Create life moments'],
      color: 'from-violet-500 to-indigo-500',
      isNew: true
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden">
        {/* Modern Floating Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-56 h-56 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Ultra-Modern Glassmorphism Header */}
        <div className="relative backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90"></div>
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center group">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mr-4 backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-all duration-300">
                  <span className="text-3xl">✨</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-pink-100 bg-clip-text text-transparent">
                    PreWedding AI Studio
                  </h1>
                  <p className="text-white/80 text-sm font-medium">9 AI-Powered Creative Modes • Professional Results</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {loading ? (
                  <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin backdrop-blur-sm bg-white/10"></div>
                ) : user ? (
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                      <span className="text-white text-sm font-medium">
                        👋 {user.user_metadata?.full_name || 'Welcome'}
                      </span>
                    </div>
                    <button
                      onClick={signOut}
                      className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-2xl font-semibold transition-all duration-300 backdrop-blur-sm border border-white/30 hover:scale-105"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="text-white/90 hover:text-white font-semibold transition-all duration-300 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/20 hover:bg-white/20"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="bg-gradient-to-r from-white to-blue-50 text-indigo-600 hover:text-indigo-700 px-6 py-2 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Start Creating →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ultra-Modern Hero Section */}
        <div className="relative py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                {/* Modern Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="inline-flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-6 py-2 rounded-full text-sm font-semibold mb-8 border border-indigo-200/50 backdrop-blur-sm"
                >
                  <span className="animate-pulse mr-2">🚀</span>
                  Next-Generation AI Photo Studio
                </motion.div>

                {/* Hero Headline */}
                <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black mb-8 leading-tight">
                  <span className="block bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
                    Create. Transform.
                  </span>
                  <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Celebrate.
                  </span>
                </h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-xl lg:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light"
                >
                  From AI voice cloning to cultural authenticity, regional styles to future vision - 
                  <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> 
                    your love story deserves extraordinary
                  </span>
                </motion.p>
                
                {/* Modern Stats Grid */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto"
                >
                  {[
                    { number: "9", label: "AI Creative Modes", icon: "🎨", color: "from-indigo-500 to-purple-600" },
                    { number: "2min", label: "Generation Time", icon: "⚡", color: "from-purple-500 to-pink-600" },
                    { number: "∞", label: "Style Variations", icon: "🎭", color: "from-pink-500 to-rose-600" },
                    { number: "Free", label: "To Get Started", icon: "✨", color: "from-rose-500 to-orange-600" }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                      className="group relative"
                    >
                      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/50 hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative">
                          <div className="text-3xl mb-2">{stat.icon}</div>
                          <div className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                            {stat.number}
                          </div>
                          <div className="text-slate-600 text-sm font-medium">{stat.label}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Modern CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                >
                  <button
                    onClick={handleGetStarted}
                    className="group relative inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl hover:shadow-2xl hover:shadow-purple-500/25 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center">
                      <span className="mr-2">
                        {user ? '🎨 Enter Creative Studio' : '🚀 Start Your Journey'}
                      </span>
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </button>
                  
                  <p className="text-slate-500 text-sm mt-4 font-light">
                    🔒 No credit card required • ✨ Instant access • 💎 Professional results
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Modern Features Showcase */}
        <div className="py-24 bg-gradient-to-b from-white to-slate-50/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <span className="mr-2">✨</span>
                9 Creative Modes Available
              </div>
              <h2 className="text-4xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight">
                Choose Your
                <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Creative Journey
                </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light">
                From AI voice cloning to cultural authenticity - each mode is crafted to bring your unique vision to life with cutting-edge technology
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  whileHover={{ y: -10 }}
                  className="group relative cursor-pointer"
                  onClick={() => handleExploreMode(feature.id)}
                >
                  <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 group-hover:border-indigo-200/50">
                    {/* Modern Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Badges */}
                    {feature.isPopular && (
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-2xl shadow-lg">
                        ⭐ POPULAR
                      </div>
                    )}
                    {feature.isNew && (
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-400 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-2xl shadow-lg">
                        ✨ NEW
                      </div>
                    )}
                    {feature.isFun && (
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-2xl shadow-lg">
                        🎉 FUN!
                      </div>
                    )}

                    {/* Icon */}
                    <div className="relative mb-6">
                      <div className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-3xl flex items-center justify-center text-3xl mb-4 shadow-2xl group-hover:scale-110 transition-all duration-500`}>
                        {feature.icon}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-900 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 mb-6 leading-relaxed font-light">
                        {feature.description}
                      </p>
                      
                      {/* Steps */}
                      <div className="space-y-3">
                        {feature.steps.map((step, stepIndex) => (
                          <motion.div 
                            key={stepIndex} 
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (index * 0.1) + (stepIndex * 0.1) }}
                            className="flex items-center text-sm text-slate-500"
                          >
                            <div className={`w-2 h-2 bg-gradient-to-r ${feature.color} rounded-full mr-3 shadow-sm`}></div>
                            <span className="group-hover:text-slate-700 transition-colors duration-300">
                              {step}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Hover Effect Button */}
                      <div className="mt-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <div className={`inline-flex items-center text-sm font-semibold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                          Explore this mode
                          <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-20 bg-gradient-to-r from-gray-50 to-pink-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">How It Works</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Getting started is incredibly simple - choose any mode that matches your creative vision
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-rose-600">1</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Mode</h3>
                <p className="text-gray-600 leading-relaxed">
                  Pick from 9 creative modes: Classic wedding, Storyboard, Fusion Reality, Future Vision, 
                  Voice Stories, and more wild options!
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload & Customize</h3>
                <p className="text-gray-600 leading-relaxed">
                  Upload your photos and customize with thousands of options: locations, outfits, 
                  poses, themes, and special effects.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Generate & Share</h3>
                <p className="text-gray-600 leading-relaxed">
                  AI creates your masterpiece in minutes. Download unlimited variations, 
                  create slideshows, and share with family & friends.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Gallery */}
        <div className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Sample Creations</h2>
              <p className="text-xl text-gray-600">
                See what couples are creating with our AI-powered modes
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { title: 'Classic Romance', mode: 'Classic Mode', color: 'from-rose-200 to-pink-200' },
                { title: 'Taj to Paris Journey', mode: 'Storyboard', color: 'from-purple-200 to-blue-200' },
                { title: 'Instant Lehenga Transform', mode: 'Fusion Reality', color: 'from-cyan-200 to-teal-200' },
                { title: 'Silver Anniversary Vision', mode: 'Future Vision', color: 'from-amber-200 to-orange-200' },
                { title: 'Cyberpunk Wedding', mode: 'Banana Mode', color: 'from-yellow-200 to-lime-200' },
                { title: 'Voice Love Story', mode: 'Voice Slideshow', color: 'from-indigo-200 to-purple-200' }
              ].map((sample, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="group cursor-pointer"
                >
                  <div className={`h-48 bg-gradient-to-br ${sample.color} rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h4 className="font-bold text-gray-800 text-lg mb-1">{sample.title}</h4>
                      <p className="text-gray-600 text-sm">{sample.mode}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                Start Your Creative Journey
                <span className="block text-yellow-300">With 9 AI Modes! ✨</span>
              </h2>
              
              <p className="text-xl md:text-2xl text-pink-100 mb-12 max-w-3xl mx-auto leading-relaxed">
                From traditional wedding photos to wild creative experiments - explore unlimited possibilities 
                with our comprehensive AI-powered creative suite.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-2xl font-bold py-6 px-16 rounded-full shadow-2xl transition-all duration-300 border-4 border-white"
              >
                {user ? '🚀 Explore All 9 Modes Now' : '🔑 Sign In to Start Creating'}
              </motion.button>
              
              <p className="text-pink-200 text-lg mt-6">
                ✨ Free to start • 🎨 9 creative modes • ⚡ Instant results
              </p>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-2xl">💖</span>
                </div>
                <h3 className="text-2xl font-bold">Pre-Wedding Look AI</h3>
              </div>
              
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                Powered by{' '}
                <a 
                  href="https://www.drmhope.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-rose-400 hover:text-rose-300 font-medium transition-colors duration-200 underline"
                >
                  DrMHope Softwares
                </a>
                {' '}• Designed with ❤️ for couples worldwide • 
                Creating magical moments through cutting-edge AI technology
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-sm text-gray-400">
                <div>
                  <h4 className="font-semibold text-white mb-2">Creative Modes</h4>
                  <p>9 AI-powered modes for every creative vision</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Instant Results</h4>
                  <p>Generate professional photos in 5 minutes</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Unlimited Use</h4>
                  <p>Create infinite variations and possibilities</p>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Navigate directly to classic mode (bride step)
          onGetStarted();
        }}
      />
    </>
  );
};

export default LandingPage;