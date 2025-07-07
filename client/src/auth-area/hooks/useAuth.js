import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Additional auth utilities
export const useAuthHelpers = () => {
  const { currentUser } = useAuth();

  const isAuthenticated = !!currentUser;
  const isEmailVerified = currentUser?.emailVerified || false;
  const userDisplayName =
    currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";
  const userEmail = currentUser?.email || "";

  return {
    isAuthenticated,
    isEmailVerified,
    userDisplayName,
    userEmail,
    currentUser,
  };
};
