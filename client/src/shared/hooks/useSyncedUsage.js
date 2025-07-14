import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { useEventContext } from "@shared/contexts/EventContext";
import usageSyncService from "@shared/services/UsageSyncService";
import subscriptionService from "@shared/services/subscriptionService";

export const useSyncedUsage = () => {
  const { currentUser } = useAuth();
  const { events } = useEventContext();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ synced: false, lastSync: null });

  const refreshUsage = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      
      // Force sync with Firebase
      const syncResult = await usageSyncService.syncUsageWithFirebase(currentUser.uid);
      
      // Get updated subscription data
      const subscription = subscriptionService.getCurrentSubscription();
      setUsage(subscription.usage);
      
      setSyncStatus({
        synced: true,
        lastSync: new Date().toISOString(),
        corrected: syncResult.corrected
      });
      
    } catch (error) {
      console.error("Failed to refresh usage:", error);
      // Fallback to stored data
      const subscription = subscriptionService.getCurrentSubscription();
      setUsage(subscription.usage);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  // Listen for real-time changes
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    refreshUsage();

    // Listen for subscription updates
    const unsubscribeSubscription = subscriptionService.subscribe((event) => {
      if (event === "usageUpdated") {
        const subscription = subscriptionService.getCurrentSubscription();
        setUsage(subscription.usage);
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
        refreshUsage();
      }
    });

    return () => {
      unsubscribeSubscription();
      unsubscribeSync();
    };
  }, [currentUser?.uid, refreshUsage]);

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
    if (!usage) return null;

    // Override events count with real-time data
    return {
      ...usage,
      events: {
        ...usage.events,
        used: getEventCount(), // Use real-time count
      }
    };
  }, [usage, getEventCount]);

  return {
    usage: getUsageWithRealTimeEvents(),
    loading,
    syncStatus,
    refreshUsage,
    getEventCount,
  };
};

export default useSyncedUsage;
