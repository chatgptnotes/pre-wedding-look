/**
 * Rate Limit Notification Component
 * Provides user-friendly feedback when rate limits are hit
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface RateLimitNotificationProps {
  isVisible: boolean;
  message: string;
  timeRemaining: number;
  onDismiss?: () => void;
  severity?: 'warning' | 'error' | 'info';
  showCountdown?: boolean;
  allowDismiss?: boolean;
}

export function RateLimitNotification({
  isVisible,
  message,
  timeRemaining,
  onDismiss,
  severity = 'warning',
  showCountdown = true,
  allowDismiss = true
}: RateLimitNotificationProps) {
  const [countdown, setCountdown] = useState(timeRemaining);

  // Update countdown every second
  useEffect(() => {
    if (!isVisible || !showCountdown) return;
    
    setCountdown(timeRemaining);
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onDismiss) onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, timeRemaining, showCountdown, onDismiss]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getSeverityStyles = () => {
    switch (severity) {
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          icon: 'text-red-500',
          accent: 'bg-red-500'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          icon: 'text-blue-500',
          accent: 'bg-blue-500'
        };
      default: // warning
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-800 dark:text-amber-200',
          icon: 'text-amber-500',
          accent: 'bg-amber-500'
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className={`
            ${styles.bg} ${styles.border} ${styles.text}
            border rounded-xl shadow-lg backdrop-blur-sm
            relative overflow-hidden
          `}>
            {/* Accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${styles.accent}`} />
            
            <div className="p-4">
              <div className="flex items-start">
                <div className={`flex-shrink-0 ${styles.icon} mr-3 mt-0.5`}>
                  <ExclamationTriangleIcon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium mb-1">
                    Rate Limit Reached
                  </div>
                  <div className="text-xs opacity-90 mb-3">
                    {message}
                  </div>
                  
                  {showCountdown && countdown > 0 && (
                    <div className="flex items-center text-xs opacity-75">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>Try again in {formatTime(countdown)}</span>
                    </div>
                  )}
                </div>
                
                {allowDismiss && onDismiss && (
                  <button
                    onClick={onDismiss}
                    className={`
                      flex-shrink-0 ml-2 ${styles.icon} hover:opacity-75
                      transition-opacity duration-200
                    `}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Progress bar */}
              {showCountdown && timeRemaining > 0 && (
                <div className="mt-3 bg-black/10 dark:bg-white/10 rounded-full h-1 overflow-hidden">
                  <motion.div
                    className={`h-full ${styles.accent} rounded-full`}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: timeRemaining, ease: 'linear' }}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast-style notification for inline use
export function RateLimitToast({
  isVisible,
  message,
  timeRemaining,
  onDismiss,
  position = 'bottom-right'
}: RateLimitNotificationProps & { position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' }) {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: position.includes('right') ? 100 : -100 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: position.includes('right') ? 100 : -100 }}
          className={`fixed ${positionClasses[position]} z-50 max-w-sm`}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 text-amber-500 mr-3">
                <ExclamationTriangleIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Please slow down
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {message}
                </div>
                {timeRemaining > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {Math.ceil(timeRemaining / 60)}m remaining
                  </div>
                )}
              </div>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Button wrapper that shows rate limit state
export function RateLimitedButton({
  children,
  onClick,
  isLimited,
  timeRemaining,
  className = '',
  disabled = false,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  isLimited: boolean;
  timeRemaining: number;
  className?: string;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.ceil(seconds / 60)}m`;
  };

  const isDisabled = disabled || isLimited;

  return (
    <button
      {...props}
      onClick={isLimited ? undefined : onClick}
      disabled={isDisabled}
      className={`
        relative transition-all duration-300
        ${isLimited 
          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
          : 'hover:scale-105 active:scale-95'
        }
        ${className}
      `}
    >
      <span className={isLimited ? 'opacity-50' : ''}>
        {children}
      </span>
      {isLimited && timeRemaining > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-white/10 rounded-lg"
        >
          <span className="text-xs font-medium">
            {formatTime(timeRemaining)}
          </span>
        </motion.div>
      )}
    </button>
  );
}

export default RateLimitNotification;