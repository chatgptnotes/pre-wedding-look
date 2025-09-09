import { useState, useEffect, useCallback, useRef } from 'react';
import { stripeService, CreditPlan, REEL_GENERATION_COST } from '../services/stripeService';

interface CreditBalance {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  wallet_created_at?: string;
  last_updated?: string;
}

interface CreditTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface UseCreditsReturn {
  // Balance and wallet info
  balance: number;
  walletInfo: CreditBalance | null;
  isLoading: boolean;
  error: string | null;

  // Credit plans
  creditPlans: CreditPlan[];
  plansLoading: boolean;
  plansError: string | null;

  // Transaction history
  transactions: CreditTransaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;

  // Actions
  refreshBalance: () => Promise<void>;
  loadCreditPlans: () => Promise<void>;
  loadTransactions: (limit?: number, offset?: number) => Promise<void>;
  purchaseCredits: (planId: string, options?: { successUrl?: string; cancelUrl?: string }) => Promise<void>;
  spendCredits: (credits: number, description: string, reelId?: string) => Promise<boolean>;
  redeemPromoCode: (code: string) => Promise<{ success: boolean; message: string; credits?: number }>;
  checkSufficientCredits: (requiredCredits: number) => boolean;
  canGenerateReel: () => boolean;

  // Utility functions
  formatCredits: (credits: number) => string;
  getCreditsPerDollar: (plan: CreditPlan) => number;
  getBestValuePlan: () => CreditPlan | null;
}

/**
 * Hook for managing user credits system
 * Provides comprehensive credits management functionality
 */
export function useCredits(): UseCreditsReturn {
  // State for balance and wallet
  const [balance, setBalance] = useState<number>(0);
  const [walletInfo, setWalletInfo] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for credit plans
  const [creditPlans, setCreditPlans] = useState<CreditPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState<boolean>(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  // State for transactions
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState<boolean>(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  // Ref to prevent multiple simultaneous balance refreshes
  const refreshingRef = useRef<boolean>(false);

  /**
   * Refresh user's credit balance
   */
  const refreshBalance = useCallback(async () => {
    if (refreshingRef.current) return;
    
    refreshingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const balanceData = await stripeService.getCreditBalance();
      
      // If we got a number, it's just the balance
      if (typeof balanceData === 'number') {
        setBalance(balanceData);
        setWalletInfo(prev => prev ? { ...prev, balance: balanceData } : null);
      } else {
        // If we got an object, it's the full wallet info
        const wallet = balanceData as any;
        setBalance(wallet.balance || 0);
        setWalletInfo({
          balance: wallet.balance || 0,
          lifetime_earned: wallet.lifetime_earned || 0,
          lifetime_spent: wallet.lifetime_spent || 0,
          wallet_created_at: wallet.wallet_created_at,
          last_updated: wallet.last_updated
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch credit balance';
      setError(errorMessage);
      console.error('Error refreshing balance:', err);
    } finally {
      setIsLoading(false);
      refreshingRef.current = false;
    }
  }, []);

  /**
   * Load available credit plans
   */
  const loadCreditPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);

    try {
      const plans = await stripeService.getCreditPlans();
      setCreditPlans(plans);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load credit plans';
      setPlansError(errorMessage);
      console.error('Error loading credit plans:', err);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  /**
   * Load transaction history
   */
  const loadTransactions = useCallback(async (limit: number = 50, offset: number = 0) => {
    setTransactionsLoading(true);
    setTransactionsError(null);

    try {
      const transactionData = await stripeService.getCreditTransactions(limit, offset);
      setTransactions(transactionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transactions';
      setTransactionsError(errorMessage);
      console.error('Error loading transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  /**
   * Purchase credits using Stripe checkout
   */
  const purchaseCredits = useCallback(async (planId: string, options: {
    successUrl?: string;
    cancelUrl?: string;
  } = {}) => {
    try {
      await stripeService.purchaseCredits(planId, options);
      // The redirect happens automatically in the service
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate purchase';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Spend credits for reel generation
   */
  const spendCredits = useCallback(async (credits: number, description: string, reelId?: string): Promise<boolean> => {
    try {
      const success = await stripeService.spendCredits(credits, description, reelId);
      
      if (success) {
        // Update local balance
        setBalance(prev => Math.max(0, prev - credits));
        setWalletInfo(prev => prev ? {
          ...prev,
          balance: Math.max(0, prev.balance - credits),
          lifetime_spent: prev.lifetime_spent + credits
        } : null);

        // Refresh balance to get exact amount
        setTimeout(refreshBalance, 1000);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to spend credits';
      setError(errorMessage);
      console.error('Error spending credits:', err);
      return false;
    }
  }, [refreshBalance]);

  /**
   * Redeem promo code for credits
   */
  const redeemPromoCode = useCallback(async (code: string): Promise<{
    success: boolean;
    message: string;
    credits?: number;
  }> => {
    try {
      const result = await stripeService.redeemPromoCode(code);
      
      if (result.success && result.credits_awarded) {
        // Update local balance
        setBalance(prev => prev + result.credits_awarded!);
        setWalletInfo(prev => prev ? {
          ...prev,
          balance: prev.balance + result.credits_awarded!,
          lifetime_earned: prev.lifetime_earned + result.credits_awarded!
        } : null);

        // Refresh balance to get exact amount
        setTimeout(refreshBalance, 1000);

        return {
          success: true,
          message: `Successfully redeemed ${result.credits_awarded} credits!`,
          credits: result.credits_awarded
        };
      }

      return {
        success: false,
        message: result.error || 'Failed to redeem promo code'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to redeem promo code';
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [refreshBalance]);

  /**
   * Check if user has sufficient credits
   */
  const checkSufficientCredits = useCallback((requiredCredits: number): boolean => {
    return balance >= requiredCredits;
  }, [balance]);

  /**
   * Check if user can generate a reel
   */
  const canGenerateReel = useCallback((): boolean => {
    return balance >= REEL_GENERATION_COST;
  }, [balance]);

  /**
   * Format credits for display
   */
  const formatCredits = useCallback((credits: number): string => {
    return new Intl.NumberFormat().format(credits);
  }, []);

  /**
   * Calculate credits per dollar for a plan
   */
  const getCreditsPerDollar = useCallback((plan: CreditPlan): number => {
    return plan.credits / (plan.price_cents / 100);
  }, []);

  /**
   * Get the best value plan
   */
  const getBestValuePlan = useCallback((): CreditPlan | null => {
    if (creditPlans.length === 0) return null;
    
    return creditPlans.reduce((best, current) => {
      const bestRatio = getCreditsPerDollar(best);
      const currentRatio = getCreditsPerDollar(current);
      return currentRatio > bestRatio ? current : best;
    });
  }, [creditPlans, getCreditsPerDollar]);

  // Load initial data on mount
  useEffect(() => {
    refreshBalance();
    loadCreditPlans();
  }, [refreshBalance, loadCreditPlans]);

  // Listen for payment success (if using URL parameters)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      // Payment was completed, refresh balance after a short delay
      setTimeout(() => {
        refreshBalance();
        // Clear the URL parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('session_id');
        window.history.replaceState({}, '', newUrl.toString());
      }, 2000);
    }
  }, [refreshBalance]);

  return {
    // Balance and wallet info
    balance,
    walletInfo,
    isLoading,
    error,

    // Credit plans
    creditPlans,
    plansLoading,
    plansError,

    // Transaction history
    transactions,
    transactionsLoading,
    transactionsError,

    // Actions
    refreshBalance,
    loadCreditPlans,
    loadTransactions,
    purchaseCredits,
    spendCredits,
    redeemPromoCode,
    checkSufficientCredits,
    canGenerateReel,

    // Utility functions
    formatCredits,
    getCreditsPerDollar,
    getBestValuePlan
  };
}

export default useCredits;