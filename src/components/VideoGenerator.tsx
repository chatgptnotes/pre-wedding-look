import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { videoService } from '../services/videoGenerationService';
import LoadingSpinner from './LoadingSpinner';

interface VideoGeneratorProps {
  gameResults?: {
    sessionId: string;
    participants: Array<{
      avatar: string;
      designs: string[];
      reveals: string[];
    }>;
    rounds: Array<{
      theme: string;
      designs: Array<{
        image: string;
        participant: string;
      }>;
    }>;
  };
  photos?: Array<{
    url: string;
    title?: string;
    description?: string;
  }>;
  onClose: () => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ 
  gameResults, 
  photos, 
  onClose 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<Blob | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'highlight' | 'story' | 'reveal'>('highlight');

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    
    try {
      let videoBlob: Blob;
      
      if (gameResults) {
        videoBlob = await videoService.generateGameReel(gameResults);
      } else if (photos) {
        videoBlob = await videoService.generatePhotoReel(photos);
      } else {
        throw new Error('No content provided for video generation');
      }
      
      setGeneratedVideo(videoBlob);
    } catch (error) {
      console.error('Video generation failed:', error);
      alert('Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async (platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook') => {
    if (!generatedVideo) return;
    
    try {
      const result = await videoService.shareToSocialMedia(generatedVideo, platform);
      if (result.success) {
        alert(result.message || 'Video shared successfully!');
      } else {
        alert('Sharing failed: ' + result.error);
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      alert('Failed to share video');
    }
  };

  const handleDownload = () => {
    if (!generatedVideo) return;
    
    const url = URL.createObjectURL(generatedVideo);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'prewedding-ai-video.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const templates = [
    {
      id: 'highlight' as const,
      name: 'Highlight Reel',
      description: 'Quick showcase of your best photos',
      icon: '⚡',
      duration: '15-30s'
    },
    {
      id: 'story' as const,
      name: 'Story Mode',
      description: 'Narrative journey with transitions',
      icon: '📖',
      duration: '45-60s'
    },
    {
      id: 'reveal' as const,
      name: 'Big Reveal',
      description: 'Dramatic reveal with suspense',
      icon: '🎭',
      duration: '30-45s'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-0"
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6">
            <div className="flex-1 pr-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Create Video Reel
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Turn your AI photos into a shareable video
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 transition-all duration-300 text-lg sm:text-xl flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {!generatedVideo ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Template Selection */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Choose Video Style</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {templates.map((template) => (
                    <motion.button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        selectedTemplate === template.id
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-xl sm:text-2xl mb-2">{template.icon}</div>
                      <h4 className="text-sm sm:text-base font-semibold text-gray-800">{template.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">{template.description}</p>
                      <p className="text-xs text-purple-600 mt-2 font-medium">
                        Duration: {template.duration}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Content Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3">Video Content</h3>
                {gameResults && (
                  <div>
                    <p className="text-gray-600 mb-2">
                      🎮 Game session with {gameResults.participants.length} participants
                    </p>
                    <p className="text-sm text-gray-500">
                      {gameResults.rounds.length} rounds of styling challenges
                    </p>
                  </div>
                )}
                {photos && (
                  <div>
                    <p className="text-gray-600 mb-2">
                      📸 {photos.length} AI-generated photos
                    </p>
                    <p className="text-sm text-gray-500">
                      Beautiful pre-wedding photos for your highlight reel
                    </p>
                  </div>
                )}
              </div>

              {/* Generation Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Include watermark</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Add background music</span>
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-3" />
                    Generating Video...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-2xl mr-3">🎬</span>
                    Generate Video Reel
                  </div>
                )}
              </motion.button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="bg-gray-900 rounded-xl p-4 text-center">
                <div className="text-white mb-4">
                  <h3 className="text-xl font-semibold mb-2">🎉 Video Generated!</h3>
                  <p className="text-gray-300">Your video reel is ready to share</p>
                </div>
                
                {/* Preview placeholder */}
                <div className="bg-gray-800 rounded-lg p-8 mb-4">
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-gray-400">Video preview will appear here</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Format: HTML Slideshow | Size: {(generatedVideo.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📥 Download Video
                </motion.button>
                
                <motion.button
                  onClick={() => handleShare('instagram')}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📱 Share to Social
                </motion.button>
              </div>

              {/* Social Media Options */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Share directly to:</h4>
                <div className="flex space-x-3">
                  {[
                    { platform: 'instagram' as const, icon: '📷', color: 'bg-pink-500' },
                    { platform: 'tiktok' as const, icon: '🎵', color: 'bg-black' },
                    { platform: 'youtube' as const, icon: '📺', color: 'bg-red-500' },
                    { platform: 'facebook' as const, icon: '👥', color: 'bg-blue-500' },
                  ].map(({ platform, icon, color }) => (
                    <motion.button
                      key={platform}
                      onClick={() => handleShare(platform)}
                      className={`${color} text-white p-3 rounded-xl hover:opacity-80 transition-opacity`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title={`Share to ${platform}`}
                    >
                      <span className="text-xl">{icon}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Generate New Video */}
              <div className="pt-4 border-t border-gray-200">
                <motion.button
                  onClick={() => setGeneratedVideo(null)}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                  whileHover={{ scale: 1.02 }}
                >
                  ← Generate Different Style
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VideoGenerator;