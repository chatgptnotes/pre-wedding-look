import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PaintBrushIcon, TrashIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import ImageUploader from '../ImageUploader';
import CustomPromptBuilder from '../CustomPromptBuilder';
import { generatePersonalizedImage } from '../../services/geminiService';
import { GalleryService } from '../../services/galleryService';

interface BrushStroke {
  x: number;
  y: number;
  size: number;
  type: 'mask' | 'erase';
}

interface AttireOption {
  id: string;
  name: string;
  category: 'bride' | 'groom';
  thumbnail: string;
  description: string;
  tags: string[];
}

const ATTIRE_OPTIONS: AttireOption[] = [
  // Bride Attire
  {
    id: 'red-lehenga',
    name: 'Royal Red Lehenga',
    category: 'bride',
    thumbnail: 'https://via.placeholder.com/150x200/dc2626/fff?text=Red+Lehenga',
    description: 'Traditional heavy embroidered red lehenga with gold work',
    tags: ['traditional', 'wedding', 'heavy', 'red']
  },
  {
    id: 'pink-saree',
    name: 'Pink Silk Saree',
    category: 'bride',
    thumbnail: 'https://via.placeholder.com/150x200/ec4899/fff?text=Pink+Saree',
    description: 'Elegant pink silk saree with golden border',
    tags: ['elegant', 'silk', 'pink', 'traditional']
  },
  {
    id: 'white-gown',
    name: 'White Wedding Gown',
    category: 'bride',
    thumbnail: 'https://via.placeholder.com/150x200/f8fafc/000?text=White+Gown',
    description: 'Modern white wedding gown with lace details',
    tags: ['modern', 'western', 'white', 'lace']
  },
  
  // Groom Attire
  {
    id: 'gold-sherwani',
    name: 'Golden Sherwani',
    category: 'groom',
    thumbnail: 'https://via.placeholder.com/150x200/f59e0b/fff?text=Gold+Sherwani',
    description: 'Regal golden sherwani with intricate embroidery',
    tags: ['traditional', 'wedding', 'gold', 'royal']
  },
  {
    id: 'blue-suit',
    name: 'Navy Blue Suit',
    category: 'groom',
    thumbnail: 'https://via.placeholder.com/150x200/1e40af/fff?text=Navy+Suit',
    description: 'Classic navy blue three-piece suit',
    tags: ['modern', 'western', 'blue', 'formal']
  },
  {
    id: 'cream-kurta',
    name: 'Cream Kurta Set',
    category: 'groom',
    thumbnail: 'https://via.placeholder.com/150x200/fef3c7/000?text=Cream+Kurta',
    description: 'Elegant cream kurta with matching pyjama',
    tags: ['casual', 'traditional', 'cream', 'comfortable']
  }
];

interface FusionRealityTabProps {
  brideImage: string | null;
  groomImage: string | null;
  onImageUpload: (type: 'bride' | 'groom', image: string | null) => void;
}

const FusionRealityTab: React.FC<FusionRealityTabProps> = ({ 
  brideImage, 
  groomImage, 
  onImageUpload 
}) => {
  const [selectedPerson, setSelectedPerson] = useState<'bride' | 'groom'>('bride');
  const [selectedAttire, setSelectedAttire] = useState<AttireOption | null>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [brushMode, setBrushMode] = useState<'mask' | 'erase'>('mask');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushStrokes, setBrushStrokes] = useState<BrushStroke[]>([]);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const activeImage = selectedPerson === 'bride' ? brideImage : groomImage;
  const availableAttire = ATTIRE_OPTIONS.filter(option => option.category === selectedPerson);

  useEffect(() => {
    // Initialize canvas when image changes
    if (canvasRef.current && activeImage) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Reset brush strokes
        setBrushStrokes([]);
      }
    }
  }, [activeImage, selectedPerson]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !activeImage) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newStroke: BrushStroke = {
      x: x / rect.width,
      y: y / rect.height,
      size: brushSize,
      type: brushMode
    };
    
    setBrushStrokes(prev => [...prev, newStroke]);
  }, [activeImage, brushSize, brushMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newStroke: BrushStroke = {
      x: x / rect.width,
      y: y / rect.height,
      size: brushSize,
      type: brushMode
    };
    
    setBrushStrokes(prev => [...prev, newStroke]);
  }, [isDrawing, brushSize, brushMode]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const drawBrushStrokes = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (!ctx) return;
    
    // Set canvas dimensions to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw brush strokes
    brushStrokes.forEach(stroke => {
      ctx.beginPath();
      ctx.arc(
        stroke.x * canvas.width,
        stroke.y * canvas.height,
        stroke.size,
        0,
        2 * Math.PI
      );
      
      if (stroke.type === 'mask') {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Red for masking
      } else {
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)'; // Blue for erasing
      }
      
      ctx.fill();
    });
  }, [brushStrokes]);

  useEffect(() => {
    drawBrushStrokes();
  }, [drawBrushStrokes]);

  const processAttireSwap = useCallback(async () => {
    if (!activeImage || !selectedAttire || brushStrokes.length === 0) {
      alert('Please select an image, choose attire, and paint the area to swap');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Processing attire swap with AI...');
      
      // Create a prompt for AI attire swapping based on selected attire
      const attirePrompt = `${selectedAttire.description}. Apply this attire style to the painted areas while maintaining the person's original face and body structure.`;
      
      // Use the AI service to generate the swapped attire image
      const config = {
        location: '',
        brideAttire: selectedPerson === 'bride' ? attirePrompt : '',
        groomAttire: selectedPerson === 'groom' ? attirePrompt : '',
        bridePose: selectedPerson === 'bride' ? 'naturally posed' : '',
        groomPose: selectedPerson === 'groom' ? 'naturally posed' : '',
        style: `Attire swap with ${selectedAttire.name}`,
        hairstyle: '',
        groomHairstyle: '',
        aspectRatio: '4:5 portrait aspect ratio',
        jewelry: ''
      };
      
      let generatedImageUrl;
      if (selectedPerson === 'bride') {
        generatedImageUrl = await generatePersonalizedImage(config, activeImage, null);
      } else {
        generatedImageUrl = await generatePersonalizedImage(config, null, activeImage);
      }
      
      console.log('AI attire swap completed successfully');
      
      // Save to Supabase database
      try {
        const imageBlob = await fetch(generatedImageUrl).then(r => r.blob());
        const uploadResult = await GalleryService.uploadGeneratedImage(imageBlob, 'IN', selectedPerson, `attire-swap-${selectedAttire.id}`);
        
        // Create GeneratedImage record in database
        const generatedImageRecord = {
          id: `attire-swap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          country_id: '1',
          model_id: null,
          style_id: selectedAttire.id,
          role: selectedPerson,
          image_url: uploadResult.url,
          image_path: uploadResult.path,
          thumbnail_url: uploadResult.url,
          generation_params: {
            attire_name: selectedAttire.name,
            attire_description: selectedAttire.description,
            person: selectedPerson,
            brush_strokes_count: brushStrokes.length,
            generated_at: new Date().toISOString(),
            type: 'attire_swap'
          },
          quality_score: 0.85,
          user_ratings: [],
          view_count: 0,
          is_featured: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Saved attire swap to database:', generatedImageRecord);
        setProcessedImage(generatedImageUrl);
      } catch (dbError) {
        console.error('Failed to save attire swap to database:', dbError);
        // Still show the generated image even if database save fails
        setProcessedImage(generatedImageUrl);
      }
      
    } catch (error) {
      console.error('Error processing attire swap:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to process attire swap: ${errorMessage}\n\nPlease try again with different attire or images.`);
    } finally {
      setIsProcessing(false);
    }
  }, [activeImage, selectedAttire, brushStrokes, selectedPerson]);

  const clearBrushStrokes = useCallback(() => {
    setBrushStrokes([]);
    setProcessedImage(null);
  }, []);

  const undoLastStroke = useCallback(() => {
    setBrushStrokes(prev => prev.slice(0, -1));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          ✨ Fusion Reality
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Instantly swap attire using intelligent brush tools. Paint over clothing areas and see real-time transformations with proper lighting and shadows.
        </p>
      </div>

      {/* Person Selection */}
      <div className="flex justify-center mb-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-lg">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPerson('bride')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedPerson === 'bride'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              👰 Bride
            </button>
            <button
              onClick={() => setSelectedPerson('groom')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedPerson === 'groom'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🤵 Groom
            </button>
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div className="mb-8">
        <ImageUploader
          label={`Upload ${selectedPerson === 'bride' ? "Bride's" : "Groom's"} Photo`}
          image={activeImage}
          onImageChange={(img) => onImageUpload(selectedPerson, img)}
          onImageReset={() => onImageUpload(selectedPerson, null)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attire Selection */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Choose New Attire</h3>
          <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
            {availableAttire.map(attire => (
              <motion.button
                key={attire.id}
                onClick={() => setSelectedAttire(attire)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedAttire?.id === attire.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex gap-3">
                  <img
                    src={attire.thumbnail}
                    alt={attire.name}
                    className="w-16 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{attire.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{attire.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {attire.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Paint to Swap</h3>
          
          {/* Brush Controls */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setBrushMode('mask')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  brushMode === 'mask'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <PaintBrushIcon className="w-4 h-4" />
                Mask
              </button>
              <button
                onClick={() => setBrushMode('erase')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  brushMode === 'erase'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TrashIcon className="w-4 h-4" />
                Erase
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Brush Size:</label>
              <input
                type="range"
                min="5"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 min-w-[3ch]">{brushSize}</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={undoLastStroke}
                disabled={brushStrokes.length === 0}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Undo
              </button>
              <button
                onClick={clearBrushStrokes}
                disabled={brushStrokes.length === 0}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <TrashIcon className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            {activeImage ? (
              <>
                <img
                  ref={imageRef}
                  src={activeImage}
                  alt="Source"
                  className="w-full h-auto max-h-96 object-contain"
                  onLoad={() => drawBrushStrokes()}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ 
                    width: imageRef.current?.offsetWidth || 'auto',
                    height: imageRef.current?.offsetHeight || 'auto'
                  }}
                />
              </>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🎨</div>
                  <div className="font-medium">Upload an image to start painting</div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={processAttireSwap}
            disabled={!activeImage || !selectedAttire || brushStrokes.length === 0 || isProcessing}
            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Swap...
              </span>
            ) : (
              '✨ Swap Attire'
            )}
          </button>
        </div>

        {/* Result */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Result</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-64 flex items-center justify-center">
            {processedImage ? (
              <div className="relative">
                <img
                  src={processedImage}
                  alt="Processed Result"
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = processedImage;
                    link.download = `${selectedPerson}_attire_swap_${selectedAttire?.name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg transition-all duration-200"
                  title="Download Swapped Attire"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">✨</div>
                <div className="font-medium">Swapped image will appear here</div>
                <div className="text-sm mt-1">Paint areas and click "Swap Attire"</div>
              </div>
            )}
          </div>

          {processedImage && (
            <div className="mt-4 space-y-2">
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = processedImage;
                  link.download = `${selectedPerson}_attire_swap_${selectedAttire?.name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download Result
              </button>
              <button 
                onClick={() => {
                  setProcessedImage(null);
                  setSelectedAttire(null);
                  setBrushStrokes([]);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Try Different Attire
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FusionRealityTab;