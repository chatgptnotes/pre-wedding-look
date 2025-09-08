import React, { useState, useCallback } from 'react';
import { GenerationConfig } from '../types';
import { generatePersonalizedImage } from '../services/geminiService';
import { LOCATIONS, BRIDE_POSES, GROOM_POSES, STYLES, ASPECT_RATIOS } from '../constants';
import OptionSelector from './OptionSelector';
import LoadingSpinner from './LoadingSpinner';

interface MagicCreationProps {
  brideImage: string | null;
  groomImage: string | null;
  onClose: () => void;
}

const MagicCreation: React.FC<MagicCreationProps> = ({ brideImage, groomImage, onClose }) => {
  const [config, setConfig] = useState<GenerationConfig>({
    location: LOCATIONS[1].promptValue,
    brideAttire: '',
    groomAttire: '',
    bridePose: BRIDE_POSES[1].promptValue,
    groomPose: GROOM_POSES[1].promptValue,
    style: STYLES[0].promptValue,
    hairstyle: '',
    groomHairstyle: '',
    aspectRatio: ASPECT_RATIOS[1].promptValue,
    jewelry: '',
  });

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfigChange = useCallback((key: keyof GenerationConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleGenerate = async () => {
    if (!brideImage || !groomImage) {
      setError("Both bride and groom images are required for Magic Creation.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const magicConfig: GenerationConfig = {
        ...config,
        // Clear attire/hairstyle/jewelry since we want to preserve original faces
        brideAttire: '',
        groomAttire: '',
        hairstyle: '',
        groomHairstyle: '',
        jewelry: ''
      };

      const imageUrl = await generatePersonalizedImage(magicConfig, brideImage, groomImage);
      setGeneratedImage(imageUrl);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while generating the magic creation.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .magic-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .magic-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .magic-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #9333ea, #ec4899);
          border-radius: 3px;
        }
        .magic-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #db2777);
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
          <div className="flex flex-col md:flex-row h-full max-h-[95vh]">
            
            {/* Left Panel - Controls */}
            <div className="md:w-1/2 p-6 overflow-y-auto max-h-full magic-scroll"
                 style={{ maxHeight: 'calc(95vh - 2rem)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
                  <span className="text-3xl mr-2">✨</span>
                  Create the Scene
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Set the final romantic scene. Feel free to change options and regenerate as many times as you like!
                </p>
              </div>
              <button 
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview Images */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-stone-100 rounded-lg">
              <div className="text-center">
                <h4 className="font-semibold mb-2 text-stone-700">Styled Bride</h4>
                {brideImage && (
                  <img src={brideImage} alt="Styled Bride" className="rounded-lg shadow-sm w-full object-cover h-24" />
                )}
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2 text-stone-700">Styled Groom</h4>
                {groomImage && (
                  <img src={groomImage} alt="Styled Groom" className="rounded-lg shadow-sm w-full object-cover h-24" />
                )}
              </div>
            </div>

            {/* Configuration Options */}
            <div className="space-y-6">
              <OptionSelector 
                label="Choose a Location" 
                options={LOCATIONS} 
                selectedValue={config.location} 
                onChange={(v) => handleConfigChange('location', v)} 
              />
              
              <OptionSelector 
                label="Bride's Pose" 
                options={BRIDE_POSES} 
                selectedValue={config.bridePose} 
                onChange={(v) => handleConfigChange('bridePose', v)} 
              />
              
              <OptionSelector 
                label="Groom's Pose" 
                options={GROOM_POSES} 
                selectedValue={config.groomPose} 
                onChange={(v) => handleConfigChange('groomPose', v)} 
              />
              
              <OptionSelector 
                label="Art Style" 
                options={STYLES} 
                selectedValue={config.style} 
                onChange={(v) => handleConfigChange('style', v)} 
              />
              
              <OptionSelector 
                label="Aspect Ratio" 
                options={ASPECT_RATIOS} 
                selectedValue={config.aspectRatio} 
                onChange={(v) => handleConfigChange('aspectRatio', v)} 
              />
            </div>

            {/* Generate Button */}
            <div className="mt-8">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !brideImage || !groomImage}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg py-4 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Magic...
                  </>
                ) : (
                  <>
                    <span className="text-2xl mr-2">✨</span>
                    Generate Scene
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Generated Image */}
          <div className="md:w-1/2 bg-gradient-to-br from-purple-50 to-pink-50 p-6 flex flex-col max-h-full overflow-y-auto magic-scroll"
               style={{ maxHeight: 'calc(95vh - 2rem)' }}>
            <h3 className="text-xl font-bold text-center text-gray-800 mb-4 flex items-center justify-center">
              <span className="text-2xl mr-2">🎨</span>
              Your Magical Creation
            </h3>

            <div className="flex-1 flex items-center justify-center">
              {isLoading ? (
                <div className="text-center">
                  <LoadingSpinner message="Creating your magical scene..." />
                  <p className="text-gray-600 mt-4 text-sm">
                    Preserving original faces while applying magical effects...
                  </p>
                </div>
              ) : generatedImage ? (
                <div className="max-w-full max-h-full overflow-hidden rounded-2xl shadow-2xl">
                  <img 
                    src={generatedImage} 
                    alt="Magic Creation Result" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 p-8">
                  <div className="text-6xl mb-4">🎭</div>
                  <p className="text-lg font-medium mb-2">Ready to create magic?</p>
                  <p className="text-sm">
                    Choose your settings and click "Generate Scene" to create your magical pre-wedding photo.
                    <br /><br />
                    <span className="text-purple-600 font-semibold">✨ Your original faces will be perfectly preserved! ✨</span>
                  </p>
                </div>
              )}
            </div>

            {generatedImage && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">
                  ✅ Original faces preserved with crystal clarity
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="bg-white text-purple-600 border border-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
                >
                  🔄 Regenerate with same faces
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
    </>
  );
};

export default MagicCreation;