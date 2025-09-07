import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import TabNavigation, { TabId } from './components/TabNavigation';
import OptionSelector from './components/OptionSelector';
import ImageDisplay from './components/ImageDisplay';
import ImageUploader from './components/ImageUploader';
import MagicCreation from './components/MagicCreation';
import FavoritesModal from './components/FavoritesModal';
import ComparisonModal from './components/ComparisonModal';
// New Tab Components
import StoryboardTab from './components/tabs/StoryboardTab';
import FusionRealityTab from './components/tabs/FusionRealityTab';
import FutureVisionTab from './components/tabs/FutureVisionTab';
import BananaChallengeTab from './components/tabs/BananaChallengeTab';
import MagicButtonTab from './components/tabs/MagicButtonTab';
import VoiceSlideshowTab from './components/tabs/VoiceSlideshowTab';
import RegionalStylesTab from './components/tabs/RegionalStylesTab';
import BeyondPreWeddingTab from './components/tabs/BeyondPreWeddingTab';
import AdminPage from './components/AdminPage';
import { generatePersonalizedImage } from './services/geminiService';
import { GenerationConfig, ComparisonItem } from './types';
import { LOCATIONS, BRIDE_ATTIRE, GROOM_ATTIRE, BRIDE_POSES, GROOM_POSES, STYLES, HAIRSTYLES, GROOM_HAIRSTYLES, ASPECT_RATIOS, JEWELRY } from './constants';
import { DatabaseService } from './services/databaseService';
import { PreWeddingProject } from './lib/supabase';
import { AuthService } from './services/authService';

type AppStage = 'landing' | 'bride' | 'groom' | 'couple' | 'tabs' | 'admin';

const AppContent: React.FC = () => {
  // Temporary bypass authentication for development
  const BYPASS_AUTH = true; // Set to false to re-enable authentication
  
  // When bypassing auth, don't use auth loading state to prevent navigation loops
  const { loading: authLoading, user } = useAuth();
  const loading = BYPASS_AUTH ? false : authLoading;
  const [stage, setStage] = useState<AppStage>('landing');
  const [activeTab, setActiveTab] = useState<TabId>('classic');
  const [currentProject, setCurrentProject] = useState<PreWeddingProject | null>(null);
  
  // Original uploaded images
  const [originalBrideImage, setOriginalBrideImage] = useState<string | null>(null);
  const [originalGroomImage, setOriginalGroomImage] = useState<string | null>(null);

  // Intermediary generated solo images
  const [generatedBrideImage, setGeneratedBrideImage] = useState<string | null>(null);
  const [generatedGroomImage, setGeneratedGroomImage] = useState<string | null>(null);
  
  // Final image
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [selectedViewImage, setSelectedViewImage] = useState<string | null>(null);

  const [config, setConfig] = useState<GenerationConfig>({
    location: LOCATIONS[1].promptValue,
    brideAttire: BRIDE_ATTIRE[1].promptValue,
    groomAttire: GROOM_ATTIRE[1].promptValue,
    bridePose: BRIDE_POSES[1].promptValue,
    groomPose: GROOM_POSES[1].promptValue,
    style: STYLES[0].promptValue,
    hairstyle: HAIRSTYLES[1].promptValue,
    groomHairstyle: GROOM_HAIRSTYLES[1].promptValue,
    aspectRatio: ASPECT_RATIOS[1].promptValue,
    jewelry: JEWELRY[0].promptValue,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showMagicCreation, setShowMagicCreation] = useState<boolean>(false);
  
  // New feature states
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);

  const handleConfigChange = useCallback((key: keyof GenerationConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const handleGenerateBride = async () => {
    if (!originalBrideImage) {
      setError("Please upload a photo for the bride.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Create a config specifically for the solo bride shot
      const soloBrideConfig: GenerationConfig = {
        ...config,
        location: '', // No location for solo portrait
        groomAttire: '',
        groomPose: '',
        groomHairstyle: '',
        bridePose: BRIDE_POSES.find(p => p.id === 'bpose1')?.promptValue || 'standing in a front view portrait', // Default to front view
        style: STYLES[0].promptValue // Default to cinematic for consistency
      };
      const imageUrl = await generatePersonalizedImage(soloBrideConfig, originalBrideImage, null);
      setGeneratedBrideImage(imageUrl);
      // Auto-add to comparison
      addToComparison(imageUrl, 'bride');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred while generating the bride's image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateGroom = async () => {
    if (!originalGroomImage) {
      setError("Please upload a photo for the groom.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const soloGroomConfig: GenerationConfig = {
          ...config,
          location: '',
          brideAttire: '',
          bridePose: '',
          hairstyle: '',
          jewelry: '',
          groomPose: GROOM_POSES.find(p => p.id === 'gpose1')?.promptValue || 'standing in a front view portrait', // Default to front view
          style: STYLES[0].promptValue
      };
      const imageUrl = await generatePersonalizedImage(soloGroomConfig, null, originalGroomImage);
      setGeneratedGroomImage(imageUrl);
      // Auto-add to comparison
      addToComparison(imageUrl, 'groom');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred while generating the groom's image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCouple = async () => {
    if (!generatedBrideImage || !generatedGroomImage) {
      setError("Generated bride and groom images are missing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Use only relevant config for the final scene
      const coupleConfig: GenerationConfig = {
        ...config,
        brideAttire: '', // Attire is already in the generated images
        groomAttire: '',
        hairstyle: '',
        groomHairstyle: '',
        jewelry: ''
      };
      const imageUrl = await generatePersonalizedImage(coupleConfig, generatedBrideImage, generatedGroomImage);
      setFinalImage(imageUrl);
      setSelectedViewImage(null); // Clear selected view when new image is generated
      // Auto-add to comparison
      addToComparison(imageUrl, 'couple');
      // Stay on the 'couple' stage to allow for more edits
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred while generating the couple's image.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartOver = () => {
    setStage('landing');
    setOriginalBrideImage(null);
    setOriginalGroomImage(null);
    setGeneratedBrideImage(null);
    setGeneratedGroomImage(null);
    setFinalImage(null);
    setSelectedViewImage(null);
    setError(null);
    setComparisonItems([]); // Clear comparison items when starting over
  };

  // Add generated images to comparison
  const addToComparison = useCallback((imageUrl: string, imageType: 'bride' | 'groom' | 'couple') => {
    const newItem: ComparisonItem = {
      id: Date.now().toString(),
      imageUrl,
      config,
      imageType,
      title: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Look - ${new Date().toLocaleTimeString()}`
    };
    setComparisonItems(prev => [...prev, newItem]);
  }, [config]);

  const handleGetStarted = async () => {
    // Set stage to tabs view instead of bride
    setStage('tabs');
    
    // Create project in background without blocking the UI
    if (!BYPASS_AUTH && user) {
      setTimeout(async () => {
        try {
          // Add timeout to database operation
          const projectPromise = DatabaseService.createProject(
            `Project ${Date.now()}`,
            user.id,
            'Bride',
            'Groom'
          );
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database operation timeout')), 3000)
          );
          
          const result = await Promise.race([projectPromise, timeoutPromise]) as { data: any, error: any };
          const { data: project, error } = result;
          
          
          if (error) {
            console.error('Failed to create project:', error);
          } else {
            setCurrentProject(project);
          }
        } catch (error) {
          console.error('Error creating project:', error);
        }
      }, 0);
    }
  };

  const handleExploreMode = useCallback((modeId: string) => {
    // Convert feature IDs to tab IDs
    const tabMapping: Record<string, TabId> = {
      'classic': 'classic',
      'storyboard': 'storyboard',
      'fusion': 'fusion',
      'future-vision': 'future-vision',
      'banana-challenge': 'banana-challenge',
      'voice-slideshow': 'voice-slideshow',
      'magic-button': 'magic-button',
      'regional-styles': 'regional-styles',
      'beyond-pre-wedding': 'beyond-pre-wedding'
    };
    
    const tabId = tabMapping[modeId] || 'classic';
    setActiveTab(tabId);
  }, []);

  const handleImageUpload = useCallback((type: 'bride' | 'groom', image: string | null) => {
    if (type === 'bride') {
      setOriginalBrideImage(image);
    } else {
      setOriginalGroomImage(image);
    }
  }, []);
  
  const displayImageUrl = selectedViewImage || finalImage || generatedGroomImage || generatedBrideImage;

  // Show loading spinner while authentication is initializing (after all hooks)
  if (!BYPASS_AUTH && loading) {
    return <LoadingSpinner message="Initializing app..." />;
  }

  // Show landing page first
  if (stage === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} onExploreMode={handleExploreMode} />;
  }

  // Show admin page
  if (stage === 'admin') {
    return <AdminPage onBack={() => setStage('tabs')} />;
  }

  // Show new tab-based interface
  if (stage === 'tabs') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden">
        {/* Modern Floating Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-56 h-56 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <Header 
          onShowFavorites={() => setShowFavorites(true)} 
          onShowComparison={() => setShowComparison(true)} 
        />
        <main className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Tab Navigation */}
            <TabNavigation 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
              className="sticky top-4 z-10" 
            />

            {/* Tab Content */}
            <div className="min-h-screen relative">
              {activeTab === 'classic' && (
                <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/50">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      💑 Classic Pre-Wedding Mode
                    </h2>
                    <p className="text-gray-600">Traditional step-by-step pre-wedding photo creation</p>
                  </div>
                  <button
                    onClick={() => setStage('bride')}
                    className="w-full bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold py-4 px-8 rounded-lg hover:from-rose-700 hover:to-pink-700 transition-all duration-300"
                  >
                    Start Classic Mode
                  </button>
                </div>
              )}
              
              {activeTab === 'storyboard' && (
                <StoryboardTab 
                  brideImage={originalBrideImage}
                  groomImage={originalGroomImage}
                  onImageUpload={handleImageUpload}
                />
              )}
              
              {activeTab === 'fusion' && (
                <FusionRealityTab 
                  brideImage={originalBrideImage}
                  groomImage={originalGroomImage}
                  onImageUpload={handleImageUpload}
                />
              )}
              
              {activeTab === 'future-vision' && (
                <FutureVisionTab 
                  brideImage={originalBrideImage}
                  groomImage={originalGroomImage}
                  onImageUpload={handleImageUpload}
                />
              )}
              
              {activeTab === 'banana-challenge' && (
                <BananaChallengeTab 
                  brideImage={originalBrideImage}
                  groomImage={originalGroomImage}
                  onImageUpload={handleImageUpload}
                />
              )}
              
              {activeTab === 'voice-slideshow' && (
                <VoiceSlideshowTab 
                  brideImage={originalBrideImage}
                  groomImage={originalGroomImage}
                  onImageUpload={handleImageUpload}
                />
              )}
              
              {activeTab === 'magic-button' && (
                <MagicButtonTab 
                  brideImage={originalBrideImage}
                  groomImage={originalGroomImage}
                  onImageUpload={handleImageUpload}
                />
              )}
              
              {activeTab === 'regional-styles' && (
                <RegionalStylesTab 
                  brideImage={originalBrideImage}
                  groomImage={originalGroomImage}
                  onImageUpload={handleImageUpload}
                />
              )}
              
              {activeTab === 'beyond-pre-wedding' && (
                <BeyondPreWeddingTab 
                  brideImage={originalBrideImage}
                  groomImage={originalGroomImage}
                  onImageUpload={handleImageUpload}
                />
              )}
            </div>
          </div>
        </main>
        
        {/* Floating Action Buttons - Improved positioning to prevent overlap */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50 max-w-[200px]">
          {/* Admin Access Button (Admin users only) */}
          {AuthService.isAdmin(user) && (
            <div className="relative group">
              <button
                onClick={() => {
                  try {
                    AuthService.requireAdmin(user);
                    setStage('admin');
                  } catch (error) {
                    alert('Access denied. Admin privileges required.');
                  }
                }}
                className="group bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border border-white/20 relative min-w-[60px] min-h-[60px] flex items-center justify-center"
                title={`Admin Dashboard - ${AuthService.getUserDisplayInfo(user).roleLabel}`}
              >
                {/* Role indicator badge - repositioned to avoid overlap */}
                <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-xl shadow-lg whitespace-nowrap">
                  {AuthService.isSuperAdmin(user) ? '👑 SUPER' : '⚡ ADMIN'}
                </div>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {/* Tooltip on hover - positioned to avoid viewport overflow */}
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-60">
                Admin Dashboard
                <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900"></div>
              </div>
            </div>
          )}

          {/* Home Button */}
          <div className="relative group">
            <button
              onClick={() => setStage('landing')}
              className="bg-white/90 backdrop-blur-xl text-slate-700 hover:text-indigo-600 p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-white/50 min-w-[60px] min-h-[60px] flex items-center justify-center"
              title="Back to Home"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            
            {/* Tooltip on hover */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-60">
              Back to Home
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900"></div>
            </div>
          </div>
        </div>
        
        {/* Modals */}
        <FavoritesModal
          isOpen={showFavorites}
          onClose={() => setShowFavorites(false)}
          onSelectImage={(imageUrl, config) => {
            console.log('Selected favorite:', { imageUrl, config });
          }}
        />
        <ComparisonModal
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          initialImages={comparisonItems}
        />
      </div>
    );
  }

  // Classic mode (original implementation)
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-pink-50/30 to-purple-50/50">
      <Header 
        onShowFavorites={() => setShowFavorites(true)} 
        onShowComparison={() => setShowComparison(true)} 
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 sm:gap-8 max-w-7xl mx-auto">
          
          <div className="xl:col-span-3 bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/50 self-start hover:shadow-3xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-gradient-to-r from-rose-200 to-pink-200">
                <div className="mb-4 sm:mb-0">
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    {stage === 'bride' && (
                      <span className="flex items-center">
                        <span className="text-3xl mr-2">👰</span>
                        Step 1: Style the Bride
                      </span>
                    )}
                    {stage === 'groom' && (
                      <span className="flex items-center">
                        <span className="text-3xl mr-2">🤵</span>
                        Step 2: Style the Groom
                      </span>
                    )}
                    {stage === 'couple' && (
                      <span className="flex items-center">
                        <span className="text-3xl mr-2">💕</span>
                        Step 3: Create the Scene
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {stage === 'bride' && "Upload a clear photo of the bride and choose her perfect look."}
                    {stage === 'groom' && "Now upload the groom's photo and select his handsome style."}
                    {stage === 'couple' && "Set the final romantic scene. Feel free to change options and regenerate as many times as you like!"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                      onClick={() => setStage('tabs')}
                      className="bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 hover:text-purple-800 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      New Features
                  </button>
                  <button 
                      onClick={handleStartOver}
                      className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-rose-100 hover:to-pink-100 text-gray-700 hover:text-rose-600 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-5.13M20 15a9 9 0 01-14.13 5.13" />
                      </svg>
                      Start Over
                  </button>
                </div>
            </div>

            {stage === 'bride' && (
              <div className="space-y-8">
                <ImageUploader label="Upload Bride's Photo" image={originalBrideImage} onImageChange={setOriginalBrideImage} onImageReset={() => setOriginalBrideImage(null)} />
                <OptionSelector label="Bride's Attire" options={BRIDE_ATTIRE} selectedValue={config.brideAttire} onChange={(v) => handleConfigChange('brideAttire', v)} />
                <OptionSelector label="Bride's Hairstyle" options={HAIRSTYLES} selectedValue={config.hairstyle} onChange={(v) => handleConfigChange('hairstyle', v)} />
                <OptionSelector label="Bride's Jewelry" options={JEWELRY} selectedValue={config.jewelry} onChange={(v) => handleConfigChange('jewelry', v)} />
              </div>
            )}

            {stage === 'groom' && (
              <div className="space-y-8">
                <ImageUploader label="Upload Groom's Photo" image={originalGroomImage} onImageChange={setOriginalGroomImage} onImageReset={() => setOriginalGroomImage(null)} />
                <OptionSelector label="Groom's Attire" options={GROOM_ATTIRE} selectedValue={config.groomAttire} onChange={(v) => handleConfigChange('groomAttire', v)} />
                <OptionSelector label="Groom's Hairstyle" options={GROOM_HAIRSTYLES} selectedValue={config.groomHairstyle} onChange={(v) => handleConfigChange('groomHairstyle', v)} />
              </div>
            )}

            {stage === 'couple' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-stone-100 rounded-lg">
                    <div className="relative group">
                        <h4 className="font-semibold text-center mb-2 text-stone-700">Styled Bride</h4>
                        <div className="relative cursor-pointer" onClick={() => setSelectedViewImage(originalBrideImage || '')}>
                            <img src={generatedBrideImage || ''} alt="Styled Bride" className="rounded-lg shadow-sm w-full object-cover hover:opacity-90 transition-opacity" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-lg transition-all duration-300 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-semibold text-sm bg-black bg-opacity-60 px-3 py-1 rounded-full">
                                    Click for original HD photo
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative group">
                        <h4 className="font-semibold text-center mb-2 text-stone-700">Styled Groom</h4>
                        <div className="relative cursor-pointer" onClick={() => setSelectedViewImage(originalGroomImage || '')}>
                            <img src={generatedGroomImage || ''} alt="Styled Groom" className="rounded-lg shadow-sm w-full object-cover hover:opacity-90 transition-opacity" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-lg transition-all duration-300 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-semibold text-sm bg-black bg-opacity-60 px-3 py-1 rounded-full">
                                    Click for original HD photo
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <OptionSelector label="Choose a Location" options={LOCATIONS} selectedValue={config.location} onChange={(v) => handleConfigChange('location', v)} />
                    <OptionSelector label="Bride's Pose" options={BRIDE_POSES} selectedValue={config.bridePose} onChange={(v) => handleConfigChange('bridePose', v)} />
                    <OptionSelector label="Groom's Pose" options={GROOM_POSES} selectedValue={config.groomPose} onChange={(v) => handleConfigChange('groomPose', v)} />
                    <OptionSelector label="Art Style" options={STYLES} selectedValue={config.style} onChange={(v) => handleConfigChange('style', v)} />
                    <OptionSelector label="Aspect Ratio" options={ASPECT_RATIOS} selectedValue={config.aspectRatio} onChange={(v) => handleConfigChange('aspectRatio', v)} />
                </div>
              </div>
            )}
            
            <div className="mt-8">
              {stage === 'bride' && (
                <div className="space-y-4">
                  <button
                    onClick={handleGenerateBride}
                    disabled={!originalBrideImage || isLoading}
                    className="w-full bg-rose-600 text-white font-bold text-lg py-4 rounded-lg shadow-md hover:bg-rose-700 transition-all duration-300 disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Style Bride"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Styling...
                      </>
                    ) : 'Style Bride'}
                  </button>
                  <button
                    onClick={() => setStage('groom')}
                    disabled={!generatedBrideImage}
                    className="w-full bg-white text-rose-600 border border-rose-600 font-bold text-lg py-3 rounded-lg shadow-sm hover:bg-rose-50 transition-all duration-300 disabled:bg-stone-100 disabled:text-stone-400 disabled:border-stone-300 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Continue to Groom"
                  >
                    Continue to Groom &rarr;
                  </button>
                </div>
              )}

              {stage === 'groom' && (
                <div className="space-y-4">
                  <button
                    onClick={handleGenerateGroom}
                    disabled={!originalGroomImage || isLoading}
                    className="w-full bg-rose-600 text-white font-bold text-lg py-4 rounded-lg shadow-md hover:bg-rose-700 transition-all duration-300 disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Style Groom"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Styling...
                      </>
                    ) : 'Style Groom'}
                  </button>
                  <button
                    onClick={() => setStage('couple')}
                    disabled={!generatedGroomImage}
                    className="w-full bg-white text-rose-600 border border-rose-600 font-bold text-lg py-3 rounded-lg shadow-sm hover:bg-rose-50 transition-all duration-300 disabled:bg-stone-100 disabled:text-stone-400 disabled:border-stone-300 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Continue to Scene"
                  >
                    Continue to Scene &rarr;
                  </button>
                </div>
              )}

              {stage === 'couple' && (
                <div className="space-y-4">
                  <button
                    onClick={handleGenerateCouple}
                    disabled={isLoading}
                    className="w-full bg-rose-600 text-white font-bold text-lg py-4 rounded-lg shadow-md hover:bg-rose-700 transition-all duration-300 disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Generate Scene"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : '✨ Generate Scene'}
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowMagicCreation(true)}
                      disabled={!generatedBrideImage || !generatedGroomImage}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg py-4 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label="Magic Creation"
                    >
                      <span className="text-2xl mr-2">🎨</span>
                      Magic Creation
                    </button>
                    
                    <button
                      onClick={() => setShowComparison(true)}
                      disabled={comparisonItems.length === 0}
                      className="bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold text-lg py-4 rounded-lg shadow-md hover:from-blue-700 hover:to-teal-700 transition-all duration-300 disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label="Compare Looks"
                    >
                      <span className="text-2xl mr-2">🔍</span>
                      Compare ({comparisonItems.length})
                    </button>
                  </div>
                  
                  <p className="text-center text-sm text-gray-600">
                    Use <strong>Magic Creation</strong> for multiple poses & effects while preserving original faces!<br/>
                    <strong>Compare</strong> different looks side by side to pick your favorite!
                  </p>
                </div>
              )}
            </div>

          </div>
          
          <div className="xl:col-span-2 lg:sticky lg:top-24 self-start">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-8 hover:shadow-3xl transition-all duration-300">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 sm:mb-6 text-center">
                ✨ Your Magical Creation
              </h3>
              <ImageDisplay 
                imageUrl={displayImageUrl} 
                isLoading={isLoading} 
                error={error}
                projectId={currentProject?.id}
                config={config}
                imageType={finalImage ? 'couple' : generatedGroomImage ? 'groom' : 'bride'}
              />
            </div>
          </div>

        </div>
      </main>
      <footer className="text-center p-4 text-stone-500 text-sm">
        <p>Powered by Google Gemini. Designed for inspiration.</p>
      </footer>
      
      {/* Magic Creation Modal */}
      {showMagicCreation && (
        <MagicCreation 
          brideImage={generatedBrideImage} 
          groomImage={generatedGroomImage} 
          onClose={() => setShowMagicCreation(false)} 
        />
      )}

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onSelectImage={(imageUrl, config) => {
          // Handle selecting an image from favorites (could load it into the main view)
          console.log('Selected favorite:', { imageUrl, config });
        }}
      />

      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        initialImages={comparisonItems}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;