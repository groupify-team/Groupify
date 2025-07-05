// src/dashboard-area/features/settings/components/sections/DataSection.jsx
import React from "react";
import { SparklesIcon, TrashIcon } from "@heroicons/react/24/outline";
import QuickStatsCard from "../widgets/QuickStatsCard";

const DataSection = ({
  trips,
  friends,
  profilePhotos,
  hasProfile,
  exportLoading,
  exportError,
  exportSuccess,
  onOpenExport,
  onOpenBackup,
  onOpenDeleteAccount,
}) => {
  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20 dark:border-gray-700/50">
      <div className="flex items-center justify-center gap-2 mb-4">
        <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Account Data
        </h2>
      </div>

      {/* Stats Grid */}
      <QuickStatsCard
        trips={trips}
        friends={friends}
        profilePhotos={profilePhotos}
        hasProfile={hasProfile}
      />

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">⚡</span>
          </div>
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
            Quick Actions
          </h3>
        </div>

        {/* Export/Backup Status Messages */}
        {exportError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-400">
              {exportError}
            </p>
          </div>
        )}

        {exportSuccess && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-400">
              {exportSuccess}
            </p>
          </div>
        )}

        {/* Mobile: 2x2 Grid Layout for Actions */}
        <div className="grid grid-cols-2 gap-2 mb-2 md:grid-cols-2">
          <button
            onClick={onOpenExport}
            disabled={exportLoading}
            className="flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-gray-800 dark:text-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Exporting...</span>
                <span className="sm:hidden">Export</span>
              </>
            ) : (
              <>
                <span>📤</span>
                <span className="hidden sm:inline">Export Data</span>
                <span className="sm:hidden">Export</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenBackup}
            disabled={exportLoading}
            className="flex items-center justify-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg font-medium text-blue-800 dark:text-blue-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Creating...</span>
                <span className="sm:hidden">Backup</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span className="hidden sm:inline">Backup</span>
                <span className="sm:hidden">Backup</span>
              </>
            )}
          </button>
        </div>

        {/* Delete Account Button - Full Width */}
        <button
          onClick={onOpenDeleteAccount}
          className="w-full flex items-center justify-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-800 dark:text-red-400 rounded-lg font-medium transition-colors text-sm"
        >
          <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center">
            <TrashIcon className="w-3 h-3 text-white" />
          </div>
          <span>Delete Account</span>
        </button>
      </div>
    </div>
  );
};

export default DataSection;