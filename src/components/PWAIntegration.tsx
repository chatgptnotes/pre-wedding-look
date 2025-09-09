import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAFeatures, useInstallPrompt, usePushNotifications } from '../hooks/usePWA';
import { useAnalytics } from '../hooks/useAnalytics';
import { InstallPrompt } from './InstallPrompt';
import { PushNotificationSettings } from './PushNotificationSettings';

// Main PWA integration component
export const PWAIntegration: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline, updateAvailable, serviceWorkerStatus, refreshApp } = usePWAFeatures();
  const { isInstallable, isInstalled } = useInstallPrompt();
  const { track } = useAnalytics();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // Track PWA status changes
  useEffect(() => {
    track('pwa_status_change', {
      is_online: isOnline,
      is_installed: isInstalled,
      is_installable: isInstallable,
      update_available: updateAvailable,
      service_worker_status: serviceWorkerStatus,
    });
  }, [isOnline, isInstalled, isInstallable, updateAvailable, serviceWorkerStatus, track]);

  // Show update prompt when update is available
  useEffect(() => {
    if (updateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [updateAvailable]);

  // Show offline banner when going offline
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
      const timer = setTimeout(() => setShowOfflineBanner(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowOfflineBanner(false);
    }
  }, [isOnline]);

  const handleUpdateApp = () => {
    track('app_update_accepted');
    setShowUpdatePrompt(false);
    refreshApp();
  };

  const handleDismissUpdate = () => {
    track('app_update_dismissed');
    setShowUpdatePrompt(false);
  };

  return (
    <>
      {/* Main content */}
      {children}

      {/* Install prompt */}
      {isInstallable && !isInstalled && (
        <InstallPrompt variant="banner" />
      )}

      {/* Update available prompt */}
      <AnimatePresence>
        {showUpdatePrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-lg">
                🚀
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900">App Update Available</h4>
                <p className="text-sm text-gray-600 mt-1">
                  A new version of Style-Off is ready with improvements and bug fixes.
                </p>
                
                <div className="flex space-x-3 mt-3">
                  <button
                    onClick={handleUpdateApp}
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Update Now
                  </button>
                  <button
                    onClick={handleDismissUpdate}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    Later
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleDismissUpdate}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline banner */}
      <AnimatePresence>
        {showOfflineBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white"
          >
            <div className="max-w-7xl mx-auto px-4 py-2 text-center">
              <div className="flex items-center justify-center space-x-2">
                <span>📶</span>
                <span className="text-sm font-medium">
                  You're offline. Some features may be limited.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Network status indicator */}
      <NetworkStatusIndicator isOnline={isOnline} />
    </>
  );
};

// Network status indicator
const NetworkStatusIndicator: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
    } else {
      const timer = setTimeout(() => setShowIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showIndicator) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className={`
        px-3 py-2 rounded-full text-sm font-medium flex items-center space-x-2
        ${isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
        }
      `}>
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-white animate-pulse'}`} />
        <span>{isOnline ? 'Back online' : 'Offline'}</span>
      </div>
    </motion.div>
  );
};

// PWA settings panel
export const PWASettings: React.FC = () => {
  const { isOnline, serviceWorkerStatus, isPWA, clearCache } = usePWAFeatures();
  const { isInstalled, isInstallable, promptInstall } = useInstallPrompt();
  const { track } = useAnalytics();
  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleClearCache = async () => {
    setIsClearingCache(true);
    track('cache_cleared_manually');
    
    try {
      await clearCache();
      // Show success message
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PWA Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">App Status</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">{isPWA ? '📱' : '🌐'}</div>
            <div className="font-medium text-gray-900">
              {isPWA ? 'PWA Mode' : 'Browser Mode'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {isPWA ? 'Running as app' : 'Running in browser'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">{isOnline ? '🟢' : '🔴'}</div>
            <div className="font-medium text-gray-900">
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {isOnline ? 'All features available' : 'Limited features'}
            </div>
          </div>
        </div>

        {/* Service Worker Status */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              serviceWorkerStatus === 'ready' ? 'bg-green-500' : 
              serviceWorkerStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`} />
            <span className="text-sm font-medium text-blue-900">
              Service Worker: {serviceWorkerStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Installation */}
      {!isInstalled && isInstallable && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Install App</h3>
          
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-xl">
              📲
            </div>
            
            <div className="flex-1">
              <p className="text-gray-600 mb-4">
                Install Style-Off on your device for the best experience with offline support and notifications.
              </p>
              
              <button
                onClick={() => {
                  track('install_from_settings');
                  promptInstall();
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Install Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push Notifications */}
      <PushNotificationSettings />

      {/* Cache Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage & Cache</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Clear Cache</div>
              <div className="text-sm text-gray-600">
                Clear stored data to free up space and fix issues
              </div>
            </div>
            
            <button
              onClick={handleClearCache}
              disabled={isClearingCache}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              {isClearingCache ? 'Clearing...' : 'Clear'}
            </button>
          </div>

          {/* Storage usage estimate */}
          <StorageUsage />
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Info</h3>
        
        <div className="text-sm text-gray-600 space-y-2 font-mono">
          <div>User Agent: {navigator.userAgent}</div>
          <div>Screen: {screen.width}x{screen.height}</div>
          <div>Viewport: {window.innerWidth}x{window.innerHeight}</div>
          <div>Platform: {navigator.platform}</div>
          <div>Language: {navigator.language}</div>
          <div>Service Worker: {serviceWorkerStatus}</div>
          <div>Standalone: {isPWA ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  );
};

// Storage usage component
const StorageUsage: React.FC = () => {
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        setUsage({
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
        });
      });
    }
  }, []);

  if (!usage) return null;

  const usedMB = Math.round(usage.used / (1024 * 1024));
  const quotaMB = Math.round(usage.quota / (1024 * 1024));
  const percentage = quotaMB > 0 ? (usedMB / quotaMB) * 100 : 0;

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-600">Storage Used</span>
        <span className="font-medium">{usedMB} MB / {quotaMB} MB</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        {percentage.toFixed(1)}% used
      </div>
    </div>
  );
};

export default PWAIntegration;