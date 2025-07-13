// src/dashboard-area/features/settings/components/modals/DeleteAccountModal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { useEnhancedNavigation } from "@shared/hooks/useEnhancedNavigation";
import { DeleteAccountService } from "../../services/deleteAccountService";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

// Deleting Account Overlay Component
const DeletingAccountOverlay = React.memo(() => (
  <div className="fixed inset-0 bg-white/95 dark:bg-gray-900/95 z-50 flex items-center justify-center backdrop-blur-sm">
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
        </div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-red-300 border-t-red-600 rounded-2xl animate-spin"></div>
      </div>
      <div className="text-center">
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
          Deleting your account...
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Thank you for using Groupify
        </p>
      </div>
    </div>
  </div>
));

DeletingAccountOverlay.displayName = "DeletingAccountOverlay";

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const { smoothNavigate } = useEnhancedNavigation();
  const [step, setStep] = useState(1); // 1: Warning, 2: Final Confirmation
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionSummary, setDeletionSummary] = useState(null);
  const [error, setError] = useState("");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmText("");
      setError("");
      setIsDeleting(false);
      loadDeletionSummary();
    }
  }, [isOpen]);

  const loadDeletionSummary = async () => {
    if (!currentUser?.uid) return;

    try {
      const summary = await DeleteAccountService.getDeletionSummary(
        currentUser.uid
      );
      setDeletionSummary(summary);
    } catch (error) {
      console.error("Error loading deletion summary:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) {
      setError("No user authenticated");
      return;
    }

    try {
      // Start deletion process
      setIsDeleting(true);
      setError("");

      // Small delay to let the modal update
      setTimeout(async () => {
        try {
          console.log("🗑️ Starting account deletion process...");

          // Delete account
          await DeleteAccountService.deleteAccount(currentUser, "");

          // Log out user
          await logout();

          // Use smooth navigation to home page with logo animation
          smoothNavigate("/", {
            delay: 200,
            showLoader: true,
            replace: true,
          });

          // Optional: Show a goodbye message after navigation
          setTimeout(() => {
            // You could show a toast or message here if needed
            console.log("👋 Account deleted successfully. Goodbye!");
          }, 500);
        } catch (deleteError) {
          console.error("Account deletion failed:", deleteError);
          setError(
            deleteError.message || "Failed to delete account. Please try again."
          );
          setIsDeleting(false);
        }
      }, 150);
    } catch (error) {
      console.error("Error in delete account handler:", error);
      setError("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  // If we're deleting, show the custom overlay
  if (isDeleting) {
    return <DeletingAccountOverlay />;
  }

  const renderStep1 = () => (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Delete Your Account
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone
          </p>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
          What will be deleted:
        </h3>

        {deletionSummary ? (
          <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
            <li>• {deletionSummary.events} events (created or joined)</li>
            <li>• {deletionSummary.photos} photos uploaded</li>
            <li>• {deletionSummary.friends} friend connections</li>
            <li>• {deletionSummary.friendRequests} pending friend requests</li>
            {deletionSummary.settings && (
              <li>• Your settings and preferences</li>
            )}
            {deletionSummary.faceProfile && (
              <li>• Your face recognition profile</li>
            )}
            <li>• All storage files and data</li>
          </ul>
        ) : (
          <p className="text-sm text-red-700 dark:text-red-400">
            Loading deletion summary...
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => setStep(2)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Final Confirmation
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This is your last chance to cancel
          </p>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-3">
          Type "DELETE" to confirm:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="DELETE"
          disabled={isDeleting}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep(1)}
          disabled={isDeleting}
          className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleDeleteAccount}
          disabled={confirmText !== "DELETE" || isDeleting}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Delete My Account
        </button>
      </div>
    </>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            Step {step} of 2
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
