import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService, UserProperties } from '../services/analyticsService';
import { loggingService } from '../services/loggingService';

// Hook for analytics tracking
export const useAnalytics = () => {
  const location = useLocation();
  const prevLocationRef = useRef<string>('');

  // Track page views automatically
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (prevLocationRef.current !== currentPath) {
      analyticsService.trackPageView(location.pathname, {
        search: location.search,
        hash: location.hash,
        pathname: location.pathname,
      });
      prevLocationRef.current = currentPath;
    }
  }, [location]);

  // Generic event tracking
  const track = useCallback(async (
    eventName: string, 
    properties?: Record<string, any>, 
    userProperties?: UserProperties
  ) => {
    try {
      await analyticsService.track(eventName, properties, userProperties);
    } catch (error) {
      loggingService.error('Analytics tracking failed', { eventName, error });
    }
  }, []);

  // Game-specific tracking methods
  const trackGameJoined = useCallback(async (gameType: string, gameId?: string) => {
    await analyticsService.trackGameJoined(gameType, gameId);
  }, []);

  const trackRoundSubmitted = useCallback(async (gameId: string, roundNumber: number, timeToSubmit?: number) => {
    await analyticsService.trackRoundSubmitted(gameId, roundNumber, timeToSubmit);
  }, []);

  const trackRevealViewed = useCallback(async (gameId: string, revealType: string) => {
    await analyticsService.trackRevealViewed(gameId, revealType);
  }, []);

  const trackReelCreated = useCallback(async (gameId: string, creationMethod: string) => {
    await analyticsService.trackReelCreated(gameId, creationMethod);
  }, []);

  const trackShareClicked = useCallback(async (content: string, platform?: string) => {
    await analyticsService.trackShareClicked(content, platform);
  }, []);

  const trackTournamentJoined = useCallback(async (tournamentId: string) => {
    await analyticsService.trackTournamentJoined(tournamentId);
  }, []);

  const trackPaymentSucceeded = useCallback(async (amount: number, currency: string, product: string) => {
    await analyticsService.trackPaymentSucceeded(amount, currency, product);
  }, []);

  const trackConversion = useCallback(async (conversionType: string, value?: number, properties?: Record<string, any>) => {
    await analyticsService.trackConversion(conversionType, value, properties);
  }, []);

  const trackPerformance = useCallback(async (metric: string, value: number, properties?: Record<string, any>) => {
    await analyticsService.trackPerformance(metric, value, properties);
  }, []);

  const trackError = useCallback(async (error: Error, context?: Record<string, any>) => {
    await analyticsService.trackError(error, context);
  }, []);

  const setUserProperties = useCallback(async (properties: UserProperties) => {
    await analyticsService.setUserProperties(properties);
  }, []);

  const trackFunnelStep = useCallback(async (funnelName: string, stepName: string) => {
    await analyticsService.trackFunnelStep(funnelName, stepName);
  }, []);

  return {
    track,
    trackGameJoined,
    trackRoundSubmitted,
    trackRevealViewed,
    trackReelCreated,
    trackShareClicked,
    trackTournamentJoined,
    trackPaymentSucceeded,
    trackConversion,
    trackPerformance,
    trackError,
    setUserProperties,
    trackFunnelStep,
  };
};

// Hook for performance tracking
export const usePerformanceTracking = () => {
  const { trackPerformance } = useAnalytics();

  // Track component mount time
  const trackComponentMount = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const mountTime = performance.now() - startTime;
      trackPerformance('component_mount_time', mountTime, {
        component_name: componentName,
      });
    };
  }, [trackPerformance]);

  // Track API call performance
  const trackApiCall = useCallback((apiName: string) => {
    const startTime = performance.now();
    
    return {
      success: (data?: any) => {
        const duration = performance.now() - startTime;
        trackPerformance('api_call_success', duration, {
          api_name: apiName,
          response_size: JSON.stringify(data || {}).length,
        });
      },
      error: (error: Error) => {
        const duration = performance.now() - startTime;
        trackPerformance('api_call_error', duration, {
          api_name: apiName,
          error_message: error.message,
        });
      },
    };
  }, [trackPerformance]);

  // Track image load time
  const trackImageLoad = useCallback((imageUrl: string, imageSize?: number) => {
    const startTime = performance.now();
    
    const img = new Image();
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      trackPerformance('image_load_time', loadTime, {
        image_url: imageUrl,
        image_size: imageSize,
        image_width: img.width,
        image_height: img.height,
      });
    };
    
    img.onerror = () => {
      const loadTime = performance.now() - startTime;
      trackPerformance('image_load_error', loadTime, {
        image_url: imageUrl,
      });
    };
    
    img.src = imageUrl;
  }, [trackPerformance]);

  return {
    trackComponentMount,
    trackApiCall,
    trackImageLoad,
  };
};

// Hook for conversion tracking
export const useConversionTracking = () => {
  const { trackConversion, trackFunnelStep } = useAnalytics();

  const trackSignUp = useCallback(async (method: string) => {
    await trackConversion('signup', 1, { signup_method: method });
    await trackFunnelStep('main_user_journey', 'signup');
  }, [trackConversion, trackFunnelStep]);

  const trackFirstGame = useCallback(async (gameType: string) => {
    await trackConversion('first_game', 1, { game_type: gameType });
    await trackFunnelStep('main_user_journey', 'start_game');
  }, [trackConversion, trackFunnelStep]);

  const trackFirstReveal = useCallback(async () => {
    await trackConversion('first_reveal', 1);
    await trackFunnelStep('main_user_journey', 'view_reveal');
  }, [trackConversion, trackFunnelStep]);

  const trackFirstShare = useCallback(async (platform: string) => {
    await trackConversion('first_share', 1, { platform });
    await trackFunnelStep('main_user_journey', 'share');
  }, [trackConversion, trackFunnelStep]);

  const trackPurchase = useCallback(async (amount: number, product: string) => {
    await trackConversion('purchase', amount, { product });
  }, [trackConversion]);

  const trackReturnVisit = useCallback(async (daysSinceLastVisit: number) => {
    await trackConversion('return_visit', 1, { days_since_last_visit: daysSinceLastVisit });
  }, [trackConversion]);

  return {
    trackSignUp,
    trackFirstGame,
    trackFirstReveal,
    trackFirstShare,
    trackPurchase,
    trackReturnVisit,
  };
};

// Hook for error tracking with automatic error boundary integration
export const useErrorTracking = () => {
  const { trackError } = useAnalytics();

  // Track JavaScript errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript_error',
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          type: 'unhandled_promise_rejection',
        }
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackError]);

  const trackComponentError = useCallback((error: Error, errorInfo: any, componentName: string) => {
    trackError(error, {
      component_name: componentName,
      component_stack: errorInfo.componentStack,
      type: 'react_component_error',
    });
  }, [trackError]);

  const trackAsyncError = useCallback((error: Error, operation: string) => {
    trackError(error, {
      operation,
      type: 'async_operation_error',
    });
  }, [trackError]);

  return {
    trackError,
    trackComponentError,
    trackAsyncError,
  };
};