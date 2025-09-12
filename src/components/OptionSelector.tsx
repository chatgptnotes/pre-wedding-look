
import React from 'react';
import { SelectionOption } from '../types';
import ImageWithFallback from './ImageWithFallback';

interface OptionSelectorProps {
  label: string;
  options: SelectionOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}

const OptionSelector: React.FC<OptionSelectorProps> = ({ label, options, selectedValue, onChange }) => {
  // Determine grid columns based on the type of options and label content
  const isStyleOrFormat = label.includes('Style') || label.includes('Format');
  const gridCols = isStyleOrFormat 
    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4" 
    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4";
    
  return (
    <div className="mb-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        {label}
      </h3>
      <div className={`grid ${gridCols} gap-4`}>
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => onChange(option.promptValue)}
            className={`cursor-pointer rounded-xl overflow-hidden border-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex flex-col ${
              selectedValue === option.promptValue 
                ? 'border-purple-500 shadow-xl ring-2 ring-purple-200' 
                : 'border-gray-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="relative flex-shrink-0">
              <ImageWithFallback 
                src={option.imageUrl} 
                alt={option.label} 
                className="w-full h-24 object-cover bg-gradient-to-br from-gray-100 to-gray-200" 
                fallbackText={option.label}
              />
              {selectedValue === option.promptValue && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className={`p-3 text-center text-xs font-semibold transition-colors duration-200 flex-1 flex items-center justify-center leading-relaxed ${
              selectedValue === option.promptValue 
                ? 'bg-purple-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}>
              <span className="break-words hyphens-auto max-w-full">{option.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptionSelector;
