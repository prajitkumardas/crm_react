import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { verifyPayment } from '../../../../lib/razorpayService';

// Webhook secret for verification (set this in environment variables)
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Received Razorpay webhook:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.payload.subscription);
        break;

      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription, event.payload.payment);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription);
        break;

      case 'subscription.expired':
        await handleSubscriptionExpired(event.payload.subscription);
        break;

      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment);
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(body, signature) {
  if (!WEBHOOK_SECRET) {
    console.warn('RAZORPAY_WEBHOOK_SECRET not set, skipping signature verification');
    return true; // Allow in development
  }

  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(subscription) {
  try {
    const { user_id, organization_id, plan_name } = subscription.notes;

    // Update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        razorpay_subscription_id: subscription.id,
        razorpay_customer_id: subscription.customer_id,
        status: 'active',
        next_billing_date: new Date(subscription.charge_at * 1000).toISOString().split('T')[0]
      })
      .eq('user_id', user_id)
      .eq('organization_id', organization_id);

    if (error) throw error;

    console.log('Subscription created:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

/**
 * Handle subscription activated event
 */
async function handleSubscriptionActivated(subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        next_billing_date: new Date(subscription.charge_at * 1000).toISOString().split('T')[0]
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (error) throw error;

    console.log('Subscription activated:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription activated:', error);
  }
}

/**
 * Handle subscription charged event
 */
async function handleSubscriptionCharged(subscription, payment) {
  try {
    // Find the subscription in our database
    const { data: dbSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, organization_id, plan_name')
      .eq('razorpay_subscription_id', subscription.id)
      .single();

    if (subError || !dbSubscription) {
      console.error('Subscription not found in database:', subscription.id);
      return;
    }

    // Add billing history entry
    const { error: billingError } = await supabase
      .from('billing_history')
      .insert({
        user_id: dbSubscription.user_id,
        organization_id: dbSubscription.organization_id,
        subscription_id: dbSubscription.id,
        plan_name: dbSubscription.plan_name,
        amount: payment.amount / 100, // Convert from paisa to rupees
        currency: payment.currency,
        payment_status: 'success',
        razorpay_payment_id: payment.id,
        billing_period_start: new Date(subscription.current_start * 1000).toISOString().split('T')[0],
        billing_period_end: new Date(subscription.current_end * 1000).toISOString().split('T')[0]
      });

    if (billingError) throw billingError;

    // Update next billing date
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        next_billing_date: new Date(subscription.charge_at * 1000).toISOString().split('T')[0]
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (updateError) throw updateError;

    console.log('Subscription charged:', subscription.id, 'Amount:', payment.amount / 100);
  } catch (error) {
    console.error('Error handling subscription charged:', error);
  }
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        auto_renew: false
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (error) throw error;

    console.log('Subscription cancelled:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

/**
 * Handle subscription expired event
 */
async function handleSubscriptionExpired(subscription) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'expired'
      })
      .eq('razorpay_subscription_id', subscription.id);

    if (error) throw error;

    console.log('Subscription expired:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription expired:', error);
  }
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(payment) {
  try {
    // Update billing history if this payment is related to a subscription
    const { error } = await supabase
      .from('billing_history')
      .update({
        payment_status: 'success'
      })
      .eq('razorpay_payment_id', payment.id);

    if (error) throw error;

    console.log('Payment captured:', payment.id);
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(payment) {
  try {
    // Update billing history
    const { error } = await supabase
      .from('billing_history')
      .update({
        payment_status: 'failed'
      })
      .eq('razorpay_payment_id', payment.id);

    if (error) throw error;

    console.log('Payment failed:', payment.id);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}