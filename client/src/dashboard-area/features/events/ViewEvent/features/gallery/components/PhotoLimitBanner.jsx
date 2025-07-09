import React, { useState } from "react";
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { usePlanLimits } from "@shared/hooks/usePlanLimits";
import navigationService from "@shared/services/navigationService";

const PhotoLimitBanner = ({ currentPhotoCount, onUpgrade }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const { subscription, showUpgradePrompt } = usePlanLimits();

  // Get the photo limit from subscription
  const maxPhotos = subscription?.features?.photosPerEvent;
  const isUnlimited = maxPhotos === "unlimited";
  const photoLimit = isUnlimited ? Infinity : (maxPhotos || 30);

  // Calculate if we're approaching or at the limit
  const isAtLimit = !isUnlimited && currentPhotoCount >= photoLimit;
  const isNearLimit = !isUnlimited && currentPhotoCount >= photoLimit * 0.8; // 80% of limit

  // Don't show banner if unlimited or if user dismissed it
  if (isUnlimited || !isVisible || (!isAtLimit && !isNearLimit)) {
    return null;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Set navigation context to return to the event page
      navigationService.setContext({
        origin: "event-photo-limit",
        returnPath: window.location.pathname + window.location.search,
        section: "photos",
        metadata: { 
          action: "upgrade_for_photos",
          currentPhotoCount,
          photoLimit,
          eventId: window.location.pathname.split('/').pop() // Extract event ID from URL
        },
      });

      // Navigate to pricing page with photo upgrade context
      navigationService.navigateToPricing(navigate, {
        plan: subscription?.plan === "free" ? "premium" : "pro",
        from: "event-photo-limit",
      });
    }
  };

  const getBannerContent = () => {
    // CHANGED: Both conditions now use yellow colors
    if (isAtLimit) {
      return {
        title: "Photo Limit Reached",
        message: `You've used all ${photoLimit} photo slots for this event.`,
        action: "Upgrade Now",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        textColor: "text-yellow-800 dark:text-yellow-400",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700",
      };
    } else {
      return {
        title: "Photo Limit Warning",
        message: `You've used ${currentPhotoCount} of ${photoLimit} photo slots.`,
        action: "Upgrade Plan",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        textColor: "text-yellow-800 dark:text-yellow-400",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700",
      };
    }
  };

  const bannerContent = getBannerContent();

  return (
    <div
      className={`relative ${bannerContent.bgColor} ${bannerContent.borderColor} border rounded-lg p-4 mb-6 animate-slide-down`}
    >
      <div className="flex items-start justify-between">
        <div className="flex">
          <ExclamationTriangleIcon
            className={`w-5 h-5 ${bannerContent.textColor} mt-0.5 mr-3 flex-shrink-0`}
          />
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${bannerContent.textColor}`}>
              {bannerContent.title}
            </h3>
            <p className={`text-sm ${bannerContent.textColor} mt-1`}>
              {bannerContent.message}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 ml-4">
          <button
            onClick={handleUpgrade}
            className={`${bannerContent.buttonColor} text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md flex-shrink-0`}
          >
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

export default PhotoLimitBanner;