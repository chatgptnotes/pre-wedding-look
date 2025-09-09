import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

/**
 * Get Credit Plans API Endpoint
 * Returns available credit plans for purchase
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Fetch active credit plans
    const { data: plans, error } = await supabase
      .from('credit_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching credit plans:', error);
      return res.status(500).json({ error: 'Failed to fetch credit plans' });
    }

    // Calculate additional metrics for each plan
    const enrichedPlans = plans.map(plan => ({
      ...plan,
      credits_per_dollar: plan.credits / (plan.price_cents / 100),
      formatted_price: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(plan.price_cents / 100),
      savings_vs_smallest: plans.length > 1 ? calculateSavings(plan, plans[0]) : 0
    }));

    // Identify the best value plan
    const bestValuePlan = enrichedPlans.reduce((best, current) => 
      current.credits_per_dollar > best.credits_per_dollar ? current : best
    );

    return res.status(200).json({
      plans: enrichedPlans.map(plan => ({
        ...plan,
        is_best_value: plan.id === bestValuePlan.id
      })),
      best_value_plan_id: bestValuePlan.id,
      total_plans: enrichedPlans.length
    });

  } catch (error) {
    console.error('Unexpected error in credit-plans API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Calculate savings percentage compared to another plan
 */
function calculateSavings(plan: any, basePlan: any): number {
  if (!basePlan || plan.id === basePlan.id) return 0;
  
  const planCostPerCredit = plan.price_cents / plan.credits;
  const baseCostPerCredit = basePlan.price_cents / basePlan.credits;
  
  return Math.round(((baseCostPerCredit - planCostPerCredit) / baseCostPerCredit) * 100);
}