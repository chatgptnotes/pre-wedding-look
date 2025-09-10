import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SpendCreditsRequest {
  credits: number;
  description: string;
  reel_id?: string;
}

/**
 * Spend Credits API Endpoint
 * Deducts credits from user's wallet for reel generation
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

    const { credits, description, reel_id }: SpendCreditsRequest = req.body;

    // Validate input
    if (!credits || credits <= 0) {
      return res.status(400).json({ error: 'Credits must be a positive number' });
    }

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (credits > 100) {
      return res.status(400).json({ error: 'Cannot spend more than 100 credits at once' });
    }

    // Use the database function to spend credits (transaction-safe)
    const { data: success, error: spendError } = await supabase.rpc('spend_user_credits', {
      user_uuid: user.id,
      credit_cost: credits,
      transaction_desc: description,
      reel_uuid: reel_id || null
    });

    if (spendError) {
      console.error('Error spending credits:', spendError);
      return res.status(500).json({ error: 'Failed to spend credits' });
    }

    if (!success) {
      return res.status(400).json({ 
        error: 'Insufficient credits',
        message: 'You do not have enough credits for this operation'
      });
    }

    // Get updated balance
    const { data: newBalance, error: balanceError } = await supabase.rpc('get_user_credit_balance', {
      user_uuid: user.id
    });

    if (balanceError) {
      console.error('Error getting updated balance:', balanceError);
      // Still return success since the spending worked
    }

    console.log(`User ${user.id} spent ${credits} credits: ${description}`);

    return res.status(200).json({
      success: true,
      credits_spent: credits,
      remaining_balance: newBalance || 0,
      description,
      reel_id
    });

  } catch (error) {
    console.error('Unexpected error in spend-credits API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}