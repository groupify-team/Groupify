// src/shared/hooks/usePlanLimits.js - FINAL VERSION aligned with pricing page

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import subscriptionService from "@shared/services/subscriptionService";
import { toast } from "react-hot-toast";

/**
 * Hook for managing plan limits and enforcement across the application
 * Provides real-time limit checking, usage tracking, and upgrade prompts
 * ALIGNED with exact pricing page values
 */
export const usePlanLimits = () => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  // Core plan limits that match your pricing page EXACTLY
  const CORE_LIMITS = {
    free: {
      trips: 5,
      photosPerTrip: 30,
      membersPerTrip: 5,
      storageGB: 2,
    },
    premium: {
      trips: 50,
      photosPerTrip: 200, // Updated to match pricing page
      membersPerTrip: 20,
      storageGB: 50,
    },
    pro: {
      trips: "unlimited",
      photosPerTrip: "unlimited",
      membersPerTrip: "unlimited",
      storageGB: 500, // Note: Pro has 500GB limit, not unlimited
    },
    enterprise: {
      trips: "unlimited",
      photosPerTrip: "unlimited",
      membersPerTrip: "unlimited",
      storageGB: "unlimited",
    },
  };

  const loadSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      const currentSubscription = subscriptionService.getCurrentSubscription();
      setSubscription(currentSubscription);
      setUsage(currentSubscription.usage);
      setRecommendations(subscriptionService.getUpgradeRecommendations());
    } catch (error) {
      console.error("Error loading subscription data:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize subscription data
  useEffect(() => {
    if (currentUser) {
      loadSubscriptionData();
    }
  }, [currentUser, loadSubscriptionData]);

  // Subscribe to subscription updates
  useEffect(() => {
    const unsubscribe = subscriptionService.subscribe((event, data) => {
      if (event === "subscriptionUpdated" || event === "usageUpdated") {
        loadSubscriptionData();
      }
    });

    return unsubscribe;
  }, [loadSubscriptionData]);

  /**
   * Check if user can perform an action based on plan limits
   * Uses EXACT pricing page values
   */
  const canPerformAction = useCallback(
    (action, additionalData = {}) => {
      if (!subscription || !usage) {
        return { allowed: false, reason: "Subscription data not loaded" };
      }

      const limits = CORE_LIMITS[subscription.plan] || CORE_LIMITS.free;

      switch (action) {
        case "create_trip":
          if (
            limits.trips !== "unlimited" &&
            additionalData.currentTripCount >= limits.trips
          ) {
            return {
              allowed: false,
              reason: `Trip limit reached (${limits.trips} trips)`,
              upgradeRequired: true,
              currentUsage: additionalData.currentTripCount,
              limit: limits.trips,
            };
          }
          break;

        case "upload_photos":
          const { currentTripPhotos = 0, newPhotoCount = 1 } = additionalData;

          // Check per-trip photo limit
          if (limits.photosPerTrip !== "unlimited") {
            if (currentTripPhotos + newPhotoCount > limits.photosPerTrip) {
              return {
                allowed: false,
                reason: `Trip photo limit reached (${limits.photosPerTrip} photos per trip)`,
                upgradeRequired: true,
                currentUsage: currentTripPhotos,
                limit: limits.photosPerTrip,
              };
            }
          }
          break;

        case "upload_storage":
          const { fileSize = 0 } = additionalData;

          if (limits.storageGB !== "unlimited") {
            const storageBytes = limits.storageGB * 1024 * 1024 * 1024;
            const newStorageUsed = usage.storage.used + fileSize;
            if (newStorageUsed > storageBytes) {
              return {
                allowed: false,
                reason: `Storage limit exceeded (${limits.storageGB}GB limit)`,
                upgradeRequired: true,
                currentUsage: usage.storage.used,
                limit: storageBytes,
                additionalNeeded: fileSize,
              };
            }
          }
          break;

        case "invite_member":
          const { currentMembers = 0, newMemberCount = 1 } = additionalData;

          if (limits.membersPerTrip !== "unlimited") {
            if (currentMembers + newMemberCount > limits.membersPerTrip) {
              return {
                allowed: false,
                reason: `Member limit reached (${limits.membersPerTrip} members per trip)`,
                upgradeRequired: true,
                currentUsage: currentMembers,
                limit: limits.membersPerTrip,
              };
            }
          }
          break;

        default:
          return { allowed: true };
      }

      return { allowed: true };
    },
    [subscription, usage, CORE_LIMITS]
  );

  /**
   * Update usage statistics
   */
  const updateUsage = useCallback((updates) => {
    return subscriptionService.updateUsage(updates);
  }, []);

  /**
   * Get formatted usage information
   */
  const getUsageInfo = useCallback(() => {
    if (!usage || !subscription) return null;

    const limits = CORE_LIMITS[subscription.plan] || CORE_LIMITS.free;

    return {
      trips: {
        used: usage.trips?.used || 0,
        limit: limits.trips,
        percentage:
          limits.trips === "unlimited"
            ? 0
            : Math.round(((usage.trips?.used || 0) / limits.trips) * 100),
        remaining:
          limits.trips === "unlimited"
            ? "unlimited"
            : Math.max(0, limits.trips - (usage.trips?.used || 0)),
      },
      photos: {
        used: usage.photos.used,
        limit: limits.photosPerTrip,
        percentage:
          limits.photosPerTrip === "unlimited"
            ? 0
            : Math.round((usage.photos.used / limits.photosPerTrip) * 100),
        remaining:
          limits.photosPerTrip === "unlimited"
            ? "unlimited"
            : Math.max(0, limits.photosPerTrip - usage.photos.used),
      },
      storage: {
        used: usage.storage.used,
        usedFormatted: usage.storage.usedFormatted,
        limit:
          limits.storageGB === "unlimited"
            ? "unlimited"
            : limits.storageGB * 1024 * 1024 * 1024,
        limitFormatted:
          limits.storageGB === "unlimited"
            ? "unlimited"
            : `${limits.storageGB}GB`,
        percentage:
          limits.storageGB === "unlimited"
            ? 0
            : Math.round(
                (usage.storage.used / (limits.storageGB * 1024 * 1024 * 1024)) *
                  100
              ),
        remaining:
          limits.storageGB === "unlimited"
            ? "unlimited"
            : Math.max(
                0,
                limits.storageGB * 1024 * 1024 * 1024 - usage.storage.used
              ),
        remainingFormatted:
          limits.storageGB === "unlimited"
            ? "unlimited"
            : subscriptionService.formatBytes(
                Math.max(
                  0,
                  limits.storageGB * 1024 * 1024 * 1024 - usage.storage.used
                )
              ),
      },
    };
  }, [usage, subscription, CORE_LIMITS]);

  /**
   * Show upgrade prompt with specific messaging
   */
  const showUpgradePrompt = useCallback(
    (reason, options = {}) => {
      const {
        title = "Upgrade Required",
        action = "upgrade",
        persistent = false,
      } = options;

      toast.error(reason, {
        duration: persistent ? 6000 : 4000,
        id: "upgrade-prompt",
        action: {
          label: "Upgrade Plan",
          onClick: () => {
            // Navigate to upgrade page or show upgrade modal
            console.log("Navigate to upgrade:", {
              reason,
              subscription: subscription?.plan,
            });
            // You can implement navigation to pricing page here
            // window.location.href = '/pricing';
          },
        },
      });
    },
    [subscription]
  );

  /**
   * Check and enforce limits before performing actions
   */
  const enforceLimit = useCallback(
    (action, additionalData = {}, options = {}) => {
      const check = canPerformAction(action, additionalData);

      if (!check.allowed && check.upgradeRequired) {
        showUpgradePrompt(check.reason, options);
        return false;
      }

      if (!check.allowed) {
        toast.error(check.reason);
        return false;
      }

      return true;
    },
    [canPerformAction, showUpgradePrompt]
  );

  /**
   * Get plan features with enhanced structure
   */
  const getPlanFeatures = useCallback(() => {
    if (!subscription) return null;

    const limits = CORE_LIMITS[subscription.plan] || CORE_LIMITS.free;

    return {
      ...subscription.features,
      // Enhanced plan limits structure from CORE_LIMITS
      trips: limits.trips,
      photosPerTrip: limits.photosPerTrip,
      membersPerTrip: limits.membersPerTrip,
      storageGB: limits.storageGB,
    };
  }, [subscription, CORE_LIMITS]);

  /**
   * Get current plan status
   */
  const getPlanStatus = useCallback(() => {
    if (!subscription) return null;

    return {
      plan: subscription.plan,
      status: subscription.status,
      isActive: subscription.isActive,
      isTrial: subscription.isTrial,
      isPaid: subscription.isPaid,
      daysRemaining: subscription.daysRemaining,
      trialDaysRemaining: subscription.trialDaysRemaining,
      expiryDate: subscription.expiryDate,
    };
  }, [subscription]);

  /**
   * Check if feature is available in current plan
   */
  const hasFeature = useCallback(
    (feature) => {
      if (!subscription) return false;

      const limits = CORE_LIMITS[subscription.plan] || CORE_LIMITS.free;

      switch (feature) {
        case "unlimited_trips":
          return limits.trips === "unlimited";
        case "unlimited_photos":
          return limits.photosPerTrip === "unlimited";
        case "unlimited_members":
          return limits.membersPerTrip === "unlimited";
        case "unlimited_storage":
          return limits.storageGB === "unlimited";
        case "ai_recognition":
          return subscription.features.aiRecognition !== "basic";
        case "video_upload":
          return subscription.features.videos;
        case "photo_editing":
          return subscription.features.editing;
        case "analytics":
          return subscription.features.analytics;
        case "priority_support":
          return (
            subscription.features.support === "priority" ||
            subscription.features.support === "dedicated"
          );
        default:
          return false;
      }
    },
    [subscription, CORE_LIMITS]
  );

  /**
   * Get upgrade suggestions based on current plan
   */
  const getUpgradeSuggestions = useCallback(() => {
    if (!subscription) return [];

    const suggestions = [];
    const currentPlan = subscription.plan;

    if (currentPlan === "free") {
      suggestions.push({
        targetPlan: "premium",
        benefits: [
          "50 trips (vs 5)",
          "200 photos per trip (vs 30)",
          "50GB storage (vs 2GB)",
          "20 members per trip (vs 5)",
        ],
        price: "$9.99/month",
      });
    }

    if (currentPlan === "free" || currentPlan === "premium") {
      suggestions.push({
        targetPlan: "pro",
        benefits: [
          "Unlimited trips",
          "Unlimited photos per trip",
          "500GB storage",
          "Unlimited members per trip",
        ],
        price: "$19.99/month",
      });
    }

    return suggestions;
  }, [subscription]);

  /**
   * Check if approaching any limits
   */
  const getApproachingLimits = useCallback(() => {
    const usageInfo = getUsageInfo();
    if (!usageInfo) return [];

    const approachingLimits = [];

    // Check trip limit (80% threshold)
    if (usageInfo.trips.percentage > 80) {
      approachingLimits.push({
        type: "trips",
        percentage: usageInfo.trips.percentage,
        message: `You've used ${usageInfo.trips.used} of ${usageInfo.trips.limit} trips`,
      });
    }

    // Check storage limit (80% threshold)
    if (usageInfo.storage.percentage > 80) {
      approachingLimits.push({
        type: "storage",
        percentage: usageInfo.storage.percentage,
        message: `You've used ${usageInfo.storage.usedFormatted} of ${usageInfo.storage.limitFormatted} storage`,
      });
    }

    return approachingLimits;
  }, [getUsageInfo]);

  return {
    // Data
    subscription,
    usage,
    loading,
    recommendations,

    // Actions
    canPerformAction,
    enforceLimit,
    updateUsage,
    showUpgradePrompt,
    loadSubscriptionData,

    // Helpers
    getUsageInfo,
    getPlanFeatures,
    getPlanStatus,
    hasFeature,
    getUpgradeSuggestions,
    getApproachingLimits,

    // Quick checks
    isFreePlan: subscription?.plan === "free",
    isPremiumPlan: subscription?.plan === "premium",
    isProPlan: subscription?.plan === "pro",
    isEnterprisePlan: subscription?.plan === "enterprise",
    needsUpgrade: recommendations.length > 0,

    // Limit constants for easy access
    CORE_LIMITS,
  };
};

export default usePlanLimits;
