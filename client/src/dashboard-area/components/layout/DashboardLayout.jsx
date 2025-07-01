// DashboardLayout.jsx - Main dashboard layout wrapper with modals
import React from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import { useDashboardLayout } from "@dashboard/hooks/useDashboardLayout";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import { useDashboardModals } from "@dashboard/contexts/DashboardModalsContext";
import DashboardSidebar from "@dashboard/components/layout/DashboardSidebar";
import DashboardHeader from "@dashboard/components/layout/DashboardHeader";
import MobileBottomNav from "@dashboard/components/layout/MobileBottomNav";

// Import modal components
import AddFriendModal from "@dashboard/features/friends/components/AddFriendModal";
import UserProfileModal from "@dashboard/features/friends/components/UserProfileModal";

const DashboardLayout = ({ children }) => {
  const { currentUser } = useAuth();
  
  const {
    layout,
    utils: { getLayoutClasses, shouldShowMobileNav, shouldShowDesktopSidebar },
  } = useDashboardLayout();

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

  const {
    modals: {
      showAddFriendModal,
      isUserProfileOpen,
    },
    addFriend: { close: closeAddFriendModal },
    userProfileActions: { open: openUserProfile, close: closeUserProfile },
    userProfile: { 
      selectedUserProfile,
      preservedSearchInput,
      preservedFoundUser,
    },
  } = useDashboardModals();

  const layoutClasses = getLayoutClasses();

  // Handler functions for friend operations
  const handleAddFriendDirect = async (targetUid) => {
    try {
      const { sendFriendRequest } = await import("@shared/services/firebase/users");
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
    const userData = friends.find(f => f.uid === uid) || preservedFoundUser;
    if (userData) {
      openUserProfile(userData, true); // true = from AddFriend modal
    }
  };

  const handleRemoveFriend = async (friendUid) => {
    try {
      const { removeFriend: removeFriendService } = await import("@shared/services/firebase/users");
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
      const { cancelFriendRequest } = await import("@shared/services/firebase/users");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex w-full transition-colors duration-500">
      {/* Desktop Sidebar */}
      <DashboardSidebar isVisible={shouldShowDesktopSidebar()} />

      {/* Sidebar Overlay for Mobile */}
      {layout.sidebarOpen && layout.isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => {
            // This will be handled by the parent component's sidebar toggle
          }}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${layoutClasses.main} overflow-hidden`}
      >
        {/* Header */}
        <DashboardHeader />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div
            className={`w-full px-2 sm:px-4 lg:px-8 max-w-full ${layoutClasses.content}`}
          >
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {shouldShowMobileNav() && <MobileBottomNav />}
      </div>

      {/* MODALS - Render all dashboard modals here */}
      
      {/* Add Friend Modal */}
      {showAddFriendModal && (
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
      {isUserProfileOpen && selectedUserProfile && (
        <UserProfileModal
          isOpen={isUserProfileOpen}
          onClose={closeUserProfile}
          user={selectedUserProfile}
          currentUserId={currentUser?.uid}
          friends={friends.map(f => f.uid)}
          pendingRequests={pendingRequests}
          onAddFriend={handleAddFriendDirect}
          onRemoveFriend={handleRemoveFriend}
          onCancelRequest={handleCancelRequest}
        />
      )}

      {/* Debug Modal State Indicator */}
      {showAddFriendModal && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-2 rounded text-sm z-50">
          ✅ AddFriend Modal is rendering!
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;