import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import ImageUploader from '../ImageUploader';
import HelpCard from '../HelpCard';

interface RegionalStyle {
  id: string;
  name: string;
  region: string;
  description: string;
  brideAttire: string;
  groomAttire: string;
  colors: string[];
  jewelry: string;
  backdrop: string;
  rituals: string[];
  icon: string;
  flag: string;
}

const REGIONAL_STYLES: RegionalStyle[] = [
  {
    id: 'marathi',
    name: 'Marathi Wedding',
    region: 'Maharashtra',
    description: 'Traditional Maharashtrian wedding with rich cultural elements and golden silk sarees',
    brideAttire: 'Nauvari saree (9-yard drape) in golden yellow or green with traditional borders, blouse with intricate embroidery',
    groomAttire: 'Dhoti-kurta with Nehru jacket, traditional pagdi (turban), and silk stole',
    colors: ['#FFD700', '#8B4513', '#FF6347', '#228B22'],
    jewelry: 'Mundavalya (pearl strings on forehead), Nath (nose ring), Kolhapuri saaj, green bangles, toe rings',
    backdrop: 'Temple mandap with marigold decorations, traditional Maharashtrian architecture',
    rituals: ['Haldi ceremony', 'Antarpat ritual', 'Saptapadi around sacred fire', 'Mangalsutra ceremony'],
    icon: '👑',
    flag: '🏛️'
  },
  {
    id: 'tamil',
    name: 'Tamil Wedding',
    region: 'Tamil Nadu',
    description: 'South Indian Tamil wedding with temple traditions and vibrant Kanjivaram sarees',
    brideAttire: 'Kanjivaram silk saree in red, gold, or maroon with heavy zari work, traditional blouse with elbow-length sleeves',
    groomAttire: 'White or cream dhoti with angavastram, silk shirt, and traditional lungi',
    colors: ['#DC143C', '#FFD700', '#8B0000', '#FFFFFF'],
    jewelry: 'Temple jewelry set with Lakshmi coins, heavy gold necklaces, armlets, waist chain, anklets',
    backdrop: 'Temple setting with banana leaves, coconuts, traditional kolam patterns',
    rituals: ['Nichayathartham engagement', 'Kashi Yatra', 'Oonjal swing ceremony', 'Saptapadi'],
    icon: '🌸',
    flag: '🕉️'
  },
  {
    id: 'punjabi',
    name: 'Punjabi Wedding',
    region: 'Punjab',
    description: 'Vibrant Punjabi wedding with energetic celebrations and heavy lehengas',
    brideAttire: 'Heavy lehenga in red or maroon with extensive gold embroidery, dupatta with gota work',
    groomAttire: 'Cream or beige sherwani with churidar, turban with kalgi, dupatta, and mojari shoes',
    colors: ['#DC143C', '#FFD700', '#FF69B4', '#FFFACD'],
    jewelry: 'Heavy kundan and polki jewelry, maang tikka, nath, chooda (red and white bangles), payal',
    backdrop: 'Gurdwara or decorated hall with marigold and rose flowers, Sikh religious symbols',
    rituals: ['Roka ceremony', 'Mehendi and Sangeet', 'Anand Karaj', 'Doli ceremony'],
    icon: '💃',
    flag: '🗡️'
  },
  {
    id: 'bengali',
    name: 'Bengali Wedding',
    region: 'West Bengal',
    description: 'Bengali wedding with fish and rice rituals, red and white traditional wear',
    brideAttire: 'Red Banarasi or Baluchari saree with white and red borders, blouse with traditional motifs',
    groomAttire: 'White dhoti with red border, kurta, traditional gamcha, and topor (tall hat)',
    colors: ['#DC143C', '#FFFFFF', '#FFD700', '#8B0000'],
    jewelry: 'Shakha pola (white and red bangles), gold jewelry, necklaces, maang tikka, nose ring',
    backdrop: 'Decorated mandap with alpana (rice paste designs), banana leaves, fish decorations',
    rituals: ['Gaye Holud (turmeric ceremony)', 'Subho Drishti', 'Mala Badal', 'Sindoor Daan'],
    icon: '🐟',
    flag: '📚'
  },
  {
    id: 'gujarati',
    name: 'Gujarati Wedding',
    region: 'Gujarat',
    description: 'Gujarati wedding with Garba traditions and colorful celebrations',
    brideAttire: 'Panetar saree (white/cream with red border) or colorful lehenga with mirror work',
    groomAttire: 'Cream or white dhoti-kurta with Nehru jacket, pagdi, and traditional stole',
    colors: ['#FFFFFF', '#DC143C', '#FFD700', '#FF69B4'],
    jewelry: 'Antique gold jewelry, heavy necklaces, armlets, traditional nose ring, toe rings',
    backdrop: 'Decorated mandap with vibrant fabrics, mirrors, and traditional Gujarati motifs',
    rituals: ['Pithi ceremony', 'Garba and Dandiya', 'Jaan ceremony', 'Saptapadi'],
    icon: '🪞',
    flag: '🦁'
  },
  {
    id: 'rajasthani',
    name: 'Rajasthani Wedding',
    region: 'Rajasthan',
    description: 'Royal Rajasthani wedding with regal attire and palace-like decorations',
    brideAttire: 'Heavy lehenga in red, maroon, or pink with extensive mirror work and gota patti',
    groomAttire: 'Royal sherwani with churidar, traditional pagdi with kalgi, mojari, sword',
    colors: ['#8B0000', '#FFD700', '#FF1493', '#DDA0DD'],
    jewelry: 'Kundan and meenakari jewelry, borla (maang tikka), heavy necklaces, armlets, payal',
    backdrop: 'Palace courtyard or haveli with colorful fabrics, puppets, traditional Rajasthani architecture',
    rituals: ['Tilak ceremony', 'Mehendi with intricate designs', 'Baraat with horse', 'Kanyadaan'],
    icon: '👸',
    flag: '🏰'
  },
  {
    id: 'malayali',
    name: 'Malayali Wedding',
    region: 'Kerala',
    description: 'Simple yet elegant Kerala wedding with white and gold traditional wear',
    brideAttire: 'White or cream Kerala saree with gold border (set mundu), traditional blouse',
    groomAttire: 'White mundu with gold border, white kurta, traditional Kerala hat or bare head',
    colors: ['#FFFFFF', '#FFD700', '#8B4513', '#F5DEB3'],
    jewelry: 'Traditional gold jewelry, temple ornaments, jasmine flowers in hair, gold bangles',
    backdrop: 'Traditional Kerala home courtyard with banana leaves, coconut decorations, oil lamps',
    rituals: ['Nischayam (engagement)', 'Tali kettu (tying the thali)', 'Saptapadi', 'Talambralu'],
    icon: '🥥',
    flag: '🌴'
  },
  {
    id: 'kashmiri',
    name: 'Kashmiri Wedding',
    region: 'Kashmir',
    description: 'Kashmiri Pandit wedding with intricate rituals and beautiful traditional attire',
    brideAttire: 'Pheran (traditional Kashmiri dress) with heavy embroidery, or silk saree with Kashmiri shawl',
    groomAttire: 'Traditional Kashmiri suit with pheran, cap, and woolen shawl',
    colors: ['#8B0000', '#FFD700', '#FFFFFF', '#4B0082'],
    jewelry: 'Traditional Kashmiri jewelry, gold ornaments, temple jewelry, nose ring',
    backdrop: 'Mountain backdrop with traditional Kashmiri architecture, shikara boats, gardens',
    rituals: ['Kasamdry ceremony', 'Devgon ritual', 'Kanyadaan', 'Satphere (seven rounds)'],
    icon: '🏔️',
    flag: '🌹'
  },
  {
    id: 'christian',
    name: 'Christian Wedding',
    region: 'Pan-India',
    description: 'Indian Christian wedding blending Western traditions with Indian elements',
    brideAttire: 'White wedding gown with train and veil, or white saree with church-appropriate styling',
    groomAttire: 'Black or navy blue suit with tie, or formal Indo-western outfit',
    colors: ['#FFFFFF', '#000000', '#C0C0C0', '#F0F8FF'],
    jewelry: 'Pearl jewelry, minimal gold ornaments, cross pendant, wedding rings',
    backdrop: 'Church altar with flowers, candles, cross, or garden setting with Christian elements',
    rituals: ['Ring exchange ceremony', 'Wedding vows', 'Unity candle', 'First dance'],
    icon: '✝️',
    flag: '⛪'
  },
  {
    id: 'muslim',
    name: 'Muslim Wedding',
    region: 'Pan-India',
    description: 'Islamic wedding (Nikah) with traditional ceremonies and elegant attire',
    brideAttire: 'Heavy lehenga or sharara in red, maroon, or gold with dupatta covering head',
    groomAttire: 'Sherwani with churidar or formal suit, traditional cap (topi), dupatta',
    colors: ['#8B0000', '#FFD700', '#228B22', '#FFFFFF'],
    jewelry: 'Gold jewelry, maang tikka, necklaces, bangles, anklets, nose ring (optional)',
    backdrop: 'Mosque courtyard or decorated hall with Islamic calligraphy, crescents, flowers',
    rituals: ['Nikah ceremony', 'Mehr (dower) exchange', 'Ring ceremony', 'Walima reception'],
    icon: '🌙',
    flag: '☪️'
  }
];

interface RegionalStylesTabProps {
  brideImage: string | null;
  groomImage: string | null;
  onImageUpload: (type: 'bride' | 'groom', image: string | null) => void;
}

const RegionalStylesTab: React.FC<RegionalStylesTabProps> = ({ 
  brideImage, 
  groomImage, 
  onImageUpload 
}) => {
  const [selectedStyle, setSelectedStyle] = useState<RegionalStyle | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showStyleDetails, setShowStyleDetails] = useState(false);

  const generateRegionalStyle = useCallback(async (style: RegionalStyle) => {
    if (!brideImage || !groomImage) {
      alert('Please upload both bride and groom images first');
      return;
    }

    setIsGenerating(true);
    try {
      // Import the AI generation service
      const { generateRegionalStyleImages } = await import('../../services/geminiService');
      
      // Generate multiple images with regional style variations
      const generatedImages = await generateRegionalStyleImages(
        style,
        brideImage,
        groomImage,
        6 // Generate 6 variations
      );
      
      setGeneratedImages(generatedImages);
    } catch (error) {
      console.error('Error generating regional style:', error);
      
      // Fallback to mock images if AI fails
      const fallbackImages = Array.from({ length: 6 }, (_, i) => 
        `https://api.placeholder.com/800x600/${style.colors[0].replace('#', '')}/fff?text=${style.name}+${i + 1}`
      );
      setGeneratedImages(fallbackImages);
      
      alert('AI generation failed. Showing preview images.');
    } finally {
      setIsGenerating(false);
    }
  }, [brideImage, groomImage]);

  const handleStyleSelect = useCallback((style: RegionalStyle) => {
    setSelectedStyle(style);
    setGeneratedImages([]);
    setShowStyleDetails(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          🏛️ Regional Wedding Styles
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Celebrate your cultural heritage with authentic regional wedding styles. From Marathi traditions to Tamil ceremonies, create beautiful photos in your cultural style.
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

      {/* Regional Styles Grid */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Choose Your Cultural Style</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REGIONAL_STYLES.map((style) => (
            <motion.div
              key={style.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 ${
                selectedStyle?.id === style.id
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
              }`}
              onClick={() => handleStyleSelect(style)}
            >
              {/* Style Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{style.icon}</span>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">{style.name}</h4>
                    <p className="text-sm text-gray-600">{style.region}</p>
                  </div>
                </div>
                <span className="text-xl">{style.flag}</span>
              </div>

              {/* Color Palette */}
              <div className="flex space-x-2 mb-3">
                {style.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">{style.description}</p>

              {/* Selection Indicator */}
              {selectedStyle?.id === style.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3"
                >
                  <CheckCircleIcon className="w-6 h-6 text-purple-500" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Style Details */}
      <AnimatePresence>
        {selectedStyle && showStyleDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <span className="text-2xl mr-3">{selectedStyle.icon}</span>
                {selectedStyle.name} Details
              </h3>
              <button
                onClick={() => setShowStyleDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Style Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">👰 Bride's Attire</h4>
                  <p className="text-sm text-gray-700">{selectedStyle.brideAttire}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">🤵 Groom's Attire</h4>
                  <p className="text-sm text-gray-700">{selectedStyle.groomAttire}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">💎 Traditional Jewelry</h4>
                  <p className="text-sm text-gray-700">{selectedStyle.jewelry}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">🏛️ Backdrop & Setting</h4>
                  <p className="text-sm text-gray-700">{selectedStyle.backdrop}</p>
                </div>
              </div>

              {/* Rituals and Generate Button */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">🕯️ Traditional Rituals</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {selectedStyle.rituals.map((ritual, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-purple-500 mr-2">•</span>
                        {ritual}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => generateRegionalStyle(selectedStyle)}
                  disabled={isGenerating || !brideImage || !groomImage}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating {selectedStyle.name} Style...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      Generate {selectedStyle.name} Wedding Photos
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Your {selectedStyle?.name} Wedding Photos ✨
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {generatedImages.map((image, index) => (
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
                  alt={`${selectedStyle?.name} wedding photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all duration-300 flex items-center justify-center">
                  <ChevronRightIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-8 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300">
              📥 Download All {selectedStyle?.name} Photos
            </button>
          </div>
        </motion.div>
      )}

      {/* Help Card */}
      <HelpCard
        title="Regional Styles Guide"
        steps={[
          {
            step: 1,
            title: "Cultural Authenticity",
            description: "Each regional style includes authentic traditional attire, jewelry, and ceremonial elements specific to that culture.",
            tip: "Choose styles that match your family heritage for best results"
          },
          {
            step: 2,
            title: "Complete Package",
            description: "Get traditional outfits, appropriate jewelry, cultural backdrop, and ceremonial elements in one click.",
            tip: "All elements are culturally coordinated and appropriate"
          },
          {
            step: 3,
            title: "Multiple Variations",
            description: "Generate 6+ different poses and arrangements within your chosen cultural style.",
            tip: "Each variation shows different aspects of the tradition"
          },
          {
            step: 4,
            title: "Regional Details",
            description: "Every style includes information about traditional rituals, attire significance, and cultural elements.",
            tip: "Read the cultural context to understand the styling choices"
          },
          {
            step: 5,
            title: "Family Heritage",
            description: "Perfect for couples wanting to honor their cultural background in their pre-wedding photos.",
            tip: "Mix different cultural styles if you come from different backgrounds"
          }
        ]}
      />
    </div>
  );
};

export default RegionalStylesTab;