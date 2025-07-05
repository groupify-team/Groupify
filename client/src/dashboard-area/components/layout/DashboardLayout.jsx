// DashboardLayout.jsx - FIXED VERSION with proper layout for fixed header
import React, { useState, useEffect } from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import { useTheme } from "@shared/contexts/ThemeContext";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useNavigate } from "react-router-dom";

// Import layout components
import DashboardSidebar from "@dashboard/components/layout/DashboardSidebar";
import DashboardHeader from "@dashboard/components/layout/DashboardHeader";
import MobileBottomNav from "@dashboard/components/layout/MobileBottomNav";
import AccessibilityModal from "@/shared/components/accessibility/AccessibilityModal";

// Try to import new hooks and modals, fallback if they don't exist
let useDashboardLayout, useDashboardModals, AddFriendModal, UserProfileModal;

try {
  const layoutModule = require("@dashboard/hooks/useDashboardLayout");
  useDashboardLayout = layoutModule.useDashboardLayout;
} catch (e) {
  console.log("useDashboardLayout not available, using fallback");
}

try {
  const modalsModule = require("@dashboard/contexts/DashboardModalsContext");
  useDashboardModals = modalsModule.useDashboardModals;
} catch (e) {
  console.log("useDashboardModals not available, using fallback");
}

try {
  AddFriendModal =
    require("@dashboard/features/friends/components/AddFriendModal").default;
} catch (e) {
  console.log("AddFriendModal not available");
}

try {
  UserProfileModal =
    require("@dashboard/features/friends/components/UserProfileModal").default;
} catch (e) {
  console.log("UserProfileModal not available");
}

const DashboardLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  // Try to use new layout system, fallback to local state
  let layoutData = null;
  let modalsData = null;

  if (useDashboardLayout) {
    try {
      layoutData = useDashboardLayout();
    } catch (e) {
      console.log(
        "Error using useDashboardLayout, falling back to local state"
      );
    }
  }

  if (useDashboardModals) {
    try {
      modalsData = useDashboardModals();
    } catch (e) {
      console.log(
        "Error using useDashboardModals, falling back to local state"
      );
    }
  }

  // Local state for when new hooks aren't available
  const [localSidebarOpen, setLocalSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const [localIsMobile, setLocalIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLocalAddFriendModal, setShowLocalAddFriendModal] = useState(false);
  const [showLocalUserProfileModal, setShowLocalUserProfileModal] =
    useState(false);
  const [selectedLocalUser, setSelectedLocalUser] = useState(null);

  // Use new layout system or local state
  const sidebarOpen = layoutData?.layout?.sidebarOpen ?? localSidebarOpen;
  const isMobile = layoutData?.layout?.isMobile ?? localIsMobile;
  const setSidebarOpen = layoutData?.sidebar?.toggle ?? setLocalSidebarOpen;

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

  const closeAddFriendModal =
    modalsData?.addFriend?.close ?? (() => setShowLocalAddFriendModal(false));
  const closeUserProfile =
    modalsData?.userProfileActions?.close ??
    (() => {
      setShowLocalUserProfileModal(false);
      setSelectedLocalUser(null);
    });
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
        if (showSettingsModal) setShowSettingsModal(false);
        if (showAddFriendModal && closeAddFriendModal) closeAddFriendModal();
        if (isUserProfileOpen && closeUserProfile) closeUserProfile();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [
    showLogoutModal,
    showSettingsModal,
    showAddFriendModal,
    isUserProfileOpen,
    closeAddFriendModal,
    closeUserProfile,
  ]);

  // Handler functions
  const handleSettingsClick = () => {
    setShowSettingsModal(true);
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

  const closeSettingsModal = () => {
    setShowSettingsModal(false);
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
      console.error("? Logout error:", error);
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

  // Show loading screen while data is loading
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex flex-col items-center justify-center transition-all duration-500">
        <div className="text-center">
          {/* Site Logo */}
          <div className="relative mb-8">
            <img
              src="/groupifyLogo.png"
              alt="Groupify Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain animate-pulse drop-shadow-2xl mx-auto"
            />
            {/* Glow Effect around logo */}
            <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl blur-xl animate-pulse mx-auto"></div>
          </div>

          {/* Brand Name */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-8 animate-pulse leading-relaxed pb-2">
            Groupify
          </h1>

          {/* Loading Spinner */}
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-6"></div>

          {/* Loading Text */}
          <p className="text-xl text-gray-800 dark:text-white font-medium mb-2">
            Loading your dashboard...
          </p>

          {/* Subtitle */}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Preparing your personalized experience
          </p>
        </div>
      </div>
    );
  }

  return (
    // ?? FIXED: Added proper layout structure with fixed header spacing
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex w-full transition-colors duration-500">
      {/* ?? FIXED: Sidebar stays the same - already using 'fixed' positioning */}
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

      {/* ?? FIXED: Main Content with proper spacing for fixed header */}
      <div
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          marginLeft: !isMobile && sidebarOpen ? "256px" : "0px",
          // ?? CRITICAL: Add top padding to account for fixed header
          paddingTop: "56px", // Height of the header (14 * 4 = 56px for h-14)
        }}
      >
        {/* ?? FIXED: Header with proper fixed positioning */}
        <DashboardHeader
          onSettingsClick={handleSettingsClick}
          onLogoutClick={handleLogoutClick}
          onSidebarToggle={handleSidebarToggle}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />

        {/* ?? FIXED: Main Content with proper spacing */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-2 sm:px-4 lg:px-8 max-w-full py-2 sm:py-4">
            {children}
          </div>
        </main>

        {/* ?? FIXED: Mobile Bottom Navigation - already using 'fixed' positioning */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-40">
            <MobileBottomNav />
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* Add Friend Modal - Only render if component exists */}
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

      {/* User Profile Modal - Only render if component exists */}
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <AccessibilityModal
          isOpen={showSettingsModal}
          onClose={closeSettingsModal}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

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

      {/* Debug indicators for modal state */}
      {process.env.NODE_ENV === "development" && (
        <>
          {showAddFriendModal && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white p-2 rounded text-sm z-50">
              ? AddFriend Modal is rendering!
            </div>
          )}
          {isUserProfileOpen && (
            <div className="fixed bottom-16 right-4 bg-blue-500 text-white p-2 rounded text-sm z-50">
              ? UserProfile Modal is rendering!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardLayout;
