import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryService } from '../../services/galleryService';
import type { 
  Country, 
  GeneratedImage, 
  ModelRole, 
  StyleType,
  CountryWithModels 
} from '../../types/gallery';

const GalleryTab: React.FC = () => {
  const [countries, setCountries] = useState<CountryWithModels[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('IN');
  const [selectedRole, setSelectedRole] = useState<ModelRole | 'all'>('all');
  const [selectedStyleType, setSelectedStyleType] = useState<StyleType | 'all'>('all');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [featuredImages, setFeaturedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'featured'>('featured');

  useEffect(() => {
    loadCountries();
    loadFeaturedImages();
    
    // Subscribe to real-time gallery updates
    const subscription = GalleryService.subscribeToGalleryUpdates(() => {
      if (viewMode === 'grid') {
        loadGalleryImages();
      } else {
        loadFeaturedImages();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (viewMode === 'grid') {
      loadGalleryImages();
    }
  }, [selectedCountry, selectedRole, selectedStyleType, viewMode]);

  const loadCountries = async () => {
    try {
      const data = await GalleryService.getCountriesWithModels();
      setCountries(data);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadGalleryImages = async () => {
    try {
      setLoading(true);
      const filters: any = {
        country: selectedCountry
      };
      
      if (selectedRole !== 'all') {
        filters.role = selectedRole;
      }
      
      if (selectedStyleType !== 'all') {
        filters.styleType = selectedStyleType;
      }
      
      const data = await GalleryService.getGeneratedImages(filters);
      setImages(data);
    } catch (error) {
      console.error('Error loading gallery images:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedImages = async () => {
    try {
      setLoading(true);
      const data = await GalleryService.getFeaturedImages(30);
      setFeaturedImages(data);
    } catch (error) {
      console.error('Error loading featured images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = async (image: GeneratedImage) => {
    setSelectedImage(image);
    // Increment view count
    await GalleryService.incrementViewCount(image.id);
  };

  const currentCountry = countries.find(c => c.iso_code === selectedCountry);
  const displayImages = viewMode === 'featured' ? featuredImages : images;

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 mb-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            🌍 Global Wedding Styles Gallery
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Explore pre-generated wedding styles from around the world. See how our AI adapts to different cultural aesthetics and get inspired for your own creations!
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-lg">
            <button
              onClick={() => setViewMode('featured')}
              className={`px-6 py-2 rounded-full transition-all ${
                viewMode === 'featured'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ⭐ Featured
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-6 py-2 rounded-full transition-all ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🏳️ By Country
            </button>
          </div>
        </div>

        {/* Country Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {countries.map(country => (
            <motion.button
              key={country.id}
              onClick={() => {
                setSelectedCountry(country.iso_code);
                setViewMode('grid');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-4 rounded-2xl transition-all ${
                selectedCountry === country.iso_code && viewMode === 'grid'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white/60 hover:bg-white/80 text-gray-700'
              }`}
            >
              <div className="text-3xl mb-2">{country.flag_emoji}</div>
              <div className="font-semibold">{country.name}</div>
              <div className="text-sm opacity-80">{country.imageCount} images</div>
              <div className="flex justify-center gap-1 mt-2">
                {country.models.bride && (
                  <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">👰</span>
                )}
                {country.models.groom && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">🤵</span>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Filters (for grid view) */}
        {viewMode === 'grid' && (
          <div className="flex flex-wrap justify-center gap-4">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ModelRole | 'all')}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="bride">👰 Bride</option>
              <option value="groom">🤵 Groom</option>
            </select>

            <select
              value={selectedStyleType}
              onChange={(e) => setSelectedStyleType(e.target.value as StyleType | 'all')}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Styles</option>
              <option value="attire">👗 Attire</option>
              <option value="hairstyle">💇 Hairstyle</option>
              <option value="backdrop">🏞️ Backdrop</option>
              <option value="jewelry">💍 Jewelry</option>
              <option value="composite">🎨 Composite</option>
            </select>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : displayImages.length > 0 ? (
        <motion.div 
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          <AnimatePresence>
            {displayImages.map((image, index) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="relative group cursor-pointer"
                onClick={() => handleImageClick(image)}
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg">
                  <img
                    src={image.thumbnail_url || image.image_url}
                    alt={`${image.country?.name} ${image.role}`}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{image.country?.flag_emoji}</span>
                        <span className="font-semibold">{image.country?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                          {image.role === 'bride' ? '👰' : '🤵'} {image.role}
                        </span>
                        <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                          {image.style?.name}
                        </span>
                      </div>
                      {image.view_count > 0 && (
                        <div className="text-xs mt-2 opacity-80">
                          👁️ {image.view_count} views
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Featured Badge */}
                  {image.is_featured && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      ⭐ Featured
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Images Yet</h3>
          <p className="text-gray-500">
            {viewMode === 'featured' 
              ? 'No featured images available yet.'
              : `No images generated for ${currentCountry?.name} yet.`}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Images will appear here once the admin generates them using the style application system.
          </p>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-5xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.image_url}
                alt={`${selectedImage.country?.name} ${selectedImage.role}`}
                className="w-full h-full object-contain"
              />
              
              {/* Image Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-2xl">{selectedImage.country?.flag_emoji}</span>
                  <h3 className="text-2xl font-bold">{selectedImage.country?.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {selectedImage.role === 'bride' ? '👰 Bride' : '🤵 Groom'}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {selectedImage.style?.type}
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {selectedImage.style?.name}
                  </span>
                  {selectedImage.view_count > 0 && (
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      👁️ {selectedImage.view_count} views
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryTab;