import React, { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackText 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Create a simple colored placeholder based on the image name
  const createPlaceholder = (imageName: string) => {
    const colors = [
      'bg-gradient-to-br from-rose-200 to-pink-300',
      'bg-gradient-to-br from-purple-200 to-indigo-300',
      'bg-gradient-to-br from-blue-200 to-cyan-300',
      'bg-gradient-to-br from-green-200 to-emerald-300',
      'bg-gradient-to-br from-yellow-200 to-orange-300',
      'bg-gradient-to-br from-red-200 to-rose-300'
    ];
    
    const hash = imageName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const placeholderColor = createPlaceholder(src);
  const displayText = fallbackText || alt;

  if (imageError || !src) {
    return (
      <div className={`${className} ${placeholderColor} flex items-center justify-center text-gray-700`}>
        <div className="text-center p-2">
          <div className="text-2xl mb-1">🖼️</div>
          <div className="text-xs font-medium truncate">{displayText}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {!imageLoaded && (
        <div className={`absolute inset-0 ${placeholderColor} flex items-center justify-center animate-pulse`}>
          <div className="text-center">
            <div className="text-2xl mb-1">⏳</div>
            <div className="text-xs font-medium">Loading...</div>
          </div>
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

export default ImageWithFallback;