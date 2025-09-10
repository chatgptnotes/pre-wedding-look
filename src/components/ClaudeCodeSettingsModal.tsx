import React from 'react';
import { ClaudeCodeSettings } from './ClaudeCodeSettings';
import { ClaudeCodeStatusIndicator } from './ClaudeCodeStatusIndicator';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ClaudeCodeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClaudeCodeSettingsModal: React.FC<ClaudeCodeSettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity cursor-pointer"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal content */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        
        <div 
          className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2">🤖</span>
                Claude Code Configuration
              </h2>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Status Indicator */}
            <div className="mb-6">
              <ClaudeCodeStatusIndicator showDetails={true} />
            </div>

            {/* Settings */}
            <div>
              <ClaudeCodeSettings />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Claude Code helps automate confirmations and actions
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaudeCodeSettingsModal;