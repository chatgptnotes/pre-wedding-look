import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import ImageUploader from '../ImageUploader';
import HelpCard from '../HelpCard';
import CustomPromptBuilder from '../CustomPromptBuilder';
import { generateStoryboardScene } from '../../services/geminiService';

interface Scene {
  id: string;
  name: string;
  location: string;
  timeOfDay: string;
  description: string;
  generatedImage?: string;
  isGenerating?: boolean;
}

const PRESET_SCENES: Omit<Scene, 'id' | 'generatedImage' | 'isGenerating'>[] = [
  {
    name: 'Sunrise at Taj Mahal',
    location: 'Taj Mahal, Agra',
    timeOfDay: 'Golden sunrise',
    description: 'Romantic sunrise silhouette with the iconic monument'
  },
  {
    name: 'Paris Night Romance',
    location: 'Eiffel Tower, Paris',
    timeOfDay: 'Evening twilight',
    description: 'City lights and romantic evening atmosphere'
  },
  {
    name: 'Goa Beach Sunset',
    location: 'Goa Beach',
    timeOfDay: 'Golden sunset',
    description: 'Waves, sand, and golden hour magic'
  },
  {
    name: 'Kashmir Valley',
    location: 'Dal Lake, Kashmir',
    timeOfDay: 'Misty morning',
    description: 'Serene lake with mountain backdrop'
  },
  {
    name: 'Rajasthan Palace',
    location: 'Jaipur Palace',
    timeOfDay: 'Royal evening',
    description: 'Regal architecture and royal grandeur'
  }
];

interface StoryboardTabProps {
  brideImage: string | null;
  groomImage: string | null;
  onImageUpload: (type: 'bride' | 'groom', image: string | null) => void;
}

const StoryboardTab: React.FC<StoryboardTabProps> = ({ 
  brideImage, 
  groomImage, 
  onImageUpload 
}) => {
  const [scenes, setScenes] = useState<Scene[]>(
    PRESET_SCENES.map((scene, index) => ({
      ...scene,
      id: `scene-${index + 1}`
    }))
  );
  
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [customScene, setCustomScene] = useState({
    location: '',
    timeOfDay: '',
    description: ''
  });
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  const generateScene = useCallback(async (sceneIndex: number) => {
    if (!brideImage || !groomImage) {
      alert('Please upload both bride and groom images first');
      return;
    }

    const currentScene = scenes[sceneIndex];
    if (!currentScene) {
      console.error('Scene not found at index:', sceneIndex);
      return;
    }

    setScenes(prev => prev.map((scene, idx) => 
      idx === sceneIndex ? { ...scene, isGenerating: true } : scene
    ));

    try {
      console.log('Generating scene:', currentScene.name, 'at', currentScene.location);
      
      // Use real Gemini API for scene generation
      const generatedImageUrl = await generateStoryboardScene(
        {
          name: currentScene.name,
          location: currentScene.location,
          timeOfDay: currentScene.timeOfDay,
          description: currentScene.description
        },
        brideImage,
        groomImage
      );
      
      console.log('Successfully generated scene:', currentScene.name);
      
      setScenes(prev => prev.map((scene, idx) => 
        idx === sceneIndex ? { 
          ...scene, 
          isGenerating: false, 
          generatedImage: generatedImageUrl 
        } : scene
      ));
    } catch (error) {
      console.error('Error generating scene:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate scene: ${errorMessage}\n\nPlease try again or check your internet connection.`);
      
      setScenes(prev => prev.map((scene, idx) => 
        idx === sceneIndex ? { ...scene, isGenerating: false } : scene
      ));
    }
  }, [brideImage, groomImage, scenes]);

  const addCustomScene = useCallback(() => {
    if (!customScene.location || !customScene.description) {
      alert('Please fill in location and description');
      return;
    }

    const newScene: Scene = {
      id: `custom-${Date.now()}`,
      name: `Custom: ${customScene.location}`,
      location: customScene.location,
      timeOfDay: customScene.timeOfDay || 'Any time',
      description: customScene.description
    };

    setScenes(prev => [...prev, newScene]);
    setCustomScene({ location: '', timeOfDay: '', description: '' });
  }, [customScene]);

  const playStoryboard = useCallback(() => {
    setIsPlaying(!isPlaying);
    // Auto-advance through scenes when playing
    if (!isPlaying) {
      const interval = setInterval(() => {
        setCurrentScene(prev => {
          const next = prev + 1;
          if (next >= scenes.length) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return next;
        });
      }, 3000);
    }
  }, [isPlaying, scenes.length]);

  const nextScene = () => {
    setCurrentScene(prev => (prev + 1) % scenes.length);
  };

  const prevScene = () => {
    setCurrentScene(prev => prev === 0 ? scenes.length - 1 : prev - 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          🎬 Storyboard Creator
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create a cinematic journey through multiple iconic locations while maintaining consistent faces and outfits.
        </p>
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

      {/* Scene Preview */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            Scene {currentScene + 1} of {scenes.length}
          </h3>
          
          <div className="flex items-center gap-4">
            <button
              onClick={prevScene}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={playStoryboard}
              className={`p-3 rounded-lg transition-all ${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            </button>
            
            <button
              onClick={nextScene}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scene Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">
                    {scenes[currentScene]?.name}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      📍 {scenes[currentScene]?.location}
                    </span>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                      🌅 {scenes[currentScene]?.timeOfDay}
                    </span>
                  </div>
                  <p className="text-gray-700">
                    {scenes[currentScene]?.description}
                  </p>
                </div>

                <button
                  onClick={() => generateScene(currentScene)}
                  disabled={scenes[currentScene]?.isGenerating || !brideImage || !groomImage}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {scenes[currentScene]?.isGenerating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Scene...
                    </span>
                  ) : (
                    '✨ Generate This Scene'
                  )}
                </button>
              </div>

              {/* Generated Image Preview */}
              <div className="flex items-center justify-center">
                {scenes[currentScene]?.generatedImage ? (
                  <img
                    src={scenes[currentScene].generatedImage}
                    alt={scenes[currentScene].name}
                    className="max-w-full h-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">🎬</div>
                      <div className="font-medium">Scene Preview</div>
                      <div className="text-sm">Generate to see your creation</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scene Thumbnails */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Storyboard Timeline</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              onClick={() => setCurrentScene(index)}
              className={`p-3 rounded-lg transition-all ${
                currentScene === index
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <div className="text-lg mb-1">{scene.name.split(' ')[0]}</div>
              <div className="text-xs opacity-75">{scene.location}</div>
              {scene.generatedImage && (
                <div className="mt-2 text-xs bg-green-200 text-green-800 rounded px-2 py-1">
                  Generated
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Builder */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-gray-800">🎨 Custom Story Themes</h4>
          <button
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-sm font-medium transition-colors"
          >
            {showCustomPrompt ? 'Hide' : 'Show'} Custom Prompts
          </button>
        </div>
        {showCustomPrompt && (
          <CustomPromptBuilder
            onPromptGenerated={setCustomPrompt}
            currentMode="storyboard"
            placeholder="Describe your storyboard theme (e.g., vintage Hollywood romance, fantasy fairytale journey, modern urban adventure)..."
            existingPrompt={customPrompt}
          />
        )}
        {customPrompt && (
          <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <h5 className="font-semibold text-purple-800 mb-2">Active Custom Theme:</h5>
            <p className="text-purple-700 text-sm">{customPrompt}</p>
          </div>
        )}
      </div>

      {/* Add Custom Scene */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Add Custom Scene</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Location (e.g., London Bridge)"
            value={customScene.location}
            onChange={(e) => setCustomScene(prev => ({ ...prev, location: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Time of day (e.g., Golden hour)"
            value={customScene.timeOfDay}
            onChange={(e) => setCustomScene(prev => ({ ...prev, timeOfDay: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={addCustomScene}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Add Scene
          </button>
        </div>
        <textarea
          placeholder="Describe your scene (e.g., Romantic walk with cherry blossoms)"
          value={customScene.description}
          onChange={(e) => setCustomScene(prev => ({ ...prev, description: e.target.value }))}
          className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={3}
        />
      </div>
    </div>
  );
};

export default StoryboardTab;