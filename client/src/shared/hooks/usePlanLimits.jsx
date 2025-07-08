/**
 * Hook for managing plan limits and enforcement across the application
 * Provides real-time limit checking, usage tracking, and upgrade prompts
 * ALIGNED with exact pricing page values
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@auth/hooks/useAuth";

import subscriptionService from "@shared/services/subscriptionService";
import { toast } from "react-hot-toast";

export const usePlanLimits = () => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  // Core plan limits that match your pricing page EXACTLY
  const CORE_LIMITS = useMemo(
    () => ({
      free: {
        events: 5,
        photosPerEvent: 30,
        membersPerEvent: 8,
        storageGB: 2,
      },
      premium: {
        events: 50,
        photosPerEvent: 200, // Updated to match pricing page
        membersPerEvent: 20,
        storageGB: 50,
      },
      pro: {
        events: "unlimited",
        photosPerEvent: "unlimited",
        membersPerEvent: "unlimited",
        storageGB: 500,
      },
      enterprise: {
        events: "unlimited",
        photosPerEvent: "unlimited",
        membersPerEvent: "unlimited",
        storageGB: "unlimited",
      },
    }),
    []
  );

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

  useEffect(() => {
    if (currentUser) {
      loadSubscriptionData();
    }
  }, [currentUser, loadSubscriptionData]);

  useEffect(() => {
    const unsubscribe = subscriptionService.subscribe((event) => {
      if (event === "subscriptionUpdated" || event === "usageUpdated") {
        loadSubscriptionData();
      }
    });

    return unsubscribe;
  }, [loadSubscriptionData]);

  const canPerformAction = useCallback(
    (action, additionalData = {}) => {
      if (!subscription || !usage) {
        return { allowed: false, reason: "Subscription data not loaded" };
      }

      const limits = CORE_LIMITS[subscription.plan] || CORE_LIMITS.free;

      switch (action) {
        case "create_event":
          if (
            limits.events !== "unlimited" &&
            additionalData.currentEventCount >= limits.events
          ) {
            return {
              allowed: false,
              reason: `Event limit reached (${limits.events} events)`,
              upgradeRequired: true,
              currentUsage: additionalData.currentEventCount,
              limit: limits.events,
            };
          }
          break;

        case "upload_photos": {
          const { currentEventPhotos = 0, newPhotoCount = 1 } = additionalData;

          if (limits.photosPerEvent !== "unlimited") {
            if (currentEventPhotos + newPhotoCount > limits.photosPerEvent) {
              return {
                allowed: false,
                reason: `event photo limit reached (${limits.photosPerEvent} photos per event)`,
                upgradeRequired: true,
                currentUsage: currentEventPhotos,
                limit: limits.photosPerEvent,
              };
            }
          }
          break;
        }

        case "upload_storage": {
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
        }

        case "invite_member": {
          const { currentMembers = 0, newMemberCount = 1 } = additionalData;

          if (limits.membersPerEvent !== "unlimited") {
            if (currentMembers + newMemberCount > limits.membersPerEvent) {
              return {
                allowed: false,
                reason: `Member limit reached (${limits.membersPerEvent} members per event)`,
                upgradeRequired: true,
                currentUsage: currentMembers,
                limit: limits.membersPerEvent,
              };
            }
          }
          break;
        }

        default:
          return { allowed: true };
      }

      return { allowed: true };
    },
    [subscription, usage, CORE_LIMITS]
  );

  const updateUsage = useCallback((updates) => {
    return subscriptionService.updateUsage(updates);
  }, []);

  const getUsageInfo = useCallback(() => {
    if (!usage || !subscription) return null;

    const limits = CORE_LIMITS[subscription.plan] || CORE_LIMITS.free;

    return {
      events: {
        used: usage.events?.used || 0,
        limit: limits.events,
        percentage:
          limits.events === "unlimited"
            ? 0
            : Math.round(((usage.events?.used || 0) / limits.events) * 100),
        remaining:
          limits.events === "unlimited"
            ? "unlimited"
            : Math.max(0, limits.events - (usage.events?.used || 0)),
      },
      photos: {
        used: usage.photos.used,
        limit: limits.photosPerEvent,
        percentage:
          limits.photosPerEvent === "unlimited"
            ? 0
            : Math.round((usage.photos.used / limits.photosPerEvent) * 100),
        remaining:
          limits.photosPerEvent === "unlimited"
            ? "unlimited"
            : Math.max(0, limits.photosPerEvent - usage.photos.used),
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

  const showUpgradePrompt = useCallback(
    (reason, options = {}) => {
      const { persistent = false } = options;

      toast.error(reason, {
        duration: persistent ? 6000 : 4000,
        id: "upgrade-prompt",
        action: {
          label: "Upgrade Plan",
          onClick: () => {
            console.log("Navigate to upgrade:", {
              reason,
              subscription: subscription?.plan,
            });
          },
        },
      });
    },
    [subscription]
  );

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

  const getPlanFeatures = useCallback(() => {
    if (!subscription) return null;

    const limits = CORE_LIMITS[subscription.plan] || CORE_LIMITS.free;

    return {
      ...subscription.features,
      events: limits.events,
      photosPerEvent: limits.photosPerEvent,
      membersPerEvent: limits.membersPerEvent,
      storageGB: limits.storageGB,
    };
  }, [subscription, CORE_LIMITS]);

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

  const hasFeature = useCallback(
    (feature) => {
      if (!subscription) return false;

      const limits = CORE_LIMITS[subscription.plan] || CORE_LIMITS.free;

      switch (feature) {
        case "unlimited_events":
          return limits.events === "unlimited";
        case "unlimited_photos":
          return limits.photosPerEvent === "unlimited";
        case "unlimited_members":
          return limits.membersPerEvent === "unlimited";
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

  const getUpgradeSuggestions = useCallback(() => {
    if (!subscription) return [];

    const suggestions = [];
    const currentPlan = subscription.plan;

    if (currentPlan === "free") {
      suggestions.push({
        targetPlan: "premium",
        benefits: [
          "50 events (vs 5)",
          "200 photos per event (vs 30)",
          "50GB storage (vs 2GB)",
          "20 members per event (vs 5)",
        ],
        price: "$9.99/month",
      });
    }

    if (currentPlan === "free" || currentPlan === "premium") {
      suggestions.push({
        targetPlan: "pro",
        benefits: [
          "Unlimited events",
          "Unlimited photos per event",
          "500GB storage",
          "Unlimited members per event",
        ],
        price: "$19.99/month",
      });
    }

    return suggestions;
  }, [subscription]);

  const getApproachingLimits = useCallback(() => {
    const usageInfo = getUsageInfo();
    if (!usageInfo) return [];

    const approachingLimits = [];

    if (usageInfo.events.percentage > 80) {
      approachingLimits.push({
        type: "events",
        percentage: usageInfo.events.percentage,
        message: `You've used ${usageInfo.events.used} of ${usageInfo.events.limit} events`,
      });
    }

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
