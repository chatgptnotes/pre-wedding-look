import React, { useState, useEffect } from 'react';
import { ComparisonItem, GenerationConfig } from '../types';
import { LOCATIONS, BRIDE_ATTIRE, GROOM_ATTIRE, BRIDE_POSES, GROOM_POSES, STYLES, ASPECT_RATIOS, HAIRSTYLES, GROOM_HAIRSTYLES, JEWELRY } from '../constants';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImages?: ComparisonItem[];
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, initialImages = [] }) => {
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<ComparisonItem[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setComparisonItems(initialImages);
      setSelectedItems(initialImages.slice(0, 2)); // Select first 2 by default
    }
  }, [isOpen, initialImages]);

  const addToComparison = (imageUrl: string, config: GenerationConfig, imageType: 'bride' | 'groom' | 'couple', title?: string) => {
    const newItem: ComparisonItem = {
      id: Date.now().toString(),
      imageUrl,
      config,
      imageType,
      title: title || `${imageType} Look`
    };
    
    setComparisonItems(prev => [...prev, newItem]);
  };

  const removeFromComparison = (itemId: string) => {
    setComparisonItems(prev => prev.filter(item => item.id !== itemId));
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const selectForComparison = (item: ComparisonItem) => {
    setSelectedItems(prev => {
      const alreadySelected = prev.find(selected => selected.id === item.id);
      if (alreadySelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else if (prev.length < 4) {
        return [...prev, item];
      } else {
        // Replace the oldest selected item
        return [...prev.slice(1), item];
      }
    });
  };

  const getConfigLabel = (key: string, value: string) => {
    const allOptions = [
      ...LOCATIONS,
      ...BRIDE_ATTIRE,
      ...GROOM_ATTIRE,
      ...BRIDE_POSES,
      ...GROOM_POSES,
      ...STYLES,
      ...ASPECT_RATIOS,
      ...HAIRSTYLES,
      ...GROOM_HAIRSTYLES,
      ...JEWELRY
    ];
    
    const option = allOptions.find(opt => opt.promptValue === value);
    return option?.label || value;
  };

  const getConfigDifferences = (config1: GenerationConfig, config2: GenerationConfig) => {
    const differences: { key: string; value1: string; value2: string }[] = [];
    
    Object.keys(config1).forEach(key => {
      const value1 = config1[key as keyof GenerationConfig];
      const value2 = config2[key as keyof GenerationConfig];
      
      if (value1 !== value2 && value1 && value2) {
        differences.push({
          key: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          value1: getConfigLabel(key, value1),
          value2: getConfigLabel(key, value2)
        });
      }
    });
    
    return differences;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Look Comparison</h2>
            <p className="text-gray-600">Compare different wedding looks side by side</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[calc(95vh-120px)] overflow-y-auto">
          {/* Available images for comparison */}
          {comparisonItems.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Available Looks</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {comparisonItems.map((item) => {
                  const isSelected = selectedItems.some(selected => selected.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        isSelected ? 'border-rose-500 shadow-lg' : 'border-gray-200 hover:border-gray-400'
                      }`}
                      onClick={() => selectForComparison(item)}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-2 bg-white">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 capitalize">{item.imageType}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {selectedItems.findIndex(selected => selected.id === item.id) + 1}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromComparison(item.id);
                        }}
                        className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comparison view */}
          {selectedItems.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  Comparing {selectedItems.length} Look{selectedItems.length > 1 ? 's' : ''}
                </h3>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              <div className={`grid gap-6 ${selectedItems.length === 1 ? 'grid-cols-1' : selectedItems.length === 2 ? 'grid-cols-2' : selectedItems.length === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
                {selectedItems.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="relative mb-4">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 left-2 bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">{item.title}</h4>
                      <p className="text-sm text-gray-600 capitalize">Type: {item.imageType}</p>
                      
                      {showDetails && (
                        <div className="mt-4 space-y-2">
                          <h5 className="font-medium text-gray-700">Configuration:</h5>
                          <div className="text-xs space-y-1">
                            {Object.entries(item.config).map(([key, value]) => {
                              if (!value) return null;
                              return (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-500 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1')}:
                                  </span>
                                  <span className="text-gray-800 font-medium">
                                    {getConfigLabel(key, value)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Differences highlighting when comparing exactly 2 items */}
              {selectedItems.length === 2 && showDetails && (
                <div className="mt-8 bg-yellow-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Key Differences</h4>
                  {(() => {
                    const differences = getConfigDifferences(selectedItems[0].config, selectedItems[1].config);
                    if (differences.length === 0) {
                      return <p className="text-gray-600">No significant differences in configuration</p>;
                    }
                    return (
                      <div className="space-y-3">
                        {differences.map((diff, index) => (
                          <div key={index} className="flex items-center space-x-4 bg-white rounded-lg p-3">
                            <div className="font-medium text-gray-700 min-w-0 flex-shrink-0">
                              {diff.key}:
                            </div>
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div className="bg-rose-100 text-rose-800 px-2 py-1 rounded text-sm flex-1 min-w-0">
                                <span className="font-medium">1:</span> <span className="truncate">{diff.value1}</span>
                              </div>
                              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex-1 min-w-0">
                                <span className="font-medium">2:</span> <span className="truncate">{diff.value2}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {selectedItems.length === 0 && comparisonItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium">No looks to compare</p>
              <p className="text-sm">Generate some wedding looks first to start comparing them!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;