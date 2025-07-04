// dashboard-area/hooks/useDeleteAccount.js
import { useState, useCallback } from "react";
import { useAuth } from "../../auth-area/contexts/AuthContext";
import { DeleteAccountService } from "../../shared/services/deleteAccountService";
import { useNavigate } from "react-router-dom";

export const useDeleteAccount = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletionSummary, setDeletionSummary] = useState(null);

  // Get summary of what will be deleted
  const getDeletionSummary = useCallback(async () => {
    if (!currentUser?.uid) return null;

    try {
      setLoading(true);
      setError(null);

      const summary = await DeleteAccountService.getDeletionSummary(
        currentUser.uid
      );
      setDeletionSummary(summary);
      return summary;
    } catch (err) {
      console.error("Error getting deletion summary:", err);
      setError(`Failed to load account data: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  // Delete account with password confirmation
  const deleteAccount = useCallback(
    async (password, confirmationText) => {
      if (!currentUser) {
        setError("No user authenticated");
        return false;
      }

      if (confirmationText !== "DELETE") {
        setError('Please type "DELETE" to confirm account deletion');
        return false;
      }

      if (!password) {
        setError("Password is required for account deletion");
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await DeleteAccountService.deleteAccount(
          currentUser,
          password
        );

        if (result.success) {
          // Log out user (this will redirect to login)
          await logout();

          // Navigate to a goodbye page or home
          navigate("/", {
            replace: true,
            state: {
              message:
                "Your account has been permanently deleted. Thank you for using Groupify!",
            },
          });

          return true;
        } else {
          throw new Error("Account deletion failed");
        }
      } catch (err) {
        console.error("❌ Account deletion failed:", err);

        // Handle specific error cases
        if (err.code === "auth/wrong-password") {
          setError("Incorrect password. Please try again.");
        } else if (err.code === "auth/requires-recent-login") {
          setError(
            "For security reasons, please log out and log back in, then try deleting your account again."
          );
        } else if (err.code === "auth/too-many-requests") {
          setError("Too many failed attempts. Please try again later.");
        } else {
          setError(`Failed to delete account: ${err.message}`);
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentUser, logout, navigate]
  );

  // Check if user needs reauthentication
  const needsReauthentication = useCallback(() => {
    if (!currentUser) return true;
    return DeleteAccountService.needsReauthentication(currentUser);
  }, [currentUser]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    deletionSummary,
    deleteAccount,
    getDeletionSummary,
    needsReauthentication,
    clearError,
  };
};
