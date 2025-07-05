// src/dashboard-area/components/widgets/SubscriptionCard.jsx - Enhanced subscription management widget
import React, { useState, useEffect } from "react";
import subscriptionService from "@shared/services/subscriptionService";
import navigationService from "@shared/services/navigationService";
import { useNavigate } from "react-router-dom";
import {
  CreditCardIcon,
  ChartBarIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  StarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

const SubscriptionCard = ({
  onOpenUsage,
  onOpenBillingHistory,
  onOpenCancelPlan,
}) => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();

    // Subscribe to subscription updates
    const unsubscribe = subscriptionService.subscribe((event, data) => {
      if (
        event === "subscriptionUpdated" ||
        event === "subscriptionCancelled" ||
        event === "subscriptionReactivated"
      ) {
        loadSubscriptionData();
      }
    });

    return unsubscribe;
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const subscriptionData = subscriptionService.getCurrentSubscription();
      setSubscription(subscriptionData);
    } catch (error) {
      console.error("Failed to load subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    // Set navigation context for returning to settings
    navigationService.setContext({
      origin: "dashboard-settings",
      returnPath: "/dashboard?section=settings",
      section: "settings",
      metadata: { action: "upgrade", currentPlan: subscription.plan },
    });

    // Navigate to pricing
    navigationService.navigateToPricing(navigate, {
      from: "dashboard-settings",
    });
  };

  const handleBillingManagement = () => {
    // Set navigation context for returning to settings
    navigationService.setContext({
      origin: "dashboard-settings",
      returnPath: "/dashboard?section=settings",
      section: "settings",
      metadata: { action: "billing", currentPlan: subscription.plan },
    });

    // Navigate to billing
    navigationService.navigateToBilling(navigate, {
      plan: subscription.plan,
      billing: subscription.billing,
      from: "dashboard-settings",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "trial":
        return "text-blue-600 dark:text-blue-400";
      case "cancel_at_period_end":
        return "text-yellow-600 dark:text-yellow-400";
      case "expired":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case "trial":
        return <ClockIcon className="w-4 h-4 text-blue-500" />;
      case "cancel_at_period_end":
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case "expired":
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
    }
  };

  const getPlanGradient = (plan) => {
    switch (plan) {
      case "free":
        return "from-gray-500 to-gray-600";
      case "pro":
        return "from-blue-500 to-indigo-600";
      case "family":
        return "from-purple-500 to-pink-600";
      case "enterprise":
        return "from-emerald-500 to-teal-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getPlanIcon = (plan) => {
    switch (plan) {
      case "free":
        return <CreditCardIcon className="w-6 h-6 text-white" />;
      case "pro":
        return <StarIcon className="w-6 h-6 text-white" />;
      case "family":
        return <UserGroupIcon className="w-6 h-6 text-white" />;
      case "enterprise":
        return <BuildingOfficeIcon className="w-6 h-6 text-white" />;
      default:
        return <CreditCardIcon className="w-6 h-6 text-white" />;
    }
  };

  const recommendations = subscription
    ? subscriptionService.getUpgradeRecommendations()
    : [];

  if (loading) {
    return (
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
      <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
          <CreditCardIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          Subscription & Billing
        </h2>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200/50 dark:border-gray-700/50">
        {/* Plan Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${getPlanGradient(
                subscription?.plan
              )} rounded-xl flex items-center justify-center shadow-lg`}
            >
              {getPlanIcon(subscription?.plan)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white capitalize">
                  {subscription?.plan} Plan
                </h3>
                {subscription?.isTrial && (
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    TRIAL
                  </span>
                )}
                {subscription?.plan !== "free" && !subscription?.isTrial && (
                  <span className="bg-gradient-to-r from-emerald-400 to-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {subscription?.plan === "free"
                  ? "Perfect for getting started"
                  : "Premium features unlocked"}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {getStatusIcon(subscription?.status)}
            <span
              className={`text-sm font-medium ${getStatusColor(
                subscription?.status
              )} capitalize`}
            >
              {subscription?.status?.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Plan Details Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Storage */}
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              {subscription?.features?.storage || "N/A"}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Storage
            </p>
          </div>

          {/* Photos */}
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              {subscription?.features?.photos === "unlimited"
                ? "∞"
                : subscription?.features?.photos?.toLocaleString() || "N/A"}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Photos
            </p>
          </div>

          {/* Price */}
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              ${subscription?.price || 0}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {subscription?.billing === "yearly" ? "Per Year" : "Per Month"}
            </p>
          </div>

          {/* Next Billing */}
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-3 sm:p-4 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              {subscription?.isTrial
                ? `${subscription.trialDaysRemaining}d`
                : subscription?.daysRemaining
                ? `${subscription.daysRemaining}d`
                : "Free"}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {subscription?.isTrial
                ? "Trial Left"
                : subscription?.plan === "free"
                ? "Free"
                : "Days Left"}
            </p>
          </div>
        </div>

        {/* Usage Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Storage Usage
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {subscription?.usage?.storage?.usedFormatted || "0 B"} of{" "}
              {subscription?.usage?.storage?.limitFormatted || "N/A"}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-purple-600"
              style={{
                width: `${Math.min(
                  subscription?.usage?.storage?.percentage || 0,
                  100
                )}%`,
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subscription?.usage?.storage?.remaining === "unlimited"
              ? "Unlimited remaining"
              : `${
                  subscription?.usage?.storage?.remainingFormatted || "0 B"
                } remaining`}
          </p>
        </div>

        {/* Trial/Cancellation Notices */}
        {subscription?.isTrial && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>🔄 Trial Active:</strong> You have{" "}
              {subscription.trialDaysRemaining} days left in your free trial.
              You'll be charged ${subscription.price} on{" "}
              {new Date(subscription.nextBillingDate).toLocaleDateString()}.
            </p>
          </div>
        )}

        {subscription?.cancelAtPeriodEnd && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Cancellation Scheduled:</strong> Your subscription will
              be cancelled on{" "}
              {new Date(subscription.nextBillingDate).toLocaleDateString()}. You
              can reactivate anytime before then.
            </p>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-4 space-y-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  rec.urgency === "high"
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    rec.urgency === "high"
                      ? "text-red-800 dark:text-red-200"
                      : "text-yellow-800 dark:text-yellow-200"
                  }`}
                >
                  {rec.urgency === "high" ? "⚠️" : "💡"} {rec.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {subscription?.plan === "free" ? (
            <button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Upgrade to Pro - Get 20x More Storage 🚀
            </button>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleUpgrade}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <ArrowTrendingUpIcon className="w-4 h-4" />
                Upgrade Plan
              </button>
              <button
                onClick={handleBillingManagement}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <CogIcon className="w-4 h-4" />
                Manage Plan
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={onOpenUsage}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-gray-800 dark:text-gray-200 transition-colors text-sm"
            >
              <ChartBarIcon className="w-4 h-4" />
              <span>Usage Details</span>
            </button>
            <button
              onClick={onOpenBillingHistory}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-gray-800 dark:text-gray-200 transition-colors text-sm"
            >
              <CreditCardIcon className="w-4 h-4" />
              <span>Billing History</span>
            </button>
          </div>

          {/* Cancel Plan Button for Paid Plans */}
          {subscription?.plan !== "free" &&
            !subscription?.cancelAtPeriodEnd && (
              <button
                onClick={onOpenCancelPlan}
                className="w-full text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 py-2 font-medium transition-colors"
              >
                Cancel Plan
              </button>
            )}
        </div>
      </div>

      {/* Quick Plan Comparison - Only show for free users */}
      {subscription?.plan === "free" && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6 border border-indigo-200/50 dark:border-indigo-800/50">
          <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">
            See What You're Missing 🌟
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Pro Plan Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <StarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      Pro Plan
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Perfect for individuals
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    50GB
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Storage
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    10K
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Photos
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    $9.99
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Monthly
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-sm mb-4">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Advanced AI recognition
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Unlimited albums
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Priority support
                  </span>
                </li>
              </ul>
            </div>

            {/* Family Plan Preview */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-xl p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      Family Plan
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Perfect for families
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    250GB
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Storage
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    50K
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Photos
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    $19.99
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Monthly
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-sm mb-4">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Premium AI recognition
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Unlimited sharing
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Family management
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 hover:scale-105"
            >
              <span>Compare All Plans</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Plan Benefits for Paid Users */}
      {subscription?.plan !== "free" && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 sm:p-6 border border-green-200/50 dark:border-green-800/50">
          <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center flex items-center justify-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            Your Premium Benefits
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <span className="text-green-500">✓</span>
              <span>
                AI Recognition: {subscription.features?.aiRecognition}
              </span>
            </div>
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <span className="text-green-500">✓</span>
              <span>Support: {subscription.features?.support}</span>
            </div>
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <span className="text-green-500">✓</span>
              <span>Quality: {subscription.features?.quality}</span>
            </div>
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <span className="text-green-500">✓</span>
              <span>
                Sharing:{" "}
                {subscription.features?.sharing === "unlimited"
                  ? "Unlimited"
                  : `Up to ${subscription.features?.sharing}`}
              </span>
            </div>
            {subscription.features?.editing && (
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <span className="text-green-500">✓</span>
                <span>Photo Editing Tools</span>
              </div>
            )}
            {subscription.features?.videos && (
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <span className="text-green-500">✓</span>
                <span>Video Storage</span>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 text-center">
              🎉 Thank you for being a premium subscriber! Enjoying your extra
              features and storage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionCard;