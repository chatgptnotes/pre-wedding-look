import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Avatar {
  id: string;
  name: string;
  style: string;
  gender: 'male' | 'female' | 'neutral';
  outfit: string;
  accessories: string[];
  mood: 'happy' | 'confident' | 'playful' | 'elegant' | 'mysterious';
  animation: string;
}

interface AvatarSystemProps {
  userId: string;
  selectedAvatar?: Avatar;
  onAvatarSelect: (avatar: Avatar) => void;
  gameMode: 'selection' | 'display' | 'battle';
  isAnimated?: boolean;
}

const AVATAR_COLLECTIONS: Record<string, Avatar[]> = {
  traditional: [
    {
      id: 'bride_classic',
      name: 'Classic Bride',
      style: 'traditional',
      gender: 'female',
      outfit: 'red_lehenga',
      accessories: ['maang_tikka', 'nath', 'kundan_earrings'],
      mood: 'elegant',
      animation: 'twirl'
    },
    {
      id: 'groom_royal',
      name: 'Royal Groom',
      style: 'traditional',
      gender: 'male', 
      outfit: 'cream_sherwani',
      accessories: ['turban', 'kalgi', 'necklace'],
      mood: 'confident',
      animation: 'bow'
    }
  ],
  modern: [
    {
      id: 'bride_contemporary',
      name: 'Modern Bride',
      style: 'contemporary',
      gender: 'female',
      outfit: 'designer_gown',
      accessories: ['diamond_earrings', 'bracelet'],
      mood: 'confident',
      animation: 'pose'
    },
    {
      id: 'groom_stylish',
      name: 'Stylish Groom',
      style: 'contemporary',
      gender: 'male',
      outfit: 'black_tuxedo',
      accessories: ['bow_tie', 'cufflinks'],
      mood: 'playful',
      animation: 'walk'
    }
  ],
  cultural: [
    {
      id: 'marathi_bride',
      name: 'Marathi Mulgi',
      style: 'marathi',
      gender: 'female',
      outfit: 'nauvari_saree',
      accessories: ['nath', 'mundavalya', 'ambada_flowers'],
      mood: 'happy',
      animation: 'dance'
    },
    {
      id: 'punjabi_groom',
      name: 'Punjabi Munda',
      style: 'punjabi',
      gender: 'male',
      outfit: 'kurta_pajama',
      accessories: ['turban', 'kada'],
      mood: 'playful',
      animation: 'bhangra'
    }
  ]
};

const AvatarSystem: React.FC<AvatarSystemProps> = ({
  userId,
  selectedAvatar,
  onAvatarSelect,
  gameMode,
  isAnimated = true
}) => {
  const [activeCollection, setActiveCollection] = useState<string>('traditional');
  const [previewAvatar, setPreviewAvatar] = useState<Avatar | null>(null);
  const [animationState, setAnimationState] = useState<string>('idle');
  const [customization, setCustomization] = useState({
    outfit: '',
    accessories: [],
    mood: 'happy' as Avatar['mood']
  });

  useEffect(() => {
    if (isAnimated && selectedAvatar) {
      const interval = setInterval(() => {
        setAnimationState(prev => 
          prev === 'idle' ? selectedAvatar.animation : 'idle'
        );
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isAnimated, selectedAvatar]);

  const getAvatarVisual = (avatar: Avatar, isPreview = false) => {
    const baseClass = `avatar-${avatar.style} ${avatar.outfit}`;
    const animationClass = isAnimated && animationState !== 'idle' ? 
      `animate-${animationState}` : '';
    const moodClass = `mood-${avatar.mood}`;

    return (
      <motion.div
        className={`relative w-24 h-24 ${baseClass} ${animationClass} ${moodClass}`}
        initial={isPreview ? { scale: 0.8, opacity: 0 } : false}
        animate={isPreview ? { scale: 1, opacity: 1 } : false}
        exit={isPreview ? { scale: 0.8, opacity: 0 } : false}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Avatar Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-pink-100 to-purple-100 rounded-full">
          <div className="w-full h-full flex items-center justify-center">
            {/* Avatar Icon/Image would go here */}
            <div className="text-2xl">
              {avatar.gender === 'female' ? '👰' : avatar.gender === 'male' ? '🤵' : '🧑'}
            </div>
          </div>
        </div>

        {/* Outfit Layer */}
        <div className={`absolute inset-0 outfit-layer ${avatar.outfit}`}>
          {avatar.outfit === 'red_lehenga' && (
            <div className="absolute bottom-0 w-full h-8 bg-red-500 rounded-b-full opacity-80"></div>
          )}
          {avatar.outfit === 'cream_sherwani' && (
            <div className="absolute inset-2 bg-cream-200 rounded-lg opacity-60"></div>
          )}
          {avatar.outfit === 'nauvari_saree' && (
            <div className="absolute bottom-0 w-full h-6 bg-orange-400 rounded-b-full opacity-70"></div>
          )}
        </div>

        {/* Accessories Layer */}
        <div className="absolute inset-0 accessories-layer">
          {avatar.accessories.map((accessory, idx) => (
            <div key={accessory} className={`accessory-${accessory}`}>
              {accessory === 'turban' && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-gold-400 rounded-t-full opacity-90"></div>
              )}
              {accessory === 'nath' && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gold-300 rounded-full"></div>
              )}
              {accessory === 'maang_tikka' && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-diamond-white rounded-full"></div>
              )}
            </div>
          ))}
        </div>

        {/* Animation Effects */}
        <AnimatePresence>
          {animationState === 'twirl' && (
            <motion.div
              className="absolute inset-0 border-2 border-pink-300 rounded-full"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1.2, rotate: 360 }}
              exit={{ scale: 0, rotate: 720 }}
              transition={{ duration: 1.5 }}
            />
          )}
          {animationState === 'dance' && (
            <motion.div
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
              initial={{ y: 0 }}
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 0.6, repeat: 3 }}
            >
              ✨
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection Indicator */}
        {selectedAvatar?.id === avatar.id && (
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
        )}
      </motion.div>
    );
  };

  const AvatarSelector = () => (
    <div className="space-y-6">
      {/* Collection Tabs */}
      <div className="flex space-x-4 justify-center">
        {Object.keys(AVATAR_COLLECTIONS).map(collection => (
          <button
            key={collection}
            onClick={() => setActiveCollection(collection)}
            className={`px-4 py-2 rounded-full transition-colors ${
              activeCollection === collection
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {collection.charAt(0).toUpperCase() + collection.slice(1)}
          </button>
        ))}
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {AVATAR_COLLECTIONS[activeCollection].map(avatar => (
          <motion.div
            key={avatar.id}
            className="cursor-pointer p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow"
            onClick={() => onAvatarSelect(avatar)}
            onMouseEnter={() => setPreviewAvatar(avatar)}
            onMouseLeave={() => setPreviewAvatar(null)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {getAvatarVisual(avatar)}
            <div className="mt-2 text-center">
              <p className="font-medium text-sm text-gray-800">{avatar.name}</p>
              <p className="text-xs text-gray-500 capitalize">{avatar.mood}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Customization Panel */}
      {selectedAvatar && (
        <motion.div
          className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <h3 className="text-lg font-semibold mb-4 text-center">
            Customize {selectedAvatar.name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Mood</label>
              <select
                value={customization.mood}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  mood: e.target.value as Avatar['mood']
                }))}
                className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500"
              >
                <option value="happy">😊 Happy</option>
                <option value="confident">😎 Confident</option>
                <option value="playful">😜 Playful</option>
                <option value="elegant">✨ Elegant</option>
                <option value="mysterious">🌙 Mysterious</option>
              </select>
            </div>

            {/* Animation Toggle */}
            <div>
              <label className="block text-sm font-medium mb-2">Animation</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="animation-toggle"
                  checked={isAnimated}
                  onChange={(e) => {
                    // This would call a prop function to update parent state
                    console.log('Animation toggled:', e.target.checked);
                  }}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="animation-toggle" className="text-sm text-gray-700">
                  Enable animations
                </label>
              </div>
            </div>

            {/* Style Info */}
            <div>
              <label className="block text-sm font-medium mb-2">Style</label>
              <p className="text-sm text-gray-600 capitalize bg-white p-2 rounded-lg">
                {selectedAvatar.style} • {selectedAvatar.outfit.replace('_', ' ')}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  const AvatarDisplay = () => (
    <div className="flex flex-col items-center space-y-4">
      {selectedAvatar && (
        <>
          <div className="relative">
            {getAvatarVisual(selectedAvatar, true)}
            
            {/* Connection Status Indicator */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse">
              <div className="absolute inset-1 bg-green-600 rounded-full"></div>
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="font-semibold text-lg">{selectedAvatar.name}</h3>
            <p className="text-sm text-gray-600 capitalize">
              {selectedAvatar.mood} • {selectedAvatar.style}
            </p>
          </div>
        </>
      )}
    </div>
  );

  const AvatarBattle = () => (
    <div className="grid grid-cols-2 gap-8 items-center">
      {/* Player Avatar */}
      <div className="text-center">
        <div className="relative mb-4">
          {selectedAvatar && getAvatarVisual(selectedAvatar, true)}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
            You
          </div>
        </div>
      </div>

      {/* VS Indicator */}
      <div className="col-span-2 flex justify-center">
        <motion.div
          className="text-4xl font-bold text-purple-600"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          VS
        </motion.div>
      </div>

      {/* Opponent Avatar */}
      <div className="text-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-2xl">⏳</span>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
            Opponent
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="avatar-system p-6">
      {gameMode === 'selection' && <AvatarSelector />}
      {gameMode === 'display' && <AvatarDisplay />}
      {gameMode === 'battle' && <AvatarBattle />}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewAvatar && gameMode === 'selection' && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  {getAvatarVisual(previewAvatar, true)}
                </div>
                <h3 className="text-xl font-bold mb-2">{previewAvatar.name}</h3>
                <p className="text-gray-600 mb-4 capitalize">
                  {previewAvatar.style} • {previewAvatar.mood}
                </p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={() => {
                      onAvatarSelect(previewAvatar);
                      setPreviewAvatar(null);
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Select This Avatar
                  </button>
                  <button
                    onClick={() => setPreviewAvatar(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvatarSystem;