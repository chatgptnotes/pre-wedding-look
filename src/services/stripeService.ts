import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Initialize Stripe
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.warn('Stripe publishable key not found. Payments will not work.');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Types for our credit system
export interface CreditPlan {
  id: string;
  name: string;
  plan_type: 'starter' | 'pro';
  credits: number;
  price_cents: number;
  stripe_price_id?: string;
  description: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface CreateCheckoutSessionRequest {
  plan_id: string;
  success_url?: string;
  cancel_url?: string;
  user_email?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionResponse {
  checkout_session_id: string;
  url: string;
}

export interface VerifyPaymentRequest {
  session_id: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  credits_awarded?: number;
  transaction_id?: string;
  error?: string;
}

export interface PromoCodeRedemptionRequest {
  code: string;
}

export interface PromoCodeRedemptionResponse {
  success: boolean;
  credits_awarded?: number;
  error?: string;
}

/**
 * Stripe Service Class
 * Handles all Stripe-related operations for the credits system
 */
export class StripeService {
  private static instance: StripeService;
  private stripe: Stripe | null = null;

  private constructor() {
    this.initializeStripe();
  }

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  private async initializeStripe() {
    this.stripe = await getStripe();
  }

  /**
   * Get available credit plans
   */
  async getCreditPlans(): Promise<CreditPlan[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-plans`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.plans || [];
    } catch (error) {
      console.error('Error fetching credit plans:', error);
      throw new Error('Failed to fetch credit plans');
    }
  }

  /**
   * Create a Stripe checkout session for purchasing credits
   */
  async createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Redirect to Stripe checkout
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    if (!this.stripe) {
      await this.initializeStripe();
    }

    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await this.stripe.redirectToCheckout({
      sessionId: sessionId
    });

    if (error) {
      console.error('Stripe redirect error:', error);
      throw new Error(error.message || 'Failed to redirect to checkout');
    }
  }

  /**
   * Purchase credits with a single method call
   */
  async purchaseCredits(planId: string, options: {
    successUrl?: string;
    cancelUrl?: string;
    userEmail?: string;
  } = {}): Promise<void> {
    try {
      // Default URLs
      const defaultSuccessUrl = `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
      const defaultCancelUrl = `${window.location.origin}/payment-cancelled`;

      const checkoutSession = await this.createCheckoutSession({
        plan_id: planId,
        success_url: options.successUrl || defaultSuccessUrl,
        cancel_url: options.cancelUrl || defaultCancelUrl,
        user_email: options.userEmail,
        metadata: {
          plan_id: planId,
          source: 'prewedding-app'
        }
      });

      await this.redirectToCheckout(checkoutSession.checkout_session_id);
    } catch (error) {
      console.error('Error purchasing credits:', error);
      throw error;
    }
  }

  /**
   * Verify payment completion and award credits
   */
  async verifyPayment(sessionId: string): Promise<VerifyPaymentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw new Error('Failed to verify payment');
    }
  }

  /**
   * Redeem promo code for credits
   */
  async redeemPromoCode(code: string): Promise<PromoCodeRedemptionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/redeem-promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return { success: false, error: errorData.error || 'Failed to redeem promo code' };
      }

      return await response.json();
    } catch (error) {
      console.error('Error redeeming promo code:', error);
      return { success: false, error: 'Network error while redeeming promo code' };
    }
  }

  /**
   * Check if credits are sufficient for a purchase
   */
  async checkSufficientCredits(requiredCredits: number, userId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/check-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ required_credits: requiredCredits, user_id: userId })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.sufficient === true;
    } catch (error) {
      console.error('Error checking credits:', error);
      return false;
    }
  }

  /**
   * Spend credits for reel generation
   */
  async spendCredits(credits: number, description: string, reelId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/spend-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          credits,
          description,
          reel_id: reelId
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Error spending credits:', error);
      return false;
    }
  }

  /**
   * Get user's current credit balance
   */
  async getCreditBalance(): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-balance`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      console.error('Error getting credit balance:', error);
      return 0;
    }
  }

  /**
   * Get user's credit transaction history
   */
  async getCreditTransactions(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-transactions?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.transactions || [];
    } catch (error) {
      console.error('Error getting credit transactions:', error);
      return [];
    }
  }

  /**
   * Get auth token for API requests
   */
  private async getAuthToken(): Promise<string> {
    // Check if we're using Supabase auth
    if (typeof window !== 'undefined' && (window as any).supabase) {
      const { data: { session } } = await (window as any).supabase.auth.getSession();
      if (session?.access_token) {
        return session.access_token;
      }
    }

    // Fallback to localStorage token or cookie
    const token = localStorage.getItem('auth_token') || 
                  document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    return token;
  }

  /**
   * Format price from cents to display format
   */
  static formatPrice(cents: number, currency: string = 'USD'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    });
    return formatter.format(cents / 100);
  }

  /**
   * Calculate credits per dollar for comparison
   */
  static calculateCreditsPerDollar(credits: number, priceCents: number): number {
    return credits / (priceCents / 100);
  }

  /**
   * Get the best value plan based on credits per dollar
   */
  static getBestValuePlan(plans: CreditPlan[]): CreditPlan | null {
    if (plans.length === 0) return null;
    
    return plans.reduce((best, current) => {
      const bestRatio = StripeService.calculateCreditsPerDollar(best.credits, best.price_cents);
      const currentRatio = StripeService.calculateCreditsPerDollar(current.credits, current.price_cents);
      return currentRatio > bestRatio ? current : best;
    });
  }
}

// Export singleton instance
export const stripeService = StripeService.getInstance();

// Export utility functions
export const formatPrice = StripeService.formatPrice;
export const calculateCreditsPerDollar = StripeService.calculateCreditsPerDollar;
export const getBestValuePlan = StripeService.getBestValuePlan;

// Constants
export const REEL_GENERATION_COST = 5; // Credits required per reel generation
export const WELCOME_BONUS_CREDITS = 10; // Free credits for new users
export const REFERRAL_BONUS_CREDITS = 25; // Credits for successful referrals

export default stripeService;