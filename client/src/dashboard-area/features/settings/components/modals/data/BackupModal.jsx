// src/dashboard-area/features/settings/components/modals/data/BackupModal.jsx
import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const BackupModal = ({ 
  isOpen, 
  onClose, 
  exportLoading, 
  onCreateBackup 
}) => {
  if (!isOpen) return null;

  const handleCreateBackup = async () => {
    try {
      await onCreateBackup();
      onClose();
    } catch (error) {
      console.error("Backup error:", error);
      // Modal stays open on error so user can retry
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Backup
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Create a complete backup of your Groupify account data including
          metadata and integrity verification.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            🔒 What's included:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• All your trips and photos</li>
            <li>• Friends and settings data</li>
            <li>• Face recognition profile</li>
            <li>• Backup verification data</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={exportLoading}
            className="flex-1 flex items-center justify-center gap-2 p-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {exportLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Create Backup</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={exportLoading}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupModal;