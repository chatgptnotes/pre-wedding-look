import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, PlayIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';
import ImageUploader from '../ImageUploader';
import HelpCard from '../HelpCard';

interface MagicStep {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
  result?: string;
}

interface MagicButtonTabProps {
  brideImage: string | null;
  groomImage: string | null;
  onImageUpload: (type: 'bride' | 'groom', image: string | null) => void;
}

const MAGIC_STEPS: Omit<MagicStep, 'status' | 'result'>[] = [
  {
    id: 'upload',
    name: 'Image Processing',
    description: 'Analyzing bride and groom photos for face detection and quality enhancement',
    icon: '📸',
    duration: 2000
  },
  {
    id: 'styling',
    name: 'AI Styling Selection',
    description: 'Choosing perfect traditional outfits, jewelry, and makeup styles',
    icon: '👗',
    duration: 3000
  },
  {
    id: 'backgrounds',
    name: 'Location Generation',
    description: 'Creating romantic backgrounds: palace, beach, garden, and city scenes',
    icon: '🏰',
    duration: 4000
  },
  {
    id: 'poses',
    name: 'Pose Optimization',
    description: 'Generating natural romantic poses and expressions for perfect chemistry',
    icon: '💑',
    duration: 3000
  },
  {
    id: 'lighting',
    name: 'Professional Lighting',
    description: 'Applying cinematic lighting effects for that golden hour glow',
    icon: '✨',
    duration: 2500
  },
  {
    id: 'effects',
    name: 'Artistic Effects',
    description: 'Adding soft focus, dreamy filters, and romantic atmosphere',
    icon: '🎨',
    duration: 2000
  },
  {
    id: 'variations',
    name: 'Multiple Variations',
    description: 'Creating 12+ different combinations of styles, poses, and backgrounds',
    icon: '🔄',
    duration: 5000
  },
  {
    id: 'voice',
    name: 'Voice Slideshow',
    description: 'Generating romantic narration and creating video slideshow',
    icon: '🎤',
    duration: 4000
  },
  {
    id: 'compilation',
    name: 'Final Compilation',
    description: 'Packaging everything into a beautiful downloadable collection',
    icon: '📦',
    duration: 2000
  }
];

const MagicButtonTab: React.FC<MagicButtonTabProps> = ({ 
  brideImage, 
  groomImage, 
  onImageUpload 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [steps, setSteps] = useState<MagicStep[]>(
    MAGIC_STEPS.map(step => ({ ...step, status: 'pending' }))
  );
  const [totalProgress, setTotalProgress] = useState(0);
  const [completedImages, setCompletedImages] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const resetProcess = useCallback(() => {
    setIsProcessing(false);
    setCurrentStep(-1);
    setSteps(MAGIC_STEPS.map(step => ({ ...step, status: 'pending' })));
    setTotalProgress(0);
    setCompletedImages([]);
    setShowResults(false);
  }, []);

  const executeStep = useCallback(async (stepIndex: number) => {
    const step = steps[stepIndex];
    
    // Update step to processing
    setSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'processing' } : s
    ));

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, step.duration || 3000));
      
      // Generate mock results based on step type
      let result = '';
      if (step.id === 'variations') {
        // Generate mock image URLs for final results
        const mockImages = Array.from({ length: 12 }, (_, i) => 
          `https://api.placeholder.com/800x600/ff69b4/fff?text=Magic+Result+${i + 1}`
        );
        setCompletedImages(mockImages);
        result = `Generated ${mockImages.length} variations`;
      } else {
        result = `${step.name} completed successfully`;
      }

      // Mark step as completed
      setSteps(prev => prev.map((s, i) => 
        i === stepIndex ? { ...s, status: 'completed', result } : s
      ));

      // Update progress
      const newProgress = ((stepIndex + 1) / steps.length) * 100;
      setTotalProgress(newProgress);

    } catch (error) {
      console.error(`Error in step ${step.id}:`, error);
      setSteps(prev => prev.map((s, i) => 
        i === stepIndex ? { ...s, status: 'error' } : s
      ));
    }
  }, [steps]);

  const startMagicProcess = useCallback(async () => {
    if (!brideImage || !groomImage) {
      alert('Please upload both bride and groom images first');
      return;
    }

    setIsProcessing(true);
    setShowResults(false);
    
    // Execute all steps sequentially
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await executeStep(i);
    }

    // Show final results
    setCurrentStep(-1);
    setShowResults(true);
  }, [brideImage, groomImage, steps, executeStep]);

  const downloadAll = useCallback(() => {
    // Mock download functionality
    alert('Downloading all images and slideshow video...');
  }, []);

  const getStepIcon = (status: MagicStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return (
          <div className="w-5 h-5">
            <svg className="animate-spin text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        );
      case 'error':
        return <div className="w-5 h-5 bg-red-500 rounded-full"></div>;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          🪄 One-Click Magic Button
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload your photos and let AI handle everything: styling, backgrounds, poses, effects, and voice narration - all automatically!
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

      {/* Magic Button */}
      <div className="text-center mb-8">
        <motion.button
          whileHover={{ scale: isProcessing ? 1 : 1.05 }}
          whileTap={{ scale: isProcessing ? 1 : 0.95 }}
          onClick={startMagicProcess}
          disabled={isProcessing || !brideImage || !groomImage}
          className={`relative overflow-hidden px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 ${
            isProcessing 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white shadow-2xl'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 mr-3 animate-pulse" />
              Magic in Progress... {Math.round(totalProgress)}%
            </span>
          ) : showResults ? (
            <span className="flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 mr-3 text-green-400" />
              ✨ Magic Complete! Create Again?
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 mr-3" />
              🪄 Start Magic Process
            </span>
          )}
        </motion.button>

        {isProcessing && (
          <div className="mt-4 max-w-md mx-auto">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${totalProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Processing {Math.round(totalProgress)}% complete
            </p>
          </div>
        )}
      </div>

      {/* Process Steps */}
      {(isProcessing || showResults) && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Magic Process Steps</h3>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center p-4 rounded-xl border transition-all duration-300 ${
                  step.status === 'completed' 
                    ? 'bg-green-50 border-green-200' 
                    : step.status === 'processing'
                    ? 'bg-blue-50 border-blue-200 shadow-md'
                    : step.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="text-2xl mr-4">{step.icon}</div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">{step.name}</h4>
                    {getStepIcon(step.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  {step.result && (
                    <p className="text-xs text-green-600 mt-1 font-medium">{step.result}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Results Gallery */}
      {showResults && completedImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Your Magic Results! ✨</h3>
            <button
              onClick={downloadAll}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
            >
              📥 Download All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {completedImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative group cursor-pointer"
              >
                <img
                  src={image}
                  alt={`Magic result ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all duration-300 flex items-center justify-center">
                  <PlayIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <h4 className="font-bold text-gray-800 mb-2">🎁 Bonus Content Included:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Voice-narrated slideshow video
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                12+ high-resolution images
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Multiple styling variations
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Professional lighting effects
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={resetProcess}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300"
            >
              🔄 Create Another Magic Set
            </button>
          </div>
        </motion.div>
      )}

      {/* Help Card */}
      <HelpCard
        title="How Magic Button Works"
        steps={[
          {
            step: 1,
            title: "Smart Analysis",
            description: "AI analyzes your photos for face detection, lighting, and composition",
            tip: "Use clear, well-lit photos for best results"
          },
          {
            step: 2,
            title: "Automatic Styling",
            description: "Chooses perfect traditional outfits, jewelry, and makeup based on your features",
            tip: "The AI considers your complexion and features for matching"
          },
          {
            step: 3,
            title: "Background Magic",
            description: "Creates multiple romantic settings: palaces, gardens, beaches, and cities",
            tip: "Each background is carefully selected for your photo style"
          },
          {
            step: 4,
            title: "Pose Perfection",
            description: "Generates natural romantic poses with perfect chemistry",
            tip: "The AI ensures poses look natural and romantic"
          },
          {
            step: 5,
            title: "Voice Story",
            description: "Creates a romantic slideshow with AI-narrated love story",
            tip: "Include your names for personalized narration"
          },
          {
            step: 6,
            title: "Complete Package",
            description: "Delivers 12+ variations plus bonus video content",
            tip: "Allow 3-5 minutes for processing all variations"
          }
        ]}
      />
    </div>
  );
};

export default MagicButtonTab;