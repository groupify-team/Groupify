import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@auth/hooks/useAuth";
import { usePresence } from "@shared/hooks/usePresence";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const presenceControls = usePresence();

  // DEBUG: Log user state changes
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("🔒 [PROTECTED ROUTE] State change:", {
        hasUser: !!currentUser,
        userId: currentUser?.uid,
        loading,
        location: location.pathname,
      });
    }
  }, [currentUser, loading, location.pathname]);

  // DEBUG: Log presence controls availability
  useEffect(() => {
    if (import.meta.env.DEV && currentUser?.uid) {
      console.log(
        "🫀 [PROTECTED ROUTE] Presence initialized for:",
        currentUser.uid
      );
      console.log(
        "🫀 [PROTECTED ROUTE] Available controls:",
        Object.keys(presenceControls)
      );
    }
  }, [currentUser?.uid, presenceControls]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-800 dark:text-white font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (import.meta.env.DEV) {
      console.log("🔒 [PROTECTED ROUTE] No user - redirecting to signin");
    }
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
