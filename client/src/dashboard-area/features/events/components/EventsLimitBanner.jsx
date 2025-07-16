import React, { useState } from "react";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { usePlanLimits } from "@shared/hooks/usePlanLimits";

const EventsLimitBanner = ({ currentEventCount, onUpgrade }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const { subscription, getUsageInfo, isFreePlan, isPremiumPlan } =
    usePlanLimits();
  const usageInfo = getUsageInfo();
  const maxEvents = usageInfo?.events?.limit;
  const isUnlimited = maxEvents === "unlimited";
  const eventLimit = isUnlimited ? Infinity : maxEvents || 5;
  const isAtLimit = !isUnlimited && currentEventCount >= eventLimit;
  const isNearLimit = !isUnlimited && currentEventCount >= eventLimit * 0.8;

  if (isUnlimited || !isVisible || currentEventCount < eventLimit) {
    return null;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      const targetPlan = subscription?.plan === "free" ? "premium" : "pro";
      const pricingUrl = `/pricing?plan=${targetPlan}&from=events-limit-banner`;
      try {
        navigate(pricingUrl);
      } catch (error) {
        console.warn("❌ EventsLimitBanner: React Router failed:", error);
        window.location.href = pricingUrl;
      }
    }
  };

  const getBannerContent = () => {
    return {
      title: "Event Limit Reached",
      message: `You've reached your ${
        subscription?.plan || "free"
      } plan limit of ${eventLimit} events.`,
      action: "Upgrade Now",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      textColor: "text-yellow-800 dark:text-yellow-400",
      buttonColor: "bg-yellow-600 hover:bg-yellow-700",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      upgradePlan: isFreePlan ? "premium" : "pro",
    };
  };

  const bannerContent = getBannerContent();

  return (
    <div
      className={`relative ${bannerContent.bgColor} ${bannerContent.borderColor} border rounded-xl p-4 mb-6 animate-slide-down shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex">
          <ExclamationTriangleIcon
            className={`w-5 h-5 ${bannerContent.iconColor} mt-0.5 mr-3 flex-shrink-0`}
          />
          <div className="flex-1">
            <h3
              className={`text-sm font-semibold ${bannerContent.textColor} mb-1`}
            >
              {bannerContent.title}
            </h3>
            <p className={`text-sm ${bannerContent.textColor}`}>
              {bannerContent.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          <button
            onClick={handleUpgrade}
            className={`${bannerContent.buttonColor} text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md flex items-center gap-2 flex-shrink-0 cursor-pointer`}
          >
            <StarIcon className="w-4 h-4" />
            {bannerContent.action}
          </button>

          <button
            onClick={() => setIsVisible(false)}
            className={`${bannerContent.textColor} hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-1.5 transition-all flex-shrink-0`}
            title="Dismiss"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventsLimitBanner;
