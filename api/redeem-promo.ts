import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RedeemPromoRequest {
  code: string;
}

/**
 * Redeem Promo Code API Endpoint
 * Allows users to redeem promo codes for credits
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { code }: RedeemPromoRequest = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Valid promo code is required' });
    }

    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length === 0) {
      return res.status(400).json({ error: 'Promo code cannot be empty' });
    }

    if (trimmedCode.length > 100) {
      return res.status(400).json({ error: 'Promo code is too long' });
    }

    // Use the database function to redeem the promo code
    const { data: result, error: redeemError } = await supabase.rpc('redeem_promo_code', {
      user_uuid: user.id,
      code_text: trimmedCode
    });

    if (redeemError) {
      console.error('Error redeeming promo code:', redeemError);
      return res.status(500).json({ error: 'Failed to process promo code' });
    }

    // The function returns a JSONB object with success/error information
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        error: result.error 
      });
    }

    // Get updated balance after redemption
    const { data: newBalance, error: balanceError } = await supabase.rpc('get_user_credit_balance', {
      user_uuid: user.id
    });

    if (balanceError) {
      console.error('Error getting updated balance:', balanceError);
      // Still return success since the redemption worked
    }

    console.log(`User ${user.id} redeemed promo code '${trimmedCode}' for ${result.credits_awarded} credits`);

    return res.status(200).json({
      success: true,
      credits_awarded: result.credits_awarded,
      new_balance: newBalance || 0,
      redemption_id: result.redemption_id,
      transaction_id: result.transaction_id,
      message: `Successfully redeemed ${result.credits_awarded} credits!`
    });

  } catch (error) {
    console.error('Unexpected error in redeem-promo API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}