import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { canAccessFeature } from './razorpayService';

/**
 * Check if a user can access a specific feature based on their subscription
 * @param {string} userId - User ID
 * @param {string} feature - Feature name to check
 * @returns {Promise<boolean>} Whether user can access the feature
 */
export async function checkFeatureAccess(userId, feature) {
  try {
    if (!userId) return false;

    // Get user's current subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('plan_name, status')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return false;
    }

    // Check if subscription is active
    if (!subscription || subscription.status !== 'active') {
      return false;
    }

    // Check feature access based on plan
    return canAccessFeature(subscription.plan_name, feature);

  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Get user's current plan and limits
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User's plan information
 */
export async function getUserPlanLimits(userId) {
  try {
    if (!userId) {
      return {
        planName: 'Free',
        clientLimit: 50,
        status: 'active',
        features: ['basic_client_management']
      };
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return {
        planName: 'Free',
        clientLimit: 50,
        status: 'active',
        features: ['basic_client_management']
      };
    }

    if (!subscription) {
      return {
        planName: 'Free',
        clientLimit: 50,
        status: 'active',
        features: ['basic_client_management']
      };
    }

    return {
      planName: subscription.plan_name,
      clientLimit: subscription.client_limit,
      status: subscription.status,
      nextBillingDate: subscription.next_billing_date,
      autoRenew: subscription.auto_renew
    };

  } catch (error) {
    console.error('Error getting user plan limits:', error);
    return {
      planName: 'Free',
      clientLimit: 50,
      status: 'active',
      features: ['basic_client_management']
    };
  }
}

/**
 * Check if user has exceeded client limit
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<boolean>} Whether user has exceeded limit
 */
export async function hasExceededClientLimit(userId, organizationId) {
  try {
    const planLimits = await getUserPlanLimits(userId);

    if (planLimits.clientLimit === -1) return false; // Unlimited

    // Count current clients
    const { count, error } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error counting clients:', error);
      return true; // Assume exceeded on error
    }

    return count >= planLimits.clientLimit;

  } catch (error) {
    console.error('Error checking client limit:', error);
    return true; // Assume exceeded on error
  }
}

/**
 * Middleware function to check subscription access
 * @param {string} userId - User ID
 * @param {string} feature - Feature to check
 * @param {string} organizationId - Organization ID (optional)
 * @returns {Promise<Object>} Access result
 */
export async function checkSubscriptionAccess(userId, feature, organizationId = null) {
  try {
    const hasAccess = await checkFeatureAccess(userId, feature);

    if (!hasAccess) {
      const planLimits = await getUserPlanLimits(userId);

      return {
        allowed: false,
        reason: `This feature requires a higher plan. Current plan: ${planLimits.planName}`,
        currentPlan: planLimits.planName,
        requiredFeature: feature
      };
    }

    // Additional checks for specific features
    if (feature === 'add_client' && organizationId) {
      const exceeded = await hasExceededClientLimit(userId, organizationId);
      if (exceeded) {
        const planLimits = await getUserPlanLimits(userId);
        return {
          allowed: false,
          reason: `Client limit exceeded (${planLimits.clientLimit}). Upgrade to add more clients.`,
          currentPlan: planLimits.planName,
          requiredFeature: 'higher_client_limit'
        };
      }
    }

    return {
      allowed: true,
      currentPlan: (await getUserPlanLimits(userId)).planName
    };

  } catch (error) {
    console.error('Error checking subscription access:', error);
    return {
      allowed: false,
      reason: 'Unable to verify subscription. Please try again.',
      error: error.message
    };
  }
}

/**
 * Hook to check feature access in React components
 * @param {string} feature - Feature to check
 * @returns {Object} Access state and loading
 */
export function useFeatureAccess(feature) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setHasAccess(false);
          return;
        }

        const access = await checkFeatureAccess(user.id, feature);
        setHasAccess(access);

      } catch (err) {
        console.error('Error checking feature access:', err);
        setError(err.message);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [feature]);

  return { hasAccess, loading, error };
}

/**
 * Feature constants for consistent naming
 */
export const FEATURES = {
  BULK_MESSAGING: 'bulk_messaging',
  AUTOMATION: 'automation',
  API_ACCESS: 'api_access',
  ADVANCED_REPORTS: 'advanced_reports',
  CHAT_SUPPORT: 'chat_support',
  ADD_CLIENT: 'add_client',
  EXPORT_DATA: 'export_data'
};