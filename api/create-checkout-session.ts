import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createOrUpdateStripeCustomer } from './stripe-webhook';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateCheckoutSessionRequest {
  plan_id: string;
  success_url?: string;
  cancel_url?: string;
  user_email?: string;
  metadata?: Record<string, string>;
}

/**
 * Create Stripe Checkout Session API Endpoint
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

    const {
      plan_id,
      success_url,
      cancel_url,
      user_email,
      metadata = {}
    }: CreateCheckoutSessionRequest = req.body;

    if (!plan_id) {
      return res.status(400).json({ error: 'plan_id is required' });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('credit_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    // Use provided email or user's email
    const customerEmail = user_email || user.email;
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required' });
    }

    // Create or get Stripe customer
    const customerId = await createOrUpdateStripeCustomer(user.id, customerEmail);

    // Default URLs
    const domain = process.env.VITE_SITE_URL || 'http://localhost:3000';
    const defaultSuccessUrl = `${domain}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancelUrl = `${domain}/payment-cancelled`;

    // Prepare session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
              images: [`${domain}/images/credits-${plan.plan_type}.png`], // Optional: add plan images
              metadata: {
                plan_id: plan.id,
                plan_type: plan.plan_type,
                credits: plan.credits.toString()
              }
            },
            unit_amount: plan.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || defaultSuccessUrl,
      cancel_url: cancel_url || defaultCancelUrl,
      
      // Include comprehensive metadata
      metadata: {
        plan_id: plan.id,
        user_id: user.id,
        user_email: customerEmail,
        credits_to_award: plan.credits.toString(),
        plan_name: plan.name,
        plan_type: plan.plan_type,
        ...metadata
      },

      // Additional session configuration
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },

      // Automatic tax calculation (if enabled in Stripe)
      automatic_tax: {
        enabled: false // Set to true if you have tax calculation enabled
      },

      // Custom success message
      custom_text: {
        submit: {
          message: `You'll receive ${plan.credits} credits immediately after payment confirmation.`
        }
      }
    };

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`Created checkout session ${session.id} for user ${user.id}, plan ${plan.name}`);

    return res.status(200).json({
      checkout_session_id: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        error: 'Payment processing error',
        details: error.message 
      });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Configuration for Vercel Node.js runtime
export const config = {
  maxDuration: 30,
};