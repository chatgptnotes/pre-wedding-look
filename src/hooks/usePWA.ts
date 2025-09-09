import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService } from '../services/pushNotificationService';
import { analyticsService } from '../services/analyticsService';
import { loggingService } from '../services/loggingService';

// Hook for PWA installation
export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkInstallation();

    // Listen for install prompt event
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstallable(true);
      
      // Track that install prompt is available
      analyticsService.track('pwa_install_prompt_available');
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      
      // Track successful installation
      analyticsService.track('pwa_installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      
      // Track the user's choice
      analyticsService.track('pwa_install_prompt_response', {
        outcome: outcome,
      });

      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      loggingService.error('Failed to prompt install', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    canInstall: !!deferredPrompt,
  };
};

// Hook for PWA features and capabilities
export const usePWAFeatures = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => {
      setIsOnline(true);
      analyticsService.track('network_online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      analyticsService.track('network_offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          setServiceWorkerStatus('ready');
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  analyticsService.track('pwa_update_available');
                }
              });
            }
          });

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', event => {
            if (event.data.type === 'NETWORK_STATUS') {
              setIsOnline(event.data.isOnline);
            }
          });

          analyticsService.track('service_worker_registered');
        })
        .catch(error => {
          setServiceWorkerStatus('error');
          loggingService.error('Service worker registration failed', error);
        });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
  }, []);

  const clearCache = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        const messageChannel = new MessageChannel();
        
        return new Promise<boolean>((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data.success);
          };
          
          registration.active!.postMessage(
            { type: 'CLEAR_CACHE' },
            [messageChannel.port2]
          );
        });
      }
    }
    return false;
  }, []);

  return {
    isOnline,
    serviceWorkerStatus,
    updateAvailable,
    refreshApp,
    clearCache,
    isPWA: window.matchMedia('(display-mode: standalone)').matches,
  };
};

// Hook for push notifications integration
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initPushNotifications = async () => {
      setIsSupported(pushNotificationService.isSupported());
      setPermission(pushNotificationService.getPermissionStatus());
      setIsSubscribed(pushNotificationService.hasSubscription());
      setIsLoading(false);
    };

    initPushNotifications();
  }, []);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const granted = await pushNotificationService.requestPermission();
      setPermission(pushNotificationService.getPermissionStatus());
      setIsSubscribed(pushNotificationService.hasSubscription());
      return granted;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const subscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.subscribe();
      setIsSubscribed(pushNotificationService.hasSubscription());
      return success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.unsubscribe();
      setIsSubscribed(pushNotificationService.hasSubscription());
      return success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      await pushNotificationService.sendTestNotification();
      return true;
    } catch (error) {
      loggingService.error('Failed to send test notification', error);
      return false;
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    hasPermission: permission === 'granted',
  };
};

// Hook for native device features
export const useNativeFeatures = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Detect device type
    const detectDeviceType = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const width = window.innerWidth;
      
      if (/mobile|android|iphone/.test(userAgent) && width < 768) {
        setDeviceType('mobile');
      } else if (/ipad|tablet/.test(userAgent) || (width >= 768 && width < 1024)) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // Detect orientation
    const detectOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    // Detect fullscreen
    const detectFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    detectDeviceType();
    detectOrientation();
    detectFullscreen();

    // Listen for changes
    window.addEventListener('resize', detectDeviceType);
    window.addEventListener('resize', detectOrientation);
    window.addEventListener('orientationchange', detectOrientation);
    document.addEventListener('fullscreenchange', detectFullscreen);

    return () => {
      window.removeEventListener('resize', detectDeviceType);
      window.removeEventListener('resize', detectOrientation);
      window.removeEventListener('orientationchange', detectOrientation);
      document.removeEventListener('fullscreenchange', detectFullscreen);
    };
  }, []);

  const shareContent = useCallback(async (data: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        analyticsService.track('native_share_used', {
          has_files: !!data.files?.length,
        });
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          loggingService.error('Native share failed', error);
        }
        return false;
      }
    }
    return false;
  }, []);

  const requestFullscreen = useCallback(async () => {
    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
        return true;
      } catch (error) {
        loggingService.error('Fullscreen request failed', error);
        return false;
      }
    }
    return false;
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (document.exitFullscreen) {
      try {
        await document.exitFullscreen();
        return true;
      } catch (error) {
        loggingService.error('Exit fullscreen failed', error);
        return false;
      }
    }
    return false;
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        analyticsService.track('clipboard_copy_success');
        return true;
      } catch (error) {
        loggingService.error('Clipboard copy failed', error);
        return false;
      }
    }
    return false;
  }, []);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        analyticsService.track('wake_lock_requested');
        return wakeLock;
      } catch (error) {
        loggingService.error('Wake lock request failed', error);
        return null;
      }
    }
    return null;
  }, []);

  return {
    deviceType,
    orientation,
    isFullscreen,
    shareContent,
    requestFullscreen,
    exitFullscreen,
    copyToClipboard,
    requestWakeLock,
    supportsShare: !!navigator.share,
    supportsClipboard: !!navigator.clipboard,
    supportsWakeLock: 'wakeLock' in navigator,
    isTouchDevice: 'ontouchstart' in window,
  };
};

// Hook for app shortcuts and quick actions
export const useAppShortcuts = () => {
  const [shortcuts, setShortcuts] = useState<any[]>([]);

  useEffect(() => {
    // Load shortcuts from manifest
    fetch('/manifest.json')
      .then(response => response.json())
      .then(manifest => {
        if (manifest.shortcuts) {
          setShortcuts(manifest.shortcuts);
        }
      })
      .catch(error => {
        loggingService.error('Failed to load app shortcuts', error);
      });
  }, []);

  const trackShortcutUsage = useCallback((shortcutName: string) => {
    analyticsService.track('app_shortcut_used', {
      shortcut_name: shortcutName,
    });
  }, []);

  return {
    shortcuts,
    trackShortcutUsage,
  };
};