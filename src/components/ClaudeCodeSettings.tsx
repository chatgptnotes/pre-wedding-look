import React, { useState } from 'react';
import { useClaudeCode } from '../contexts/ClaudeCodeContext';
import { RiskLevel } from '../types/claudeCode';

interface ClaudeCodeSettingsProps {
  className?: string;
}

export function ClaudeCodeSettings({ className = '' }: ClaudeCodeSettingsProps): JSX.Element {
  const { config, updateConfig, resetConfig, executeCommand } = useClaudeCode();
  const [isLoading, setIsLoading] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [commandResult, setCommandResult] = useState<string | null>(null);

  const handleToggleBypass = async () => {
    setIsLoading(true);
    try {
      await updateConfig({ confirmationBypass: !config.confirmationBypass });
    } catch (error) {
      console.error('Failed to toggle bypass:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoAccept = async () => {
    setIsLoading(true);
    try {
      await updateConfig({ autoAcceptAll: !config.autoAcceptAll });
    } catch (error) {
      console.error('Failed to toggle auto-accept:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRiskLevelChange = async (riskLevel: RiskLevel) => {
    setIsLoading(true);
    try {
      await updateConfig({ riskLevel });
    } catch (error) {
      console.error('Failed to update risk level:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDebug = async () => {
    setIsLoading(true);
    try {
      await updateConfig({ debugMode: !config.debugMode });
    } catch (error) {
      console.error('Failed to toggle debug mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    setIsLoading(true);
    try {
      const result = await executeCommand(commandInput);
      setCommandResult(result.message);
      if (result.success) {
        setCommandInput('');
      }
    } catch (error) {
      setCommandResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all Claude Code settings to defaults?')) {
      setIsLoading(true);
      try {
        await resetConfig();
        setCommandResult('Settings reset to defaults');
      } catch (error) {
        setCommandResult('Failed to reset settings');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          🤖 Claude Code Settings
        </h2>

        {/* Command Input */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Commands
          </h3>
          <form onSubmit={handleExecuteCommand} className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="/help - Show available commands"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={isLoading || !commandInput.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Run
              </button>
            </div>
            {commandResult && (
              <div className="p-3 text-sm bg-gray-100 dark:bg-gray-600 rounded-md border">
                <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 font-mono text-xs">
                  {commandResult}
                </pre>
              </div>
            )}
          </form>
        </div>

        {/* Settings Grid */}
        <div className="space-y-6">
          {/* Bypass Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Confirmation Bypass
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-900 dark:text-white">
                    Enable Bypass
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically handle confirmations based on risk assessment
                  </p>
                </div>
                <button
                  onClick={handleToggleBypass}
                  disabled={isLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.confirmationBypass
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.confirmationBypass ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-900 dark:text-white">
                    Auto-Accept All
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Skip all confirmations (except critical operations)
                  </p>
                </div>
                <button
                  onClick={handleToggleAutoAccept}
                  disabled={isLoading || !config.confirmationBypass}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.autoAcceptAll && config.confirmationBypass
                      ? 'bg-green-600'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.autoAcceptAll ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Risk Level */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Risk Level
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[RiskLevel.CONSERVATIVE, RiskLevel.MODERATE, RiskLevel.AGGRESSIVE].map((level) => (
                <button
                  key={level}
                  onClick={() => handleRiskLevelChange(level)}
                  disabled={isLoading}
                  className={`p-3 text-sm rounded-lg border-2 transition-all ${
                    config.riskLevel === level
                      ? level === RiskLevel.CONSERVATIVE
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : level === RiskLevel.MODERATE
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {level === RiskLevel.CONSERVATIVE && '🟢'}
                    {level === RiskLevel.MODERATE && '🟡'}
                    {level === RiskLevel.AGGRESSIVE && '🔴'}
                  </div>
                  <div className="font-medium capitalize">{level}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {level === RiskLevel.CONSERVATIVE && 'Safest'}
                    {level === RiskLevel.MODERATE && 'Balanced'}
                    {level === RiskLevel.AGGRESSIVE && 'Fastest'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Debug Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Advanced
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm text-gray-900 dark:text-white">
                    Debug Mode
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enable detailed logging and debug information
                  </p>
                </div>
                <button
                  onClick={handleToggleDebug}
                  disabled={isLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.debugMode
                      ? 'bg-purple-600'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.debugMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
              >
                Reset to Defaults
              </button>
              
              <div className="flex space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Session: {config.sessionTimeout / 60000}min</span>
                <span>•</span>
                <span>Operations: {config.allowedOperations.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}