import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Coins, TrendingUp, Clock, Gift } from 'lucide-react';
import { useCredits } from '../hooks/useCredits';
import { formatPrice } from '../services/stripeService';

interface CreditsDisplayProps {
  showFullWidget?: boolean;
  onPurchaseClick?: () => void;
  onPromoClick?: () => void;
  className?: string;
}

/**
 * Credits Display Component
 * Shows user's credit balance with purchase and promo options
 */
const CreditsDisplay: React.FC<CreditsDisplayProps> = ({
  showFullWidget = false,
  onPurchaseClick,
  onPromoClick,
  className = ''
}) => {
  const {
    balance,
    walletInfo,
    isLoading,
    error,
    creditPlans,
    formatCredits,
    getBestValuePlan
  } = useCredits();

  const [showTooltip, setShowTooltip] = useState(false);
  const [animateBalance, setAnimateBalance] = useState(false);
  const [previousBalance, setPreviousBalance] = useState(balance);

  // Animate balance changes
  useEffect(() => {
    if (balance !== previousBalance) {
      setAnimateBalance(true);
      const timer = setTimeout(() => setAnimateBalance(false), 1000);
      setPreviousBalance(balance);
      return () => clearTimeout(timer);
    }
  }, [balance, previousBalance]);

  const bestValuePlan = getBestValuePlan();

  // Minimal header display
  if (!showFullWidget) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <motion.div
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                     backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 hover:bg-white/10 
                     transition-all duration-300 cursor-pointer"
          onClick={onPurchaseClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={animateBalance ? { 
            scale: [1, 1.1, 1],
            boxShadow: ['0 0 0px rgba(168, 85, 247, 0)', '0 0 20px rgba(168, 85, 247, 0.5)', '0 0 0px rgba(168, 85, 247, 0)']
          } : {}}
          transition={{ duration: 0.6 }}
        >
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-semibold text-sm">
            {isLoading ? '...' : formatCredits(balance)}
          </span>
          {!isLoading && (
            <Plus className="w-3 h-3 text-white/70 hover:text-white transition-colors" />
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-red-400 text-xs"
          >
            !
          </motion.div>
        )}
      </div>
    );
  }

  // Full widget display
  return (
    <div className={`bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm 
                     border border-white/20 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Coins className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-semibold">Credits</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {onPromoClick && (
            <button
              onClick={onPromoClick}
              className="text-xs text-purple-300 hover:text-purple-200 transition-colors
                         bg-purple-500/20 px-2 py-1 rounded-full flex items-center space-x-1"
            >
              <Gift className="w-3 h-3" />
              <span>Promo</span>
            </button>
          )}
        </div>
      </div>

      {/* Balance Display */}
      <div className="text-center mb-4">
        <motion.div
          className="text-3xl font-bold text-white mb-1"
          animate={animateBalance ? { 
            scale: [1, 1.2, 1],
            color: ['#ffffff', '#fbbf24', '#ffffff']
          } : {}}
          transition={{ duration: 0.6 }}
        >
          {isLoading ? (
            <div className="animate-pulse bg-white/20 rounded w-16 h-8 mx-auto"></div>
          ) : (
            formatCredits(balance)
          )}
        </motion.div>
        
        {walletInfo && !isLoading && (
          <div className="text-xs text-white/60 space-y-1">
            <div className="flex justify-center items-center space-x-4">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>Earned: {formatCredits(walletInfo.lifetime_earned)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Spent: {formatCredits(walletInfo.lifetime_spent)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 mb-4"
          >
            <p className="text-red-300 text-xs text-center">{error}</p>
          </motion.div>
        )}

        {balance === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-2 mb-4"
          >
            <p className="text-yellow-300 text-xs text-center">
              Get credits to start generating amazing reels!
            </p>
          </motion.div>
        )}

        {balance > 0 && balance < 10 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-2 mb-4"
          >
            <p className="text-orange-300 text-xs text-center">
              Running low on credits. Consider purchasing more!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase Button */}
      <div className="space-y-2">
        <motion.button
          onClick={onPurchaseClick}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 
                     hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg 
                     transition-all duration-300 flex items-center justify-center space-x-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <CreditCard className="w-4 h-4" />
          <span>Buy Credits</span>
        </motion.button>

        {bestValuePlan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-xs text-white/60">
              Best Value: <span className="text-yellow-300 font-semibold">{bestValuePlan.name}</span>
              {' '}• {formatCredits(bestValuePlan.credits)} credits for {formatPrice(bestValuePlan.price_cents)}
            </p>
          </motion.div>
        )}
      </div>

      {/* Usage Guide */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="text-xs text-white/60 space-y-1">
          <div className="flex justify-between">
            <span>Reel Generation:</span>
            <span className="text-yellow-300">5 credits</span>
          </div>
          <div className="flex justify-between">
            <span>HD Download:</span>
            <span className="text-yellow-300">2 credits</span>
          </div>
          <div className="flex justify-between">
            <span>Premium Effects:</span>
            <span className="text-yellow-300">3 credits</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditsDisplay;