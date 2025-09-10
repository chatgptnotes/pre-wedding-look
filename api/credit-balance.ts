import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get User Credit Balance API Endpoint
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
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

    // Get user's credit balance using the database function
    const { data: balance, error: balanceError } = await supabase.rpc('get_user_credit_balance', {
      user_uuid: user.id
    });

    if (balanceError) {
      console.error('Error getting credit balance:', balanceError);
      return res.status(500).json({ error: 'Failed to get credit balance' });
    }

    // Get detailed wallet information
    const { data: wallet, error: walletError } = await supabase
      .from('user_credit_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('Error getting wallet details:', walletError);
      return res.status(500).json({ error: 'Failed to get wallet details' });
    }

    return res.status(200).json({
      balance: balance || 0,
      lifetime_earned: wallet?.lifetime_earned || 0,
      lifetime_spent: wallet?.lifetime_spent || 0,
      wallet_created_at: wallet?.created_at,
      last_updated: wallet?.updated_at
    });

  } catch (error) {
    console.error('Unexpected error in credit-balance API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}