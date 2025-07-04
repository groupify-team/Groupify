// SettingsSection.jsx - Complete Settings management section with EditProfileModal
import React, { useState } from "react";
import {
  BellIcon,
  CameraIcon,
  SparklesIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../auth-area/contexts/AuthContext";
import { useDashboardLayout } from "../../hooks/useDashboardLayout";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useDashboardNavigation } from "../../hooks/useDashboardNavigation";
import { useSettings } from "../../features/settings/hooks/useSettings";
import { useExportBackup } from "../../hooks/useExportBackup";
import SubscriptionCard from "../widgets/SubscriptionCard";
import FaceProfileCard from "../widgets/FaceProfileCard";
import QuickStatsCard from "../widgets/QuickStatsCard";
import FaceProfileModal from "../../features/face-recognition/components/FaceProfileModal";
import FaceProfileManageModal from "../../features/face-recognition/components/FaceProfileManageModal";
import DeleteAccountModal from "../modals/DeleteAccountModal";
import EditProfileModal from "../../features/settings/components/EditProfileModal"; // New import
import {
  NOTIFICATION_SETTINGS,
  PRIVACY_SETTINGS,
} from "../../utils/dashboardConstants.jsx";

const SettingsSection = () => {
  const { currentUser } = useAuth();
  const { settings, toggleSetting, loading: settingsLoading } = useSettings();
  const {
    loading: exportLoading,
    error: exportError,
    success: exportSuccess,
    exportData,
    createBackup,
    exportCSV,
  } = useExportBackup();

  // Local state for modals
  const [showFaceProfileModal, setShowFaceProfileModal] = useState(false);
  const [showFaceProfileManageModal, setShowFaceProfileManageModal] =
    useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showBillingHistoryModal, setShowBillingHistoryModal] = useState(false);
  const [showCancelPlanModal, setShowCancelPlanModal] = useState(false);

  const {
    layout: { isMobile },
  } = useDashboardLayout();

  const {
    userData,
    trips,
    friends,
    hasProfile,
    profilePhotos,
    isLoadingProfile,
    loadDashboardData: refreshData,
    loadFaceProfile,
  } = useDashboardData();

  // Safe navigation hook usage with fallback
  let navigationActions = {};
  try {
    navigationActions = useDashboardNavigation();
  } catch (e) {
    navigationActions = {
      pages: {
        toPricing: () => (window.location.href = "/pricing"),
        toBilling: () => (window.location.href = "/billing"),
      },
    };
  }

  const toPricing = navigationActions?.pages?.toPricing || (() => {});
  const toBilling = navigationActions?.pages?.toBilling || (() => {});

  // Check if face recognition is enabled
  const faceRecognitionEnabled = settings.privacy?.faceRecognition ?? false;

  // Handle face profile creation success
  const handleFaceProfileCreated = async (success) => {
    if (success) {
      setShowFaceProfileModal(false);

      // Force refresh of face profile data to update UI immediately
      try {
        if (loadFaceProfile) {
          loadFaceProfile();
        }

        if (refreshData) {
          await refreshData();
        } else {
        }
      } catch (error) {
        console.error("❌ Error refreshing data:", error);
      }
    } else {
    }
  };

  // Handle face profile updates from manage modal
  const handleFaceProfileUpdated = async () => {
    try {
      if (loadFaceProfile) {
        loadFaceProfile();
      }

      if (refreshData) {
        await refreshData();
      }
    } catch (error) {
      console.error("❌ Error refreshing data after profile update:", error);
    }
  };

  // Check face recognition setting before allowing setup
  const handleOpenFaceProfileModal = () => {
    if (!faceRecognitionEnabled) {
      alert("Please enable Face Recognition in Privacy Settings first.");
      return;
    }

    setShowFaceProfileModal(true);
  };

  // Check face recognition setting before allowing management
  const handleOpenFaceProfileManageModal = () => {
    if (!faceRecognitionEnabled) {
      alert("Please enable Face Recognition in Privacy Settings first.");
      return;
    }

    setShowFaceProfileManageModal(true);
  };

  // Modal handlers - FIXED: Single definition for each
  const openEditProfileModal = () => setShowEditProfileModal(true);
  const closeEditProfileModal = () => setShowEditProfileModal(false);
  const openDeleteAccountModal = () => setShowDeleteAccountModal(true);
  const closeDeleteAccountModal = () => setShowDeleteAccountModal(false);
  const openUsageModal = () => setShowUsageModal(true);
  const openBillingHistoryModal = () => setShowBillingHistoryModal(true);
  const openCancelPlanModal = () => setShowCancelPlanModal(true);

  // Export/Backup handlers - FIXED: Proper async handling
  const handleExportData = async () => {
    try {
      await exportData();
      setShowExportModal(false);
    } catch (error) {
      console.error("Export error:", error);
      // Modal stays open on error so user can retry
    }
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup();
      setShowBackupModal(false);
    } catch (error) {
      console.error("Backup error:", error);
      // Modal stays open on error so user can retry
    }
  };

  const handleExportCSV = async (dataType) => {
    try {
      await exportCSV(dataType);
      setShowExportModal(false);
    } catch (error) {
      console.error("CSV export error:", error);
      // Modal stays open on error so user can retry
    }
  };

  // Handle profile edit completion with data refresh
  const handleProfileEditComplete = async () => {
    // Refresh dashboard data to reflect profile changes
    try {
      if (refreshData) {
        await refreshData();
      }
    } catch (error) {
      console.error("❌ Error refreshing data after profile edit:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Settings */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
          <UserCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            Account Information
          </h2>
        </div>

        {/* Profile Section */}
        <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4 sm:gap-6">
            {/* Profile Image */}
            <div className="relative flex-shrink-0 group">
              <div className="relative">
                <img
                  src={
                    userData?.photoURL ||
                    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                  }
                  alt="Profile"
                  className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 cursor-pointer"
                  onClick={openEditProfileModal} // Added click handler to open edit modal
                />

                {/* Interactive overlay on hover */}
                <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                </div>

                {/* Online status indicator */}
                <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-green-500 border-3 sm:border-4 border-white dark:border-gray-800 rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
              <div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white truncate">
                  {userData?.displayName || currentUser?.displayName || "User"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg mt-1 break-all sm:break-normal">
                  {userData?.email || currentUser?.email}
                </p>
              </div>

              {/* Edit Profile Button */}
              <button
                onClick={openEditProfileModal}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 border border-white/20"
              >
                <UserCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Notifications */}
            <div
              className="space-y-3 sm:space-y-4"
              data-section="notifications"
            >
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                  <BellIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-white">
                  Notifications
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Choose which notifications you'd like to receive
              </p>

              <div className="space-y-2 sm:space-y-3">
                {NOTIFICATION_SETTINGS.map((item) => {
                  // Check if setting should be disabled
                  const isDisabled =
                    item.id !== "emailNotifications" &&
                    !settings.notifications?.emailNotifications;

                  return (
                    <div key={item.id} className="group">
                      <label
                        className={`flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 bg-white/60 dark:bg-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-600/30 ${
                          isDisabled ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1">
                          {item.icon}
                          <div>
                            <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors block">
                              {item.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {item.description}
                            </span>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={
                              settings.notifications?.[item.id] ??
                              item.defaultChecked
                            }
                            onChange={() =>
                              toggleSetting("notifications", item.id)
                            }
                            disabled={settingsLoading || isDisabled}
                          />
                          <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 transition-all duration-300 shadow-inner"></div>
                          <div className="absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-5 sm:peer-checked:translate-x-5 transition-transform duration-300"></div>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Privacy */}
            <div className="space-y-3 sm:space-y-4" data-section="privacy">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-white">
                  Privacy Settings
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Control your privacy and data sharing preferences
              </p>

              <div className="space-y-2 sm:space-y-3">
                {PRIVACY_SETTINGS.map((item) => (
                  <div key={item.id} className="group">
                    <label className="flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 bg-white/60 dark:bg-gray-700/40 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/60 transition-all duration-200 cursor-pointer border border-transparent hover:border-green-200 dark:hover:border-green-600/30">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1">
                        {item.icon}
                        <div>
                          <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors block">
                            {item.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={
                            settings.privacy?.[item.id] ?? item.defaultChecked
                          }
                          onChange={() => toggleSetting("privacy", item.id)}
                          disabled={settingsLoading}
                        />
                        <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-600 transition-all duration-300 shadow-inner"></div>
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-5 sm:peer-checked:translate-x-5 transition-transform duration-300"></div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Face Profile Management with Privacy Check */}
      {faceRecognitionEnabled ? (
        <FaceProfileCard
          hasProfile={hasProfile}
          profilePhotos={profilePhotos}
          isLoading={isLoadingProfile}
          onOpenSetup={handleOpenFaceProfileModal}
          onOpenManage={handleOpenFaceProfileManageModal}
        />
      ) : (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636 5.636 18.364"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Face Recognition Disabled
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Enable face recognition in Privacy Settings to set up your face
              profile and get tagged in photos.
            </p>
            <button
              onClick={() => {
                // Scroll to privacy settings
                const privacySection = document.querySelector(
                  '[data-section="privacy"]'
                );
                if (privacySection) {
                  privacySection.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Enable Face Recognition
            </button>
          </div>
        </div>
      )}

      {/* Subscription & Billing */}
      <SubscriptionCard
        onNavigateToPricing={toPricing}
        onNavigateToBilling={toBilling}
        onOpenUsage={openUsageModal}
        onOpenBillingHistory={openBillingHistoryModal}
        onOpenCancelPlan={openCancelPlanModal}
      />

      {/* Data & Storage */}
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
              onClick={() => setShowExportModal(true)}
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
              onClick={() => setShowBackupModal(true)}
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
            onClick={openDeleteAccountModal}
            className="w-full flex items-center justify-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-800 dark:text-red-400 rounded-lg font-medium transition-colors text-sm"
          >
            <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center">
              <TrashIcon className="w-3 h-3 text-white" />
            </div>
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export Your Data
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Choose what type of data you'd like to export from your Groupify
              account.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleExportData}
                disabled={exportLoading}
                className="w-full flex items-center justify-center gap-3 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <span>📦</span>
                <span>Complete Data Export (JSON)</span>
              </button>

              <button
                onClick={() => handleExportCSV("trips")}
                disabled={exportLoading}
                className="w-full flex items-center justify-center gap-3 p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <span>🗺️</span>
                <span>Trips Data (CSV)</span>
              </button>

              <button
                onClick={() => handleExportCSV("photos")}
                disabled={exportLoading}
                className="w-full flex items-center justify-center gap-3 p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <span>📸</span>
                <span>Photos Data (CSV)</span>
              </button>

              <button
                onClick={() => handleExportCSV("friends")}
                disabled={exportLoading}
                className="w-full flex items-center justify-center gap-3 p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <span>👥</span>
                <span>Friends Data (CSV)</span>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Backup
            </h3>
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
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <span>💾</span>
                <span>Create Backup</span>
              </button>

              <button
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Face Profile Modal */}
      {showFaceProfileModal && (
        <FaceProfileModal
          isOpen={showFaceProfileModal}
          onClose={() => {
            setShowFaceProfileModal(false);
          }}
          onProfileCreated={handleFaceProfileCreated}
        />
      )}

      {/* Face Profile Manage Modal */}
      {showFaceProfileManageModal && (
        <FaceProfileManageModal
          isOpen={showFaceProfileManageModal}
          onClose={() => {
            setShowFaceProfileManageModal(false);
          }}
          onProfileUpdated={handleFaceProfileUpdated}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <EditProfileModal
          isOpen={showEditProfileModal}
          onClose={() => {
            closeEditProfileModal();
            handleProfileEditComplete(); // Refresh data when modal closes
          }}
        />
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <DeleteAccountModal
          isOpen={showDeleteAccountModal}
          onClose={closeDeleteAccountModal}
        />
      )}
    </div>
  );
};

export default SettingsSection;
