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

    const unsubscribe = PresenceService.subscribeToUserPresence(
      userId,
      (presenceData) => {
        setPresence({
          ...presenceData,
          loading: false,
        });
      }
    );

    return () => {
      PresenceService.unsubscribeFromUserPresence(userId);
    };
  }, [userId]);

  return presence;
};

export const useMultipleUserPresence = (userIds = []) => {
  const [presenceMap, setPresenceMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPresence = useCallback(async () => {
    if (!userIds.length) {
      setPresenceMap({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const presence = await PresenceService.getMultipleUserPresence(userIds);
      setPresenceMap(presence);
    } catch (error) {
      console.error("Error fetching multiple user presence:", error);
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
