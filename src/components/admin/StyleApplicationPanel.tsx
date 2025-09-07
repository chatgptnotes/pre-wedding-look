import React, { useState, useEffect } from 'react';
import { GalleryService } from '../../services/galleryService';
import type { 
  Country, 
  Style, 
  StyleType, 
  ModelRole,
  GenerationQueueItem 
} from '../../types/gallery';

interface StyleApplicationPanelProps {
  isAdmin: boolean;
}

const StyleApplicationPanel: React.FC<StyleApplicationPanelProps> = ({ isAdmin }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesWithModels, setCountriesWithModels] = useState<CountryWithModels[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('IN');
  const [selectedRole, setSelectedRole] = useState<ModelRole>('bride');
  const [selectedStyleType, setSelectedStyleType] = useState<StyleType>('attire');
  const [queueItems, setQueueItems] = useState<GenerationQueueItem[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingStyles, setApplyingStyles] = useState<Set<string>>(new Set());
  const [savingImageId, setSavingImageId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  useEffect(() => {
    loadCountries();
    loadCountriesWithModels();
    loadStyles();
    loadQueueStatus();
    loadGeneratedImages();
    
    // Subscribe to queue updates
    const subscription = GalleryService.subscribeToQueueUpdates(() => {
      loadQueueStatus();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadStyles();
    loadGeneratedImages();
  }, [selectedStyleType, selectedRole]);

  useEffect(() => {
    loadGeneratedImages();
  }, [selectedCountry]);

  const loadCountries = async () => {
    try {
      const data = await GalleryService.getCountries();
      setCountries(data);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadCountriesWithModels = async () => {
    try {
      const data = await GalleryService.getCountriesWithModels();
      setCountriesWithModels(data);
    } catch (error) {
      console.error('Error loading countries with models:', error);
    }
  };

  const loadGeneratedImages = async () => {
    try {
      const data = await GalleryService.getGeneratedImages({
        country: selectedCountry,
        role: selectedRole
      });
      setGeneratedImages(data);
    } catch (error) {
      console.error('Error loading generated images:', error);
    }
  };

  const loadStyles = async () => {
    try {
      setLoading(true);
      const data = await GalleryService.getStyles({
        type: selectedStyleType,
        category: selectedRole === 'bride' ? 'bride' : 'groom',
        activeOnly: true
      });
      setStyles(data);
    } catch (error) {
      console.error('Error loading styles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQueueStatus = async () => {
    try {
      const data = await GalleryService.getQueueStatus();
      setQueueItems(data);
    } catch (error) {
      console.error('Error loading queue status:', error);
    }
  };

  const handleApplyStyle = async (styleId: string) => {
    try {
      setApplyingStyles(prev => new Set(prev).add(styleId));
      
      await GalleryService.addToQueue({
        iso: selectedCountry,
        role: selectedRole,
        styleId,
        variations: 1,
        priority: 0
      });

      // Log the action
      await GalleryService.logStyleApplicationAction(
        'apply',
        selectedCountry,
        selectedRole,
        styleId,
        undefined,
        { variations: 1, priority: 0 }
      );
      
      // Show success toast
      showToast('Style applied successfully in demo mode!', 'success');
      
      // Reload queue status and generated images
      setTimeout(async () => {
        await loadQueueStatus();
        await loadGeneratedImages();
      }, 100);
      
    } catch (error) {
      console.error('Error applying style:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply style';
      showToast(errorMessage, 'error');
    } finally {
      setApplyingStyles(prev => {
        const newSet = new Set(prev);
        newSet.delete(styleId);
        return newSet;
      });
    }
  };

  const handleSaveImage = async (imageId: string) => {
    try {
      setSavingImageId(imageId);
      await GalleryService.saveGeneratedImage(imageId);
      
      // Log the action
      await GalleryService.logStyleApplicationAction(
        'save',
        selectedCountry,
        selectedRole,
        undefined,
        imageId
      );
      
      showToast('Image saved successfully!', 'success');
      await loadGeneratedImages();
    } catch (error) {
      console.error('Error saving image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save image';
      showToast(errorMessage, 'error');
    } finally {
      setSavingImageId(null);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this generated image?')) {
      return;
    }

    try {
      setDeletingImageId(imageId);
      await GalleryService.deleteGeneratedImage(imageId);
      
      // Log the action
      await GalleryService.logStyleApplicationAction(
        'delete',
        selectedCountry,
        selectedRole,
        undefined,
        imageId
      );
      
      showToast('Image deleted successfully!', 'success');
      await loadGeneratedImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      showToast(errorMessage, 'error');
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleStartOver = async () => {
    if (!confirm('Are you sure you want to delete all generated images and start over?')) {
      return;
    }

    try {
      setLoading(true);
      await GalleryService.clearGeneratedImages(selectedCountry, selectedRole);
      
      // Log the action
      await GalleryService.logStyleApplicationAction(
        'clear',
        selectedCountry,
        selectedRole,
        undefined,
        undefined,
        { cleared_all: true }
      );
      
      showToast('All images cleared. You can start over!', 'success');
      await loadGeneratedImages();
    } catch (error) {
      console.error('Error clearing images:', error);
      showToast('Failed to clear images', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchApply = async () => {
    if (!confirm(`Apply ALL ${styles.length} styles to ${selectedCountry} ${selectedRole} model?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      await GalleryService.batchAddToQueue({
        iso: selectedCountry,
        role: selectedRole,
        styleIds: styles.map(s => s.id),
        priority: -1 // Lower priority for batch
      });
      
      showToast(`Queued ${styles.length} styles for generation!`, 'success');
      await loadQueueStatus();
    } catch (error) {
      console.error('Error batch applying styles:', error);
      showToast('Failed to batch apply styles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    // This would be replaced with a proper toast library
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const currentCountry = countries.find(c => c.iso_code === selectedCountry);
  const currentCountryWithModels = countriesWithModels.find(c => c.iso_code === selectedCountry);
  const currentModel = currentCountryWithModels?.models?.[selectedRole];
  const pendingCount = queueItems.filter(item => item.status === 'pending').length;
  const processingCount = queueItems.filter(item => item.status === 'processing').length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Style Application System
        </h2>
        
        {/* Queue Status Badge */}
        <div className="flex items-center space-x-2">
          {processingCount > 0 && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium animate-pulse">
              {processingCount} Processing
            </span>
          )}
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              {pendingCount} Pending
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            {countries.map(country => (
              <option key={country.id} value={country.iso_code}>
                {country.flag_emoji} {country.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as ModelRole)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="bride">👰 Bride</option>
            <option value="groom">🤵 Groom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Style Type
          </label>
          <select
            value={selectedStyleType}
            onChange={(e) => setSelectedStyleType(e.target.value as StyleType)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="attire">👗 Attire</option>
            <option value="hairstyle">💇 Hairstyle</option>
            <option value="backdrop">🏞️ Backdrop</option>
            <option value="jewelry">💍 Jewelry</option>
            <option value="composite">🎨 Composite</option>
          </select>
        </div>
      </div>

      {/* Batch Actions */}
      {isAdmin && styles.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-900">Batch Operations</h3>
              <p className="text-sm text-purple-700 mt-1">
                Apply all {styles.length} {selectedStyleType} styles to {currentCountry?.name} {selectedRole} model
              </p>
            </div>
            <button
              onClick={handleBatchApply}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate All
            </button>
          </div>
        </div>
      )}

      {/* Styles Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {styles.map(style => (
            <StyleCard
              key={style.id}
              style={style}
              isAdmin={isAdmin}
              isApplying={applyingStyles.has(style.id)}
              onApply={() => handleApplyStyle(style.id)}
              queueStatus={queueItems.find(q => q.style_id === style.id)?.status}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && styles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No styles found for the selected filters</p>
        </div>
      )}

      {/* Current Model Display */}
      {currentModel && (
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Current {selectedRole === 'bride' ? '👰 Bride' : '🤵 Groom'} Model for {currentCountry?.flag_emoji} {currentCountry?.name}
          </h3>
          <div className="flex items-center space-x-4">
            <img
              src={currentModel.source_image_url}
              alt={`${currentCountry?.name} ${selectedRole} model`}
              className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-md"
              onError={(e) => {
                console.log('Model image failed to load:', currentModel.source_image_url);
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="text-sm text-gray-600">
              <p><strong>Model ID:</strong> {currentModel.id}</p>
              <p><strong>Uploaded:</strong> {new Date(currentModel.created_at).toLocaleDateString()}</p>
              <p className="text-green-600"><strong>✓ Ready for Style Application</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* Model Missing Warning */}
      {!currentModel && (
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            <div>
              <h4 className="font-semibold text-yellow-800">No {selectedRole} Model Available</h4>
              <p className="text-sm text-yellow-700">Please upload a {selectedRole} model for {currentCountry?.name} in the Country Models Manager before applying styles.</p>
            </div>
          </div>
        </div>
      )}

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Generated Images ({generatedImages.length})
            </h3>
            <button
              onClick={handleStartOver}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🔄 Start Over
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedImages.map((image) => (
              <div key={image.id} className="bg-gray-50 rounded-lg p-4">
                <img
                  src={image.image_url}
                  alt={`Generated ${selectedRole} with style`}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {image.style_name || 'Style Applied'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      image.is_saved 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {image.is_saved ? 'Saved' : 'Temporary'}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!image.is_saved && (
                      <button
                        onClick={() => handleSaveImage(image.id)}
                        disabled={savingImageId === image.id}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        {savingImageId === image.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>💾 Save</>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={deletingImageId === image.id}
                      className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {deletingImageId === image.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>🗑️ Delete</>
                      )}
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Generated: {new Date(image.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface StyleCardProps {
  style: Style;
  isAdmin: boolean;
  isApplying: boolean;
  onApply: () => void;
  queueStatus?: GenerationQueueItem['status'];
}

const StyleCard: React.FC<StyleCardProps> = ({
  style,
  isAdmin,
  isApplying,
  onApply,
  queueStatus
}) => {
  const getStatusBadge = () => {
    if (queueStatus === 'processing') {
      return (
        <span className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full animate-pulse">
          Processing
        </span>
      );
    }
    if (queueStatus === 'pending') {
      return (
        <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
          Queued
        </span>
      );
    }
    if (queueStatus === 'completed') {
      return (
        <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
          ✓ Done
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {getStatusBadge()}
      
      {/* Preview Image */}
      {style.preview_url ? (
        <img
          src={style.preview_url}
          alt={style.name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <span className="text-4xl">
            {style.type === 'attire' && '👗'}
            {style.type === 'hairstyle' && '💇'}
            {style.type === 'backdrop' && '🏞️'}
            {style.type === 'jewelry' && '💍'}
            {style.type === 'composite' && '🎨'}
          </span>
        </div>
      )}

      {/* Style Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{style.name}</h3>
        
        {/* Cultural Tags */}
        {style.cultural_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {style.cultural_tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Prompt Preview */}
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {style.prompt_template.positive}
        </p>

        {/* Apply Button (Admin Only) */}
        {isAdmin && !queueStatus && (
          <button
            onClick={onApply}
            disabled={isApplying}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isApplying ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Applying...
              </>
            ) : (
              'Apply to Model'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default StyleApplicationPanel;