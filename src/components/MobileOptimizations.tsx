import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNativeFeatures } from '../hooks/usePWA';
import { useAnalytics } from '../hooks/useAnalytics';

// Touch gesture wrapper component
interface TouchGestureWrapperProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
  swipeThreshold?: number;
  disabled?: boolean;
}

export const TouchGestureWrapper: React.FC<TouchGestureWrapperProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onDoubleTap,
  swipeThreshold = 50,
  disabled = false,
}) => {
  const { track } = useAnalytics();
  const [lastTap, setLastTap] = useState(0);
  const [pinchDistance, setPinchDistance] = useState(0);
  
  const handlePanEnd = (event: any, info: PanInfo) => {
    if (disabled) return;
    
    const { offset, velocity } = info;
    const swipeVelocityThreshold = 500;
    
    // Determine swipe direction
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal swipe
      if ((offset.x > swipeThreshold || velocity.x > swipeVelocityThreshold) && onSwipeRight) {
        track('touch_gesture_used', { gesture: 'swipe_right' });
        onSwipeRight();
      } else if ((offset.x < -swipeThreshold || velocity.x < -swipeVelocityThreshold) && onSwipeLeft) {
        track('touch_gesture_used', { gesture: 'swipe_left' });
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if ((offset.y > swipeThreshold || velocity.y > swipeVelocityThreshold) && onSwipeDown) {
        track('touch_gesture_used', { gesture: 'swipe_down' });
        onSwipeDown();
      } else if ((offset.y < -swipeThreshold || velocity.y < -swipeVelocityThreshold) && onSwipeUp) {
        track('touch_gesture_used', { gesture: 'swipe_up' });
        onSwipeUp();
      }
    }
  };

  const handleTap = () => {
    if (disabled || !onDoubleTap) return;
    
    const now = Date.now();
    const timeDiff = now - lastTap;
    
    if (timeDiff < 300) {
      track('touch_gesture_used', { gesture: 'double_tap' });
      onDoubleTap();
    }
    
    setLastTap(now);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    if (disabled || !onPinch || event.touches.length !== 2) return;
    
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    setPinchDistance(distance);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (disabled || !onPinch || event.touches.length !== 2) return;
    
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    if (pinchDistance > 0) {
      const scale = distance / pinchDistance;
      track('touch_gesture_used', { gesture: 'pinch', scale });
      onPinch(scale);
    }
  };

  return (
    <motion.div
      onPanEnd={handlePanEnd}
      onTap={handleTap}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      drag={disabled ? false : true}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
    >
      {children}
    </motion.div>
  );
};

// Swipeable card component for game interactions
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = '',
  disabled = false,
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -50, 0, 50, 200], [0, 0.5, 1, 0.5, 0]);
  
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (disabled) return;
    
    const threshold = 100;
    
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else {
      // Snap back to center
      x.set(0);
    }
  };

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
    >
      {children}
      
      {/* Swipe indicators */}
      <motion.div
        className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center pointer-events-none"
        style={{
          opacity: useTransform(x, [0, 100], [0, 1]),
        }}
      >
        <div className="text-green-600 font-bold text-2xl">❤️</div>
      </motion.div>
      
      <motion.div
        className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center pointer-events-none"
        style={{
          opacity: useTransform(x, [-100, 0], [1, 0]),
        }}
      >
        <div className="text-red-600 font-bold text-2xl">❌</div>
      </motion.div>
    </motion.div>
  );
};

// Pull-to-refresh component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const { track } = useAnalytics();
  
  const y = useMotionValue(0);
  const refreshProgress = useTransform(y, [0, threshold], [0, 1]);

  const handleDrag = (event: any, info: PanInfo) => {
    if (disabled || isRefreshing) return;
    
    // Only allow pulling down when at the top of the page
    if (window.scrollY > 0) return;
    
    const newY = Math.max(0, info.offset.y);
    y.set(newY);
    setPullDistance(newY);
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    if (disabled || isRefreshing || info.offset.y < threshold) {
      y.set(0);
      setPullDistance(0);
      return;
    }
    
    setIsRefreshing(true);
    track('pull_to_refresh_triggered');
    
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      y.set(0);
      setPullDistance(0);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Refresh indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center bg-gradient-to-b from-purple-500 to-transparent text-white"
        style={{
          height: useTransform(y, [0, threshold], [0, 60]),
          opacity: refreshProgress,
        }}
      >
        <div className="flex items-center space-x-2">
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0 }}
          >
            🔄
          </motion.div>
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Mobile navigation with touch gestures
export const MobileNavigation: React.FC<{
  currentTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{ id: string; label: string; icon: string }>;
}> = ({ currentTab, onTabChange, tabs }) => {
  const { track } = useAnalytics();
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const currentIndex = tabs.findIndex(tab => tab.id === currentTab);

  const handleSwipeLeft = () => {
    const nextIndex = Math.min(currentIndex + 1, tabs.length - 1);
    if (nextIndex !== currentIndex) {
      track('mobile_nav_swipe', { direction: 'left', tab: tabs[nextIndex].id });
      onTabChange(tabs[nextIndex].id);
      setSwipeDirection('left');
      setTimeout(() => setSwipeDirection(null), 200);
    }
  };

  const handleSwipeRight = () => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex !== currentIndex) {
      track('mobile_nav_swipe', { direction: 'right', tab: tabs[prevIndex].id });
      onTabChange(tabs[prevIndex].id);
      setSwipeDirection('right');
      setTimeout(() => setSwipeDirection(null), 200);
    }
  };

  return (
    <TouchGestureWrapper
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
    >
      <div className="flex bg-white border-t border-gray-200 overflow-hidden">
        {tabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            className={`flex-1 p-3 text-center ${
              tab.id === currentTab
                ? 'text-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => {
              track('mobile_nav_tap', { tab: tab.id });
              onTabChange(tab.id);
            }}
            animate={
              swipeDirection && index === currentIndex
                ? {
                    x: swipeDirection === 'left' ? -10 : 10,
                    scale: 1.05,
                  }
                : { x: 0, scale: 1 }
            }
            transition={{ duration: 0.2 }}
          >
            <div className="text-xl mb-1">{tab.icon}</div>
            <div className="text-xs font-medium">{tab.label}</div>
          </motion.button>
        ))}
      </div>
    </TouchGestureWrapper>
  );
};

// Touch-friendly button with haptic feedback
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  hapticFeedback?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  hapticFeedback = true,
}) => {
  const { track } = useAnalytics();

  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white',
    secondary: 'bg-gray-100 text-gray-700 border border-gray-300',
    danger: 'bg-red-500 text-white',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[44px]',
    md: 'px-4 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  };

  const triggerHapticFeedback = () => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10); // Light tap feedback
    }
  };

  const handleClick = () => {
    if (disabled) return;
    
    triggerHapticFeedback();
    track('touch_button_pressed', { variant, size });
    onClick?.();
  };

  return (
    <motion.button
      className={`
        rounded-xl font-semibold transition-all
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={disabled}
      style={{ touchAction: 'manipulation' }} // Prevents zoom on iOS
    >
      {children}
    </motion.button>
  );
};

// Native share integration
export const NativeShareButton: React.FC<{
  title: string;
  text: string;
  url: string;
  files?: File[];
  fallbackUrl?: string;
}> = ({ title, text, url, files, fallbackUrl }) => {
  const { shareContent, supportsShare, copyToClipboard } = useNativeFeatures();
  const { track } = useAnalytics();

  const handleShare = async () => {
    track('share_button_clicked', { has_native_share: supportsShare });
    
    if (supportsShare) {
      const success = await shareContent({ title, text, url, files });
      if (success) {
        track('native_share_completed');
        return;
      }
    }

    // Fallback to copying URL
    const copied = await copyToClipboard(fallbackUrl || url);
    if (copied) {
      track('url_copied_to_clipboard');
      // Show toast notification
      // toast.success('Link copied to clipboard!');
    }
  };

  return (
    <TouchButton
      onClick={handleShare}
      variant="secondary"
      className="flex items-center space-x-2"
    >
      <span>📤</span>
      <span>Share</span>
    </TouchButton>
  );
};

// Long press gesture component
interface LongPressProps {
  children: React.ReactNode;
  onLongPress: () => void;
  delay?: number;
  disabled?: boolean;
}

export const LongPress: React.FC<LongPressProps> = ({
  children,
  onLongPress,
  delay = 500,
  disabled = false,
}) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { track } = useAnalytics();

  const startLongPress = () => {
    if (disabled) return;
    
    timerRef.current = setTimeout(() => {
      track('long_press_triggered');
      onLongPress();
    }, delay);
  };

  const cancelLongPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchCancel={cancelLongPress}
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
    >
      {children}
    </div>
  );
};