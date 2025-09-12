import React from 'react';
import { motion } from 'framer-motion';

export type TabId = 
  | 'classic' 
  | 'gallery'
  | 'storyboard' 
  | 'fusion' 
  | 'future-vision' 
  | 'banana-challenge' 
  | 'voice-slideshow' 
  | 'magic-button' 
  | 'regional-styles' 
  | 'beyond-pre-wedding'
  | 'blind-date';

export interface Tab {
  id: TabId;
  label: string;
  icon: string;
  description: string;
  badge?: string;
  isNew?: boolean;
}

export const TABS: Tab[] = [
  {
    id: 'classic',
    label: 'Classic Mode',
    icon: '💑',
    description: '📸 Perfect for beginners! Upload bride & groom photos → Choose traditional attire → Generate stunning romantic wedding scenes with AI magic',
    badge: 'Recommended'
  },
  {
    id: 'gallery',
    label: 'Gallery',
    icon: '🖼️',
    description: '🌍 Explore global wedding styles! Browse pre-generated images from 5 countries → See cultural authenticity → Get inspired before creating your own',
    isNew: true,
    badge: 'HOT!'
  },
  {
    id: 'storyboard',
    label: 'Storyboard',
    icon: '🎬',
    description: '🎥 Create cinematic journeys! Upload photos → Select iconic locations (Taj Mahal→Paris→Goa) → Generate seamless scene transitions',
    isNew: true
  },
  {
    id: 'fusion',
    label: 'Fusion Reality',
    icon: '✨',
    description: '🖌️ Live clothing swap! Upload any photo → Use brush tool to select areas → Instantly transform jeans into lehenga with perfect lighting',
    isNew: true
  },
  {
    id: 'future-vision',
    label: 'Future Vision',
    icon: '👴👵',
    description: '⏳ See your future together! Upload couple photo → Choose years ahead → Generate silver anniversary or family portraits with kids',
    isNew: true
  },
  {
    id: 'banana-challenge',
    label: 'Banana Mode',
    icon: '🍌',
    description: '🎭 Go wild and creative! Pick crazy themes → Cyberpunk weddings, underwater ceremonies, Bollywood posters → Have fun!',
    isNew: true,
    badge: 'Fun!'
  },
  {
    id: 'voice-slideshow',
    label: 'Voice Story',
    icon: '🎤',
    description: '🎙️ Tell your love story! Record your voices → Choose romantic scripts → Generate AI-narrated video slideshows in your own voice',
    isNew: true
  },
  {
    id: 'magic-button',
    label: 'One-Click Magic',
    icon: '🪄',
    description: '✨ Ultimate convenience! Upload photos → Click magic button → AI handles everything: styling, backgrounds, effects & voice automatically',
    isNew: true
  },
  {
    id: 'regional-styles',
    label: 'Regional Styles',
    icon: '🏛️',
    description: '🏛️ Authentic cultural weddings! Choose your region → Marathi, Tamil, Punjabi, Bengali styles → Perfect traditional attire & rituals',
    isNew: true
  },
  {
    id: 'beyond-pre-wedding',
    label: 'Beyond Pre-Wedding',
    icon: '🎯',
    description: '🎯 Expand your journey! Create anniversary shoots, maternity photos, destination weddings → Complete relationship timeline',
    isNew: true
  },
  {
    id: 'blind-date',
    label: 'Blind Date Style-Off',
    icon: '🎭',
    description: '🎭 Ultimate multiplayer fun! Style each other secretly in 3 timed rounds → Reveal results → React and share your hilarious outcomes!',
    isNew: true,
    badge: 'GAME!'
  }
];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  className?: string;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-3 ${className}`}>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTabChange(tab.id);
              }}
              initial={{ 
                opacity: 0, 
                y: 40,
                scale: 0.95
              }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1
              }}
              transition={{ 
                delay: index * 0.08,
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className={`group relative p-4 rounded-2xl text-center transition-all duration-500 cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/25 transform scale-105'
                  : 'bg-slate-50/70 hover:bg-white/80 text-slate-700 hover:text-indigo-600 hover:shadow-lg'
              }`}
              whileHover={{ 
                scale: isActive ? 1.08 : 1.05,
                y: -8,
                rotateY: 5,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }}
              whileTap={{ 
                scale: 0.95,
                y: 0
              }}
              style={{
                transformStyle: "preserve-3d"
              }}
            >
              {/* Glow Effect for Active Tab */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-75 -z-10"></div>
              )}

              {/* New Badge */}
              {tab.isNew && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (index * 0.05) + 0.3 }}
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-400 to-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-xl shadow-lg z-10"
                >
                  ✨ NEW
                </motion.div>
              )}
              
              {/* Custom Badge */}
              {tab.badge && !tab.isNew && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (index * 0.05) + 0.3 }}
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-xl shadow-lg z-10"
                >
                  🎉 {tab.badge}
                </motion.div>
              )}
              
              {/* Icon */}
              <motion.div 
                className={`text-2xl mb-2 transition-all duration-300 ${
                  isActive ? 'transform scale-110' : 'group-hover:scale-110'
                }`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: (index * 0.1) + 0.2,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 200
                }}
                whileHover={{
                  scale: 1.2,
                  rotate: [0, -10, 10, 0],
                  transition: { duration: 0.3 }
                }}
              >
                {tab.icon}
              </motion.div>
              
              {/* Label */}
              <motion.div 
                className={`text-xs font-semibold leading-tight transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-slate-600 group-hover:text-indigo-600'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: (index * 0.1) + 0.3,
                  duration: 0.4
                }}
              >
                {tab.label}
              </motion.div>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/80 rounded-full"
                  layoutId="activeIndicator"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />
              )}

              {/* Hover glow with ripple effect */}
              {!isActive && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 via-purple-400/0 to-pink-400/0 group-hover:from-indigo-400/10 group-hover:via-purple-400/10 group-hover:to-pink-400/10 rounded-2xl transition-all duration-300"
                  whileHover={{
                    background: [
                      "radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 50%)",
                      "radial-gradient(circle at center, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 30%, transparent 70%)",
                      "radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 50%)"
                    ],
                    transition: { duration: 0.6, repeat: Infinity }
                  }}
                />
              )}

              {/* Hover Overlay */}
              {!isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-3 opacity-0 group-hover:opacity-100"
                >
                  <div className="text-center space-y-3">
                    <div className="text-lg mb-2">{tab.icon}</div>
                    <p className="text-white text-xs leading-tight font-medium line-clamp-3">
                      {tab.description.replace(/[📸🌍🎥🖌️⏳🎭🎙️✨🏛️🎯]/g, '').trim()}
                    </p>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg transition-all duration-200"
                    >
                      See More
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Tab Description */}
      <motion.div 
        className="mt-6 text-center bg-slate-50/50 rounded-2xl p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm text-slate-600 leading-relaxed font-light">
          {TABS.find(tab => tab.id === activeTab)?.description}
        </p>
      </motion.div>
    </div>
  );
};

export default TabNavigation;