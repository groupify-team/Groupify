import { useState, useEffect, useCallback } from "react";
import { PresenceService } from "@shared/services/presence/PresenceService";

/**
 * Hook for subscribing to other users' presence status
 */
export const useUserPresence = (userId) => {
  const [presence, setPresence] = useState({
    userId,
    isOnline: false,
    status: "offline",
    lastSeen: null,
    updatedAt: null,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setPresence((prev) => ({ ...prev, loading: false }));
      return;
    }

    console.log(`👁️ Setting up presence subscription for: ${userId}`);

    // Subscribe to real-time presence updates
    const unsubscribe = PresenceService.subscribeToUserPresence(
      userId,
      (presenceData) => {
        console.log(`📡 Presence update for ${userId}:`, presenceData);
        setPresence({
          ...presenceData,
          loading: false,
        });
      }
    );

    // Cleanup subscription
    return () => {
      console.log(`🧹 Cleaning up presence subscription for: ${userId}`);
      PresenceService.unsubscribeFromUserPresence(userId);
    };
  }, [userId]);

  return presence;
};

/**
 * Hook for getting presence of multiple users
 */
export const useMultipleUserPresence = (userIds = []) => {
  const [presenceMap, setPresenceMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Memoize the fetch function
  const fetchPresence = useCallback(async () => {
    if (!userIds.length) {
      setPresenceMap({});
      setLoading(false);
      return;
    }

    try {
      console.log(`👥 Fetching presence for ${userIds.length} users`);
      setLoading(true);

      const presence = await PresenceService.getMultipleUserPresence(userIds);
      setPresenceMap(presence);
    } catch (error) {
      console.error("Error fetching multiple user presence:", error);

      // Set all users as offline on error
      const offlineMap = {};
      userIds.forEach((id) => {
        offlineMap[id] = {
          userId: id,
          isOnline: false,
          status: "offline",
          lastSeen: null,
          updatedAt: null,
        };
      });
      setPresenceMap(offlineMap);
    } finally {
      setLoading(false);
    }
  }, [userIds]);

  useEffect(() => {
    fetchPresence();
  }, [fetchPresence]);

  // Refresh function for manual updates
  const refresh = useCallback(() => {
    fetchPresence();
  }, [fetchPresence]);

  return {
    presenceMap,
    loading,
    refresh,
    getUserPresence: (userId) =>
      presenceMap[userId] || {
        userId,
        isOnline: false,
        status: "offline",
        lastSeen: null,
        updatedAt: null,
      },
  };
};
