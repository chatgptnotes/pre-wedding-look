import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Initialize Supabase client with service role key for database operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Webhook endpoint secret for signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Stripe Webhook Handler
 * Processes Stripe events, specifically payment completions
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Future subscription handling
        console.log(`Subscription event ${event.type} received but not implemented yet`);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout completion:', session.id);

  const { customer_email, metadata, amount_total, currency } = session;
  const planId = metadata?.plan_id;
  const userId = metadata?.user_id;

  if (!planId) {
    console.error('No plan_id in session metadata:', session.id);
    return;
  }

  // Get plan details from database
  const { data: plan, error: planError } = await supabase
    .from('credit_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError || !plan) {
    console.error('Plan not found:', planId, planError);
    return;
  }

  // Find user by email if user_id not in metadata
  let targetUserId = userId;
  if (!targetUserId && customer_email) {
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', customer_email)
      .single();

    if (!userError && user) {
      targetUserId = user.id;
    }
  }

  if (!targetUserId) {
    console.error('Could not identify user for session:', session.id);
    return;
  }

  // Award credits using the database function
  const { data: transaction, error: creditError } = await supabase.rpc('add_user_credits', {
    user_uuid: targetUserId,
    credit_amount: plan.credits,
    transaction_desc: `Credits purchased: ${plan.name}`,
    trans_type: 'purchase',
    payment_intent_id: session.payment_intent as string,
    checkout_session_id: session.id,
    plan_uuid: plan.id,
    meta_data: {
      amount_paid: amount_total,
      currency: currency,
      customer_email: customer_email,
      stripe_session_id: session.id
    }
  });

  if (creditError) {
    console.error('Error awarding credits:', creditError);
    return;
  }

  console.log(`Successfully awarded ${plan.credits} credits to user ${targetUserId}`);
  
  // Update Stripe session metadata with transaction ID for reference
  try {
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...session.metadata,
        transaction_id: transaction,
        processed: 'true',
        processed_at: new Date().toISOString()
      }
    });
  } catch (stripeError) {
    console.error('Error updating Stripe session metadata:', stripeError);
    // Don't fail the webhook for this
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment success:', paymentIntent.id);
  
  // Most payment processing should happen in checkout.session.completed
  // This is a backup/additional confirmation
  const { metadata } = paymentIntent;
  
  if (metadata?.processed === 'true') {
    console.log('Payment already processed via checkout.session.completed');
    return;
  }

  // If we reach here, it might be a direct payment without checkout session
  // Handle accordingly (implementation depends on your payment flow)
}

/**
 * Handle failed payment intent
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment failure:', paymentIntent.id);
  
  const { metadata, last_payment_error } = paymentIntent;
  const userId = metadata?.user_id;
  
  if (userId) {
    // Log the failed payment attempt
    try {
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'purchase',
          amount: 0,
          balance_after: 0, // Will be updated by trigger
          description: `Payment failed: ${last_payment_error?.message || 'Unknown error'}`,
          stripe_payment_intent_id: paymentIntent.id,
          metadata: {
            failure_reason: last_payment_error?.code,
            error_message: last_payment_error?.message
          }
        });
    } catch (error) {
      console.error('Error logging payment failure:', error);
    }
  }
}

/**
 * Handle invoice payment success (for subscriptions)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment:', invoice.id);
  
  // Future implementation for subscription-based credit plans
  // For now, we're focusing on one-time purchases
}

/**
 * Utility function to get user by Stripe customer ID
 */
async function getUserByStripeCustomer(customerId: string) {
  const { data: user, error } = await supabase
    .from('auth.users')
    .select('id, email')
    .eq('raw_user_meta_data->stripe_customer_id', customerId)
    .single();

  if (error) {
    console.error('Error finding user by Stripe customer ID:', error);
    return null;
  }

  return user;
}

/**
 * Utility function to create or update Stripe customer
 */
async function createOrUpdateStripeCustomer(userId: string, email: string): Promise<string> {
  // Check if user already has a Stripe customer ID
  const { data: user } = await supabase
    .from('auth.users')
    .select('raw_user_meta_data')
    .eq('id', userId)
    .single();

  const stripeCustomerId = user?.raw_user_meta_data?.stripe_customer_id;

  if (stripeCustomerId) {
    // Update existing customer
    await stripe.customers.update(stripeCustomerId, { email });
    return stripeCustomerId;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId }
  });

  // Update user metadata with Stripe customer ID
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...user?.raw_user_meta_data,
      stripe_customer_id: customer.id
    }
  });

  return customer.id;
}

// Export helper functions for use in other API endpoints
export {
  createOrUpdateStripeCustomer,
  getUserByStripeCustomer
};