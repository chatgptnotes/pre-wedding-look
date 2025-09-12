
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { ImageStorageService } from '../services/imageStorageService';
import { FavoritesService } from '../services/favoritesService';
import SocialShare from './SocialShare';
import { ShareableImage } from '../types';

interface ImageDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onSave?: (imageUrl: string) => void;
  imageType?: 'bride' | 'groom' | 'couple';
  config?: any;
  projectId?: string;
  isSaved?: boolean;
  onRegenerateWithSameFace?: () => void;
}

const LoadingIndicator: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-rose-500"></div>
    <h3 className="text-2xl font-semibold text-stone-700">Crafting your vision...</h3>
    <p className="text-stone-500">This magical moment may take a few seconds to appear.</p>
  </div>
);

const InitialState: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-rose-50 rounded-xl border-2 border-dashed border-rose-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-rose-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-2xl font-bold text-rose-800">Your Masterpiece Awaits</h3>
        <p className="text-stone-600 mt-2">Select your preferences on the left and click "Generate" to create your unique pre-wedding photo.</p>
    </div>
);

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  imageUrl, 
  isLoading, 
  error, 
  onSave,
  imageType = 'couple',
  config,
  projectId,
  isSaved = false,
  onRegenerateWithSameFace
}) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageSaved, setImageSaved] = useState(isSaved);
  const [addingToFavorites, setAddingToFavorites] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showSocialShare, setShowSocialShare] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showImageModal) {
        setShowImageModal(false);
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  const handleSave = async () => {
    if (!imageUrl || !user || imageSaved) {
      console.log('Save conditions not met:', {
        hasImageUrl: !!imageUrl,
        hasUser: !!user,
        hasProjectId: !!projectId,
        alreadySaved: imageSaved
      });
      return;
    }
    
    // If no projectId, create a temporary one for saving
    const saveProjectId = projectId || `temp-${Date.now()}`;
    
    console.log('Starting save process...', {
      imageUrl: imageUrl.substring(0, 50) + '...',
      projectId: saveProjectId,
      imageType,
      userId: user.id
    });
    
    setSaving(true);
    try {
      const savedImage = await ImageStorageService.saveImage(
        imageUrl,
        saveProjectId,
        imageType,
        config,
        user.id
      );
      console.log('Image saved successfully:', savedImage);
      setImageSaved(true);
      onSave?.(imageUrl);
      
      // Show detailed info about where image was saved
      const savedLocation = savedImage.storage_path === 'fallback-original' ? 'Database only (original URL)' :
                           savedImage.storage_path === 'project-table' ? 'Project table' :
                           savedImage.storage_path?.includes('supabase') ? 'Supabase storage' :
                           savedImage.image_url?.includes('supabase') ? 'Supabase storage' : 'Database only';
      
      console.log('🎯 IMAGE SAVE DETAILS:', {
        location: savedLocation,
        imageUrl: savedImage.image_url?.substring(0, 100) + '...',
        storagePath: savedImage.storage_path,
        isSupabaseUrl: savedImage.image_url?.includes('supabase')
      });
      
      alert(`Image saved successfully!\n\nSaved to: ${savedLocation}`);
    } catch (error) {
      console.error('Failed to save image:', error);
      alert(`Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl || !imageSaved) return;
    
    setDownloading(true);
    try {
      const fileName = `pre-wedding-${imageType}-${Date.now()}.jpg`;
      await ImageStorageService.downloadImage(imageUrl, fileName);
      console.log('Image downloaded successfully');
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Failed to download image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!imageUrl || !user || !config) return;
    
    setAddingToFavorites(true);
    try {
      const imageId = `${projectId || 'temp'}-${imageType}-${Date.now()}`;
      const title = `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Look`;
      
      const { error } = await FavoritesService.addToFavorites(
        user.id,
        imageId,
        imageUrl,
        imageType,
        config,
        title
      );
      
      if (error) throw error;
      
      setIsFavorited(true);
      alert('Added to favorites!');
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      alert('Failed to add to favorites. Please try again.');
    } finally {
      setAddingToFavorites(false);
    }
  };

  const shareableImage: ShareableImage | null = imageUrl && config ? {
    imageUrl,
    title: `Beautiful ${imageType.charAt(0).toUpperCase() + imageType.slice(1)} Look`,
    description: `Created with Pre-wedding Look AI - A stunning ${imageType} look for your special day!`,
    config
  } : null;

  return (
    <>
    <div className="w-full bg-stone-50 rounded-2xl shadow-inner p-4 space-y-4">
      {/* Image Display Area */}
      <div className="w-full h-[32rem] md:h-[36rem] lg:h-[40rem] xl:h-[44rem] bg-stone-100 rounded-xl shadow-inner flex items-center justify-center p-2">
        {isLoading ? (
          <LoadingIndicator />
        ) : error ? (
          <div className="text-center text-red-500">
            <h3 className="font-bold">Oops! Something went wrong.</h3>
            <p>{error}</p>
          </div>
        ) : imageUrl ? (
          <div 
            className="w-full h-full group relative cursor-pointer hover:scale-[1.02] transition-transform duration-200" 
            onClick={() => {
              console.log('Image clicked, opening modal');
              setShowImageModal(true);
            }}
            title="Click to view full size"
          >
            <img 
              src={imageUrl} 
              alt="Generated pre-wedding look" 
              className="w-full h-full object-contain rounded-lg hover:opacity-95 transition-opacity duration-300" 
            />
            
            {/* Click to Enlarge Indicator */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              Click to enlarge
            </div>
          </div>
        ) : (
          <InitialState />
        )}
      </div>
      
      {/* Action Buttons Below Image */}
      {imageUrl && (
        <div className="flex flex-wrap items-center justify-center gap-3 py-2">
          {/* Add to Favorites Button */}
          {!isFavorited && (
            <button
              onClick={handleAddToFavorites}
              disabled={addingToFavorites}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white rounded-full shadow-lg transition-all duration-300 flex items-center text-sm font-semibold"
            >
              {addingToFavorites ? (
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              {addingToFavorites ? 'Adding...' : 'Favorite'}
            </button>
          )}

          {/* Save Button */}
          {!imageSaved ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-full shadow-lg transition-all duration-300 flex items-center text-sm font-semibold"
            >
              {saving ? (
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                </svg>
              )}
              {saving ? 'Saving...' : 'Save'}
            </button>
          ) : (
            <span className="px-4 py-2 bg-green-500 text-white rounded-full shadow-lg flex items-center text-sm font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Saved
            </span>
          )}

          {/* Regenerate with Same Face Button */}
          {onRegenerateWithSameFace && (
            <button
              onClick={onRegenerateWithSameFace}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full shadow-lg transition-all duration-300 flex items-center text-sm font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20l5-5m0 0H4m5 0v5M20 4l-5 5m0 0V4m0 5h5" />
              </svg>
              Regenerate
            </button>
          )}

          {/* Share Button */}
          <button
            onClick={() => setShowSocialShare(true)}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transition-all duration-300 flex items-center text-sm font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share
          </button>

          {/* Download Button - Only show if saved */}
          {imageSaved && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-full shadow-lg transition-all duration-300 flex items-center text-sm font-semibold"
            >
              {downloading ? (
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              {downloading ? 'Downloading...' : 'Download'}
            </button>
          )}
        </div>
      )}

      {/* Social Share Modal */}
      {showSocialShare && shareableImage && (
        <SocialShare
          image={shareableImage}
          isOpen={showSocialShare}
          onClose={() => setShowSocialShare(false)}
        />
      )}

    </div>
    
    {/* Modal Window - Rendered at document body level */}
    {showImageModal && imageUrl && createPortal(
      <div 
        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-8"
        onClick={() => setShowImageModal(false)}
      >
        {/* Modal Window */}
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[85vh] relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/10 hover:bg-black/20 text-gray-700 rounded-full flex items-center justify-center transition-all duration-300"
            title="Close (ESC)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Image Container */}
          <div className="p-4">
            <img
              src={imageUrl}
              alt="Generated pre-wedding look - Full Size"
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg cursor-pointer"
              onDoubleClick={() => setShowImageModal(false)}
              title="Double-click to close"
            />
          </div>
          
          {/* Bottom Info */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">✨ Your Magical Creation</h3>
                <p className="text-sm text-gray-600">AI-generated pre-wedding photo</p>
              </div>
              <div className="text-sm text-gray-600 text-right">
                <p>Double-click image to close</p>
                <p>Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">ESC</kbd> to close</p>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default ImageDisplay;
