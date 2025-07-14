import { toast } from "@shared/utils/toast";

class SubscriptionService {
  constructor() {
    this.listeners = new Set();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
  }

  getCurrentSubscription() {
    const stored = localStorage.getItem("userPlan");

    if (!stored) {
      return this.getDefaultSubscription();
    }

    try {
      const planData = JSON.parse(stored);
      return this.enhanceSubscriptionData(planData);
    } catch (error) {
      console.error("Failed to parse subscription data:", error);
      return this.getDefaultSubscription();
    }
  }

  getDefaultSubscription() {
    return {
      plan: "free",
      billing: "monthly",
      status: "active",
      purchaseDate: null,
      expiryDate: null,
      price: 0,
      isActive: true,
      isTrial: false,
      isPaid: false,
      daysRemaining: null,
      trialDaysRemaining: null,
      features: this.getPlanFeatures("free"),
      usage: this.getDefaultUsage(),
      billingHistory: [],
      nextBillingDate: null,
      cancelAtPeriodEnd: false,
      metadata: {},
    };
  }

  /**
   * Enhance subscription data with computed fields
   */
  enhanceSubscriptionData(planData) {
    const now = new Date();
    const purchaseDate = planData.purchaseDate
      ? new Date(planData.purchaseDate)
      : null;
    const expiryDate = this.calculateExpiryDate(planData);
    const trialEndDate = this.calculateTrialEndDate(planData);
    const isTrial = this.isInTrialPeriod(planData);
    const trialDaysRemaining = isTrial ? this.getDaysUntil(trialEndDate) : 0;
    const nextBillingDate = this.calculateNextBillingDate(planData);
    const daysUntilBilling = nextBillingDate
      ? this.getDaysUntil(nextBillingDate)
      : null;

    return {
      ...planData,
      status: this.getSubscriptionStatus(planData),
      isActive: this.isSubscriptionActive(planData),
      isTrial,
      isPaid: planData.plan !== "free",
      expiryDate,
      trialEndDate,
      nextBillingDate,
      daysRemaining: daysUntilBilling,
      trialDaysRemaining,
      features: this.getPlanFeatures(planData.plan),
      usage: this.calculateUsage(planData),
      billingHistory: this.getBillingHistoryForPlan(planData),
      cancelAtPeriodEnd: planData.cancelAtPeriodEnd || false,
      metadata: planData.metadata || {},
    };
  }

  getPlanFeatures(planName) {
    const features = {
      free: {
        events: 5,
        photosPerEvent: 30,
        membersPerEvent: 8, // FIXED: Changed from 5 to 8 to match usePlanLimits.jsx
        storage: "2GB",
        storageBytes: 2 * 1024 * 1024 * 1024,
        aiRecognition: "basic",
        support: "email",
        videos: true,
        editing: true,
        analytics: true,
        sharing: "unlimited",
        quality: "standard",
      },
      premium: {
        events: 50,
        photosPerEvent: 200,
        membersPerEvent: 20,
        storage: "50GB",
        storageBytes: 50 * 1024 * 1024 * 1024,
        aiRecognition: "advanced",
        support: "email",
        videos: true,
        editing: true,
        analytics: true,
        sharing: "unlimited",
        quality: "high",
      },
      pro: {
        events: "unlimited",
        photosPerEvent: "unlimited",
        membersPerEvent: "unlimited",
        storage: "500GB",
        storageBytes: 500 * 1024 * 1024 * 1024,
        aiRecognition: "premium",
        support: "priority",
        videos: true,
        editing: true,
        analytics: true,
        sharing: "unlimited",
        quality: "original",
      },
      enterprise: {
        events: "unlimited",
        photosPerEvent: "unlimited",
        membersPerEvent: "unlimited",
        storage: "unlimited",
        storageBytes: Number.MAX_SAFE_INTEGER,
        aiRecognition: "enterprise",
        support: "dedicated",
        videos: true,
        editing: true,
        analytics: true,
        sharing: "unlimited",
        quality: "original",
      },
    };

    return features[planName] || features.free;
  }

  calculateUsage(planData) {
    const features = this.getPlanFeatures(planData.plan);
    const storedUsage = this.getStoredUsage();

    const eventsUsed = storedUsage.events || 0;
    const photosUsed = storedUsage.photos || 0;
    const storageUsed = storedUsage.storage || 0;

    const eventsPercentage =
      features.events === "unlimited"
        ? 0
        : Math.min((eventsUsed / features.events) * 100, 100);

    const photosPercentage =
      features.photosPerEvent === "unlimited"
        ? 0
        : Math.min((photosUsed / features.photosPerEvent) * 100, 100);

    const storagePercentage =
      features.storageBytes === Number.MAX_SAFE_INTEGER
        ? 0
        : Math.min((storageUsed / features.storageBytes) * 100, 100);

    return {
      events: {
        used: eventsUsed,
        limit: features.events,
        percentage: eventsPercentage,
        remaining:
          features.events === "unlimited"
            ? "unlimited"
            : Math.max(0, features.events - eventsUsed),
      },
      photos: {
        used: photosUsed,
        limit: features.photosPerEvent,
        percentage: photosPercentage,
        remaining:
          features.photosPerEvent === "unlimited"
            ? "unlimited"
            : Math.max(0, features.photosPerEvent - photosUsed),
      },
      storage: {
        used: storageUsed,
        usedFormatted: this.formatBytes(storageUsed),
        limit: features.storageBytes,
        limitFormatted: features.storage,
        percentage: storagePercentage,
        remaining:
          features.storageBytes === Number.MAX_SAFE_INTEGER
            ? "unlimited"
            : Math.max(0, features.storageBytes - storageUsed),
        remainingFormatted:
          features.storageBytes === Number.MAX_SAFE_INTEGER
            ? "unlimited"
            : this.formatBytes(
                Math.max(0, features.storageBytes - storageUsed)
              ),
      },
    };
  }

  getStoredUsage() {
    try {
      const stored = localStorage.getItem("groupify_usage");
      if (stored) {
        const usage = JSON.parse(stored);
        console.log("📊 SubscriptionService: Retrieved stored usage:", usage);
        return usage;
      }
    } catch (error) {
      console.warn("Failed to get stored usage:", error);
    }

    const defaultUsage = {
      events: 0,
      photos: 0,
      storage: 0,
    };
    console.log("📊 SubscriptionService: Using default usage:", defaultUsage);
    return defaultUsage;
  }

  getDefaultUsage() {
    return this.calculateUsage({ plan: "free" });
  }

  updateUsage(updates) {
    const currentUsage = this.getStoredUsage();
    const newUsage = { ...currentUsage, ...updates };

    console.log("📊 SubscriptionService: Updating usage:", {
      current: currentUsage,
      updates: updates,
      new: newUsage
    });

    try {
      localStorage.setItem("groupify_usage", JSON.stringify(newUsage));
      this.notifyListeners("usageUpdated", newUsage);
      console.log("✅ SubscriptionService: Usage updated successfully");
      return newUsage;
    } catch (error) {
      console.error("❌ SubscriptionService: Failed to update usage:", error);
      return currentUsage;
    }
  }

  // ADDED: Method to sync usage with actual data
  syncUsageWithActualData(actualCounts) {
    console.log("🔄 SubscriptionService: Syncing usage with actual data:", actualCounts);
    
    const currentUsage = this.getStoredUsage();
    const syncedUsage = {
      events: actualCounts.events || currentUsage.events,
      photos: actualCounts.photos || currentUsage.photos,
      storage: actualCounts.storage || currentUsage.storage,
    };

    if (JSON.stringify(currentUsage) !== JSON.stringify(syncedUsage)) {
      console.log("🔄 SubscriptionService: Usage out of sync, correcting:", {
        before: currentUsage,
        after: syncedUsage
      });
      
      try {
        localStorage.setItem("groupify_usage", JSON.stringify(syncedUsage));
        this.notifyListeners("usageUpdated", syncedUsage);
        console.log("✅ SubscriptionService: Usage synced successfully");
        return syncedUsage;
      } catch (error) {
        console.error("❌ SubscriptionService: Failed to sync usage:", error);
        return currentUsage;
      }
    } else {
      console.log("✅ SubscriptionService: Usage already in sync");
      return currentUsage;
    }
  }

  // ADDED: Method to reset usage (for debugging)
  resetUsage() {
    console.log("🔄 SubscriptionService: Resetting usage to zero");
    const resetUsage = {
      events: 0,
      photos: 0,
      storage: 0,
    };

    try {
      localStorage.setItem("groupify_usage", JSON.stringify(resetUsage));
      this.notifyListeners("usageUpdated", resetUsage);
      console.log("✅ SubscriptionService: Usage reset successfully");
      return resetUsage;
    } catch (error) {
      console.error("❌ SubscriptionService: Failed to reset usage:", error);
      return this.getStoredUsage();
    }
  }

  getBillingHistoryForPlan(planData) {
    try {
      const stored = localStorage.getItem("groupify_billing_history");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to get billing history:", error);
    }

    return [];
  }

  getBillingHistory() {
    try {
      const stored = localStorage.getItem("groupify_billing_history");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to get billing history:", error);
    }

    return [];
  }

  isInTrialPeriod(planData) {
    if (planData.plan === "free") return false;

    const purchaseDate = planData.purchaseDate
      ? new Date(planData.purchaseDate)
      : null;
    if (!purchaseDate) return false;

    const trialEndDate = new Date(purchaseDate);
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    return new Date() < trialEndDate;
  }

  calculateTrialEndDate(planData) {
    if (planData.plan === "free") return null;

    const purchaseDate = planData.purchaseDate
      ? new Date(planData.purchaseDate)
      : null;
    if (!purchaseDate) return null;

    const trialEndDate = new Date(purchaseDate);
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    return trialEndDate;
  }

  calculateExpiryDate(planData) {
    if (planData.plan === "free") return null;

    const purchaseDate = planData.purchaseDate
      ? new Date(planData.purchaseDate)
      : null;
    if (!purchaseDate) return null;

    const expiryDate = new Date(purchaseDate);

    if (planData.billing === "yearly") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    return expiryDate;
  }
  calculateNextBillingDate(planData) {
    const trialEndDate = this.calculateTrialEndDate(planData);
    const isTrial = this.isInTrialPeriod(planData);

    if (isTrial && trialEndDate) {
      return trialEndDate;
    }

    return this.calculateExpiryDate(planData);
  }

  getSubscriptionStatus(planData) {
    if (planData.plan === "free") return "active";

    const isTrial = this.isInTrialPeriod(planData);
    const isActive = this.isSubscriptionActive(planData);

    if (isTrial) return "trial";
    if (isActive) return "active";
    if (planData.cancelAtPeriodEnd) return "cancel_at_period_end";

    return "expired";
  }

  isSubscriptionActive(planData) {
    if (planData.plan === "free") return true;

    const expiryDate = this.calculateExpiryDate(planData);
    if (!expiryDate) return false;

    return new Date() < expiryDate;
  }

  getDaysUntil(date) {
    if (!date) return 0;

    const now = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  updateSubscription(updates) {
    const current = this.getCurrentSubscription();
    const updated = {
      ...current,
      ...updates,
      purchaseDate: updates.purchaseDate || new Date().toISOString(),
      metadata: {
        ...current.metadata,
        ...updates.metadata,
        lastUpdated: new Date().toISOString(),
      },
    };

    try {
      localStorage.setItem("userPlan", JSON.stringify(updated));
      this.clearCache();
      this.notifyListeners("subscriptionUpdated", updated);

      toast.success(`Successfully updated to ${updated.plan} plan!`);
      return updated;
    } catch (error) {
      console.error("Failed to update subscription:", error);
      toast.error("Failed to update subscription");
      return current;
    }
  }
  cancelSubscription(cancelAtPeriodEnd = true) {
    const current = this.getCurrentSubscription();

    if (current.plan === "free") {
      toast.error("Cannot cancel free plan");
      return current;
    }

    const updated = {
      ...current,
      cancelAtPeriodEnd,
      metadata: {
        ...current.metadata,
        cancelledAt: new Date().toISOString(),
        cancelReason: "user_requested",
      },
    };

    try {
      localStorage.setItem("userPlan", JSON.stringify(updated));
      this.clearCache();
      this.notifyListeners("subscriptionCancelled", updated);

      const message = cancelAtPeriodEnd
        ? "Subscription will be cancelled at the end of the billing period"
        : "Subscription cancelled immediately";

      toast.success(message);
      return updated;
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error("Failed to cancel subscription");
      return current;
    }
  }
  reactivateSubscription() {
    const current = this.getCurrentSubscription();

    const updated = {
      ...current,
      cancelAtPeriodEnd: false,
      metadata: {
        ...current.metadata,
        reactivatedAt: new Date().toISOString(),
      },
    };

    try {
      localStorage.setItem("userPlan", JSON.stringify(updated));
      this.clearCache();
      this.notifyListeners("subscriptionReactivated", updated);

      toast.success("Subscription reactivated successfully!");
      return updated;
    } catch (error) {
      console.error("Failed to reactivate subscription:", error);
      toast.error("Failed to reactivate subscription");
      return current;
    }
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notifyListeners(event, data) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (error) {
        console.error("Subscription listener error:", error);
      }
    });
  }
  clearCache() {
    this.cache.clear();
  }
  getCached(key, fetchFn) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const fresh = fetchFn();
    this.cache.set(key, {
      data: fresh,
      timestamp: Date.now(),
    });

    return fresh;
  }

  /**
   * Check if user needs to upgrade for a feature
   */
  needsUpgradeFor(feature, currentUsage = null) {
    const subscription = this.getCurrentSubscription();
    const features = subscription.features;
    const usage = currentUsage || subscription.usage;

    switch (feature) {
      case "events":
        return (
          features.events !== "unlimited" &&
          usage.events.used >= features.events
        );

      case "photos":
        return (
          features.photosPerEvent !== "unlimited" &&
          usage.photos.used >= features.photosPerEvent
        );

      case "storage":
        return (
          features.storageBytes !== Number.MAX_SAFE_INTEGER &&
          usage.storage.used >= features.storageBytes
        );

      default:
        return false;
    }
  }

  getUpgradeRecommendations() {
    const subscription = this.getCurrentSubscription();
    const usage = subscription.usage;
    const recommendations = [];

    if (
      !usage ||
      (usage.events.used === 0 &&
        usage.photos.used === 0 &&
        usage.storage.used === 0)
    ) {
      return recommendations;
    }

    if (usage.events.percentage > 80) {
      recommendations.push({
        type: "events",
        urgency: usage.events.percentage > 95 ? "high" : "medium",
        message: `You've used ${Math.round(
          usage.events.percentage
        )}% of your event limit`,
        action: "upgrade_plan",
      });
    }

    if (usage.photos.percentage > 80) {
      recommendations.push({
        type: "photos",
        urgency: usage.photos.percentage > 95 ? "high" : "medium",
        message: `You've used ${Math.round(
          usage.photos.percentage
        )}% of your photo limit`,
        action: "upgrade_plan",
      });
    }

    if (usage.storage.percentage > 80) {
      recommendations.push({
        type: "storage",
        urgency: usage.storage.percentage > 95 ? "high" : "medium",
        message: `You've used ${Math.round(
          usage.storage.percentage
        )}% of your storage`,
        action: "upgrade_plan",
      });
    }

    if (subscription.isTrial && subscription.trialDaysRemaining <= 3) {
      recommendations.push({
        type: "trial",
        urgency: "high",
        message: `Your trial expires in ${subscription.trialDaysRemaining} days`,
        action: "subscribe",
      });
    }

    return recommendations;
  }
}

const subscriptionService = new SubscriptionService();

// ADDED: Global debug functions for development
if (typeof window !== 'undefined') {
  window.groupifyDebug = {
    subscriptionService,
    resetUsage: () => subscriptionService.resetUsage(),
    syncUsage: (counts) => subscriptionService.syncUsageWithActualData(counts),
    checkUsage: () => console.log("Current usage:", subscriptionService.getStoredUsage()),
    checkSubscription: () => console.log("Current subscription:", subscriptionService.getCurrentSubscription())
  };
}

export default subscriptionService;