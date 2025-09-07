import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, BookmarkIcon, ClockIcon } from '@heroicons/react/24/solid';

export interface CustomPrompt {
  id: string;
  title: string;
  prompt: string;
  category: string;
  tags: string[];
  createdAt: string;
  isCustom: boolean;
}

export interface ThemeTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrompt: string;
  tags: string[];
  icon: string;
  previewImage?: string;
}

// Comprehensive theme templates for different wedding styles
export const THEME_TEMPLATES: ThemeTemplate[] = [
  // Vintage/Retro Themes
  {
    id: 'vintage-1920s',
    name: '1920s Art Deco Glamour',
    category: 'vintage',
    description: 'Great Gatsby inspired with gold details and art deco patterns',
    basePrompt: 'vintage 1920s art deco style with gold geometric patterns, feathers, pearls, and jazz age elegance',
    tags: ['vintage', 'art deco', 'glamour', '1920s'],
    icon: '🎭'
  },
  {
    id: 'vintage-1950s',
    name: '1950s Classic Romance',
    category: 'vintage',
    description: 'Pin-up style with polka dots and retro charm',
    basePrompt: 'vintage 1950s pin-up style with polka dots, classic cars, diner aesthetics, and retro romance',
    tags: ['vintage', 'pin-up', 'classic', '1950s'],
    icon: '🚗'
  },
  {
    id: 'vintage-1970s',
    name: '1970s Bohemian Dream',
    category: 'vintage',
    description: 'Flower power with earth tones and free spirit vibes',
    basePrompt: 'vintage 1970s bohemian hippie style with flower crowns, earth tones, macramé, and free spirit aesthetic',
    tags: ['vintage', 'bohemian', 'hippie', '1970s'],
    icon: '🌼'
  },
  {
    id: 'vintage-1980s',
    name: '1980s Neon Romance',
    category: 'vintage',
    description: 'Bold colors and geometric patterns with 80s flair',
    basePrompt: 'vintage 1980s style with neon colors, geometric patterns, big hair, and retro-futuristic elements',
    tags: ['vintage', 'neon', '1980s', 'retro'],
    icon: '💫'
  },

  // Fairytale Themes
  {
    id: 'fairytale-disney',
    name: 'Disney Princess Magic',
    category: 'fairytale',
    description: 'Magical castle settings with Disney princess aesthetics',
    basePrompt: 'Disney princess fairytale with enchanted castle, magical sparkles, royal ballgown, and storybook romance',
    tags: ['fairytale', 'disney', 'princess', 'castle'],
    icon: '👸'
  },
  {
    id: 'fairytale-medieval',
    name: 'Medieval Fantasy',
    category: 'fairytale',
    description: 'Knights and princesses in medieval castle settings',
    basePrompt: 'medieval fantasy with stone castles, knight in armor, princess gown, dragons, and gothic architecture',
    tags: ['fairytale', 'medieval', 'knight', 'castle'],
    icon: '🏰'
  },
  {
    id: 'fairytale-forest',
    name: 'Enchanted Forest',
    category: 'fairytale',
    description: 'Magical woodland with fairy lights and forest creatures',
    basePrompt: 'enchanted forest fairytale with glowing fairy lights, mystical creatures, moss-covered trees, and magical atmosphere',
    tags: ['fairytale', 'forest', 'magical', 'nature'],
    icon: '🧚'
  },

  // Hollywood Glamour
  {
    id: 'hollywood-old',
    name: 'Old Hollywood Glamour',
    category: 'hollywood',
    description: 'Black and white cinema with classic movie star elegance',
    basePrompt: 'old Hollywood glamour with black and white cinema aesthetics, red carpet elegance, and movie star sophistication',
    tags: ['hollywood', 'glamour', 'classic', 'cinema'],
    icon: '🎬'
  },
  {
    id: 'hollywood-red-carpet',
    name: 'Red Carpet Premiere',
    category: 'hollywood',
    description: 'Modern celebrity style with paparazzi and spotlights',
    basePrompt: 'red carpet premiere with paparazzi flashes, elegant evening wear, spotlights, and celebrity glamour',
    tags: ['hollywood', 'red carpet', 'celebrity', 'glamour'],
    icon: '📸'
  },
  {
    id: 'hollywood-movie-poster',
    name: 'Movie Poster Romance',
    category: 'hollywood',
    description: 'Dramatic movie poster style with cinematic lighting',
    basePrompt: 'movie poster style romance with dramatic cinematic lighting, epic poses, and blockbuster aesthetics',
    tags: ['hollywood', 'movie poster', 'cinematic', 'dramatic'],
    icon: '🎯'
  },

  // Artistic Styles
  {
    id: 'artistic-oil-painting',
    name: 'Oil Painting Masterpiece',
    category: 'artistic',
    description: 'Classical oil painting with Renaissance style',
    basePrompt: 'oil painting masterpiece with Renaissance style, classical art techniques, rich textures, and museum quality',
    tags: ['artistic', 'oil painting', 'renaissance', 'classical'],
    icon: '🎨'
  },
  {
    id: 'artistic-watercolor',
    name: 'Watercolor Dreams',
    category: 'artistic',
    description: 'Soft watercolor with flowing colors and artistic blur',
    basePrompt: 'watercolor painting with soft flowing colors, artistic blur effects, and dreamy romantic atmosphere',
    tags: ['artistic', 'watercolor', 'soft', 'dreamy'],
    icon: '🌈'
  },
  {
    id: 'artistic-pop-art',
    name: 'Pop Art Explosion',
    category: 'artistic',
    description: 'Bold pop art with bright colors and comic book style',
    basePrompt: 'pop art style with bold bright colors, comic book aesthetics, halftone patterns, and graphic design elements',
    tags: ['artistic', 'pop art', 'bold', 'graphic'],
    icon: '💥'
  },

  // Seasonal Themes
  {
    id: 'seasonal-spring',
    name: 'Spring Garden Romance',
    category: 'seasonal',
    description: 'Blooming flowers and fresh spring colors',
    basePrompt: 'spring garden romance with blooming flowers, fresh green foliage, pastel colors, and new life energy',
    tags: ['seasonal', 'spring', 'flowers', 'garden'],
    icon: '🌸'
  },
  {
    id: 'seasonal-winter',
    name: 'Winter Wonderland',
    category: 'seasonal',
    description: 'Snow-covered landscapes with cozy winter romance',
    basePrompt: 'winter wonderland with snow-covered trees, cozy blankets, warm fireplaces, and magical winter atmosphere',
    tags: ['seasonal', 'winter', 'snow', 'cozy'],
    icon: '❄️'
  },
  {
    id: 'seasonal-autumn',
    name: 'Autumn Harvest',
    category: 'seasonal',
    description: 'Golden leaves and warm autumn colors',
    basePrompt: 'autumn harvest with golden falling leaves, warm orange and red colors, cozy sweaters, and rustic charm',
    tags: ['seasonal', 'autumn', 'golden', 'harvest'],
    icon: '🍂'
  },

  // Adventure Themes
  {
    id: 'adventure-hiking',
    name: 'Mountain Adventure',
    category: 'adventure',
    description: 'Epic mountain peaks and hiking adventure',
    basePrompt: 'mountain adventure with epic peaks, hiking trails, outdoor adventure gear, and breathtaking vistas',
    tags: ['adventure', 'mountain', 'hiking', 'outdoor'],
    icon: '🏔️'
  },
  {
    id: 'adventure-beach',
    name: 'Tropical Beach Escape',
    category: 'adventure',
    description: 'Paradise beach with crystal clear waters',
    basePrompt: 'tropical beach paradise with crystal clear waters, palm trees, white sand, and sunset romance',
    tags: ['adventure', 'beach', 'tropical', 'paradise'],
    icon: '🏖️'
  },
  {
    id: 'adventure-cityscape',
    name: 'Urban Cityscape',
    category: 'adventure',
    description: 'Modern city skyline with urban romance',
    basePrompt: 'urban cityscape with modern skyscrapers, city lights, rooftop views, and metropolitan romance',
    tags: ['adventure', 'city', 'urban', 'modern'],
    icon: '🌆'
  },

  // Cultural Fusion
  {
    id: 'cultural-east-meets-west',
    name: 'East Meets West',
    category: 'cultural',
    description: 'Beautiful fusion of Eastern and Western traditions',
    basePrompt: 'cultural fusion of Eastern and Western wedding traditions, blending styles, colors, and ceremonial elements',
    tags: ['cultural', 'fusion', 'east', 'west'],
    icon: '🌏'
  },
  {
    id: 'cultural-multicultural',
    name: 'Multicultural Celebration',
    category: 'cultural',
    description: 'Celebration of diverse cultural elements',
    basePrompt: 'multicultural wedding celebration with diverse traditional elements, various cultural symbols, and unified harmony',
    tags: ['cultural', 'multicultural', 'diverse', 'unity'],
    icon: '🤝'
  }
];

interface CustomPromptBuilderProps {
  onPromptGenerated: (prompt: string) => void;
  currentMode: string;
  placeholder?: string;
  existingPrompt?: string;
}

const CustomPromptBuilder: React.FC<CustomPromptBuilderProps> = ({
  onPromptGenerated,
  currentMode,
  placeholder = "Describe your dream wedding scene...",
  existingPrompt = ""
}) => {
  const [customPrompt, setCustomPrompt] = useState(existingPrompt);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedPrompts, setSavedPrompts] = useState<CustomPrompt[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(THEME_TEMPLATES.map(t => t.category))];
    return cats;
  }, []);

  const filteredTemplates = useMemo(() => {
    return THEME_TEMPLATES.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = searchTerm === '' || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  const handleTemplateSelect = useCallback((template: ThemeTemplate) => {
    const enhancedPrompt = customPrompt 
      ? `${template.basePrompt}, ${customPrompt}` 
      : template.basePrompt;
    
    setCustomPrompt(enhancedPrompt);
    onPromptGenerated(enhancedPrompt);
    setShowTemplates(false);
  }, [customPrompt, onPromptGenerated]);

  const handleCustomPromptSubmit = useCallback(() => {
    if (customPrompt.trim()) {
      onPromptGenerated(customPrompt.trim());
      
      // Save to history
      const newPrompt: CustomPrompt = {
        id: Date.now().toString(),
        title: customPrompt.slice(0, 50) + (customPrompt.length > 50 ? '...' : ''),
        prompt: customPrompt.trim(),
        category: currentMode,
        tags: [],
        createdAt: new Date().toISOString(),
        isCustom: true
      };
      
      setSavedPrompts(prev => [newPrompt, ...prev.slice(0, 9)]); // Keep last 10
    }
  }, [customPrompt, onPromptGenerated, currentMode]);

  const handlePromptFromHistory = useCallback((prompt: CustomPrompt) => {
    setCustomPrompt(prompt.prompt);
    onPromptGenerated(prompt.prompt);
    setShowHistory(false);
  }, [onPromptGenerated]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'vintage': '📻',
      'fairytale': '🧚',
      'hollywood': '🎬',
      'artistic': '🎨',
      'seasonal': '🌸',
      'adventure': '🗺️',
      'cultural': '🌏',
      'all': '✨'
    };
    return icons[category] || '✨';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2 text-purple-600" />
          Custom Prompt Builder
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-sm font-medium transition-colors"
          >
            🎨 Templates
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-sm font-medium transition-colors flex items-center"
          >
            <ClockIcon className="w-4 h-4 mr-1" />
            History
          </button>
        </div>
      </div>

      {/* Custom Prompt Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Describe Your Vision
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={3}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-slate-500">
            {customPrompt.length}/500 characters
          </span>
          <button
            onClick={handleCustomPromptSubmit}
            disabled={!customPrompt.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate ✨
          </button>
        </div>
      </div>

      {/* Theme Templates */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 border-t border-slate-200 pt-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-800">Theme Templates</h4>
              <input
                type="text"
                placeholder="Search themes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 bg-slate-100 rounded-lg text-sm border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-3 bg-slate-50 hover:bg-purple-50 rounded-xl border border-slate-200 hover:border-purple-300 cursor-pointer transition-all duration-300"
                >
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">{template.icon}</span>
                    <div className="flex-1">
                      <h5 className="font-semibold text-slate-800 mb-1">{template.name}</h5>
                      <p className="text-xs text-slate-600 mb-2">{template.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt History */}
      <AnimatePresence>
        {showHistory && savedPrompts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200 pt-4"
          >
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              Recent Prompts
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {savedPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  onClick={() => handlePromptFromHistory(prompt)}
                  className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h6 className="font-medium text-slate-800 text-sm">{prompt.title}</h6>
                      <p className="text-xs text-slate-600 mt-1">{prompt.category} • {new Date(prompt.createdAt).toLocaleDateString()}</p>
                    </div>
                    <BookmarkIcon className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomPromptBuilder;