// DashboardLayout.jsx - OPTIMIZED VERSION with progressive loading
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@auth/hooks/useAuth";

import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useNavigate } from "react-router-dom";
import { useDashboardLayout } from "@dashboard/hooks/useDashboardLayout";
import { useDashboardModals } from "@dashboard/contexts/DashboardModalsContext";
import { useGlobalAccessibility } from "@shared/components/accessibility/hooks/useGlobalAccessibility";

// Import layout components
import DashboardSidebar from "@dashboard/components/layout/DashboardSidebar";
import DashboardHeader from "@dashboard/components/layout/DashboardHeader";
import MobileBottomNav from "@dashboard/components/layout/MobileBottomNav";
import AccessibilityModal from "@/shared/components/accessibility/AccessibilityModal";
import DashboardSkeleton from "./DashboardSkeleton"; // New skeleton component

// For now, disable modal components until proper imports are available
let AddFriendModal, UserProfileModal;

const DashboardLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { accessibilityModalProps, openAccessibilitySettings } =
    useGlobalAccessibility();
  const navigate = useNavigate();

  const {
    loading,
    friends,
    pendingRequests,
    showSuccessMessage,
    showErrorMessage,
    refreshFriends,
    removeFriend,
    removePendingRequest,
  } = useDashboardData();

  // Use new layout system and modals
  const layoutData = useDashboardLayout();
  const modalsData = useDashboardModals();

  // Local state for when new hooks aren't available
  const [localSidebarOpen, setLocalSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const [localIsMobile, setLocalIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLocalAddFriendModal, setShowLocalAddFriendModal] = useState(false);
  const [showLocalUserProfileModal, setShowLocalUserProfileModal] =
    useState(false);
  const [selectedLocalUser, setSelectedLocalUser] = useState(null);

  // Use new layout system or local state
  const sidebarOpen = layoutData?.layout?.sidebarOpen ?? localSidebarOpen;
  const isMobile = layoutData?.layout?.isMobile ?? localIsMobile;

  // Use new modals system or local state
  const showAddFriendModal =
    modalsData?.modals?.showAddFriendModal ?? showLocalAddFriendModal;
  const isUserProfileOpen =
    modalsData?.modals?.isUserProfileOpen ?? showLocalUserProfileModal;
  const selectedUserProfile =
    modalsData?.userProfile?.selectedUserProfile ?? selectedLocalUser;
  const preservedSearchInput =
    modalsData?.userProfile?.preservedSearchInput ?? "";
  const preservedFoundUser =
    modalsData?.userProfile?.preservedFoundUser ?? null;

  const closeAddFriendModal = useMemo(
    () =>
      modalsData?.addFriend?.close ?? (() => setShowLocalAddFriendModal(false)),
    [modalsData?.addFriend?.close, setShowLocalAddFriendModal]
  );

  const closeUserProfile = useMemo(
    () =>
      modalsData?.userProfileActions?.close ??
      (() => {
        setShowLocalUserProfileModal(false);
        setSelectedLocalUser(null);
      }),
    [
      modalsData?.userProfileActions?.close,
      setShowLocalUserProfileModal,
      setSelectedLocalUser,
    ]
  );
  const openUserProfile =
    modalsData?.userProfileActions?.open ??
    ((user) => {
      setSelectedLocalUser(user);
      setShowLocalUserProfileModal(true);
    });

  // Refs for click outside detection
  const logoutModalRef = useClickOutside(() => setShowLogoutModal(false));

  // Handle window resize (only for local state)
  useEffect(() => {
    if (layoutData) return; // Skip if using new layout system

    const handleResize = () => {
      const width = window.innerWidth;
      setLocalIsMobile(width < 768);

      // Auto-open sidebar on desktop, auto-close on mobile
      if (width >= 1024) {
        setLocalSidebarOpen(true);
      } else {
        setLocalSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [layoutData]);

  // Escape key support
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showLogoutModal) setShowLogoutModal(false);
        if (showAddFriendModal && closeAddFriendModal) closeAddFriendModal();
        if (isUserProfileOpen && closeUserProfile) closeUserProfile();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [
    showLogoutModal,
    showAddFriendModal,
    isUserProfileOpen,
    closeAddFriendModal,
    closeUserProfile,
  ]);

  // Handler functions
  const handleSettingsClick = () => {
    openAccessibilitySettings();
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleSidebarToggle = () => {
    if (layoutData?.sidebar?.toggle) {
      layoutData.sidebar.toggle();
    } else {
      setLocalSidebarOpen((prev) => !prev);
    }
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      closeLogoutModal();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("❌ Logout error:", error);
      showErrorMessage("Failed to logout. Please try again.");
    }
  };

  // Friend operation handlers
  const handleAddFriendDirect = async (targetUid) => {
    try {
      const { sendFriendRequest } = await import("@firebase-services/users");
      await sendFriendRequest(currentUser.uid, targetUid);
      showSuccessMessage("Friend request sent!");
      closeAddFriendModal();
    } catch (error) {
      console.error("Error sending friend request:", error);
      showErrorMessage("Failed to send friend request");
    }
  };

  const handleUserSelect = (uid) => {
    // Find user data and open profile modal
    const userData = friends.find((f) => f.uid === uid) || preservedFoundUser;
    if (userData) {
      openUserProfile(userData);
    }
  };

  const handleRemoveFriend = async (friendUid) => {
    try {
      const { removeFriend: removeFriendService } = await import(
        "@firebase-services/users"
      );
      await removeFriendService(currentUser.uid, friendUid);
      removeFriend(friendUid);
      await refreshFriends();
      showSuccessMessage("Friend removed");
      closeUserProfile();
    } catch (error) {
      console.error("Error removing friend:", error);
      showErrorMessage("Failed to remove friend");
    }
  };

  const handleCancelRequest = async (targetUid) => {
    try {
      const { cancelFriendRequest } = await import("@firebase-services/users");
      await cancelFriendRequest(currentUser.uid, targetUid);
      removePendingRequest(targetUid);
      showSuccessMessage("Friend request cancelled");
      closeUserProfile();
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      showErrorMessage("Failed to cancel friend request");
    }
  };

  // OPTIMIZED: Show layout immediately with skeleton loading instead of full-screen loader
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex w-full transition-colors duration-500">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border-r border-white/20 dark:border-gray-700/50 transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <DashboardSidebar
            sidebarOpen={sidebarOpen}
            onSidebarClose={() => {
              if (layoutData?.sidebar?.close) {
                layoutData.sidebar.close();
              } else {
                setLocalSidebarOpen(false);
              }
            }}
            onLogoutClick={handleLogoutClick}
          />
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => {
              if (layoutData?.sidebar?.close) {
                layoutData.sidebar.close();
              } else {
                setLocalSidebarOpen(false);
              }
            }}
          />
        )}

        {/* Main Content */}
        <div
          className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
          style={{
            marginLeft: !isMobile && sidebarOpen ? "256px" : "0px",
            paddingTop: "56px", // Height of the header
          }}
        >
          {/* Header */}
          <DashboardHeader
            onSettingsClick={handleSettingsClick}
            onLogoutClick={handleLogoutClick}
            onSidebarToggle={handleSidebarToggle}
            sidebarOpen={sidebarOpen}
            isMobile={isMobile}
          />

          {/* Main Content with Skeleton */}
          <main className="flex-1 overflow-y-auto">
            <div className="w-full px-2 sm:px-4 lg:px-8 max-w-full py-2 sm:py-4">
              <DashboardSkeleton />
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 z-40">
              <MobileBottomNav />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex w-full transition-colors duration-500">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border-r border-white/20 dark:border-gray-700/50 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <DashboardSidebar
          sidebarOpen={sidebarOpen}
          onSidebarClose={() => {
            if (layoutData?.sidebar?.close) {
              layoutData.sidebar.close();
            } else {
              setLocalSidebarOpen(false);
            }
          }}
          onLogoutClick={handleLogoutClick}
        />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => {
            if (layoutData?.sidebar?.close) {
              layoutData.sidebar.close();
            } else {
              setLocalSidebarOpen(false);
            }
          }}
        />
      )}

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          marginLeft: !isMobile && sidebarOpen ? "256px" : "0px",
          paddingTop: "56px", // Height of the header
        }}
      >
        {/* Header */}
        <DashboardHeader
          onSettingsClick={handleSettingsClick}
          onLogoutClick={handleLogoutClick}
          onSidebarToggle={handleSidebarToggle}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-2 sm:px-4 lg:px-8 max-w-full py-2 sm:py-4">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-40">
            <MobileBottomNav />
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* Add Friend Modal */}
      {showAddFriendModal && AddFriendModal && (
        <AddFriendModal
          isOpen={showAddFriendModal}
          onClose={closeAddFriendModal}
          onUserSelect={handleUserSelect}
          onAddFriendDirect={handleAddFriendDirect}
          preservedInput={preservedSearchInput}
          preservedUser={preservedFoundUser}
        />
      )}

      {/* User Profile Modal */}
      {isUserProfileOpen && selectedUserProfile && UserProfileModal && (
        <UserProfileModal
          isOpen={isUserProfileOpen}
          onClose={closeUserProfile}
          user={selectedUserProfile}
          currentUserId={currentUser?.uid}
          friends={friends.map((f) => f.uid)}
          pendingRequests={pendingRequests}
          onAddFriend={handleAddFriendDirect}
          onRemoveFriend={handleRemoveFriend}
          onCancelRequest={handleCancelRequest}
        />
      )}

      {/* Global Accessibility Modal */}
      <AccessibilityModal {...accessibilityModalProps} />

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={closeLogoutModal}
        >
          <div
            ref={logoutModalRef}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Confirm Logout
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to logout?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeLogoutModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
