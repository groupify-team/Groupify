// src/dashboard-area/features/settings/components/modals/DeleteAccountModal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { DeleteAccountService } from "../../services/deleteAccountService";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
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
      const summary = await DeleteAccountService.getDeletionSummary(currentUser.uid);
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

    setIsDeleting(true);
    setError("");

    try {
      // For now, we'll skip password authentication and delete directly
      // You can add password authentication back later if needed
      await DeleteAccountService.deleteAccount(currentUser, "");

      // Log out and redirect
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Account deletion failed:", error);
      setError(error.message || "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

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
            {deletionSummary.settings && <li>• Your settings and preferences</li>}
            {deletionSummary.faceProfile && <li>• Your face recognition profile</li>}
            <li>• All storage files and data</li>
          </ul>
        ) : (
          <p className="text-sm text-red-700 dark:text-red-400">Loading deletion summary...</p>
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
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isDeleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Deleting...
            </>
          ) : (
            "Delete My Account"
          )}
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
            Step {step} of 3
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