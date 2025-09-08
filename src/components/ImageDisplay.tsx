
import React, { useState } from 'react';
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
  isSaved = false
}) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageSaved, setImageSaved] = useState(isSaved);
  const [addingToFavorites, setAddingToFavorites] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showSocialShare, setShowSocialShare] = useState(false);

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
    <div className="w-full h-[30rem] md:h-full bg-stone-100 rounded-2xl shadow-inner flex items-center justify-center p-4">
      {isLoading ? (
        <LoadingIndicator />
      ) : error ? (
        <div className="text-center text-red-500">
          <h3 className="font-bold">Oops! Something went wrong.</h3>
          <p>{error}</p>
        </div>
      ) : imageUrl ? (
        <div className="w-full h-full group relative">
          <img src={imageUrl} alt="Generated pre-wedding look" className="w-full h-full object-contain rounded-lg" />
          
          {/* Action buttons */}
          <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Add to Favorites Button */}
            {!isFavorited && (
              <button
                onClick={handleAddToFavorites}
                disabled={addingToFavorites}
                className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-all duration-300 flex items-center"
              >
                {addingToFavorites ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Favorite
                  </>
                )}
              </button>
            )}

            {/* Save Button */}
            {!imageSaved ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-all duration-300 flex items-center"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            ) : (
              <span className="bg-green-500 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Saved
              </span>
            )}
            
            {/* Download Button - Only show if saved */}
            {imageSaved && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-all duration-300 flex items-center"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={() => setShowSocialShare(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-all duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      ) : (
        <InitialState />
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
  );
};

export default ImageDisplay;
