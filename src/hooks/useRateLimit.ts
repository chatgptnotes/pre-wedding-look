/**
 * React Hook for Rate Limiting with UI Feedback
 * Provides easy integration of rate limiting with user-friendly messages
 */

import { useState, useEffect, useCallback } from 'react';
import { RateLimitService, RATE_LIMITS, RateLimitResult } from '../services/rateLimitService';

interface UseRateLimitOptions {
  autoCheck?: boolean;
  onViolation?: (result: RateLimitResult) => void;
  showNotifications?: boolean;
}

export function useRateLimit(
  limitType: keyof typeof RATE_LIMITS,
  identifier?: string,
  options: UseRateLimitOptions = {}
) {
  const [isLimited, setIsLimited] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [resetTime, setResetTime] = useState(0);
  const [message, setMessage] = useState<string>();
  const [isChecking, setIsChecking] = useState(false);

  const { autoCheck = false, onViolation, showNotifications = true } = options;

  // Get identifier (user ID, session ID, or IP)
  const getIdentifier = useCallback(() => {
    if (identifier) return identifier;
    
    // Try to get user ID from context/localStorage
    const userId = localStorage.getItem('userId');
    if (userId) return `user:${userId}`;
    
    // Fallback to session-based identifier
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sessionId', sessionId);
    }
    return `session:${sessionId}`;
  }, [identifier]);

  // Check rate limit
  const checkRateLimit = useCallback(async (): Promise<RateLimitResult> => {
    setIsChecking(true);
    
    try {
      const result = await RateLimitService.checkRateLimit(
        getIdentifier(),
        limitType
      );
      
      setIsLimited(!result.allowed);
      setRemaining(result.remaining);
      setResetTime(result.resetTime);
      setMessage(result.message);
      
      if (!result.allowed && onViolation) {
        onViolation(result);
      }
      
      if (!result.allowed && showNotifications) {
        // Show browser notification if permissions granted
        if (Notification.permission === 'granted') {
          new Notification('Rate Limit Exceeded', {
            body: result.message || 'Please slow down your requests.',
            icon: '/favicon.ico',
            tag: 'rate-limit'
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return {
        allowed: true,
        remaining: RATE_LIMITS[limitType].requests,
        resetTime: Date.now() + (RATE_LIMITS[limitType].window * 1000)
      };
    } finally {
      setIsChecking(false);
    }
  }, [getIdentifier, limitType, onViolation, showNotifications]);

  // Auto-check on mount if enabled
  useEffect(() => {
    if (autoCheck) {
      checkRateLimit();
    }
  }, [autoCheck, checkRateLimit]);

  // Calculate time remaining until reset
  const getTimeRemaining = useCallback(() => {
    if (!resetTime) return 0;
    return Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
  }, [resetTime]);

  // Format time remaining for display
  const getFormattedTimeRemaining = useCallback(() => {
    return RateLimitService.formatRetryAfter(getTimeRemaining());
  }, [getTimeRemaining]);

  // Execute action with rate limit check
  const executeWithRateLimit = useCallback(async (
    action: () => Promise<any> | any,
    customMessage?: string
  ) => {
    const result = await checkRateLimit();
    
    if (!result.allowed) {
      const error = new Error(customMessage || result.message || 'Rate limit exceeded');
      (error as any).rateLimited = true;
      (error as any).resetTime = result.resetTime;
      throw error;
    }
    
    return await action();
  }, [checkRateLimit]);

  // Reset rate limit state
  const resetState = useCallback(() => {
    setIsLimited(false);
    setRemaining(RATE_LIMITS[limitType].requests);
    setResetTime(0);
    setMessage(undefined);
  }, [limitType]);

  return {
    // State
    isLimited,
    remaining,
    resetTime,
    message,
    isChecking,
    
    // Computed values
    timeRemaining: getTimeRemaining(),
    formattedTimeRemaining: getFormattedTimeRemaining(),
    
    // Actions
    checkRateLimit,
    executeWithRateLimit,
    resetState,
    
    // Config
    limit: RATE_LIMITS[limitType].requests,
    window: RATE_LIMITS[limitType].window,
  };
}

// Convenience hooks for common rate limits
export const useGameRateLimit = (identifier?: string) => 
  useRateLimit('JOIN_GAME', identifier);

export const useImageGenerationRateLimit = (identifier?: string) => 
  useRateLimit('GENERATE_IMAGE', identifier, { showNotifications: true });

export const useAuthRateLimit = (identifier?: string) => 
  useRateLimit('AUTH_ATTEMPTS', identifier, { 
    showNotifications: true,
    onViolation: (result) => {
      console.warn('Auth rate limit exceeded:', result);
    }
  });

export default useRateLimit;