import Razorpay from 'razorpay';

// Lazy initialization of Razorpay client
let razorpayClient = null;

const getRazorpayClient = () => {
  if (!razorpayClient) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }

    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayClient;
};

// Plan configurations
export const PLAN_CONFIGS = {
  Free: {
    name: 'Free',
    clientLimit: 50,
    price: 0,
    features: ['Basic client management', 'Community support']
  },
  Starter: {
    name: 'Starter',
    clientLimit: 500,
    price: 499,
    razorpayPlanId: process.env.RAZORPAY_PLAN_STARTER,
    features: ['Up to 500 clients', '3 team members', 'Automation', 'Bulk messaging', 'Email support']
  },
  Growth: {
    name: 'Growth',
    clientLimit: 2000,
    price: 999,
    razorpayPlanId: process.env.RAZORPAY_PLAN_GROWTH,
    features: ['Up to 2000 clients', '10 team members', 'Advanced automation', 'Bulk messaging', 'Advanced reports', 'Chat support']
  },
  Pro: {
    name: 'Pro',
    clientLimit: -1, // Unlimited
    price: 2499,
    razorpayPlanId: process.env.RAZORPAY_PLAN_PRO,
    features: ['Unlimited clients', 'Unlimited team members', 'API access', 'Advanced automation', 'Bulk messaging', 'Advanced reports', '24/7 support']
  }
};

/**
 * Create a new subscription
 * @param {string} planName - The plan name (Starter, Growth, Pro)
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} Subscription object
 */
export async function createSubscription(planName, userId, organizationId) {
  try {
    const planConfig = PLAN_CONFIGS[planName];
    if (!planConfig || !planConfig.razorpayPlanId) {
      throw new Error(`Invalid plan or plan not configured: ${planName}`);
    }

    const razorpay = getRazorpayClient();
    const options = {
      plan_id: planConfig.razorpayPlanId,
      total_count: 12, // 12 months
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: userId,
        organization_id: organizationId,
        plan_name: planName
      }
    };

    const subscription = await razorpay.subscriptions.create(options);
    return subscription;
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    throw new Error('Failed to create subscription');
  }
}

/**
 * Create a one-time payment order
 * @param {number} amount - Amount in paisa (₹1 = 100 paisa)
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @param {string} planName - Plan name
 * @returns {Promise<Object>} Order object
 */
export async function createOrder(amount, userId, organizationId, planName) {
  try {
    const razorpay = getRazorpayClient();
    const options = {
      amount: amount * 100, // Convert to paisa
      currency: 'INR',
      receipt: `rcpt_${userId}_${Date.now()}`,
      notes: {
        user_id: userId,
        organization_id: organizationId,
        plan_name: planName
      }
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
}

/**
 * Verify payment signature
 * @param {string} orderId - Order ID
 * @param {string} paymentId - Payment ID
 * @param {string} signature - Payment signature
 * @returns {boolean} Whether signature is valid
 */
export function verifyPayment(orderId, paymentId, signature) {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}

/**
 * Cancel a subscription
 * @param {string} subscriptionId - Razorpay subscription ID
 * @returns {Promise<Object>} Cancellation response
 */
export async function cancelSubscription(subscriptionId) {
  try {
    const razorpay = getRazorpayClient();
    const response = await razorpay.subscriptions.cancel(subscriptionId);
    return response;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

/**
 * Update subscription (pause/resume)
 * @param {string} subscriptionId - Razorpay subscription ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Update response
 */
export async function updateSubscription(subscriptionId, updateData) {
  try {
    const razorpay = getRazorpayClient();
    const response = await razorpay.subscriptions.update(subscriptionId, updateData);
    return response;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('Failed to update subscription');
  }
}

/**
 * Fetch subscription details
 * @param {string} subscriptionId - Razorpay subscription ID
 * @returns {Promise<Object>} Subscription details
 */
export async function getSubscription(subscriptionId) {
  try {
    const razorpay = getRazorpayClient();
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw new Error('Failed to fetch subscription details');
  }
}

/**
 * Create customer in Razorpay
 * @param {Object} customerData - Customer data
 * @returns {Promise<Object>} Customer object
 */
export async function createCustomer(customerData) {
  try {
    const razorpay = getRazorpayClient();
    const customer = await razorpay.customers.create({
      name: customerData.name,
      email: customerData.email,
      contact: customerData.phone,
      notes: customerData.notes || {}
    });
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
}

/**
 * Get plan pricing information
 * @param {string} planName - Plan name
 * @returns {Object} Plan pricing info
 */
export function getPlanPricing(planName) {
  const plan = PLAN_CONFIGS[planName];
  if (!plan) {
    throw new Error(`Plan not found: ${planName}`);
  }

  return {
    name: plan.name,
    price: plan.price,
    currency: 'INR',
    interval: 'month',
    features: plan.features,
    clientLimit: plan.clientLimit
  };
}

/**
 * Check if user can access a feature based on their plan
 * @param {string} userPlan - User's current plan
 * @param {string} feature - Feature to check
 * @returns {boolean} Whether user can access the feature
 */
export function canAccessFeature(userPlan, feature) {
  const planConfig = PLAN_CONFIGS[userPlan];
  if (!planConfig) return false;

  // Define feature access rules
  const featureRules = {
    bulk_messaging: ['Starter', 'Growth', 'Pro'],
    automation: ['Starter', 'Growth', 'Pro'],
    api_access: ['Pro'],
    advanced_reports: ['Growth', 'Pro'],
    chat_support: ['Growth', 'Pro'],
    priority_support: ['Pro']
  };

  const allowedPlans = featureRules[feature];
  return allowedPlans ? allowedPlans.includes(userPlan) : true;
}