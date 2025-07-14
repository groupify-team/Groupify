import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { useEventContext } from "@shared/contexts/EventContext";
import usageSyncService from "@shared/services/UsageSyncService";
import subscriptionService from "@shared/services/subscriptionService";

const UsageContext = createContext();

export const UsageProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { events } = useEventContext();
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ synced: false, lastSync: null });

  const refreshData = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      
      // Force sync with Firebase
      const syncResult = await usageSyncService.syncUsageWithFirebase(currentUser.uid);
      
      // Get updated subscription data
      const currentSubscription = subscriptionService.getCurrentSubscription();
      setSubscription(currentSubscription);
      setUsage(currentSubscription.usage);
      
      setSyncStatus({
        synced: true,
        lastSync: new Date().toISOString(),
        corrected: syncResult.corrected
      });
      
    } catch (error) {
      console.error("Failed to refresh usage data:", error);
      // Fallback to stored data
      const currentSubscription = subscriptionService.getCurrentSubscription();
      setSubscription(currentSubscription);
      setUsage(currentSubscription.usage);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  // Initialize and listen for changes
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    refreshData();

    // Listen for subscription updates
    const unsubscribeSubscription = subscriptionService.subscribe((event) => {
      if (event === "usageUpdated" || event === "subscriptionUpdated") {
        const currentSubscription = subscriptionService.getCurrentSubscription();
        setSubscription(currentSubscription);
        setUsage(currentSubscription.usage);
      }
    });

    // Listen for sync updates
    const unsubscribeSync = usageSyncService.subscribe((event, data) => {
      if (event === "usageSynced") {
        setSyncStatus({
          synced: true,
          lastSync: new Date().toISOString(),
          corrected: data.corrected
        });
        refreshData();
      }
    });

    return () => {
      unsubscribeSubscription();
      unsubscribeSync();
    };
  }, [currentUser?.uid, refreshData]);

  // Auto-sync when events change
  useEffect(() => {
    if (events.length > 0 && currentUser?.uid) {
      // Debounced sync when events change
      const timer = setTimeout(() => {
        usageSyncService.syncUsageWithFirebase(currentUser.uid).catch(console.warn);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [events.length, currentUser?.uid]);

  const getEventCount = useCallback(() => {
    return events.length; // Use real-time count from EventContext
  }, [events.length]);

  const getUsageWithRealTimeEvents = useCallback(() => {
    if (!usage || !subscription) return null;

    const limits = {
      free: { events: 5 },
      premium: { events: 50 },
      pro: { events: "unlimited" },
      enterprise: { events: "unlimited" }
    };

    const planLimits = limits[subscription.plan] || limits.free;
    const realTimeEventCount = getEventCount();

    return {
      ...usage,
      events: {
        used: realTimeEventCount,
        limit: planLimits.events,
        percentage: planLimits.events === "unlimited" 
          ? 0 
          : Math.round((realTimeEventCount / planLimits.events) * 100),
        remaining: planLimits.events === "unlimited" 
          ? "unlimited" 
          : Math.max(0, planLimits.events - realTimeEventCount),
      }
    };
  }, [usage, subscription, getEventCount]);

  const contextValue = {
    usage: getUsageWithRealTimeEvents(),
    subscription,
    loading,
    syncStatus,
    refreshData,
    getEventCount,
    // Helper functions
    canCreateEvent: useCallback(() => {
      if (!subscription) return false;
      const eventCount = getEventCount();
      const limits = {
        free: 5,
        premium: 50,
        pro: "unlimited",
        enterprise: "unlimited"
      };
      const limit = limits[subscription.plan] || limits.free;
      return limit === "unlimited" || eventCount < limit;
    }, [subscription, getEventCount]),
    
    getEventLimitInfo: useCallback(() => {
      if (!subscription) return null;
      const eventCount = getEventCount();
      const limits = {
        free: 5,
        premium: 50,
        pro: "unlimited",
        enterprise: "unlimited"
      };
      const limit = limits[subscription.plan] || limits.free;
      return {
        used: eventCount,
        limit,
        remaining: limit === "unlimited" ? "unlimited" : Math.max(0, limit - eventCount),
        percentage: limit === "unlimited" ? 0 : Math.round((eventCount / limit) * 100)
      };
    }, [subscription, getEventCount])
  };

  return (
    <UsageContext.Provider value={contextValue}>
      {children}
    </UsageContext.Provider>
  );
};

export const useUsage = () => {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error("useUsage must be used within a UsageProvider");
  }
  return context;
};

export default UsageContext;
