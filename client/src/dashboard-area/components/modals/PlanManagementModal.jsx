// src/dashboard-area/components/modals/PlanManagementModal.jsx - Professional plan management modal
import React, { useState, useEffect } from "react";
import { 
  XMarkIcon, 
  CogIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ClockIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";
import subscriptionService from "../../../shared/services/subscriptionService";
import navigationService from "../../../shared/services/navigationService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const PlanManagementModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSubscriptionData();
      
      // Subscribe to subscription updates
      const unsubscribe = subscriptionService.subscribe((event, data) => {
        if (event === 'subscriptionUpdated' || event === 'subscriptionCancelled' || event === 'subscriptionReactivated') {
          loadSubscriptionData();
        }
      });

      return unsubscribe;
    }
  }, [isOpen]);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      const subscriptionData = subscriptionService.getCurrentSubscription();
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planName) => {
    // Set navigation context for returning to settings
    navigationService.setContext({
      origin: 'dashboard-settings',
      returnPath: '/dashboard?section=settings',
      section: 'settings',
      metadata: { action: 'upgrade', currentPlan: subscription.plan }
    });

    // Navigate to pricing with upgrade context
    navigationService.navigateToPricing(navigate, {
      plan: planName,
      from: 'dashboard-settings'
    });
  };

  const handleDowngrade = async (planName) => {
    setActionLoading('downgrade');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      subscriptionService.updateSubscription({
        plan: planName,
        billing: subscription.billing,
        price: planName === 'free' ? 0 : (planName === 'pro' ? 9.99 : 19.99)
      });
      
      toast.success(`Successfully downgraded to ${planName} plan!`);
      setShowConfirmation(null);
    } catch (error) {
      console.error('Downgrade failed:', error);
      toast.error('Failed to downgrade plan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    setActionLoading('cancel');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      subscriptionService.cancelSubscription(true); // Cancel at period end
      toast.success('Subscription will be cancelled at the end of your billing period');
      setShowConfirmation(null);
    } catch (error) {
      console.error('Cancellation failed:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    setActionLoading('reactivate');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      subscriptionService.reactivateSubscription();
      setShowConfirmation(null);
    } catch (error) {
      console.error('Reactivation failed:', error);
      toast.error('Failed to reactivate subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeBilling = () => {
    // Set navigation context for returning to settings
    navigationService.setContext({
      origin: 'dashboard-settings',
      returnPath: '/dashboard?section=settings',
      section: 'settings',
      metadata: { action: 'change_billing', currentPlan: subscription.plan }
    });

    // Navigate to billing with current plan
    navigationService.navigateToBilling(navigate, {
      plan: subscription.plan,
      billing: subscription.billing === 'monthly' ? 'yearly' : 'monthly',
      from: 'dashboard-settings'
    });
  };

  const plans = [
    {
      name: 'free',
      displayName: 'Free',
      price: { monthly: 0, yearly: 0 },
      features: ['2GB storage', '500 photos', '2 albums', 'Basic AI'],
      color: 'gray'
    },
    {
      name: 'pro',
      displayName: 'Pro',
      price: { monthly: 9.99, yearly: 99.99 },
      features: ['50GB storage', '10K photos', 'Unlimited albums', 'Advanced AI'],
      color: 'indigo'
    },
    {
      name: 'family',
      displayName: 'Family',
      price: { monthly: 19.99, yearly: 199.99 },
      features: ['250GB storage', '50K photos', 'Unlimited sharing', 'Premium AI'],
      color: 'purple'
    }
  ];

  const currentPlanIndex = plans.findIndex(plan => plan.name === subscription?.plan);
  const availableUpgrades = plans.slice(currentPlanIndex + 1);
  const availableDowngrades = plans.slice(0, currentPlanIndex);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] border border-white/20 dark:border-gray-700/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <CogIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Manage Your Plan
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upgrade, downgrade, or cancel your subscription
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading subscription data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Current Plan Overview */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Plan: {subscription?.plan?.charAt(0).toUpperCase() + subscription?.plan?.slice(1)}
                  </h3>
                  <div className="flex items-center gap-2">
                    {subscription?.isTrial && (
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                        Trial - {subscription.trialDaysRemaining} days left
                      </span>
                    )}
                    {subscription?.cancelAtPeriodEnd && (
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm font-medium">
                        Cancelling
                      </span>
                    )}
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Active</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      ${subscription?.price || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {subscription?.billing === 'yearly' ? 'Per Year' : 'Per Month'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {subscription?.features?.storage || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Storage</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {subscription?.features?.photos === 'unlimited' ? '∞' : subscription?.features?.photos?.toLocaleString() || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Photos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {subscription?.nextBillingDate ? 
                        new Date(subscription.nextBillingDate).toLocaleDateString() : 
                        'N/A'
                      }
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Next Billing</p>
                  </div>
                </div>
              </div>

              {/* Upgrade Options */}
              {availableUpgrades.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ArrowRightIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Upgrade Options
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableUpgrades.map((plan) => (
                      <div key={plan.name} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {plan.displayName}
                          </h5>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">
                              ${plan.price[subscription?.billing || 'monthly']}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              per {subscription?.billing === 'yearly' ? 'year' : 'month'}
                            </p>
                          </div>
                        </div>

                        <ul className="space-y-2 mb-4">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <CheckCircleIcon className="w-4 h-4 text-green-500" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => handleUpgrade(plan.name)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          Upgrade to {plan.displayName}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing Options */}
              {subscription?.plan !== 'free' && (
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCardIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Billing Options
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Current Billing: {subscription?.billing === 'yearly' ? 'Yearly' : 'Monthly'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {subscription?.billing === 'yearly' 
                            ? 'Save 20% with yearly billing' 
                            : 'Switch to yearly and save 20%'
                          }
                        </p>
                      </div>
                      <button
                        onClick={handleChangeBilling}
                        className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-medium text-sm transition-colors"
                      >
                        Switch to {subscription?.billing === 'yearly' ? 'Monthly' : 'Yearly'}
                      </button>
                    </div>

                    {subscription?.billing === 'monthly' && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>💡 Save Money:</strong> Switch to yearly billing and save{' '}
                          <strong>${((subscription.price * 12) - (subscription.price * 10)).toFixed(2)}</strong> per year!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Downgrade Options */}
              {availableDowngrades.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    Downgrade Options
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableDowngrades.map((plan) => (
                      <div key={plan.name} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {plan.displayName}
                          </h5>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                              ${plan.price[subscription?.billing || 'monthly']}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              per {subscription?.billing === 'yearly' ? 'year' : 'month'}
                            </p>
                          </div>
                        </div>

                        <ul className="space-y-2 mb-4">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <CheckCircleIcon className="w-4 h-4 text-gray-400" />
                              {feature}
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => setShowConfirmation({ type: 'downgrade', plan: plan.name })}
                          className="w-full bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg font-semibold transition-colors border border-yellow-300 dark:border-yellow-700"
                        >
                          Downgrade to {plan.displayName}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>⚠️ Important:</strong> Downgrading may result in loss of access to premium features and 
                      data limits. Your change will take effect at the end of your current billing period.
                    </p>
                  </div>
                </div>
              )}

              {/* Cancel Subscription */}
              {subscription?.plan !== 'free' && (
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                    Cancel Subscription
                  </h4>

                  {subscription?.cancelAtPeriodEnd ? (
                    <div className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                          <strong>Cancellation Scheduled:</strong> Your subscription will be cancelled on{' '}
                          <strong>{new Date(subscription.nextBillingDate).toLocaleDateString()}</strong>.
                          You'll continue to have access to all features until then.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                          <ClockIcon className="w-4 h-4" />
                          <span>{subscription.daysRemaining} days remaining</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowConfirmation({ type: 'reactivate' })}
                        disabled={actionLoading === 'reactivate'}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        {actionLoading === 'reactivate' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Reactivating...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-5 h-5" />
                            Reactivate Subscription
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cancel your subscription and revert to the free plan. You'll keep access to all 
                        premium features until the end of your current billing period.
                      </p>

                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <strong>⚠️ What happens when you cancel:</strong>
                        </p>
                        <ul className="mt-2 text-xs text-red-700 dark:text-red-300 space-y-1">
                          <li>• You'll lose access to premium features at the end of your billing period</li>
                          <li>• Your storage will be limited to the free plan limits</li>
                          <li>• Advanced AI features will no longer be available</li>
                          <li>• You can reactivate anytime before the cancellation date</li>
                        </ul>
                      </div>

                      <button
                        onClick={() => setShowConfirmation({ type: 'cancel' })}
                        className="w-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg font-semibold transition-colors border border-red-300 dark:border-red-700"
                      >
                        Cancel Subscription
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Need help? Contact support for plan questions.
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                showConfirmation.type === 'cancel' 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : showConfirmation.type === 'reactivate'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-yellow-100 dark:bg-yellow-900/30'
              }`}>
                {showConfirmation.type === 'cancel' && (
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                )}
                {showConfirmation.type === 'reactivate' && (
                  <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                )}
                {showConfirmation.type === 'downgrade' && (
                  <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {showConfirmation.type === 'cancel' && 'Cancel Subscription?'}
                {showConfirmation.type === 'reactivate' && 'Reactivate Subscription?'}
                {showConfirmation.type === 'downgrade' && 'Confirm Downgrade'}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {showConfirmation.type === 'cancel' && 
                  'Your subscription will be cancelled at the end of the current billing period. You can reactivate anytime before then.'
                }
                {showConfirmation.type === 'reactivate' && 
                  'Your subscription will be reactivated and you\'ll continue to be billed normally.'
                }
                {showConfirmation.type === 'downgrade' && 
                  `You're about to downgrade to the ${showConfirmation.plan} plan. This change will take effect at the end of your current billing period.`
                }
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(null)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showConfirmation.type === 'cancel') {
                      handleCancelSubscription();
                    } else if (showConfirmation.type === 'reactivate') {
                      handleReactivateSubscription();
                    } else if (showConfirmation.type === 'downgrade') {
                      handleDowngrade(showConfirmation.plan);
                    }
                  }}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    showConfirmation.type === 'cancel'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : showConfirmation.type === 'reactivate'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {showConfirmation.type === 'cancel' && 'Cancelling...'}
                      {showConfirmation.type === 'reactivate' && 'Reactivating...'}
                      {showConfirmation.type === 'downgrade' && 'Processing...'}
                    </>
                  ) : (
                    <>
                      {showConfirmation.type === 'cancel' && 'Yes, Cancel'}
                      {showConfirmation.type === 'reactivate' && 'Yes, Reactivate'}
                      {showConfirmation.type === 'downgrade' && 'Yes, Downgrade'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManagementModal;