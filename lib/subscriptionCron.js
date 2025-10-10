import { supabase } from './supabase';

/**
 * Cron job to handle subscription expiry and grace periods
 * Should be run daily (e.g., every midnight)
 */
export async function processSubscriptionExpiry() {
  try {
    console.log('Starting subscription expiry processing...');

    const today = new Date().toISOString().split('T')[0];

    // 1. Find subscriptions that should expire today
    const { data: expiringSubscriptions, error: expiringError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .lte('next_billing_date', today)
      .eq('auto_renew', false);

    if (expiringError) {
      console.error('Error fetching expiring subscriptions:', expiringError);
      return;
    }

    // 2. Move expired subscriptions to grace period
    if (expiringSubscriptions && expiringSubscriptions.length > 0) {
      const subscriptionIds = expiringSubscriptions.map(sub => sub.id);

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'grace',
          updated_at: new Date().toISOString()
        })
        .in('id', subscriptionIds);

      if (updateError) {
        console.error('Error updating subscriptions to grace period:', updateError);
      } else {
        console.log(`Moved ${expiringSubscriptions.length} subscriptions to grace period`);
      }
    }

    // 3. Find subscriptions in grace period that have exceeded 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: graceSubscriptions, error: graceError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'grace')
      .lt('updated_at', sevenDaysAgo.toISOString());

    if (graceError) {
      console.error('Error fetching grace period subscriptions:', graceError);
      return;
    }

    // 4. Downgrade expired grace period subscriptions to Free
    if (graceSubscriptions && graceSubscriptions.length > 0) {
      const subscriptionIds = graceSubscriptions.map(sub => sub.id);

      const { error: downgradeError } = await supabase
        .from('subscriptions')
        .update({
          plan_name: 'Free',
          status: 'active',
          client_limit: 50,
          updated_at: new Date().toISOString()
        })
        .in('id', subscriptionIds);

      if (downgradeError) {
        console.error('Error downgrading subscriptions to Free:', downgradeError);
      } else {
        console.log(`Downgraded ${graceSubscriptions.length} subscriptions to Free plan`);
      }
    }

    // 5. Process auto-renewal reminders (3 days before expiry)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const reminderDate = threeDaysFromNow.toISOString().split('T')[0];

    const { data: reminderSubscriptions, error: reminderError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .eq('auto_renew', true)
      .eq('next_billing_date', reminderDate);

    if (reminderError) {
      console.error('Error fetching subscriptions for renewal reminders:', reminderError);
    } else if (reminderSubscriptions && reminderSubscriptions.length > 0) {
      // Here you could send renewal reminder emails
      // For now, we'll just log it
      console.log(`Found ${reminderSubscriptions.length} subscriptions due for renewal in 3 days`);
    }

    console.log('Subscription expiry processing completed successfully');

  } catch (error) {
    console.error('Error in subscription expiry processing:', error);
  }
}

/**
 * Cron job to clean up old billing history (optional)
 * Keeps only last 2 years of billing history
 */
export async function cleanupOldBillingHistory() {
  try {
    console.log('Starting billing history cleanup...');

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const { data, error } = await supabase
      .from('billing_history')
      .delete()
      .lt('created_at', twoYearsAgo.toISOString());

    if (error) {
      console.error('Error cleaning up old billing history:', error);
    } else {
      console.log('Billing history cleanup completed');
    }

  } catch (error) {
    console.error('Error in billing history cleanup:', error);
  }
}

/**
 * Cron job to send payment failure notifications
 */
export async function processPaymentFailures() {
  try {
    console.log('Processing payment failure notifications...');

    // Find recent failed payments (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: failedPayments, error } = await supabase
      .from('billing_history')
      .select(`
        *,
        subscriptions:user_id (
          user_id,
          plan_name
        )
      `)
      .eq('payment_status', 'failed')
      .gt('created_at', yesterday.toISOString());

    if (error) {
      console.error('Error fetching failed payments:', error);
      return;
    }

    if (failedPayments && failedPayments.length > 0) {
      // Here you could send payment failure notification emails
      console.log(`Found ${failedPayments.length} failed payments in the last 24 hours`);
    }

  } catch (error) {
    console.error('Error processing payment failures:', error);
  }
}

/**
 * Initialize all subscription cron jobs
 */
export function initSubscriptionCronJobs() {
  console.log('Initializing subscription cron jobs...');

  // Run subscription expiry processing daily at midnight
  const subscriptionExpiryJob = setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      processSubscriptionExpiry();
    }
  }, 60 * 1000); // Check every minute

  // Run billing history cleanup monthly
  const billingCleanupJob = setInterval(() => {
    const now = new Date();
    if (now.getDate() === 1 && now.getHours() === 1) { // 1st of month at 1 AM
      cleanupOldBillingHistory();
    }
  }, 60 * 60 * 1000); // Check every hour

  // Run payment failure processing every 6 hours
  const paymentFailureJob = setInterval(() => {
    processPaymentFailures();
  }, 6 * 60 * 60 * 1000); // Every 6 hours

  console.log('Subscription cron jobs initialized');

  // Return cleanup function
  return () => {
    clearInterval(subscriptionExpiryJob);
    clearInterval(billingCleanupJob);
    clearInterval(paymentFailureJob);
    console.log('Subscription cron jobs stopped');
  };
}

/**
 * Manual trigger functions for testing
 */
export const manualTriggers = {
  processExpiry: processSubscriptionExpiry,
  cleanupHistory: cleanupOldBillingHistory,
  processFailures: processPaymentFailures
};