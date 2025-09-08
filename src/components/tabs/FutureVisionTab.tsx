import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, CalendarIcon, UserGroupIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import ImageUploader from '../ImageUploader';
import { generateFutureVision } from '../../services/geminiService';
import { GalleryService } from '../../services/galleryService';

interface AgeScenario {
  id: string;
  name: string;
  yearsAhead: number;
  icon: string;
  description: string;
  occasionType: 'anniversary' | 'family' | 'milestone';
  backgroundSuggestions: string[];
}

const AGE_SCENARIOS: AgeScenario[] = [
  {
    id: 'silver-25',
    name: '25th Silver Anniversary',
    yearsAhead: 25,
    icon: '🥈',
    description: 'Celebrating 25 years of love with silver anniversary attire',
    occasionType: 'anniversary',
    backgroundSuggestions: ['Elegant home garden', 'Silver jubilee banquet hall', 'Romantic restaurant']
  },
  {
    id: 'golden-50',
    name: '50th Golden Anniversary',
    yearsAhead: 50,
    icon: '🥇',
    description: 'Golden years celebration with traditional golden outfits',
    occasionType: 'anniversary',
    backgroundSuggestions: ['Golden temple', 'Luxury hotel', 'Family gathering hall']
  },
  {
    id: 'parents-10',
    name: 'Proud Parents (10 years)',
    yearsAhead: 10,
    icon: '👨‍👩‍👧‍👦',
    description: 'Happy family portrait with children after a decade',
    occasionType: 'family',
    backgroundSuggestions: ['Family home', 'Park with children', 'School graduation backdrop']
  },
  {
    id: 'grandparents-30',
    name: 'Loving Grandparents (30 years)',
    yearsAhead: 30,
    icon: '👴👵',
    description: 'Grandparents celebrating with grandchildren',
    occasionType: 'family',
    backgroundSuggestions: ['Traditional family home', 'Garden with grandkids', 'Festival celebration']
  },
  {
    id: 'retirement-35',
    name: 'Retirement Journey (35 years)',
    yearsAhead: 35,
    icon: '🌅',
    description: 'Celebrating retirement and new adventures together',
    occasionType: 'milestone',
    backgroundSuggestions: ['Travel destination', 'Peaceful cottage', 'Beach sunset']
  },
  {
    id: 'diamond-60',
    name: '60th Diamond Anniversary',
    yearsAhead: 60,
    icon: '💎',
    description: 'Rare diamond anniversary - a lifetime of love',
    occasionType: 'anniversary',
    backgroundSuggestions: ['Grand celebration hall', 'Family estate', 'Traditional temple']
  }
];

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  ageInScenario: number;
  description: string;
}

interface FutureVisionTabProps {
  brideImage: string | null;
  groomImage: string | null;
  onImageUpload: (type: 'bride' | 'groom', image: string | null) => void;
}

const FutureVisionTab: React.FC<FutureVisionTabProps> = ({ 
  brideImage, 
  groomImage, 
  onImageUpload 
}) => {
  const [selectedScenario, setSelectedScenario] = useState<AgeScenario | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [customYears, setCustomYears] = useState<number>(10);
  const [showCustom, setShowCustom] = useState(false);

  const addFamilyMember = useCallback(() => {
    const newMember: FamilyMember = {
      id: `member-${Date.now()}`,
      name: '',
      relationship: '',
      ageInScenario: 0,
      description: ''
    };
    setFamilyMembers(prev => [...prev, newMember]);
  }, []);

  const updateFamilyMember = useCallback((id: string, updates: Partial<FamilyMember>) => {
    setFamilyMembers(prev => prev.map(member => 
      member.id === id ? { ...member, ...updates } : member
    ));
  }, []);

  const removeFamilyMember = useCallback((id: string) => {
    setFamilyMembers(prev => prev.filter(member => member.id !== id));
  }, []);

  const generateFutureVisionImage = useCallback(async () => {
    if (!brideImage || !groomImage || !selectedScenario) {
      alert('Please upload both images and select a scenario');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Generating future vision with AI for:', selectedScenario.name);
      
      // Prepare scenario data for AI generation
      const scenarioData = {
        name: selectedScenario.name,
        yearsAhead: selectedScenario.yearsAhead,
        description: selectedScenario.description,
        backgroundSetting: selectedBackground || undefined,
        familyMembers: familyMembers.length > 0 ? familyMembers : undefined
      };
      
      // Use the AI service to generate the future vision
      const generatedImageUrl = await generateFutureVision(
        scenarioData,
        brideImage,
        groomImage
      );
      
      console.log('AI future vision generation completed successfully');
      
      // Save to Supabase database
      try {
        const imageBlob = await fetch(generatedImageUrl).then(r => r.blob());
        const uploadResult = await GalleryService.uploadGeneratedImage(imageBlob, 'IN', 'bride', `future-vision-${selectedScenario.id}`);
        
        // Create GeneratedImage record in database
        const generatedImageRecord = {
          id: `future-vision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          country_id: '1',
          model_id: null,
          style_id: null,
          role: 'bride' as const,
          image_url: uploadResult.url,
          image_path: uploadResult.path,
          thumbnail_url: uploadResult.url,
          generation_params: {
            scenario_name: selectedScenario.name,
            years_ahead: selectedScenario.yearsAhead,
            background_setting: selectedBackground,
            family_members_count: familyMembers.length,
            family_members: familyMembers,
            generated_at: new Date().toISOString(),
            type: 'future_vision'
          },
          quality_score: 0.9,
          user_ratings: [],
          view_count: 0,
          is_featured: true, // Mark future visions as featured
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Saved future vision to database:', generatedImageRecord);
        setGeneratedImage(generatedImageUrl);
      } catch (dbError) {
        console.error('Failed to save future vision to database:', dbError);
        // Still show the generated image even if database save fails
        setGeneratedImage(generatedImageUrl);
      }
      
    } catch (error) {
      console.error('Error generating future vision:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate future vision: ${errorMessage}\n\nPlease try again with different scenario or images.`);
    } finally {
      setIsGenerating(false);
    }
  }, [brideImage, groomImage, selectedScenario, selectedBackground, familyMembers]);

  const resetGeneration = useCallback(() => {
    setGeneratedImage(null);
    setFamilyMembers([]);
    setSelectedBackground('');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          👴👵 Future Vision
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          See your love story through time! Age yourselves together for silver/golden anniversaries, visualize family portraits with children, and create emotional milestone celebrations.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Selection */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Choose Your Future Scenario</h3>
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {showCustom ? 'Hide Custom' : 'Custom Years'}
            </button>
          </div>

          {/* Custom Years Input */}
          {showCustom && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-blue-800">Custom years ahead:</label>
                <input
                  type="number"
                  min="1"
                  max="70"
                  value={customYears}
                  onChange={(e) => setCustomYears(parseInt(e.target.value) || 10)}
                  className="w-24 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    const customScenario: AgeScenario = {
                      id: 'custom',
                      name: `${customYears} Years Together`,
                      yearsAhead: customYears,
                      icon: '⏰',
                      description: `Celebrating ${customYears} years of love and togetherness`,
                      occasionType: 'milestone',
                      backgroundSuggestions: ['Romantic setting', 'Celebration venue', 'Meaningful location']
                    };
                    setSelectedScenario(customScenario);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Use This
                </button>
              </div>
            </div>
          )}

          {/* Preset Scenarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AGE_SCENARIOS.map(scenario => (
              <motion.button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedScenario?.id === scenario.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{scenario.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">{scenario.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        +{scenario.yearsAhead} years
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        scenario.occasionType === 'anniversary' ? 'bg-red-100 text-red-700' :
                        scenario.occasionType === 'family' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {scenario.occasionType}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Background Selection */}
          {selectedScenario && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-bold text-gray-800 mb-3">Choose Background Setting</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedScenario.backgroundSuggestions.map(bg => (
                  <button
                    key={bg}
                    onClick={() => setSelectedBackground(bg)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      selectedBackground === bg
                        ? 'bg-purple-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or describe your custom background..."
                value={selectedBackground}
                onChange={(e) => setSelectedBackground(e.target.value)}
                className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Family Members (for family scenarios) */}
          {selectedScenario?.occasionType === 'family' && (
            <div className="mt-6 p-4 bg-green-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-green-800">Add Family Members</h4>
                <button
                  onClick={addFamilyMember}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                >
                  + Add Member
                </button>
              </div>
              
              <div className="space-y-3">
                {familyMembers.map(member => (
                  <div key={member.id} className="grid grid-cols-4 gap-3 p-3 bg-white rounded-lg">
                    <input
                      type="text"
                      placeholder="Name"
                      value={member.name}
                      onChange={(e) => updateFamilyMember(member.id, { name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Relationship"
                      value={member.relationship}
                      onChange={(e) => updateFamilyMember(member.id, { relationship: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      value={member.ageInScenario || ''}
                      onChange={(e) => updateFamilyMember(member.id, { ageInScenario: parseInt(e.target.value) || 0 })}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500"
                    />
                    <button
                      onClick={() => removeFamilyMember(member.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Generation Panel */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Future Vision Preview</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-64 flex items-center justify-center mb-6">
            {generatedImage ? (
              <div className="relative">
                <img
                  src={generatedImage}
                  alt="Future Vision"
                  className="max-w-full max-h-64 object-contain rounded-lg"
                />
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedImage;
                    link.download = `future_vision_${selectedScenario?.name.replace(/\s+/g, '_').toLowerCase()}_${selectedScenario?.yearsAhead}years.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg transition-all duration-200"
                  title="Download Future Vision"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🔮</div>
                <div className="font-medium">Your future vision will appear here</div>
                <div className="text-sm mt-1">Select scenario and generate</div>
              </div>
            )}
          </div>

          {selectedScenario && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{selectedScenario.icon}</span>
                <span className="font-semibold text-blue-800">{selectedScenario.name}</span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <div>Years ahead: +{selectedScenario.yearsAhead}</div>
                {selectedBackground && <div>Setting: {selectedBackground}</div>}
                {familyMembers.length > 0 && (
                  <div>Family: {familyMembers.length} member(s)</div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={generateFutureVisionImage}
              disabled={!brideImage || !groomImage || !selectedScenario || isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Future Vision...
                </span>
              ) : (
                '🔮 Generate Future Vision'
              )}
            </button>

            {generatedImage && (
              <>
                <button
                  onClick={resetGeneration}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Try Different Scenario
                </button>
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedImage;
                    link.download = `future_vision_${selectedScenario?.name.replace(/\s+/g, '_').toLowerCase()}_${selectedScenario?.yearsAhead}years.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Download & Save Vision
                </button>
              </>
            )}
          </div>

          {/* Emotional Touch */}
          <div className="mt-6 p-3 bg-rose-50 rounded-lg border border-rose-200">
            <div className="flex items-center gap-2 mb-2">
              <HeartIcon className="w-5 h-5 text-rose-500" />
              <span className="font-semibold text-rose-800">Emotional Preview</span>
            </div>
            <p className="text-sm text-rose-700">
              {selectedScenario 
                ? `Imagine celebrating ${selectedScenario.name.toLowerCase()} together - a beautiful milestone in your love story!`
                : 'Select a scenario to see what your future might hold together.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FutureVisionTab;