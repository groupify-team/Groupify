// SubscriptionCard.jsx - Subscription and billing management widget
import React from "react";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import {
  getCurrentPlanConfig,
  isPaidPlan,
  getExpiryDate,
  getPhotoUsagePercentage,
} from "@dashboard/utils/dashboardHelpers";

const SubscriptionCard = ({
  onNavigateToPricing,
  onNavigateToBilling,
  onOpenUsage,
  onOpenBillingHistory,
  onOpenCancelPlan,
}) => {
  const { userData, hasProfile, profilePhotos } = useDashboardData();

  const currentPlanConfig = getCurrentPlanConfig();
  const isCurrentlyPaidPlan = isPaidPlan();
  const expiryDate = getExpiryDate();
  const photoUsagePercent = getPhotoUsagePercentage(
    hasProfile ? profilePhotos.length : 0,
    currentPlanConfig.plan || "free"
  );

  return (
    <div
      data-section="settings"
      className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50"
    >
      <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path
              fillRule="evenodd"
              d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
              clipRule="evenodd"
            />
          </svg>
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
              className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${currentPlanConfig.gradient} rounded-xl flex items-center justify-center shadow-lg`}
            >
              <span className="text-white font-bold text-lg sm:text-xl">
                {currentPlanConfig.icon}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
                  {currentPlanConfig.name}
                </h3>
                {isCurrentlyPaidPlan && (
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    ⭐ PREMIUM
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {isCurrentlyPaidPlan
                  ? "Premium features unlocked"
                  : "Perfect for getting started"}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse bg-green-500"></div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Active
            </span>
          </div>
        </div>

        {/* Plan Details Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Storage */}
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              {currentPlanConfig.storage}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Storage
            </p>
          </div>

          {/* Photos */}
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              {currentPlanConfig.photos}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Photos
            </p>
          </div>

          {/* Price */}
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              {currentPlanConfig.price}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {currentPlanConfig.billing}
            </p>
          </div>

          {/* Trial/Status */}
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
              {isCurrentlyPaidPlan ? "14 days" : "∞"}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {isCurrentlyPaidPlan ? "Trial" : "Free"}
            </p>
          </div>

          {/* Plan Dates */}
          <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-4 sm:p-6 flex flex-col justify-center space-y-2">
            <div className="text-center">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Plan started:{" "}
              </span>
              <span className="font-medium text-gray-800 dark:text-white text-sm sm:text-base">
                {userData?.createdAt
                  ? new Date(userData.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Recently"}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Plan expires:{" "}
              </span>
              <span className="font-medium text-gray-800 dark:text-white text-sm sm:text-base">
                {isCurrentlyPaidPlan && expiryDate ? expiryDate : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Storage Usage
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {hasProfile ? `${profilePhotos.length} photos` : "0 photos"} used
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-purple-600"
              style={{ width: `${Math.min(photoUsagePercent, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {parseInt(currentPlanConfig.photos.replace(",", "")) -
              (hasProfile ? profilePhotos.length : 0)}{" "}
            photos remaining
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isCurrentlyPaidPlan ? (
            <button
              onClick={() => onNavigateToPricing()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Upgrade to Pro - Get 20x More Storage 🚀
            </button>
          ) : (
            <button
              onClick={() => onNavigateToPricing()}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Compare All Plans
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={onOpenUsage}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-gray-800 dark:text-gray-200 transition-colors text-sm"
            >
              <span>📊</span>
              <span>Usage Details</span>
            </button>
            <button
              onClick={onOpenBillingHistory}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-gray-800 dark:text-gray-200 transition-colors text-sm"
            >
              <span>💳</span>
              <span>Billing History</span>
            </button>
          </div>

          {/* Cancel Plan Button for Paid Plans */}
          {isCurrentlyPaidPlan && (
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
      {!isCurrentlyPaidPlan && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6 border border-indigo-200/50 dark:border-indigo-800/50">
          <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-center">
            See What You're Missing 👀
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Pro Plan Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">P</span>
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
                    <span className="text-white font-bold text-lg">F</span>
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
              onClick={() => onNavigateToPricing()}
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
    </div>
  );
};

export default SubscriptionCard;
