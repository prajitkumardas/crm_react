'use client';

import { useState } from 'react';
import { X, Crown, Zap, BarChart3, Check } from 'lucide-react';
import { PLAN_CONFIGS } from '../lib/razorpayService';

export default function UpgradePromptModal({ isOpen, onClose, feature, currentPlan, onUpgrade }) {
  const [selectedPlan, setSelectedPlan] = useState('Starter');

  if (!isOpen) return null;

  const getFeatureDescription = (feature) => {
    const descriptions = {
      bulk_messaging: 'Send messages to multiple clients at once',
      automation: 'Automate client communications and follow-ups',
      api_access: 'Integrate with external systems via API',
      advanced_reports: 'Get detailed analytics and custom reports',
      chat_support: 'Get priority support via live chat',
      add_client: 'Add more clients to your database'
    };
    return descriptions[feature] || 'Access premium features';
  };

  const getUpgradeReason = (feature) => {
    const reasons = {
      bulk_messaging: 'Bulk messaging helps you reach all your clients efficiently',
      automation: 'Automation saves time and ensures consistent communication',
      api_access: 'API access enables seamless integration with your workflow',
      advanced_reports: 'Advanced reports give you deeper insights into your business',
      chat_support: 'Priority support ensures you get help when you need it',
      add_client: 'Upgrade to manage more clients and grow your business'
    };
    return reasons[feature] || 'Upgrade to unlock this premium feature';
  };

  const handleUpgrade = (planName) => {
    onUpgrade(planName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-secondary-900 bg-opacity-50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Crown className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Upgrade Required</h2>
              <p className="text-sm text-text-secondary">Unlock premium features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Feature Description */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Feature: {feature.replace('_', ' ').toUpperCase()}</h3>
            <p className="text-blue-800">{getFeatureDescription(feature)}</p>
            <p className="text-blue-700 mt-2 font-medium">{getUpgradeReason(feature)}</p>
          </div>

          {/* Current Plan Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Your current plan: <span className="font-semibold text-gray-900">{currentPlan || 'Free'}</span>
            </p>
          </div>

          {/* Plan Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">Choose Your Plan</h3>

            <div className="grid gap-4">
              {/* Starter Plan */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPlan === 'Starter'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan('Starter')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Starter Plan</h4>
                      <p className="text-sm text-gray-600">₹499/month</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={selectedPlan === 'Starter'}
                      onChange={() => setSelectedPlan('Starter')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Up to 500 clients</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Automation features</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Bulk messaging</span>
                  </li>
                </ul>
              </div>

              {/* Growth Plan */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPlan === 'Growth'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan('Growth')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Growth Plan</h4>
                      <p className="text-sm text-gray-600">₹999/month</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={selectedPlan === 'Growth'}
                      onChange={() => setSelectedPlan('Growth')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Up to 2,000 clients</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Advanced automation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Advanced reports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Chat support</span>
                  </li>
                </ul>
              </div>

              {/* Pro Plan */}
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPlan === 'Pro'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan('Pro')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Pro Plan</h4>
                      <p className="text-sm text-gray-600">₹2499/month</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={selectedPlan === 'Pro'}
                      onChange={() => setSelectedPlan('Pro')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Unlimited clients</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>API access</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>Advanced features</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span>24/7 priority support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-border-light">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleUpgrade(selectedPlan)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Upgrade to {selectedPlan}
          </button>
        </div>
      </div>
    </div>
  );
}