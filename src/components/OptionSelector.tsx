
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
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-stone-700 mb-4 capitalize">{label}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => onChange(option.promptValue)}
            className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 ${
              selectedValue === option.promptValue ? 'border-rose-500 shadow-lg' : 'border-transparent hover:border-rose-300'
            }`}
          >
            <ImageWithFallback 
              src={option.imageUrl} 
              alt={option.label} 
              className="w-full h-24 object-cover bg-stone-100" 
              fallbackText={option.label}
            />
            <div className={`p-2 text-center text-sm font-medium ${
              selectedValue === option.promptValue ? 'bg-rose-500 text-white' : 'bg-white text-stone-700'
            }`}>
              {option.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptionSelector;
