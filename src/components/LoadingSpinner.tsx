import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-rose-200 border-t-rose-600 mx-auto`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${sizeClasses[size === 'lg' ? 'md' : size === 'md' ? 'sm' : 'sm']} bg-rose-100 rounded-full`}></div>
          </div>
        </div>
        <p className={`mt-4 text-gray-600 font-medium ${textSizeClasses[size]}`}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;