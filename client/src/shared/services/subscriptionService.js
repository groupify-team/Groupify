import { toast } from "react-hot-toast";

class SubscriptionService {
  constructor() {
    this.listeners = new Set();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get current user subscription data
   */
  getCurrentSubscription() {
    const stored = localStorage.getItem('userPlan');
    
    if (!stored) {
      return this.getDefaultSubscription();
    }

    try {
      const planData = JSON.parse(stored);
      return this.enhanceSubscriptionData(planData);
    } catch (error) {
      console.error('Failed to parse subscription data:', error);
      return this.getDefaultSubscription();
    }
  }

  /**
   * Get default free subscription
   */
  getDefaultSubscription() {
    return {
      plan: 'free',
      billing: 'monthly',
      status: 'active',
      purchaseDate: null,
      expiryDate: null,
      price: 0,
      isActive: true,
      isTrial: false,
      isPaid: false,
      daysRemaining: null,
      trialDaysRemaining: null,
      features: this.getPlanFeatures('free'),
      usage: this.getDefaultUsage(),
      billingHistory: [],
      nextBillingDate: null,
      cancelAtPeriodEnd: false,
      metadata: {}
    };
  }

  /**
   * Enhance subscription data with computed fields
   */
  enhanceSubscriptionData(planData) {
    const now = new Date();
    const purchaseDate = planData.purchaseDate ? new Date(planData.purchaseDate) : null;
    const expiryDate = this.calculateExpiryDate(planData);
    const trialEndDate = this.calculateTrialEndDate(planData);
    
    // Check if subscription is in trial period
    const isTrial = this.isInTrialPeriod(planData);
    const trialDaysRemaining = isTrial ? this.getDaysUntil(trialEndDate) : 0;
    
    // Calculate billing dates
    const nextBillingDate = this.calculateNextBillingDate(planData);
    const daysUntilBilling = nextBillingDate ? this.getDaysUntil(nextBillingDate) : null;

    return {
      ...planData,
      status: this.getSubscriptionStatus(planData),
      isActive: this.isSubscriptionActive(planData),
      isTrial,
      isPaid: planData.plan !== 'free',
      expiryDate,
      trialEndDate,
      nextBillingDate,
      daysRemaining: daysUntilBilling,
      trialDaysRemaining,
      features: this.getPlanFeatures(planData.plan),
      usage: this.calculateUsage(planData),
      billingHistory: this.getBillingHistoryForPlan(planData),
      cancelAtPeriodEnd: planData.cancelAtPeriodEnd || false,
      metadata: planData.metadata || {}
    };
  }

  /**
   * Get plan features configuration - FIXED to match your pricing page exactly
   */
  getPlanFeatures(planName) {
    const features = {
      free: {
        // Core limitations (ENFORCED) - matches your pricing page
        trips: 5,
        photosPerTrip: 30,
        membersPerTrip: 5,
        storage: '2GB',
        storageBytes: 2 * 1024 * 1024 * 1024,
        
        // Available to all (NOT ENFORCED)
        aiRecognition: 'basic',
        support: 'email',
        videos: true,
        editing: true,
        analytics: true,
        sharing: 'unlimited',
        quality: 'standard',
      },
      premium: {
        // Core limitations (ENFORCED) - matches your pricing page
        trips: 50,
        photosPerTrip: 200, // Fixed from your CORE_LIMITS
        membersPerTrip: 20,
        storage: '50GB',
        storageBytes: 50 * 1024 * 1024 * 1024,
        
        // Available to all (NOT ENFORCED)
        aiRecognition: 'advanced',
        support: 'email',
        videos: true,
        editing: true,
        analytics: true,
        sharing: 'unlimited',
        quality: 'high',
      },
      pro: {
        // Core limitations (ENFORCED) - matches your pricing page
        trips: 'unlimited',
        photosPerTrip: 'unlimited',
        membersPerTrip: 'unlimited',
        storage: '500GB', // Pro has 500GB limit, not unlimited
        storageBytes: 500 * 1024 * 1024 * 1024,
        
        // Available to all (NOT ENFORCED)
        aiRecognition: 'premium',
        support: 'priority',
        videos: true,
        editing: true,
        analytics: true,
        sharing: 'unlimited',
        quality: 'original',
      },
      enterprise: {
        // Core limitations (ENFORCED)
        trips: 'unlimited',
        photosPerTrip: 'unlimited',
        membersPerTrip: 'unlimited',
        storage: 'unlimited',
        storageBytes: Number.MAX_SAFE_INTEGER,
        
        // Enterprise features
        aiRecognition: 'enterprise',
        support: 'dedicated',
        videos: true,
        editing: true,
        analytics: true,
        sharing: 'unlimited',
        quality: 'original',
      }
    };

    return features[planName] || features.free;
  }

  /**
   * Calculate usage statistics - FIXED to include trips usage
   */
  calculateUsage(planData) {
    const features = this.getPlanFeatures(planData.plan);
    const storedUsage = this.getStoredUsage();
    
    const tripsUsed = storedUsage.trips || 0;
    const photosUsed = storedUsage.photos || 0;
    const storageUsed = storedUsage.storage || 0;

    // Calculate percentages
    const tripsPercentage = features.trips === 'unlimited' ? 0 : 
      Math.min((tripsUsed / features.trips) * 100, 100);
    
    const photosPercentage = features.photosPerTrip === 'unlimited' ? 0 : 
      Math.min((photosUsed / features.photosPerTrip) * 100, 100);
    
    const storagePercentage = features.storageBytes === Number.MAX_SAFE_INTEGER ? 0 :
      Math.min((storageUsed / features.storageBytes) * 100, 100);

    return {
      trips: {
        used: tripsUsed,
        limit: features.trips,
        percentage: tripsPercentage,
        remaining: features.trips === 'unlimited' ? 'unlimited' : Math.max(0, features.trips - tripsUsed)
      },
      photos: {
        used: photosUsed,
        limit: features.photosPerTrip,
        percentage: photosPercentage,
        remaining: features.photosPerTrip === 'unlimited' ? 'unlimited' : Math.max(0, features.photosPerTrip - photosUsed)
      },
      storage: {
        used: storageUsed,
        usedFormatted: this.formatBytes(storageUsed),
        limit: features.storageBytes,
        limitFormatted: features.storage,
        percentage: storagePercentage,
        remaining: features.storageBytes === Number.MAX_SAFE_INTEGER ? 'unlimited' : 
          Math.max(0, features.storageBytes - storageUsed),
        remainingFormatted: features.storageBytes === Number.MAX_SAFE_INTEGER ? 'unlimited' :
          this.formatBytes(Math.max(0, features.storageBytes - storageUsed))
      }
    };
  }

  /**
   * Get stored usage data - FIXED to include trips
   */
  getStoredUsage() {
    try {
      const stored = localStorage.getItem('groupify_usage');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to get stored usage:', error);
    }

    // Return empty/zero data
    return {
      trips: 0,
      photos: 0,
      storage: 0
    };
  }

  /**
   * Get default usage structure
   */
  getDefaultUsage() {
    return this.calculateUsage({ plan: 'free' });
  }

  /**
   * Update usage data
   */
  updateUsage(updates) {
    const currentUsage = this.getStoredUsage();
    const newUsage = { ...currentUsage, ...updates };
    
    try {
      localStorage.setItem('groupify_usage', JSON.stringify(newUsage));
      this.notifyListeners('usageUpdated', newUsage);
      return newUsage;
    } catch (error) {
      console.error('Failed to update usage:', error);
      return currentUsage;
    }
  }

  /**
   * Get billing history for a specific plan
   */
  getBillingHistoryForPlan(planData) {
    try {
      const stored = localStorage.getItem('groupify_billing_history');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to get billing history:', error);
    }

    return [];
  }

  /**
   * Get billing history
   */
  getBillingHistory() {
    try {
      const stored = localStorage.getItem('groupify_billing_history');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to get billing history:', error);
    }

    return [];
  }

  /**
   * Check if subscription is in trial period
   */
  isInTrialPeriod(planData) {
    if (planData.plan === 'free') return false;
    
    const purchaseDate = planData.purchaseDate ? new Date(planData.purchaseDate) : null;
    if (!purchaseDate) return false;

    const trialEndDate = new Date(purchaseDate);
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial

    return new Date() < trialEndDate;
  }

  /**
   * Calculate trial end date
   */
  calculateTrialEndDate(planData) {
    if (planData.plan === 'free') return null;
    
    const purchaseDate = planData.purchaseDate ? new Date(planData.purchaseDate) : null;
    if (!purchaseDate) return null;

    const trialEndDate = new Date(purchaseDate);
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    return trialEndDate;
  }

  /**
   * Calculate subscription expiry date
   */
  calculateExpiryDate(planData) {
    if (planData.plan === 'free') return null;
    
    const purchaseDate = planData.purchaseDate ? new Date(planData.purchaseDate) : null;
    if (!purchaseDate) return null;

    const expiryDate = new Date(purchaseDate);
    
    if (planData.billing === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    return expiryDate;
  }

  /**
   * Calculate next billing date
   */
  calculateNextBillingDate(planData) {
    const trialEndDate = this.calculateTrialEndDate(planData);
    const isTrial = this.isInTrialPeriod(planData);
    
    if (isTrial && trialEndDate) {
      return trialEndDate;
    }

    return this.calculateExpiryDate(planData);
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(planData) {
    if (planData.plan === 'free') return 'active';
    
    const isTrial = this.isInTrialPeriod(planData);
    const isActive = this.isSubscriptionActive(planData);
    
    if (isTrial) return 'trial';
    if (isActive) return 'active';
    if (planData.cancelAtPeriodEnd) return 'cancel_at_period_end';
    
    return 'expired';
  }

  /**
   * Check if subscription is active
   */
  isSubscriptionActive(planData) {
    if (planData.plan === 'free') return true;
    
    const expiryDate = this.calculateExpiryDate(planData);
    if (!expiryDate) return false;
    
    return new Date() < expiryDate;
  }

  /**
   * Get days until a specific date
   */
  getDaysUntil(date) {
    if (!date) return 0;
    
    const now = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Update subscription plan
   */
  updateSubscription(updates) {
    const current = this.getCurrentSubscription();
    const updated = {
      ...current,
      ...updates,
      purchaseDate: updates.purchaseDate || new Date().toISOString(),
      metadata: {
        ...current.metadata,
        ...updates.metadata,
        lastUpdated: new Date().toISOString()
      }
    };

    try {
      localStorage.setItem('userPlan', JSON.stringify(updated));
      this.clearCache();
      this.notifyListeners('subscriptionUpdated', updated);
      
      toast.success(`Successfully updated to ${updated.plan} plan!`);
      return updated;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      toast.error('Failed to update subscription');
      return current;
    }
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(cancelAtPeriodEnd = true) {
    const current = this.getCurrentSubscription();
    
    if (current.plan === 'free') {
      toast.error('Cannot cancel free plan');
      return current;
    }

    const updated = {
      ...current,
      cancelAtPeriodEnd,
      metadata: {
        ...current.metadata,
        cancelledAt: new Date().toISOString(),
        cancelReason: 'user_requested'
      }
    };

    try {
      localStorage.setItem('userPlan', JSON.stringify(updated));
      this.clearCache();
      this.notifyListeners('subscriptionCancelled', updated);
      
      const message = cancelAtPeriodEnd 
        ? 'Subscription will be cancelled at the end of the billing period'
        : 'Subscription cancelled immediately';
        
      toast.success(message);
      return updated;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription');
      return current;
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  reactivateSubscription() {
    const current = this.getCurrentSubscription();
    
    const updated = {
      ...current,
      cancelAtPeriodEnd: false,
      metadata: {
        ...current.metadata,
        reactivatedAt: new Date().toISOString()
      }
    };

    try {
      localStorage.setItem('userPlan', JSON.stringify(updated));
      this.clearCache();
      this.notifyListeners('subscriptionReactivated', updated);
      
      toast.success('Subscription reactivated successfully!');
      return updated;
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      toast.error('Failed to reactivate subscription');
      return current;
    }
  }

  /**
   * Subscribe to subscription events
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Subscription listener error:', error);
      }
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cached data or fetch fresh
   */
  getCached(key, fetchFn) {
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    const fresh = fetchFn();
    this.cache.set(key, {
      data: fresh,
      timestamp: Date.now()
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
      case 'trips':
        return features.trips !== 'unlimited' && usage.trips.used >= features.trips;
      
      case 'photos':
        return features.photosPerTrip !== 'unlimited' && usage.photos.used >= features.photosPerTrip;
      
      case 'storage':
        return features.storageBytes !== Number.MAX_SAFE_INTEGER && 
               usage.storage.used >= features.storageBytes;
      
      default:
        return false;
    }
  }

  /**
   * Get upgrade recommendations
   */
  getUpgradeRecommendations() {
    const subscription = this.getCurrentSubscription();
    const usage = subscription.usage;
    const recommendations = [];

    // Only show recommendations if we have real usage data
    if (!usage || (usage.trips.used === 0 && usage.photos.used === 0 && usage.storage.used === 0)) {
      return recommendations;
    }

    // Check trip limit
    if (usage.trips.percentage > 80) {
      recommendations.push({
        type: 'trips',
        urgency: usage.trips.percentage > 95 ? 'high' : 'medium',
        message: `You've used ${Math.round(usage.trips.percentage)}% of your trip limit`,
        action: 'upgrade_plan'
      });
    }

    // Check photo limit
    if (usage.photos.percentage > 80) {
      recommendations.push({
        type: 'photos',
        urgency: usage.photos.percentage > 95 ? 'high' : 'medium',
        message: `You've used ${Math.round(usage.photos.percentage)}% of your photo limit`,
        action: 'upgrade_plan'
      });
    }

    // Check storage limit
    if (usage.storage.percentage > 80) {
      recommendations.push({
        type: 'storage',
        urgency: usage.storage.percentage > 95 ? 'high' : 'medium',
        message: `You've used ${Math.round(usage.storage.percentage)}% of your storage`,
        action: 'upgrade_plan'
      });
    }

    // Check trial expiry
    if (subscription.isTrial && subscription.trialDaysRemaining <= 3) {
      recommendations.push({
        type: 'trial',
        urgency: 'high',
        message: `Your trial expires in ${subscription.trialDaysRemaining} days`,
        action: 'subscribe'
      });
    }

    return recommendations;
  }

  /**
   * Debug current subscription state
   */
  debug() {
    const subscription = this.getCurrentSubscription();
    
    console.group('💳 Subscription Service Debug');
    console.log('Current subscription:', subscription);
    console.log('Usage breakdown:', subscription.usage);
    console.log('Billing history count:', subscription.billingHistory.length);
    console.log('Upgrade recommendations:', this.getUpgradeRecommendations());
    console.log('Cache size:', this.cache.size);
    console.log('Listeners count:', this.listeners.size);
    console.groupEnd();
  }
}

// Create singleton instance
const subscriptionService = new SubscriptionService();

export default subscriptionService;