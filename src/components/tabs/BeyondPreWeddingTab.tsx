import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon, SparklesIcon, CalendarIcon } from '@heroicons/react/24/solid';
import ImageUploader from '../ImageUploader';
import HelpCard from '../HelpCard';

interface ShootType {
  id: string;
  name: string;
  category: string;
  description: string;
  scenarios: string[];
  timeline: string;
  props: string[];
  locations: string[];
  styling: {
    couple: string;
    colors: string[];
  };
  icon: string;
  badge?: string;
}

const SHOOT_TYPES: ShootType[] = [
  {
    id: 'anniversary-1',
    name: '1st Anniversary - Paper',
    category: 'Anniversary Milestones',
    description: 'Celebrate your paper anniversary with romantic scenes featuring love letters, books, and paper flowers',
    scenarios: [
      'Writing love letters to each other',
      'Reading in a cozy library setting',
      'Paper flower garden backdrop',
      'Vintage newspaper "Just Married" theme',
      'Origami heart decorations'
    ],
    timeline: '1 year after wedding',
    props: ['Love letters', 'Books', 'Paper flowers', 'Newspapers', 'Origami hearts'],
    locations: ['Library', 'Home study', 'Bookstore', 'Paper mill', 'Literary café'],
    styling: {
      couple: 'Casual romantic wear, reading glasses, cozy sweaters',
      colors: ['#F5F5DC', '#DEB887', '#8B4513', '#FFFFFF']
    },
    icon: '📜',
    badge: 'Popular'
  },
  {
    id: 'anniversary-5',
    name: '5th Anniversary - Wood',
    category: 'Anniversary Milestones',
    description: 'Wood anniversary celebration in natural forest settings with rustic charm',
    scenarios: [
      'Walking through autumn forest',
      'Carved initials on tree trunk',
      'Log cabin romantic getaway',
      'Building something together',
      'Picnic in wooden gazebo'
    ],
    timeline: '5 years after wedding',
    props: ['Carved wooden hearts', 'Log cabin', 'Tree swing', 'Wooden furniture', 'Nature wreaths'],
    locations: ['Forest trail', 'Log cabin', 'Wooden bridge', 'Tree house', 'Rustic barn'],
    styling: {
      couple: 'Earthy tones, flannel shirts, boots, layered rustic look',
      colors: ['#8B4513', '#228B22', '#DEB887', '#F4A460']
    },
    icon: '🌲'
  },
  {
    id: 'anniversary-10',
    name: '10th Anniversary - Tin/Aluminum',
    category: 'Anniversary Milestones',
    description: 'Decade celebration with modern metallic themes and urban sophistication',
    scenarios: [
      'City skyline at golden hour',
      'Modern art museum setting',
      'Metallic balloon arrangements',
      'Industrial chic backdrop',
      'Vintage car with metal details'
    ],
    timeline: '10 years after wedding',
    props: ['Metallic balloons', 'Tin signs', 'Aluminum decorations', 'Modern sculptures'],
    locations: ['City rooftop', 'Art museum', 'Industrial space', 'Modern architecture', 'Urban bridge'],
    styling: {
      couple: 'Sophisticated modern wear, metallic accessories, urban chic',
      colors: ['#C0C0C0', '#708090', '#2F4F4F', '#000000']
    },
    icon: '🏙️'
  },
  {
    id: 'anniversary-25',
    name: '25th Anniversary - Silver',
    category: 'Anniversary Milestones',
    description: 'Silver jubilee celebration with elegant themes and mature romance',
    scenarios: [
      'Elegant ballroom dancing',
      'Silver-themed garden party',
      'Recreating wedding photos',
      'Family portrait with children',
      'Candlelit dinner for two'
    ],
    timeline: '25 years after wedding',
    props: ['Silver decorations', 'Elegant candles', 'Family photos', 'Silver jewelry', 'Formal attire'],
    locations: ['Elegant ballroom', 'Silver garden', 'Grand hotel', 'Family home', 'Formal restaurant'],
    styling: {
      couple: 'Formal elegant wear, silver accessories, mature sophistication',
      colors: ['#C0C0C0', '#808080', '#FFFFFF', '#000080']
    },
    icon: '💍',
    badge: 'Milestone'
  },
  {
    id: 'maternity-first',
    name: 'First Baby Maternity',
    category: 'Maternity Journey',
    description: 'Celebrating the miracle of first pregnancy with gentle, glowing maternity portraits',
    scenarios: [
      'Silhouette shots highlighting bump',
      'Partner connecting with baby',
      'Nursery preparation scenes',
      'Sunset outdoor portraits',
      'Intimate home moments'
    ],
    timeline: '6-8 months pregnancy',
    props: ['Baby shoes', 'Ultrasound photos', 'Nursery items', 'Flowing fabrics', 'Flower crowns'],
    locations: ['Beach at sunset', 'Flower fields', 'Home nursery', 'Park with trees', 'Studio with soft lighting'],
    styling: {
      couple: 'Flowing maternity dresses, soft pastels, comfortable elegant wear',
      colors: ['#FFB6C1', '#E6E6FA', '#F0F8FF', '#FFFACD']
    },
    icon: '🤱',
    badge: 'New'
  },
  {
    id: 'maternity-rainbow',
    name: 'Rainbow Baby Maternity',
    category: 'Maternity Journey',
    description: 'Celebrating hope and joy after loss with meaningful rainbow-themed maternity photos',
    scenarios: [
      'Rainbow after rain metaphor',
      'Colorful balloon release',
      'Paint powder celebration',
      'Rainbow fabric flowing',
      'Memorial and hope themes'
    ],
    timeline: 'Pregnancy after loss',
    props: ['Rainbow decorations', 'Colorful balloons', 'Paint powders', 'Memorial items', 'Hope quotes'],
    locations: ['After rain setting', 'Open field', 'Rainbow backdrop', 'Meaningful location', 'Studio with colors'],
    styling: {
      couple: 'Colorful flowing dresses, rainbow accessories, hopeful themes',
      colors: ['#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#4B0082', '#9400D3']
    },
    icon: '🌈',
    badge: 'Meaningful'
  },
  {
    id: 'destination-beach',
    name: 'Beach Destination Wedding',
    category: 'Destination Weddings',
    description: 'Tropical paradise wedding with ocean waves and sandy beaches',
    scenarios: [
      'Ceremony by the ocean waves',
      'Sunset beach portraits',
      'Tropical flower arrangements',
      'Beach reception setup',
      'Couples walk on shoreline'
    ],
    timeline: 'Destination wedding day',
    props: ['Tropical flowers', 'Beach umbrellas', 'Sand ceremony', 'Seashells', 'Flowing veils'],
    locations: ['Beach ceremony', 'Ocean backdrop', 'Palm trees', 'Beach resort', 'Sunset pier'],
    styling: {
      couple: 'Light flowing wedding dress, linen suit, barefoot beach style',
      colors: ['#87CEEB', '#F0F8FF', '#FFFACD', '#98FB98']
    },
    icon: '🏖️'
  },
  {
    id: 'destination-mountain',
    name: 'Mountain Destination Wedding',
    category: 'Destination Weddings',
    description: 'Majestic mountain wedding with breathtaking views and rustic charm',
    scenarios: [
      'Mountain peak ceremony',
      'Alpine lake portraits',
      'Forest pathway walk',
      'Rustic lodge reception',
      'Sunrise mountain views'
    ],
    timeline: 'Destination wedding day',
    props: ['Mountain flowers', 'Rustic decorations', 'Cozy blankets', 'Lanterns', 'Natural elements'],
    locations: ['Mountain peak', 'Alpine meadow', 'Forest clearing', 'Mountain lodge', 'Lake shore'],
    styling: {
      couple: 'Warm layered attire, boots, rustic elegant style, cozy accessories',
      colors: ['#8B4513', '#228B22', '#87CEEB', '#FFFFFF']
    },
    icon: '🏔️'
  },
  {
    id: 'family-newborn',
    name: 'Newborn Family Portraits',
    category: 'Growing Family',
    description: 'Precious first moments with your newborn baby and growing family',
    scenarios: [
      'Tiny fingers and toes close-ups',
      'Family of three bonding',
      'Peaceful sleeping baby',
      'Parents with baby silhouettes',
      'Sibling meeting baby'
    ],
    timeline: '2-3 weeks after birth',
    props: ['Soft blankets', 'Baby wraps', 'Small props', 'Family photos', 'Gentle lighting'],
    locations: ['Home studio', 'Nursery', 'Master bedroom', 'Living room', 'Soft light areas'],
    styling: {
      couple: 'Soft neutral colors, comfortable clothing, natural minimal makeup',
      colors: ['#F5F5DC', '#FFFACD', '#E6E6FA', '#F0F8FF']
    },
    icon: '👶',
    badge: 'Precious'
  },
  {
    id: 'family-toddler',
    name: 'Toddler Family Fun',
    category: 'Growing Family',
    description: 'Active family portraits capturing the joy and energy of toddler years',
    scenarios: [
      'Playing in the park together',
      'Tickle fights and laughter',
      'Reading bedtime stories',
      'Baking together in kitchen',
      'Outdoor adventure time'
    ],
    timeline: '1-3 years old',
    props: ['Toys', 'Books', 'Balloons', 'Picnic items', 'Play equipment'],
    locations: ['Playground', 'Home kitchen', 'Park', 'Beach', 'Backyard'],
    styling: {
      couple: 'Casual comfortable wear, ready for play, coordinated family colors',
      colors: ['#FFB6C1', '#98FB98', '#87CEEB', '#FFFACD']
    },
    icon: '🎈'
  },
  {
    id: 'vow-renewal',
    name: 'Vow Renewal Ceremony',
    category: 'Milestone Celebrations',
    description: 'Renewing your commitment with intimate ceremony and celebration photos',
    scenarios: [
      'Intimate vow exchange',
      'Walking down aisle again',
      'Family witness moments',
      'Celebration with loved ones',
      'Recreated wedding poses'
    ],
    timeline: 'Any anniversary',
    props: ['New rings', 'Fresh flowers', 'Written vows', 'Celebration decorations', 'Memorial items'],
    locations: ['Church', 'Beach', 'Garden', 'Home backyard', 'Meaningful venue'],
    styling: {
      couple: 'Semi-formal attire, new dress/suit, renewal theme accessories',
      colors: ['#FFFFFF', '#FFB6C1', '#DDA0DD', '#F0F8FF']
    },
    icon: '💒',
    badge: 'Renewal'
  },
  {
    id: 'empty-nest',
    name: 'Empty Nest Rediscovery',
    category: 'Life Transitions',
    description: 'Celebrating yourselves as a couple again when children leave home',
    scenarios: [
      'Romantic date night scenes',
      'Travel adventure photos',
      'Rediscovering hobbies together',
      'Elegant dinner for two',
      'Dancing like young lovers'
    ],
    timeline: 'After children leave home',
    props: ['Travel items', 'Hobby materials', 'Elegant dinnerware', 'Dance floor', 'Adventure gear'],
    locations: ['Fancy restaurant', 'Dance hall', 'Travel destinations', 'Home date setup', 'Adventure locations'],
    styling: {
      couple: 'Sophisticated mature style, date night attire, adventure wear',
      colors: ['#800080', '#FF69B4', '#000080', '#C0C0C0']
    },
    icon: '🕊️'
  }
];

interface BeyondPreWeddingTabProps {
  brideImage: string | null;
  groomImage: string | null;
  onImageUpload: (type: 'bride' | 'groom', image: string | null) => void;
}

const BeyondPreWeddingTab: React.FC<BeyondPreWeddingTabProps> = ({ 
  brideImage, 
  groomImage, 
  onImageUpload 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Anniversary Milestones');
  const [selectedShoot, setSelectedShoot] = useState<ShootType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const categories = Array.from(new Set(SHOOT_TYPES.map(shoot => shoot.category)));
  const filteredShoots = SHOOT_TYPES.filter(shoot => shoot.category === selectedCategory);

  const generateShoot = useCallback(async (shoot: ShootType) => {
    if (!brideImage || !groomImage) {
      alert('Please upload both couple images first');
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate API call with shoot-specific parameters
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock generated images for the selected shoot type
      const mockImages = Array.from({ length: 8 }, (_, i) => 
        `https://api.placeholder.com/800x600/${shoot.styling.colors[0].replace('#', '')}/fff?text=${shoot.name}+${i + 1}`
      );
      setGeneratedImages(mockImages);
    } catch (error) {
      console.error('Error generating shoot:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [brideImage, groomImage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          🎯 Beyond Pre-Wedding
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Capture every milestone of your relationship journey - from anniversary celebrations to growing families, destination weddings to life transitions.
        </p>
      </div>

      {/* Image Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ImageUploader
          label="Upload Your Photo (Person 1)"
          image={brideImage}
          onImageChange={(img) => onImageUpload('bride', img)}
          onImageReset={() => onImageUpload('bride', null)}
        />
        <ImageUploader
          label="Upload Partner's Photo (Person 2)"
          image={groomImage}
          onImageChange={(img) => onImageUpload('groom', img)}
          onImageReset={() => onImageUpload('groom', null)}
        />
      </div>

      {/* Category Selection */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Choose Your Milestone Category</h3>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setSelectedShoot(null);
                setGeneratedImages([]);
              }}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Shoot Types Grid */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-6">
          {selectedCategory} Options
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShoots.map((shoot) => (
            <motion.div
              key={shoot.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 ${
                selectedShoot?.id === shoot.id
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedShoot(shoot)}
            >
              {/* Shoot Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{shoot.icon}</span>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">{shoot.name}</h4>
                    <p className="text-sm text-gray-600">{shoot.timeline}</p>
                  </div>
                </div>
                {shoot.badge && (
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {shoot.badge}
                  </span>
                )}
              </div>

              {/* Color Palette */}
              <div className="flex space-x-2 mb-3">
                {shoot.styling.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">{shoot.description}</p>

              {/* Quick Info */}
              <div className="space-y-2 text-xs text-gray-600">
                <div><strong>Locations:</strong> {shoot.locations.slice(0, 2).join(', ')}</div>
                <div><strong>Props:</strong> {shoot.props.slice(0, 2).join(', ')}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Selected Shoot Details */}
      <AnimatePresence>
        {selectedShoot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <span className="text-3xl mr-3">{selectedShoot.icon}</span>
                {selectedShoot.name}
              </h3>
              <button
                onClick={() => setSelectedShoot(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Shoot Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">📸 Photo Scenarios</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {selectedShoot.scenarios.map((scenario, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-purple-500 mr-2">•</span>
                        {scenario}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">📍 Suggested Locations</h4>
                  <p className="text-sm text-gray-700">{selectedShoot.locations.join(', ')}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">🎭 Props & Elements</h4>
                  <p className="text-sm text-gray-700">{selectedShoot.props.join(', ')}</p>
                </div>
              </div>

              {/* Styling and Generate */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">👗 Styling Guide</h4>
                  <p className="text-sm text-gray-700">{selectedShoot.styling.couple}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">📅 Perfect Timing</h4>
                  <p className="text-sm text-gray-700">{selectedShoot.timeline}</p>
                </div>

                <button
                  onClick={() => generateShoot(selectedShoot)}
                  disabled={isGenerating || !brideImage || !groomImage}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating {selectedShoot.name}...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      Generate {selectedShoot.name} Photos
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
            Your {selectedShoot?.name} Collection ✨
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  alt={`${selectedShoot?.name} photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all duration-300 flex items-center justify-center">
                  <HeartIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-center space-y-3">
            <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-8 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300">
              📥 Download Complete Collection
            </button>
            <p className="text-sm text-gray-600">
              Includes high-resolution photos, styling guide, and photo recreation tips
            </p>
          </div>
        </motion.div>
      )}

      {/* Help Card */}
      <HelpCard
        title="Beyond Pre-Wedding Guide"
        steps={[
          {
            step: 1,
            title: "Milestone Celebrations",
            description: "Capture anniversaries (1st, 5th, 10th, 25th) with traditional themes and meaningful props.",
            tip: "Plan shoots around meaningful dates and locations"
          },
          {
            step: 2,
            title: "Growing Family",
            description: "Document maternity journey, newborn moments, and family growth milestones.",
            tip: "Book maternity shoots in 7th-8th month for best results"
          },
          {
            step: 3,
            title: "Destination Celebrations",
            description: "Create stunning wedding photos in beach paradises or mountain retreats.",
            tip: "Research local photography regulations and sunrise/sunset times"
          },
          {
            step: 4,
            title: "Life Transitions",
            description: "From vow renewals to empty nest rediscovery, celebrate every chapter of your love story.",
            tip: "Include meaningful props and elements from your journey"
          },
          {
            step: 5,
            title: "Custom Timeline",
            description: "Each shoot type includes perfect timing suggestions and seasonal considerations.",
            tip: "Book 2-3 months in advance for popular locations"
          }
        ]}
      />
    </div>
  );
};

export default BeyondPreWeddingTab;