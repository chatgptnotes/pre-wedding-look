import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ClaudeCodeConfig, CommandResult } from '../types/claudeCode';
import { ClaudeCodeConfigService } from '../services/claudeCodeConfigService';
import { SlashCommandService } from '../services/slashCommandService';
import { ConfirmationBypassAgent } from '../services/confirmationBypassAgent';
import { useAuth } from './AuthContext';

interface ClaudeCodeContextType {
  config: ClaudeCodeConfig;
  isEnabled: boolean;
  isLoading: boolean;
  executeCommand: (command: string) => Promise<CommandResult>;
  updateConfig: (updates: Partial<ClaudeCodeConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  getStatus: () => {
    bypassEnabled: boolean;
    autoAcceptAll: boolean;
    riskLevel: string;
    operationsCount: number;
  };
}

const ClaudeCodeContext = createContext<ClaudeCodeContextType | undefined>(undefined);

interface ClaudeCodeProviderProps {
  children: ReactNode;
}

export function ClaudeCodeProvider({ children }: ClaudeCodeProviderProps): JSX.Element {
  const [config, setConfig] = useState<ClaudeCodeConfig>(() => ClaudeCodeConfigService.getConfig());
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    initializeClaudeCode();
  }, [user]);

  const initializeClaudeCode = async () => {
    try {
      setIsLoading(true);
      
      // Initialize services with timeout protection
      try {
        SlashCommandService.initialize();
      } catch (error) {
        console.warn('SlashCommandService initialization failed:', error);
      }
      
      try {
        // Add timeout protection for database operations
        const configPromise = ClaudeCodeConfigService.initialize(user?.id);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Config initialization timeout')), 5000)
        );
        
        await Promise.race([configPromise, timeoutPromise]);
        
        // Subscribe to config changes
        const unsubscribe = ClaudeCodeConfigService.subscribe((newConfig) => {
          setConfig(newConfig);
        });

        // Load initial config
        const initialConfig = ClaudeCodeConfigService.getConfig();
        setConfig(initialConfig);

        return unsubscribe;
      } catch (error) {
        console.warn('ClaudeCodeConfigService initialization failed:', error);
        // Use default config if initialization fails
        setConfig(() => ClaudeCodeConfigService.getConfig());
      }
    } catch (error) {
      console.error('Failed to initialize Claude Code:', error);
      // Ensure default config is set even on failure
      setConfig(() => ClaudeCodeConfigService.getConfig());
    } finally {
      setIsLoading(false);
    }
  };

  const executeCommand = async (command: string): Promise<CommandResult> => {
    const context = {
      userId: user?.id,
      sessionId: crypto.randomUUID(),
      timestamp: new Date(),
      config,
      permissions: ['user'] // Basic permissions for now
    };

    return SlashCommandService.executeCommand(command, context);
  };

  const updateConfig = async (updates: Partial<ClaudeCodeConfig>): Promise<void> => {
    await ClaudeCodeConfigService.updateConfig(user?.id, updates);
  };

  const resetConfig = async (): Promise<void> => {
    await ClaudeCodeConfigService.resetToDefaults(user?.id);
  };

  const getStatus = () => {
    return ClaudeCodeConfigService.getConfigStatus();
  };

  const value: ClaudeCodeContextType = {
    config,
    isEnabled: config.confirmationBypass,
    isLoading,
    executeCommand,
    updateConfig,
    resetConfig,
    getStatus
  };

  return (
    <ClaudeCodeContext.Provider value={value}>
      {children}
    </ClaudeCodeContext.Provider>
  );
}

export function useClaudeCode(): ClaudeCodeContextType {
  const context = useContext(ClaudeCodeContext);
  if (context === undefined) {
    throw new Error('useClaudeCode must be used within a ClaudeCodeProvider');
  }
  return context;
}