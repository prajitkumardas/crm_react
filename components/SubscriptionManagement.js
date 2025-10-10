'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PLAN_CONFIGS, createSubscription, createOrder, canAccessFeature } from '../lib/razorpayService';
import { Check, X, CreditCard, Calendar, Users, Zap, BarChart3, MessageSquare, HeadphonesIcon, Crown } from 'lucide-react';

export default function SubscriptionManagement({ user, organization }) {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, [user?.id, organization?.id]);

  const fetchSubscriptionData = async () => {
    if (!user?.id || !organization?.id) return;

    try {
      // Fetch current subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', organization.id)
        .single();

      if (subError && subError.code !== 'PGRST116') throw subError;

      setCurrentSubscription(subscription || {
        plan_name: 'Free',
        status: 'active',
        client_limit: 50,
        auto_renew: true
      });

      // Fetch billing history
      const { data: billing, error: billingError } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (billingError) throw billingError;
      setBillingHistory(billing || []);

    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName) => {
    if (!user || !organization) return;

    setUpgrading(true);
    setSelectedPlan(planName);

    try {
      const planConfig = PLAN_CONFIGS[planName];
      if (!planConfig) throw new Error('Invalid plan selected');

      // Create Razorpay subscription
      const subscription = await createSubscription(planName, user.id, organization.id);

      // Update local subscription record
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          organization_id: organization.id,
          plan_name: planName,
          razorpay_subscription_id: subscription.id,
          status: 'active',
          client_limit: planConfig.clientLimit,
          auto_renew: true,
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

      if (error) throw error;

      // Redirect to Razorpay checkout
      window.location.href = subscription.short_url;

    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Failed to initiate upgrade. Please try again.');
    } finally {
      setUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const toggleAutoRenew = async () => {
    if (!currentSubscription) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ auto_renew: !currentSubscription.auto_renew })
        .eq('id', currentSubscription.id);

      if (error) throw error;

      setCurrentSubscription(prev => ({
        ...prev,
        auto_renew: !prev.auto_renew
      }));

    } catch (error) {
      console.error('Error updating auto-renew:', error);
      alert('Failed to update auto-renewal setting.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'grace': return 'text-yellow-600 bg-yellow-100';
      case 'canceled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'Free': return <Users className="h-5 w-5" />;
      case 'Starter': return <Zap className="h-5 w-5" />;
      case 'Growth': return <BarChart3 className="h-5 w-5" />;
      case 'Pro': return <Crown className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getPlanIcon(currentSubscription?.plan_name)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Current Plan: {currentSubscription?.plan_name}
              </h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(currentSubscription?.status)}`}>
                {currentSubscription?.status?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Client Limit: {currentSubscription?.client_limit === -1 ? 'Unlimited' : currentSubscription?.client_limit}
            </span>
          </div>

          {currentSubscription?.next_billing_date && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Next Billing: {new Date(currentSubscription.next_billing_date).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Auto-renew: {currentSubscription?.auto_renew ? 'On' : 'Off'}
            </span>
          </div>
        </div>

        {currentSubscription?.plan_name !== 'Pro' && (
          <div className="flex items-center justify-between">
            <button
              onClick={toggleAutoRenew}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentSubscription?.auto_renew
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {currentSubscription?.auto_renew ? 'Auto-renew On' : 'Auto-renew Off'}
            </button>
          </div>
        )}
      </div>

      {/* Plan Comparison Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Choose Your Plan</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Features</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Free</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Starter</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Growth</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900">Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Client Limit</td>
                <td className="text-center py-3 px-4">50</td>
                <td className="text-center py-3 px-4">500</td>
                <td className="text-center py-3 px-4">2,000</td>
                <td className="text-center py-3 px-4">Unlimited</td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Team Members</td>
                <td className="text-center py-3 px-4">1</td>
                <td className="text-center py-3 px-4">3</td>
                <td className="text-center py-3 px-4">10</td>
                <td className="text-center py-3 px-4">Unlimited</td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Automation</td>
                <td className="text-center py-3 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Bulk Messaging</td>
                <td className="text-center py-3 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">API Access</td>
                <td className="text-center py-3 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                <td className="text-center py-3 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                <td className="text-center py-3 px-4"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Reports</td>
                <td className="text-center py-3 px-4">Basic</td>
                <td className="text-center py-3 px-4">Basic</td>
                <td className="text-center py-3 px-4">Advanced</td>
                <td className="text-center py-3 px-4">Advanced</td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Support</td>
                <td className="text-center py-3 px-4">Community</td>
                <td className="text-center py-3 px-4">Email</td>
                <td className="text-center py-3 px-4">Chat</td>
                <td className="text-center py-3 px-4">24/7</td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium">Pricing</td>
                <td className="text-center py-3 px-4 font-semibold">Free</td>
                <td className="text-center py-3 px-4 font-semibold">₹499/mo</td>
                <td className="text-center py-3 px-4 font-semibold">₹999/mo</td>
                <td className="text-center py-3 px-4 font-semibold">₹2499/mo</td>
              </tr>

              <tr>
                <td className="py-3 px-4"></td>
                <td className="text-center py-3 px-4">
                  <span className="text-sm text-gray-500">Current</span>
                </td>
                <td className="text-center py-3 px-4">
                  <button
                    onClick={() => handleUpgrade('Starter')}
                    disabled={upgrading || currentSubscription?.plan_name === 'Starter'}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading && selectedPlan === 'Starter' ? 'Processing...' : 'Upgrade'}
                  </button>
                </td>
                <td className="text-center py-3 px-4">
                  <button
                    onClick={() => handleUpgrade('Growth')}
                    disabled={upgrading || currentSubscription?.plan_name === 'Growth'}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading && selectedPlan === 'Growth' ? 'Processing...' : 'Upgrade'}
                  </button>
                </td>
                <td className="text-center py-3 px-4">
                  <button
                    onClick={() => handleUpgrade('Pro')}
                    disabled={upgrading || currentSubscription?.plan_name === 'Pro'}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading && selectedPlan === 'Pro' ? 'Processing...' : 'Upgrade'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>

        {billingHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No billing history available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((bill) => (
                  <tr key={bill.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm">
                      {new Date(bill.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{bill.plan_name}</td>
                    <td className="py-3 px-4 text-sm">₹{bill.amount}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        bill.payment_status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : bill.payment_status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bill.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {bill.invoice_url ? (
                        <a
                          href={bill.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}