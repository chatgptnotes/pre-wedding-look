import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, FireIcon, BoltIcon } from '@heroicons/react/24/solid';
import ImageUploader from '../ImageUploader';

interface ChallengeTheme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: 'fantasy' | 'sci-fi' | 'bollywood' | 'adventure' | 'comedy';
  difficulty: 'easy' | 'medium' | 'hard' | 'insane';
  prompt: string;
  colors: string[];
  props?: string[];
}

const BANANA_THEMES: ChallengeTheme[] = [
  {
    id: 'cyberpunk-wedding',
    name: 'Cyberpunk Wedding 2077',
    emoji: '🤖',
    description: 'Neon-lit futuristic wedding in a cyberpunk world',
    category: 'sci-fi',
    difficulty: 'hard',
    prompt: 'cyberpunk wedding ceremony with neon lights, holographic decorations, futuristic outfits',
    colors: ['#00ffff', '#ff00ff', '#ffff00'],
    props: ['Neon accessories', 'Hologram rings', 'LED bouquet']
  },
  {
    id: 'bollywood-poster',
    name: 'Bollywood Movie Poster',
    emoji: '🎬',
    description: 'Dramatic Bollywood movie poster style romance',
    category: 'bollywood',
    difficulty: 'medium',
    prompt: 'dramatic Bollywood movie poster style with vibrant colors, traditional outfits, romantic poses',
    colors: ['#ff6b6b', '#ffd93d', '#6bcf7f'],
    props: ['Dramatic lighting', 'Flower petals', 'Traditional jewelry']
  },
  {
    id: 'mermaid-wedding',
    name: 'Undersea Mermaid Wedding',
    emoji: '🧜‍♀️',
    description: 'Magical underwater wedding with mermaid transformation',
    category: 'fantasy',
    difficulty: 'insane',
    prompt: 'underwater mermaid wedding with coral reefs, sea creatures, flowing mermaid tail dress',
    colors: ['#1e40af', '#06b6d4', '#10b981'],
    props: ['Mermaid tails', 'Coral crown', 'Pearl jewelry', 'Sea creatures']
  },
  {
    id: 'superhero-couple',
    name: 'Superhero Power Couple',
    emoji: '🦸‍♀️🦸‍♂️',
    description: 'Comic book style superhero wedding with powers',
    category: 'fantasy',
    difficulty: 'hard',
    prompt: 'superhero wedding with comic book style, capes, superpowers, action poses',
    colors: ['#dc2626', '#1d4ed8', '#fbbf24'],
    props: ['Superhero capes', 'Power effects', 'Comic speech bubbles']
  },
  {
    id: 'zombie-apocalypse',
    name: 'Zombie Apocalypse Romance',
    emoji: '🧟‍♂️',
    description: 'Love conquers all - even a zombie apocalypse!',
    category: 'comedy',
    difficulty: 'medium',
    prompt: 'romantic wedding during zombie apocalypse, tattered dress and suit, post-apocalyptic background',
    colors: ['#374151', '#7c2d12', '#166534'],
    props: ['Tattered clothing', 'Survival gear', 'Zombie makeup']
  },
  {
    id: 'space-station',
    name: 'Space Station Wedding',
    emoji: '🚀',
    description: 'Zero gravity wedding ceremony aboard a space station',
    category: 'sci-fi',
    difficulty: 'hard',
    prompt: 'zero gravity wedding in space station, astronaut suits, Earth in background, floating elements',
    colors: ['#000000', '#ffffff', '#3b82f6'],
    props: ['Space suits', 'Floating elements', 'Earth backdrop']
  },
  {
    id: 'pirate-adventure',
    name: 'Pirate Ship Adventure',
    emoji: '🏴‍☠️',
    description: 'Swashbuckling pirate wedding on the high seas',
    category: 'adventure',
    difficulty: 'medium',
    prompt: 'pirate wedding on ship deck, period costumes, treasure chests, ocean waves',
    colors: ['#7c2d12', '#fbbf24', '#1e40af'],
    props: ['Pirate hats', 'Treasure chest', 'Ship elements', 'Swords']
  },
  {
    id: 'dinosaur-prehistoric',
    name: 'Prehistoric Dinosaur Age',
    emoji: '🦕',
    description: 'Stone age wedding with friendly dinosaurs',
    category: 'comedy',
    difficulty: 'easy',
    prompt: 'prehistoric wedding with dinosaurs, stone age clothing, jungle background',
    colors: ['#166534', '#7c2d12', '#a3a3a3'],
    props: ['Stone age clothing', 'Dinosaur friends', 'Jungle plants']
  },
  {
    id: 'alien-planet',
    name: 'Alien Planet Ceremony',
    emoji: '👽',
    description: 'Wedding on an alien planet with multiple moons',
    category: 'sci-fi',
    difficulty: 'insane',
    prompt: 'wedding ceremony on alien planet, strange alien landscape, multiple moons, otherworldly clothing',
    colors: ['#7c3aed', '#ec4899', '#06b6d4'],
    props: ['Alien landscape', 'Multiple moons', 'Otherworldly outfits']
  },
  {
    id: 'medieval-castle',
    name: 'Medieval Castle Royalty',
    emoji: '🏰',
    description: 'Royal medieval wedding fit for a king and queen',
    category: 'fantasy',
    difficulty: 'medium',
    prompt: 'medieval royal wedding, castle backdrop, crown and royal robes, knights and dragons',
    colors: ['#dc2626', '#fbbf24', '#6366f1'],
    props: ['Royal crowns', 'Castle backdrop', 'Medieval robes', 'Knights']
  }
];

const DIFFICULTY_STYLES = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-orange-100 text-orange-800',
  insane: 'bg-red-100 text-red-800'
};

const CATEGORY_ICONS = {
  fantasy: '✨',
  'sci-fi': '🚀',
  bollywood: '🎭',
  adventure: '⚔️',
  comedy: '😄'
};

interface BananaChallengeTabProps {
  brideImage: string | null;
  groomImage: string | null;
  onImageUpload: (type: 'bride' | 'groom', image: string | null) => void;
}

const BananaChallengeTab: React.FC<BananaChallengeTabProps> = ({ 
  brideImage, 
  groomImage, 
  onImageUpload 
}) => {
  const [selectedTheme, setSelectedTheme] = useState<ChallengeTheme | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState<string[]>([]);
  const [showRandomChallenge, setShowRandomChallenge] = useState(false);

  const categories = ['all', 'fantasy', 'sci-fi', 'bollywood', 'adventure', 'comedy'];

  const filteredThemes = activeCategory === 'all' 
    ? BANANA_THEMES 
    : BANANA_THEMES.filter(theme => theme.category === activeCategory);

  const getRandomTheme = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * BANANA_THEMES.length);
    setSelectedTheme(BANANA_THEMES[randomIndex]);
    setShowRandomChallenge(true);
  }, []);

  const generateBananaChallenge = useCallback(async () => {
    if (!brideImage || !groomImage || !selectedTheme) {
      alert('Please upload both images and select a theme');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Import the Gemini service
      const { generateBananaChallengeImage } = await import('../../services/geminiService');
      
      // Generate the crazy banana challenge image using AI
      const generatedImageUrl = await generateBananaChallengeImage(
        selectedTheme,
        brideImage,
        groomImage
      );
      
      setGeneratedImage(generatedImageUrl);
      
      // Mark challenge as completed
      setChallengeCompleted(prev => [...prev, selectedTheme.id]);
    } catch (error) {
      console.error('Error generating banana challenge:', error);
      alert('Failed to generate challenge. Please try again.');
      
      // Fallback to mock image if AI fails
      const themeName = selectedTheme.name.replace(/\s+/g, '+');
      setGeneratedImage(`https://api.placeholder.com/800x600/ff69b4/fff?text=${themeName}+Challenge`);
      setChallengeCompleted(prev => [...prev, selectedTheme.id]);
    } finally {
      setIsGenerating(false);
    }
  }, [brideImage, groomImage, selectedTheme]);

  const resetChallenge = useCallback(() => {
    setGeneratedImage(null);
    setShowRandomChallenge(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4">
          🍌 Banana Challenge Mode
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Go absolutely bananas with wild, creative, and completely over-the-top wedding themes! From cyberpunk to mermaid weddings - let your imagination run wild!
        </p>
        
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={getRandomTheme}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            🎲 Random Challenge!
          </button>
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <span className="text-sm font-medium text-gray-700">
              Completed: {challengeCompleted.length}/{BANANA_THEMES.length}
            </span>
          </div>
        </div>

        {/* Sample Gallery */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🎨 Sample Banana Challenges</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative group cursor-pointer rounded-lg overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 h-32 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-2xl mb-1">🤖</div>
                <div className="text-xs font-medium">Cyberpunk Wedding</div>
              </div>
            </div>
            <div className="relative group cursor-pointer rounded-lg overflow-hidden bg-gradient-to-br from-blue-400 to-teal-400 h-32 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-2xl mb-1">🧜‍♀️</div>
                <div className="text-xs font-medium">Mermaid Wedding</div>
              </div>
            </div>
            <div className="relative group cursor-pointer rounded-lg overflow-hidden bg-gradient-to-br from-red-400 to-yellow-400 h-32 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-2xl mb-1">🦸‍♂️</div>
                <div className="text-xs font-medium">Superhero Couple</div>
              </div>
            </div>
            <div className="relative group cursor-pointer rounded-lg overflow-hidden bg-gradient-to-br from-green-400 to-blue-400 h-32 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-2xl mb-1">👽</div>
                <div className="text-xs font-medium">Alien Planet</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">Upload your photos and select a theme to create your own wild masterpiece!</p>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ImageUploader
          label="Upload Bride's Photo"
          image={brideImage}
          onImageChange={(img) => onImageUpload('bride', img)}
          onImageReset={() => onImageUpload('bride', null)}
        />
        <ImageUploader
          label="Upload Groom's Photo"
          image={groomImage}
          onImageChange={(img) => onImageUpload('groom', img)}
          onImageReset={() => onImageUpload('groom', null)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Theme Selection */}
        <div className="lg:col-span-3 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {category === 'all' ? '🌟 All' : `${CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]} ${category}`}
                </button>
              ))}
            </div>
          </div>

          {/* Random Challenge Banner */}
          {showRandomChallenge && selectedTheme && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎲</div>
                <div>
                  <div className="font-bold">Random Challenge Selected!</div>
                  <div className="text-sm opacity-90">{selectedTheme.name} - Are you brave enough?</div>
                </div>
                <button
                  onClick={() => setShowRandomChallenge(false)}
                  className="ml-auto bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}

          {/* Theme Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredThemes.map(theme => {
              const isCompleted = challengeCompleted.includes(theme.id);
              const isSelected = selectedTheme?.id === theme.id;
              
              return (
                <motion.button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: isSelected 
                      ? `linear-gradient(135deg, ${theme.colors[0]}15, ${theme.colors[1]}15)` 
                      : undefined
                  }}
                >
                  {/* Completion Badge */}
                  {isCompleted && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      ✓
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{theme.emoji}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">{theme.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${DIFFICULTY_STYLES[theme.difficulty]}`}>
                          {theme.difficulty.toUpperCase()}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {CATEGORY_ICONS[theme.category]} {theme.category}
                        </span>
                      </div>
                      
                      {/* Color Preview */}
                      <div className="flex gap-1">
                        {theme.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Challenge Panel */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Challenge Zone</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-48 flex items-center justify-center mb-6">
            {generatedImage ? (
              <img
                src={generatedImage}
                alt="Banana Challenge Result"
                className="max-w-full max-h-48 object-contain rounded-lg"
              />
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🍌</div>
                <div className="font-medium">Go Bananas!</div>
                <div className="text-sm mt-1">Your crazy creation appears here</div>
              </div>
            )}
          </div>

          {selectedTheme && (
            <div className="mb-4 p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{selectedTheme.emoji}</span>
                <span className="font-bold text-yellow-800">{selectedTheme.name}</span>
              </div>
              <div className="text-sm text-yellow-700 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${DIFFICULTY_STYLES[selectedTheme.difficulty]}`}>
                    {selectedTheme.difficulty}
                  </span>
                </div>
                {selectedTheme.props && (
                  <div>
                    <strong>Props:</strong> {selectedTheme.props.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={generateBananaChallenge}
              disabled={!brideImage || !groomImage || !selectedTheme || isGenerating}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-3 px-6 rounded-lg hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Going Bananas...
                </span>
              ) : (
                <>
                  🍌 Accept Challenge!
                  {selectedTheme && (
                    <div className="text-xs opacity-75 mt-1">
                      Difficulty: {selectedTheme.difficulty}
                    </div>
                  )}
                </>
              )}
            </button>

            {generatedImage && (
              <>
                <button
                  onClick={resetChallenge}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Try Another Challenge
                </button>
                <button 
                  onClick={async () => {
                    try {
                      // Save to Supabase database
                      const { DatabaseService } = await import('../../services/databaseService');
                      await DatabaseService.saveBananaChallengeResult({
                        challenge_theme_id: selectedTheme!.id,
                        challenge_theme_name: selectedTheme!.name,
                        bride_image: brideImage!,
                        groom_image: groomImage!,
                        generated_image: generatedImage,
                        completed_at: new Date().toISOString()
                      });
                      alert('Banana Challenge saved successfully! 🍌✨');
                    } catch (error) {
                      console.error('Error saving banana challenge:', error);
                      // Still allow sharing even if database save fails
                    }
                    // Create shareable link
                    const shareData = {
                      title: `Banana Challenge: ${selectedTheme!.name}`,
                      text: `Check out our wild ${selectedTheme!.name} pre-wedding photo! 🍌`,
                      url: window.location.href
                    };
                    if (navigator.share) {
                      navigator.share(shareData);
                    } else {
                      navigator.clipboard.writeText(`${shareData.title} - ${shareData.url}`);
                      alert('Link copied to clipboard! Share your banana challenge! 🍌');
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  💾 Save & Share This Madness!
                </button>
              </>
            )}
          </div>

          {/* Progress */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-800">Challenge Progress</span>
            </div>
            <div className="text-sm text-blue-700">
              <div className="flex justify-between mb-1">
                <span>Completed</span>
                <span>{challengeCompleted.length}/{BANANA_THEMES.length}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(challengeCompleted.length / BANANA_THEMES.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BananaChallengeTab;