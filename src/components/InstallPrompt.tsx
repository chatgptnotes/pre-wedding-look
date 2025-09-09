import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInstallPrompt, usePWAFeatures } from '../hooks/usePWA';
import { useAnalytics } from '../hooks/useAnalytics';

interface InstallPromptProps {
  autoShow?: boolean;
  className?: string;
  variant?: 'banner' | 'modal' | 'inline';
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  autoShow = true,
  className = '',
  variant = 'banner',
}) => {
  const { isInstallable, isInstalled, promptInstall, canInstall } = useInstallPrompt();
  const { isPWA } = usePWAFeatures();
  const { track } = useAnalytics();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || isPWA || isDismissed || (!isInstallable && autoShow)) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    track('install_prompt_clicked');
    
    try {
      const success = await promptInstall();
      if (success) {
        track('install_completed');
      } else {
        track('install_cancelled');
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    track('install_prompt_dismissed');
  };

  const BannerPrompt = () => (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              📱
            </div>
            <div>
              <p className="font-semibold text-sm">Install Style-Off App</p>
              <p className="text-xs text-white/90">Get the full experience with offline support</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling || !canInstall}
              className="bg-white text-purple-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white p-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ModalPrompt = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl ${className}`}
      >
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl">
            📱
          </div>
          <h3 className="text-xl font-bold mb-2">Install Style-Off</h3>
          <p className="text-white/90 text-sm">
            Get instant access, offline support, and push notifications
          </p>
        </div>
        
        <div className="p-6">
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                ⚡
              </div>
              <span className="text-sm">Lightning fast performance</span>
            </div>
            
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                📱
              </div>
              <span className="text-sm">Works offline</span>
            </div>
            
            <div className="flex items-center space-x-3 text-gray-700">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                🔔
              </div>
              <span className="text-sm">Game notifications</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleInstall}
              disabled={isInstalling || !canInstall}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              {isInstalling ? 'Installing...' : 'Install App'}
            </button>
            
            <button
              onClick={handleDismiss}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
            >
              Later
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const InlinePrompt = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          📱
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-1">Install Style-Off App</h4>
          <p className="text-sm text-gray-600 mb-3">
            Add to your home screen for quick access and offline support
          </p>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleInstall}
              disabled={isInstalling || !canInstall}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );

  const PromptComponent = {
    banner: BannerPrompt,
    modal: ModalPrompt,
    inline: InlinePrompt,
  }[variant];

  return (
    <AnimatePresence>
      {(isInstallable || !autoShow) && <PromptComponent />}
    </AnimatePresence>
  );
};

// Smart install prompt that shows contextually
export const SmartInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState<'banner' | 'modal' | 'inline'>('banner');
  const { isInstallable } = useInstallPrompt();
  const { track } = useAnalytics();

  React.useEffect(() => {
    if (!isInstallable) return;

    // Show banner after 10 seconds
    const bannerTimer = setTimeout(() => {
      setPromptType('banner');
      setShowPrompt(true);
      track('smart_install_prompt_shown', { type: 'banner', delay: 10000 });
    }, 10000);

    // Show modal after 60 seconds if banner was dismissed
    const modalTimer = setTimeout(() => {
      setPromptType('modal');
      setShowPrompt(true);
      track('smart_install_prompt_shown', { type: 'modal', delay: 60000 });
    }, 60000);

    return () => {
      clearTimeout(bannerTimer);
      clearTimeout(modalTimer);
    };
  }, [isInstallable, track]);

  if (!showPrompt) return null;

  return (
    <InstallPrompt
      variant={promptType}
      autoShow={false}
    />
  );
};

export default InstallPrompt;