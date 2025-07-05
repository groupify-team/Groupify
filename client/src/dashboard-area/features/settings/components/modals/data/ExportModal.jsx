// src/dashboard-area/features/settings/components/modals/data/ExportModal.jsx
import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const ExportModal = ({ 
  isOpen, 
  onClose, 
  exportLoading, 
  onExportData, 
  onExportCSV 
}) => {
  if (!isOpen) return null;

  const handleExportData = async () => {
    try {
      await onExportData();
      onClose();
    } catch (error) {
      console.error("Export error:", error);
      // Modal stays open on error so user can retry
    }
  };

  const handleExportCSV = async (dataType) => {
    try {
      await onExportCSV(dataType);
      onClose();
    } catch (error) {
      console.error("CSV export error:", error);
      // Modal stays open on error so user can retry
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Export Your Data
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Choose what type of data you'd like to export from your Groupify
          account.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleExportData}
            disabled={exportLoading}
            className="w-full flex items-center justify-center gap-3 p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <span>📦</span>
            <span>Complete Data Export (JSON)</span>
          </button>

          <button
            onClick={() => handleExportCSV("trips")}
            disabled={exportLoading}
            className="w-full flex items-center justify-center gap-3 p-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <span>🗺️</span>
            <span>Trips Data (CSV)</span>
          </button>

          <button
            onClick={() => handleExportCSV("photos")}
            disabled={exportLoading}
            className="w-full flex items-center justify-center gap-3 p-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <span>📸</span>
            <span>Photos Data (CSV)</span>
          </button>

          <button
            onClick={() => handleExportCSV("friends")}
            disabled={exportLoading}
            className="w-full flex items-center justify-center gap-3 p-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <span>👥</span>
            <span>Friends Data (CSV)</span>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
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

export default ExportModal;