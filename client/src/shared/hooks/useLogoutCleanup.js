/**
 * Custom hook to handle cleanup when user logs out
 * Use this in components that cache user-specific data
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@auth/hooks/useAuth";

export const useLogoutCleanup = (cleanupFn) => {
  const { currentUser } = useAuth();
  const previousUserRef = useRef(currentUser);

  useEffect(() => {
    const previousUser = previousUserRef.current;

    // If we had a user and now we don't (logout)
    if (previousUser && !currentUser) {
      if (typeof cleanupFn === "function") {
        cleanupFn();
      }
    }

    previousUserRef.current = currentUser;
  }, [currentUser, cleanupFn]);
};
