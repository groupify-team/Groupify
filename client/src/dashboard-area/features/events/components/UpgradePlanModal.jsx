import React from "react";
import {
  XMarkIcon,
  StarIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const UpgradePlanModal = ({
  isOpen,
  onClose,
  currentPlan,
  currentEventCount,
  eventLimit,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isFreePlan = currentPlan === "free";
  const isPremiumPlan = currentPlan === "premium";

  const handleUpgrade = (targetPlan) => {
    // Smooth button animation before navigation
    const clickedButton = document.activeElement;
    if (clickedButton) {
      clickedButton.style.transform = "scale(0.95)";
      clickedButton.style.opacity = "0.8";
    }

    // Close modal with fade effect
    const modalElement = document.querySelector('[data-modal="upgrade-plan"]');
    if (modalElement) {
      modalElement.style.opacity = "0";
      modalElement.style.transform = "scale(0.95)";
    }

    // Navigate after animation
    setTimeout(() => {
      onClose();
      navigate(`/pricing?from=events-limit-modal&plan=${targetPlan}`, {
        replace: false,
        state: {
          smoothTransition: true,
          fromModal: "upgrade-plan",
          targetPlan,
        },
      });
    }, 200);
  };

  const handleClose = () => {
    // Smooth close animation
    const modalElement = document.querySelector('[data-modal="upgrade-plan"]');
    if (modalElement) {
      modalElement.style.opacity = "0";
      modalElement.style.transform = "scale(0.95)";
    }

    setTimeout(() => {
      onClose();
    }, 150);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[1200] animate-fade-in">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto my-4 sm:my-8 max-h-[90vh] flex flex-col">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl blur opacity-30"></div>

        <div
          data-modal="upgrade-plan"
          className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden animate-slide-in-scale flex flex-col max-h-full transition-all duration-200 ease-out"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed at top */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                    Event Limit Reached
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm truncate">
                    Time to upgrade your plan
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex-shrink-0 hover:scale-105 active:scale-95"
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Current Status */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4 animate-fade-in">
                <div className="flex items-start gap-2 sm:gap-3">
                  <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 text-sm">
                      You've reached your limit
                    </h4>
                    <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm">
                      {currentEventCount}/{eventLimit} events used on your{" "}
                      {isFreePlan ? "Free" : "Premium"} plan
                    </p>
                  </div>
                </div>
              </div>

              {/* Upgrade Options */}
              <div className="space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white text-center">
                  Choose Your Upgrade
                </h4>

                {/* Show Premium option only if user is on Free plan */}
                {isFreePlan && (
                  <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg animate-slide-up">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2">
                        <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        <h5 className="font-semibold text-blue-800 dark:text-blue-200 text-sm sm:text-base">
                          Premium Plan
                        </h5>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>

                    <div className="mb-3 sm:mb-4">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        50 Events
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Perfect for regular users
                      </p>
                    </div>

                    <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        <span>50 events (10x more than Free)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        <span>Unlimited photos per event</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                        <span>Advanced face recognition</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpgrade("premium")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm hover:shadow-lg hover:scale-105 active:scale-95 transform"
                    >
                      <span>Upgrade to Premium</span>
                      <ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                )}

                {/* Pro Plan - Always show */}
                <div
                  className="border border-purple-200 dark:border-purple-800 rounded-xl p-3 sm:p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20 hover:shadow-xl animate-slide-up"
                  style={{ animationDelay: "100ms" }}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                      <h5 className="font-semibold text-purple-800 dark:text-purple-200 text-sm sm:text-base">
                        Pro Plan
                      </h5>
                    </div>
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-medium">
                      Best Value
                    </span>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                      Unlimited Events
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      For power users and professionals
                    </p>
                  </div>

                  <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                      <span>Unlimited events</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                      <span>Unlimited photos per event</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                      <span>Advanced analytics</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpgrade("pro")}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 text-sm hover:shadow-xl group"
                  >
                    <span>Upgrade to Pro</span>
                    <ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div
                className="text-center animate-fade-in"
                style={{ animationDelay: "200ms" }}
              >
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                  Need help choosing? Contact our support team
                </p>
                <button
                  onClick={handleClose}
                  className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline transition-colors duration-200 hover:scale-105"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlanModal;
