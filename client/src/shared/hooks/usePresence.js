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
  const { currentUser } = useAuth();
  const isSetupRef = useRef(false);
  const cleanupFunctionsRef = useRef([]);

  useEffect(() => {
    if (!currentUser?.uid || isSetupRef.current) {
      return;
    }

    isSetupRef.current = true;
    const setOnline = async () => {
      try {
        await PresenceService.setUserOnline(currentUser.uid, "online");
      } catch (error) {
        console.error("Failed to set user online:", error);
      }
    };

    const setOffline = async () => {
      try {
        await PresenceService.setUserOffline(currentUser.uid);
      } catch (error) {
        console.error("Failed to set user offline:", error);
      }
    };

    const setAway = async () => {
      try {
        await PresenceService.updateUserStatus(currentUser.uid, "away");
      } catch (error) {
        console.error("Failed to set user away:", error);
      }
    };
    setOnline();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setOnline();
      } else {
        setAway();
      }
    };

    const handleFocus = () => {
      setOnline();
    };

    const handleBlur = () => {
      setAway();
    };

    const handleBeforeUnload = (event) => {
      if (navigator.sendBeacon) {
        const presenceData = JSON.stringify({
          userId: currentUser.uid,
          action: "setOffline",
          timestamp: Date.now(),
        });
        navigator.sendBeacon("/api/presence/offline", presenceData);
      }
      setOffline();
    };
    const handleOnline = () => {
      setOnline();
    };

    const handleOffline = () => {
      setAway();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
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

    return () => {
      cleanupFunctionsRef.current.forEach((cleanup) => cleanup());
      cleanupFunctionsRef.current = [];
      setOffline();
      PresenceService.cleanup();
      isSetupRef.current = false;
    };
  }, [currentUser?.uid]);
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
