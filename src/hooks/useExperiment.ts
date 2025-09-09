import { useState, useEffect, useCallback } from 'react';
import { experimentService, Experiment, ExperimentVariant } from '../services/experimentService';
import { loggingService } from '../services/loggingService';

// Hook for A/B testing and experiments
export const useExperiment = (experimentName: string, defaultVariant: string = 'control') => {
  const [variant, setVariant] = useState<string>(defaultVariant);
  const [isLoading, setIsLoading] = useState(true);
  const [experiment, setExperiment] = useState<Experiment | null>(null);

  // Load experiment and get user's variant
  useEffect(() => {
    const loadExperiment = async () => {
      try {
        setIsLoading(true);
        
        // Get experiment configuration
        const experimentData = await experimentService.getExperiment(experimentName);
        setExperiment(experimentData);

        // Get user's variant assignment
        const userVariant = await experimentService.getVariant(experimentName);
        
        if (userVariant && experimentData) {
          // Verify the variant exists in the experiment
          const variantExists = experimentData.variants.some((v: ExperimentVariant) => v.id === userVariant);
          if (variantExists) {
            setVariant(userVariant);
          } else {
            loggingService.warn(`Variant ${userVariant} not found in experiment ${experimentName}`, {
              experiment: experimentData,
              userVariant
            });
            setVariant(defaultVariant);
          }
        } else {
          setVariant(defaultVariant);
        }
      } catch (error) {
        loggingService.error('Failed to load experiment', { experimentName, error });
        setVariant(defaultVariant);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiment();
  }, [experimentName, defaultVariant]);

  // Track experiment event
  const track = useCallback(async (
    eventName: string,
    properties?: Record<string, any>,
    value?: number
  ) => {
    try {
      await experimentService.trackEvent(experimentName, eventName, properties, value);
    } catch (error) {
      loggingService.error('Failed to track experiment event', { 
        experimentName, 
        eventName, 
        error 
      });
    }
  }, [experimentName]);

  // Track conversion
  const trackConversion = useCallback(async (
    conversionType: string = 'primary',
    value?: number,
    properties?: Record<string, any>
  ) => {
    try {
      await experimentService.trackConversion(experimentName, conversionType, value, properties);
    } catch (error) {
      loggingService.error('Failed to track experiment conversion', { 
        experimentName, 
        conversionType, 
        error 
      });
    }
  }, [experimentName]);

  // Check if user is in specific variant
  const isVariant = useCallback((variantId: string): boolean => {
    return variant === variantId && !isLoading;
  }, [variant, isLoading]);

  // Get variant configuration
  const getVariantConfig = useCallback((key?: string): any => {
    if (!experiment || isLoading) return null;
    
    const currentVariant = experiment.variants.find((v: ExperimentVariant) => v.id === variant);
    if (!currentVariant) return null;
    
    return key ? currentVariant.config[key] : currentVariant.config;
  }, [experiment, variant, isLoading]);

  return {
    variant,
    isLoading,
    experiment,
    track,
    trackConversion,
    isVariant,
    getVariantConfig,
    isActive: experiment?.status === 'running',
  };
};

// Hook for feature flags (simple experiments with on/off variants)
export const useFeatureFlag = (flagName: string, defaultValue: boolean = false) => {
  const { variant, isLoading, experiment, track } = useExperiment(flagName, defaultValue ? 'enabled' : 'disabled');
  
  const isEnabled = variant === 'enabled' || variant === 'on' || variant === 'true';
  
  // Track feature flag usage
  const trackUsage = useCallback(async (action: string, properties?: Record<string, any>) => {
    await track(`feature_${action}`, {
      feature_enabled: isEnabled,
      ...properties,
    });
  }, [track, isEnabled]);

  return {
    isEnabled,
    isLoading,
    experiment,
    trackUsage,
  };
};

// Hook for multivariate testing (multiple variants)
export const useMultivariateTest = (experimentName: string, variants: string[], defaultVariant?: string) => {
  const defaultVar = defaultVariant || variants[0];
  const { variant, isLoading, experiment, track, trackConversion } = useExperiment(experimentName, defaultVar);

  // Get specific variant content/config
  const getVariantContent = useCallback((contentKey: string): any => {
    if (!experiment || isLoading) return null;
    
    const currentVariant = experiment.variants.find((v: ExperimentVariant) => v.id === variant);
    return currentVariant?.config?.[contentKey];
  }, [experiment, variant, isLoading]);

  // Check if current variant is one of the expected variants
  const isValidVariant = variants.includes(variant);

  return {
    variant: isValidVariant ? variant : defaultVar,
    isLoading,
    experiment,
    track,
    trackConversion,
    getVariantContent,
    isValidVariant,
  };
};

// Hook for managing experiment assignments (admin use)
export const useExperimentManagement = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all experiments
  useEffect(() => {
    const loadExperiments = async () => {
      try {
        setIsLoading(true);
        const activeExperiments = await experimentService.getActiveExperiments();
        setExperiments(activeExperiments);
      } catch (error) {
        loggingService.error('Failed to load experiments', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiments();
  }, []);

  // Create new experiment
  const createExperiment = useCallback(async (experiment: Partial<Experiment>): Promise<Experiment | null> => {
    try {
      const newExperiment = await experimentService.createExperiment(experiment);
      if (newExperiment) {
        setExperiments(prev => [...prev, newExperiment]);
      }
      return newExperiment;
    } catch (error) {
      loggingService.error('Failed to create experiment', error);
      return null;
    }
  }, []);

  // Update experiment
  const updateExperiment = useCallback(async (
    experimentName: string, 
    updates: Partial<Experiment>
  ): Promise<Experiment | null> => {
    try {
      const updatedExperiment = await experimentService.updateExperiment(experimentName, updates);
      if (updatedExperiment) {
        setExperiments(prev => 
          prev.map(exp => exp.name === experimentName ? updatedExperiment : exp)
        );
      }
      return updatedExperiment;
    } catch (error) {
      loggingService.error('Failed to update experiment', error);
      return null;
    }
  }, []);

  // Force user into variant
  const forceVariant = useCallback(async (
    experimentName: string,
    variantId: string,
    userId?: string,
    reason?: string
  ): Promise<boolean> => {
    try {
      return await experimentService.forceVariant(experimentName, variantId, userId, reason);
    } catch (error) {
      loggingService.error('Failed to force variant', error);
      return false;
    }
  }, []);

  // Get experiment results
  const getResults = useCallback(async (experimentName: string) => {
    try {
      return await experimentService.getExperimentResults(experimentName);
    } catch (error) {
      loggingService.error('Failed to get experiment results', error);
      return null;
    }
  }, []);

  return {
    experiments,
    isLoading,
    createExperiment,
    updateExperiment,
    forceVariant,
    getResults,
  };
};

// Hook for common A/B test patterns
export const useABTest = () => {
  // Landing page hero test
  const landingHero = useExperiment('landing_hero_test', 'control');
  
  // CTA button text test
  const ctaText = useMultivariateTest('cta_text_test', ['control', 'urgent', 'benefit'], 'control');
  
  // Pricing page test
  const pricingLayout = useExperiment('pricing_layout_test', 'control');
  
  // Onboarding flow test
  const onboardingFlow = useMultivariateTest('onboarding_flow_test', ['control', 'simplified', 'guided'], 'control');

  return {
    landingHero,
    ctaText,
    pricingLayout,
    onboardingFlow,
  };
};

// Hook for personalization experiments based on user segments
export const usePersonalizedExperiment = (
  experimentName: string,
  userSegment: string,
  defaultVariant: string = 'control'
) => {
  const [personalizedVariant, setPersonalizedVariant] = useState<string>(defaultVariant);
  const { variant, isLoading, experiment, track, trackConversion } = useExperiment(
    `${experimentName}_${userSegment}`,
    defaultVariant
  );

  useEffect(() => {
    // Check if there's a personalized experiment for this segment
    if (!isLoading && experiment) {
      setPersonalizedVariant(variant);
    } else {
      // Fallback to default experiment without segment
      const fallbackExperiment = `${experimentName}_default`;
      experimentService.getVariant(fallbackExperiment).then(fallbackVariant => {
        if (fallbackVariant) {
          setPersonalizedVariant(fallbackVariant);
        }
      });
    }
  }, [experimentName, userSegment, variant, isLoading, experiment]);

  return {
    variant: personalizedVariant,
    isLoading,
    experiment,
    track,
    trackConversion,
    userSegment,
  };
};