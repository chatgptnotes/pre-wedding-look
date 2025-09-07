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
  const [styles, setStyles] = useState<Style[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('IN');
  const [selectedRole, setSelectedRole] = useState<ModelRole>('bride');
  const [selectedStyleType, setSelectedStyleType] = useState<StyleType>('attire');
  const [queueItems, setQueueItems] = useState<GenerationQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingStyles, setApplyingStyles] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCountries();
    loadStyles();
    loadQueueStatus();
    
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
  }, [selectedStyleType, selectedRole]);

  const loadCountries = async () => {
    try {
      const data = await GalleryService.getCountries();
      setCountries(data);
    } catch (error) {
      console.error('Error loading countries:', error);
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
      
      // Show success toast
      showToast('Style applied successfully in demo mode!', 'success');
      
      // Reload queue status with a small delay to ensure state updates
      setTimeout(async () => {
        await loadQueueStatus();
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