// Re-export the useAuth hook from AuthContext
export { useAuth } from "../contexts/AuthContext";

// Additional auth utilities
export const useAuthHelpers = () => {
  const { currentUser } = useAuth();

  const isAuthenticated = !!currentUser;
  const isEmailVerified = currentUser?.emailVerified || false;
  const userDisplayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const userEmail = currentUser?.email || '';

  return {
    isAuthenticated,
    isEmailVerified,
    userDisplayName,
    userEmail,
    currentUser
  };
};