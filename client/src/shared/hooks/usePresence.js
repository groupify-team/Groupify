import { useEffect, useRef } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { PresenceService } from "@shared/services/presence/PresenceService";

/**
 * Hook for managing current user's presence
 * Automatically sets user online/offline based on app state
 */
export const usePresence = () => {
  const { user } = useAuth();
  const isSetupRef = useRef(false);
  const heartbeatRef = useRef(null);

  useEffect(() => {
    if (!user?.uid || isSetupRef.current) {
      return;
    }

    console.log(`🫀 Setting up presence for user: ${user.uid}`);
    isSetupRef.current = true;

    // Set user online when hook initializes
    const setOnline = async () => {
      try {
        await PresenceService.setUserOnline(user.uid, "online");
      } catch (error) {
        console.error("Failed to set user online:", error);
      }
    };

    // Set user offline
    const setOffline = async () => {
      try {
        await PresenceService.setUserOffline(user.uid);
      } catch (error) {
        console.error("Failed to set user offline:", error);
      }
    };

    // Set user away (when tab loses focus)
    const setAway = async () => {
      try {
        await PresenceService.updateUserStatus(user.uid, "away");
      } catch (error) {
        console.error("Failed to set user away:", error);
      }
    };

    // Initial setup - set user online
    setOnline();

    // Heartbeat to keep presence alive (every 4 minutes)
    heartbeatRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        PresenceService.setUserOnline(user.uid, "online");
      }
    }, 4 * 60 * 1000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setOnline();
      } else {
        setAway();
      }
    };

    // Handle window focus/blur
    const handleFocus = () => {
      setOnline();
    };

    const handleBlur = () => {
      setAway();
    };

    // Handle page unload (user closes tab/refreshes)
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline signal
      const presenceData = {
        userId: user.uid,
        isOnline: false,
        status: "offline",
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Try to send offline status
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `/api/presence/offline`, // We'll handle this on the backend if needed
          JSON.stringify(presenceData)
        );
      }

      // Also try the normal way (might not complete but worth trying)
      setOffline();
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup function
    return () => {
      console.log(`🧹 Cleaning up presence for user: ${user.uid}`);

      // Clear heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      // Remove event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Set user offline
      setOffline();

      isSetupRef.current = false;
    };
  }, [user?.uid]);

  // Return utility functions
  return {
    setOnline: () =>
      user?.uid && PresenceService.setUserOnline(user.uid, "online"),
    setAway: () =>
      user?.uid && PresenceService.updateUserStatus(user.uid, "away"),
    setBusy: () =>
      user?.uid && PresenceService.updateUserStatus(user.uid, "busy"),
    setOffline: () => user?.uid && PresenceService.setUserOffline(user.uid),
  };
};
