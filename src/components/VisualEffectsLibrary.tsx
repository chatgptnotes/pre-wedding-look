import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, TagIcon, SparklesIcon, EyeIcon } from '@heroicons/react/24/solid';

interface VisualEffect {
  id: string;
  name: string;
  category: string;
  description: string;
  intensity: 'Low' | 'Medium' | 'High' | 'Extreme';
  duration: string;
  suitableFor: string[];
}

const VISUAL_EFFECTS: VisualEffect[] = [
  // Transformation Effects
  { id: 'earth-zoom', name: 'Earth Zoom Out', category: 'Cinematic', description: 'Dramatic zoom from close-up to Earth view', intensity: 'High', duration: '2-3s', suitableFor: ['Opening scenes', 'Dramatic reveals'] },
  { id: 'eyes-in', name: 'Eyes In', category: 'Portrait', description: 'Intense eye focus with zoom effect', intensity: 'Medium', duration: '1-2s', suitableFor: ['Emotional moments', 'Close-ups'] },
  { id: 'turning-metal', name: 'Turning Metal', category: 'Fantasy', description: 'Transform subject into metallic material', intensity: 'High', duration: '2-4s', suitableFor: ['Fantasy themes', 'Artistic shots'] },
  { id: 'melting', name: 'Melting', category: 'Artistic', description: 'Liquid melting transformation', intensity: 'High', duration: '3-5s', suitableFor: ['Abstract art', 'Surreal themes'] },
  { id: 'turning-metal-eyes', name: 'Turning Metal + Eyes In', category: 'Fantasy', description: 'Metal transformation with eye focus', intensity: 'Extreme', duration: '3-4s', suitableFor: ['Fantasy portraits', 'Dramatic effects'] },
  
  // Action & Dynamic Effects  
  { id: 'building-explosion', name: 'Building Explosion', category: 'Action', description: 'Explosive background destruction', intensity: 'Extreme', duration: '2-3s', suitableFor: ['Action themes', 'Dynamic backgrounds'] },
  { id: 'face-punch', name: 'Face Punch', category: 'Action', description: 'Impact effect on face', intensity: 'High', duration: '0.5-1s', suitableFor: ['Action sequences', 'Impact moments'] },
  { id: 'explosion', name: 'Explosion', category: 'Action', description: 'General explosion effects', intensity: 'High', duration: '1-3s', suitableFor: ['Action scenes', 'Dramatic reveals'] },
  { id: 'fast-sprint', name: 'Fast Sprint', category: 'Motion', description: 'High-speed movement blur', intensity: 'Medium', duration: '1-2s', suitableFor: ['Running scenes', 'Speed effects'] },
  
  // Elemental Effects
  { id: 'fire-element', name: 'Fire Element', category: 'Elemental', description: 'Fire-based transformation', intensity: 'High', duration: '2-4s', suitableFor: ['Passionate themes', 'Dramatic scenes'] },
  { id: 'water-element', name: 'Water Element', category: 'Elemental', description: 'Water-based effects', intensity: 'Medium', duration: '2-3s', suitableFor: ['Fluid motion', 'Serene themes'] },
  { id: 'earth-element', name: 'Earth Element', category: 'Elemental', description: 'Earth and stone effects', intensity: 'Medium', duration: '2-4s', suitableFor: ['Grounding themes', 'Nature scenes'] },
  { id: 'air-element', name: 'Air Element', category: 'Elemental', description: 'Wind and air currents', intensity: 'Low', duration: '2-3s', suitableFor: ['Ethereal themes', 'Light effects'] },
  { id: 'flame-on', name: 'Flame On', category: 'Elemental', description: 'Ignition and fire spread', intensity: 'High', duration: '1-3s', suitableFor: ['Transformation', 'Power reveals'] },
  { id: 'set-on-fire', name: 'Set on Fire', category: 'Elemental', description: 'Subject catches fire', intensity: 'Extreme', duration: '2-4s', suitableFor: ['Dramatic themes', 'Intense emotions'] },
  
  // Magical & Fantasy
  { id: 'diamond', name: 'Diamond', category: 'Luxury', description: 'Diamond crystallization effect', intensity: 'High', duration: '2-3s', suitableFor: ['Luxury themes', 'Jewelry shots'] },
  { id: 'angel-wings', name: 'Angel Wings', category: 'Fantasy', description: 'Ethereal wing appearance', intensity: 'Medium', duration: '2-4s', suitableFor: ['Angelic themes', 'Romantic scenes'] },
  { id: 'fairies-around', name: 'Fairies Around', category: 'Fantasy', description: 'Magical fairy particles', intensity: 'Low', duration: '3-5s', suitableFor: ['Whimsical themes', 'Magic moments'] },
  { id: 'mystification', name: 'Mystification', category: 'Fantasy', description: 'Mysterious magical aura', intensity: 'Medium', duration: '2-4s', suitableFor: ['Mystery themes', 'Enchanted scenes'] },
  { id: 'wonderland', name: 'Wonderland', category: 'Fantasy', description: 'Alice in Wonderland theme', intensity: 'High', duration: '3-5s', suitableFor: ['Fairytale themes', 'Surreal scenes'] },
  
  // Horror & Dark Effects
  { id: 'horror-face', name: 'Horror Face', category: 'Horror', description: 'Frightening facial transformation', intensity: 'Extreme', duration: '1-3s', suitableFor: ['Halloween themes', 'Horror effects'] },
  { id: 'black-tears', name: 'Black Tears', category: 'Dark', description: 'Dark emotional crying effect', intensity: 'Medium', duration: '2-3s', suitableFor: ['Gothic themes', 'Emotional drama'] },
  { id: 'shadow', name: 'Shadow', category: 'Dark', description: 'Shadow manipulation effects', intensity: 'Low', duration: '1-4s', suitableFor: ['Mysterious themes', 'Dramatic lighting'] },
  { id: 'spiders-mouth', name: 'Spiders from Mouth', category: 'Horror', description: 'Spiders emerging from mouth', intensity: 'Extreme', duration: '2-3s', suitableFor: ['Horror themes', 'Shock effects'] },
  
  // Transformation & Morphing
  { id: 'cyborg', name: 'Cyborg', category: 'Sci-Fi', description: 'Cybernetic enhancement', intensity: 'High', duration: '2-4s', suitableFor: ['Sci-fi themes', 'Futuristic looks'] },
  { id: 'werewolf', name: 'Werewolf', category: 'Monster', description: 'Werewolf transformation', intensity: 'Extreme', duration: '3-5s', suitableFor: ['Monster themes', 'Full moon scenes'] },
  { id: 'animalization', name: 'Animalization', category: 'Transform', description: 'Animal feature integration', intensity: 'High', duration: '2-4s', suitableFor: ['Animal themes', 'Wild nature'] },
  { id: 'morphskin', name: 'Morphskin', category: 'Transform', description: 'Skin texture transformation', intensity: 'High', duration: '2-3s', suitableFor: ['Fantasy creatures', 'Texture effects'] },
  
  // Glitch & Digital Effects
  { id: 'glitch', name: 'Glitch', category: 'Digital', description: 'Digital corruption effects', intensity: 'Medium', duration: '0.5-2s', suitableFor: ['Tech themes', 'Error effects'] },
  { id: 'wireframe', name: 'Wireframe', category: 'Digital', description: '3D wireframe visualization', intensity: 'Low', duration: '2-3s', suitableFor: ['Tech demos', '3D visualization'] },
  { id: 'polygon', name: 'Polygon', category: 'Digital', description: 'Low-poly geometric effect', intensity: 'Medium', duration: '2-3s', suitableFor: ['Geometric art', 'Modern design'] },
  { id: 'point-cloud', name: 'Point Cloud', category: 'Digital', description: 'Particle point visualization', intensity: 'Low', duration: '2-4s', suitableFor: ['Data visualization', 'Abstract art'] },
  
  // Transitions
  { id: 'roll-transition', name: 'Roll Transition', category: 'Transition', description: 'Rolling page turn effect', intensity: 'Low', duration: '1-2s', suitableFor: ['Scene changes', 'Page turns'] },
  { id: 'flame-transition', name: 'Flame Transition', category: 'Transition', description: 'Fire-based scene transition', intensity: 'Medium', duration: '1-3s', suitableFor: ['Dramatic transitions', 'Fire themes'] },
  { id: 'smoke-transition', name: 'Smoke Transition', category: 'Transition', description: 'Smoke-based scene change', intensity: 'Low', duration: '2-3s', suitableFor: ['Mysterious transitions', 'Soft changes'] },
  { id: 'splash-transition', name: 'Splash Transition', category: 'Transition', description: 'Water splash scene change', intensity: 'Medium', duration: '1-2s', suitableFor: ['Water themes', 'Refreshing transitions'] },
  
  // Nature & Environmental
  { id: 'nature-bloom', name: 'Nature Bloom', category: 'Nature', description: 'Flowering and growth effects', intensity: 'Low', duration: '3-5s', suitableFor: ['Spring themes', 'Growth symbolism'] },
  { id: 'garden-bloom', name: 'Garden Bloom', category: 'Nature', description: 'Garden flowering effect', intensity: 'Low', duration: '3-4s', suitableFor: ['Garden scenes', 'Romantic nature'] },
  { id: 'sakura-petals', name: 'Sakura Petals', category: 'Nature', description: 'Cherry blossom petals', intensity: 'Low', duration: '3-5s', suitableFor: ['Japanese themes', 'Spring romance'] },
  { id: 'northern-lights', name: 'Northern Lights', category: 'Nature', description: 'Aurora borealis effect', intensity: 'Medium', duration: '4-6s', suitableFor: ['Winter themes', 'Celestial scenes'] },
  
  // Special Effects
  { id: 'duplicate', name: 'Duplicate', category: 'Special', description: 'Multiple copy effect', intensity: 'Medium', duration: '1-3s', suitableFor: ['Clone themes', 'Multiplicity'] },
  { id: 'levitation', name: 'Levitation', category: 'Special', description: 'Floating/hovering effect', intensity: 'Medium', duration: '2-4s', suitableFor: ['Magical themes', 'Supernatural'] },
  { id: 'x-ray', name: 'X-Ray', category: 'Special', description: 'X-ray vision effect', intensity: 'High', duration: '1-3s', suitableFor: ['Medical themes', 'See-through effects'] },
  { id: 'portal', name: 'Portal', category: 'Special', description: 'Dimensional portal opening', intensity: 'High', duration: '2-4s', suitableFor: ['Fantasy travel', 'Dimensional themes'] },
  
  // Fun & Playful
  { id: 'balloon', name: 'Balloon', category: 'Playful', description: 'Balloon transformation/floating', intensity: 'Low', duration: '2-4s', suitableFor: ['Celebration themes', 'Playful scenes'] },
  { id: 'cotton-cloud', name: 'Cotton Cloud', category: 'Playful', description: 'Soft cotton cloud effect', intensity: 'Low', duration: '2-3s', suitableFor: ['Dreamy themes', 'Soft textures'] },
  { id: 'pizza-fall', name: 'Pizza Fall', category: 'Comedy', description: 'Pizza raining effect', intensity: 'Medium', duration: '2-3s', suitableFor: ['Comedy themes', 'Food fun'] },
  { id: 'money-rain', name: 'Money Rain', category: 'Comedy', description: 'Money falling effect', intensity: 'Medium', duration: '2-4s', suitableFor: ['Wealth themes', 'Success celebration'] }
];

const categories = Array.from(new Set(VISUAL_EFFECTS.map(effect => effect.category)));

const VisualEffectsLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIntensity, setSelectedIntensity] = useState('All');

  const filteredEffects = useMemo(() => {
    return VISUAL_EFFECTS.filter(effect => {
      const matchesSearch = effect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           effect.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || effect.category === selectedCategory;
      const matchesIntensity = selectedIntensity === 'All' || effect.intensity === selectedIntensity;
      
      return matchesSearch && matchesCategory && matchesIntensity;
    });
  }, [searchTerm, selectedCategory, selectedIntensity]);

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Extreme': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Cinematic': 'from-blue-500 to-cyan-600',
      'Portrait': 'from-purple-500 to-pink-600',
      'Fantasy': 'from-indigo-500 to-purple-600',
      'Action': 'from-red-500 to-orange-600',
      'Elemental': 'from-emerald-500 to-teal-600',
      'Horror': 'from-gray-800 to-black',
      'Sci-Fi': 'from-cyan-500 to-blue-600',
      'Digital': 'from-slate-500 to-gray-600',
      'Nature': 'from-green-500 to-emerald-600',
      'Special': 'from-violet-500 to-purple-600',
      'Playful': 'from-pink-500 to-rose-600'
    };
    return colors[category as keyof typeof colors] || 'from-gray-500 to-slate-600';
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Visual Effects Library</h2>
            <p className="text-slate-600">Higgsfield.ai powered visual effects, animations and actions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search effects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Intensity Filter */}
          <div>
            <select
              value={selectedIntensity}
              onChange={(e) => setSelectedIntensity(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="All">All Intensities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Extreme">Extreme</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-violet-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between text-violet-800">
            <span className="text-sm font-medium">
              Showing {filteredEffects.length} of {VISUAL_EFFECTS.length} effects
            </span>
            <span className="text-sm">
              {categories.length} categories available
            </span>
          </div>
        </div>
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredEffects.map((effect, index) => (
            <motion.div
              key={effect.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{effect.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(effect.category)} text-white`}>
                      {effect.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIntensityColor(effect.intensity)}`}>
                      {effect.intensity}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <div className="font-medium">{effect.duration}</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                {effect.description}
              </p>

              {/* Suitable For */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center">
                  <TagIcon className="w-3 h-3 mr-1" />
                  Suitable For:
                </h4>
                <div className="flex flex-wrap gap-1">
                  {effect.suitableFor.map((use, idx) => (
                    <span 
                      key={idx}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs"
                    >
                      {use}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preview Button */}
              <button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-2 px-4 rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center">
                <EyeIcon className="w-4 h-4 mr-2" />
                Preview Effect
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Integration Info */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-indigo-800 mb-4">🔗 Integration Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-indigo-700 mb-3">How to Use</h4>
            <ul className="text-indigo-600 text-sm space-y-2">
              <li>• Select effects based on video theme and mood</li>
              <li>• Consider effect intensity for target audience</li>
              <li>• Chain effects for complex transformations</li>
              <li>• Test effects with sample footage first</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-indigo-700 mb-3">Technical Notes</h4>
            <ul className="text-indigo-600 text-sm space-y-2">
              <li>• Effects require minimum 720p resolution</li>
              <li>• Processing time varies by complexity</li>
              <li>• Some effects work best with specific lighting</li>
              <li>• Preview before applying to final renders</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 text-center">
          <a 
            href="https://higgsfield.ai/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          >
            Learn more about Higgsfield.ai visual effects →
          </a>
        </div>
      </div>
    </div>
  );
};

export default VisualEffectsLibrary;