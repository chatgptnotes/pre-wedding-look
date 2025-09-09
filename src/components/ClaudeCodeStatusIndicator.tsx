import React, { useState } from 'react';
import { useClaudeCode } from '../contexts/ClaudeCodeContext';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ClaudeCodeStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function ClaudeCodeStatusIndicator({ 
  className = '', 
  showDetails = true 
}: ClaudeCodeStatusIndicatorProps): JSX.Element {
  const { config, isEnabled, getStatus } = useClaudeCode();
  const [isExpanded, setIsExpanded] = useState(false);
  const status = getStatus();

  const getStatusColor = () => {
    if (!isEnabled) return 'text-gray-500';
    if (config.autoAcceptAll) return 'text-green-500';
    if (config.riskLevel === 'aggressive') return 'text-red-500';
    if (config.riskLevel === 'moderate') return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getStatusIcon = () => {
    if (!isEnabled) return '⚪';
    if (config.autoAcceptAll) return '🟢';
    if (config.riskLevel === 'aggressive') return '🔴';
    if (config.riskLevel === 'moderate') return '🟡';
    return '🔵';
  };

  const getStatusText = () => {
    if (!isEnabled) return 'Disabled';
    if (config.autoAcceptAll) return 'Auto-Accept All';
    return `${config.riskLevel.charAt(0).toUpperCase() + config.riskLevel.slice(1)} Bypass`;
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm">{getStatusIcon()}</span>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          Claude Code: {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getStatusIcon()}</span>
          <div className="text-left">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Claude Code Status
            </h3>
            <p className={`text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Bypass:</span>
                <span className={`ml-2 font-medium ${status.bypassEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {status.bypassEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Auto-Accept:</span>
                <span className={`ml-2 font-medium ${status.autoAcceptAll ? 'text-green-600' : 'text-gray-600'}`}>
                  {status.autoAcceptAll ? 'ON' : 'OFF'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Risk Level:</span>
                <span className={`ml-2 font-medium ${
                  status.riskLevel === 'conservative' ? 'text-green-600' :
                  status.riskLevel === 'moderate' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {status.riskLevel.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Operations:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {status.operationsCount}
                </span>
              </div>
            </div>

            <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
              {config.debugMode && (
                <div className="flex items-center space-x-1">
                  <span>🐛</span>
                  <span>Debug Mode Active</span>
                </div>
              )}
              <div className="mt-1">
                Session timeout: {config.sessionTimeout / 60000}min
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                💡 Use <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">/help</code> for commands
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}