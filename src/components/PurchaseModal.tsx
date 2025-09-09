import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CreditCard, 
  Star, 
  Shield, 
  Zap, 
  Gift,
  Check,
  AlertCircle,
  Coins,
  Crown,
  Sparkles
} from 'lucide-react';
import { useCredits } from '../hooks/useCredits';
import { formatPrice, CreditPlan, calculateCreditsPerDollar } from '../services/stripeService';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId?: string;
}

interface PromoCodeState {
  code: string;
  isRedeeming: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Purchase Modal Component
 * Handles credit purchases and promo code redemption
 */
const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  selectedPlanId
}) => {
  const {
    balance,
    creditPlans,
    plansLoading,
    plansError,
    purchaseCredits,
    redeemPromoCode,
    formatCredits,
    getBestValuePlan
  } = useCredits();

  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPromoSection, setShowPromoSection] = useState(false);
  const [promoState, setPromoState] = useState<PromoCodeState>({
    code: '',
    isRedeeming: false,
    error: null,
    success: false
  });

  const bestValuePlan = getBestValuePlan();

  // Auto-select plan if provided
  useEffect(() => {
    if (selectedPlanId && creditPlans.length > 0) {
      const plan = creditPlans.find(p => p.id === selectedPlanId);
      if (plan) setSelectedPlan(plan);
    }
  }, [selectedPlanId, creditPlans]);

  // Select best value plan by default
  useEffect(() => {
    if (!selectedPlan && bestValuePlan) {
      setSelectedPlan(bestValuePlan);
    }
  }, [selectedPlan, bestValuePlan]);

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    setIsPurchasing(true);
    try {
      await purchaseCredits(selectedPlan.id, {
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: window.location.href
      });
      // Redirect happens automatically
    } catch (error) {
      console.error('Purchase error:', error);
      setIsPurchasing(false);
      // Error is handled by useCredits hook
    }
  };

  const handlePromoRedeem = async () => {
    if (!promoState.code.trim()) return;

    setPromoState(prev => ({ ...prev, isRedeeming: true, error: null }));

    try {
      const result = await redeemPromoCode(promoState.code);
      
      if (result.success) {
        setPromoState(prev => ({
          ...prev,
          success: true,
          error: null,
          code: ''
        }));
        
        setTimeout(() => {
          setPromoState(prev => ({ ...prev, success: false }));
        }, 3000);
      } else {
        setPromoState(prev => ({
          ...prev,
          error: result.message,
          success: false
        }));
      }
    } catch (error) {
      setPromoState(prev => ({
        ...prev,
        error: 'Failed to redeem promo code',
        success: false
      }));
    } finally {
      setPromoState(prev => ({ ...prev, isRedeeming: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-xl 
                     border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Buy Credits</h2>
                <p className="text-white/60 text-sm">Choose a plan to get started</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-xs text-white/60">Current Balance</p>
                <p className="text-lg font-semibold text-yellow-300">{formatCredits(balance)}</p>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Credit Plans */}
            {plansLoading ? (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                    <div className="h-6 bg-white/10 rounded mb-2"></div>
                    <div className="h-8 bg-white/10 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded"></div>
                      <div className="h-4 bg-white/10 rounded"></div>
                      <div className="h-4 bg-white/10 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : plansError ? (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
                <p className="text-red-300 text-center">{plansError}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {creditPlans.map(plan => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const isBestValue = bestValuePlan?.id === plan.id;
                  const creditsPerDollar = calculateCreditsPerDollar(plan.credits, plan.price_cents);

                  return (
                    <motion.div
                      key={plan.id}
                      className={`relative bg-white/5 hover:bg-white/10 border-2 rounded-xl p-6 cursor-pointer
                                  transition-all duration-300 ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-500/10' 
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Best Value Badge */}
                      {isBestValue && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 
                                        text-black text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
                          <Crown className="w-3 h-3" />
                          <span>Best Value</span>
                        </div>
                      )}

                      {/* Plan Header */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">
                            {formatPrice(plan.price_cents)}
                          </div>
                          <div className="text-xs text-white/60">
                            {creditsPerDollar.toFixed(1)} credits/$
                          </div>
                        </div>
                      </div>

                      {/* Credits */}
                      <div className="flex items-center space-x-2 mb-4">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="text-xl font-semibold text-yellow-300">
                          {formatCredits(plan.credits)} Credits
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-white/70 text-sm mb-4">{plan.description}</p>

                      {/* Features */}
                      <div className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-white/80 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-4 left-4 w-6 h-6 bg-purple-500 rounded-full 
                                     flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Promo Code Section */}
            <div className="mb-6">
              <button
                onClick={() => setShowPromoSection(!showPromoSection)}
                className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 
                           transition-colors mb-3"
              >
                <Gift className="w-4 h-4" />
                <span className="text-sm">Have a promo code?</span>
              </button>

              <AnimatePresence>
                {showPromoSection && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white/5 rounded-xl p-4"
                  >
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        placeholder="Enter promo code"
                        value={promoState.code}
                        onChange={e => setPromoState(prev => ({ 
                          ...prev, 
                          code: e.target.value.toUpperCase(),
                          error: null 
                        }))}
                        onKeyPress={e => e.key === 'Enter' && handlePromoRedeem()}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 
                                   text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                        disabled={promoState.isRedeeming}
                      />
                      <button
                        onClick={handlePromoRedeem}
                        disabled={!promoState.code.trim() || promoState.isRedeeming}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 
                                   hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed
                                   text-white px-4 py-2 rounded-lg transition-all duration-300"
                      >
                        {promoState.isRedeeming ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Redeem'
                        )}
                      </button>
                    </div>

                    {promoState.error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 mt-3 text-red-300"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{promoState.error}</span>
                      </motion.div>
                    )}

                    {promoState.success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 mt-3 text-green-300"
                      >
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Promo code redeemed successfully!</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Security & Features */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-white/70 text-sm">Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-white/70 text-sm">Instant Delivery</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-purple-400" />
                <span className="text-white/70 text-sm">Premium Quality</span>
              </div>
            </div>

            {/* Purchase Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold 
                           py-3 px-6 rounded-xl transition-all duration-300"
              >
                Cancel
              </button>
              
              <button
                onClick={handlePurchase}
                disabled={!selectedPlan || isPurchasing || plansLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 
                           hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed
                           text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300
                           flex items-center justify-center space-x-2"
              >
                {isPurchasing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>
                      Purchase {selectedPlan ? formatCredits(selectedPlan.credits) : ''} Credits
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-white/40 text-xs text-center mt-4">
              Credits don't expire and can be used for all premium features. 
              Powered by Stripe for secure payments.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PurchaseModal;