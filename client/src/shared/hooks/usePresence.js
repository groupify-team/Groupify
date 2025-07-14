// client/src/shared/hooks/usePresence.js
import { useEffect, useRef } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { PresenceService } from "@shared/services/presence/PresenceService";

/**
 * Hook for managing current user's presence
 * Automatically sets user online/offline based on app state
 * Handles page visibility, focus/blur, and cleanup
 */
export const usePresence = () => {
  const { currentUser } = useAuth(); // Updated to match your auth context
  const isSetupRef = useRef(false);
  const cleanupFunctionsRef = useRef([]);

  useEffect(() => {
    if (!currentUser?.uid || isSetupRef.current) {
      return;
    }

    console.log(`🫀 Setting up presence for user: ${currentUser.uid}`);
    isSetupRef.current = true;

    // Helper functions
    const setOnline = async () => {
      try {
        await PresenceService.setUserOnline(currentUser.uid, "online");
        console.log(`✅ User ${currentUser.uid} set online`);
      } catch (error) {
        console.error("Failed to set user online:", error);
      }
    };

    const setOffline = async () => {
      try {
        await PresenceService.setUserOffline(currentUser.uid);
        console.log(`✅ User ${currentUser.uid} set offline`);
      } catch (error) {
        console.error("Failed to set user offline:", error);
      }
    };

    const setAway = async () => {
      try {
        await PresenceService.updateUserStatus(currentUser.uid, "away");
        console.log(`✅ User ${currentUser.uid} set away`);
      } catch (error) {
        console.error("Failed to set user away:", error);
      }
    };

    // Initial setup - set user online
    setOnline();

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log(`👁️ Tab visible - setting user online`);
        setOnline();
      } else {
        console.log(`👁️ Tab hidden - setting user away`);
        setAway();
      }
    };

    // Handle window focus/blur
    const handleFocus = () => {
      console.log(`🎯 Window focused - setting user online`);
      setOnline();
    };

    const handleBlur = () => {
      console.log(`🎯 Window blurred - setting user away`);
      setAway();
    };

    // Handle page unload (user closes tab/refreshes)
    const handleBeforeUnload = (event) => {
      console.log(`🚪 Page unloading - setting user offline`);

      // For modern browsers, use sendBeacon for reliable offline signal
      if (navigator.sendBeacon) {
        const presenceData = JSON.stringify({
          userId: currentUser.uid,
          action: "setOffline",
          timestamp: Date.now(),
        });

        // Note: You'd need a backend endpoint to handle this
        // For now, we'll just try the normal Firebase call
        navigator.sendBeacon("/api/presence/offline", presenceData);
      }

      // Also try the normal way (might not complete but worth trying)
      setOffline();
    };

    // Handle online/offline network status
    const handleOnline = () => {
      console.log(`🌐 Network online - setting user online`);
      setOnline();
    };

    const handleOffline = () => {
      console.log(`🌐 Network offline - setting user away`);
      setAway();
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Store cleanup functions
    cleanupFunctionsRef.current = [
      () =>
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        ),
      () => window.removeEventListener("focus", handleFocus),
      () => window.removeEventListener("blur", handleBlur),
      () => window.removeEventListener("beforeunload", handleBeforeUnload),
      () => window.removeEventListener("online", handleOnline),
      () => window.removeEventListener("offline", handleOffline),
    ];

    // Cleanup function
    return () => {
      console.log(`🧹 Cleaning up presence for user: ${currentUser.uid}`);

      // Remove event listeners
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
      cleanupFunctionsRef.current = [];

      // Set user offline
      setOffline();

      // Clean up PresenceService
      PresenceService.cleanup();

      isSetupRef.current = false;
    };
  }, [currentUser?.uid]);

  // Return utility functions for manual control
  return {
    setOnline: () =>
      currentUser?.uid &&
      PresenceService.setUserOnline(currentUser.uid, "online"),
    setAway: () =>
      currentUser?.uid &&
      PresenceService.updateUserStatus(currentUser.uid, "away"),
    setBusy: () =>
      currentUser?.uid &&
      PresenceService.updateUserStatus(currentUser.uid, "busy"),
    setOffline: () =>
      currentUser?.uid && PresenceService.setUserOffline(currentUser.uid),
    getCurrentStatus: () =>
      currentUser?.uid
        ? PresenceService.getUserPresence(currentUser.uid)
        : null,
  };
};
