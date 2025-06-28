// FriendsSection.jsx - Friends management section
import React from "react";
import {
  BellIcon,
  CheckCircleIcon,
  PlusIcon,
  UserGroupIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@auth/contexts/AuthContext";
import { useDashboardLayout } from "@dashboard/hooks/useDashboardLayout";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import { useDashboardModals } from "@dashboard/hooks/useDashboardModals";
import TabSwitcher from "@dashboard/components/ui/TabSwitcher";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
} from "@shared/services/firebase/users";

const FriendsSection = () => {
  const { currentUser } = useAuth();

  const {
    layout: { isMobile },
    tabs: { friendsActiveTab },
    tabActions: { switchFriendsTab },
    desktop: { showDesktopRequests, desktopRequestsExpanded },
    desktopActions: { toggleDesktopRequests, toggleDesktopRequestsVisibility },
  } = useDashboardLayout();

  const {
    friends,
    pendingRequests,
    refreshFriends,
    removePendingRequest,
    addFriend,
    showSuccessMessage,
    showErrorMessage,
  } = useDashboardData();

  const {
    addFriend: { open: openAddFriendModal },
    userProfileActions: { open: openUserProfile },
  } = useDashboardModals();

  const handleAcceptFriendRequest = async (fromUid) => {
    try {
      await acceptFriendRequest(currentUser.uid, fromUid);
      removePendingRequest(fromUid);

      // Refresh friends list to include the new friend
      const updatedFriends = await getFriends(currentUser.uid);
      // Update friends list through the data hook
      // This would typically be handled by the real-time listener
      await refreshFriends();

      showSuccessMessage("Friend request accepted");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      showErrorMessage("Failed to accept friend request");
    }
  };

  const handleRejectFriendRequest = async (senderUid) => {
    try {
      await rejectFriendRequest(currentUser.uid, senderUid);
      removePendingRequest(senderUid);
      showSuccessMessage("Friend request declined");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      showErrorMessage("Failed to decline friend request");
    }
  };

  const handleOpenUserProfile = (uid) => {
    openUserProfile({ uid }, false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1
            className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white"
            style={{ fontSize: window.innerWidth <= 320 ? "0.85rem" : "" }}
          >
            My Friends
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1">
            Connect and share memories with friends
          </p>
        </div>

        {/* Add Friend Button - only show when on friends tab */}
        {friendsActiveTab === "friends" && (
          <button
            onClick={openAddFriendModal}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-1 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base whitespace-nowrap flex-shrink-0"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Add Friend</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      {isMobile && (
        <div className="mb-6">
          <TabSwitcher
            activeTab={friendsActiveTab}
            onTabChange={switchFriendsTab}
            tabs={[
              {
                id: "friends",
                label: "Friends",
                icon: UserGroupIcon,
                badge: friends.length,
                badgeColor: "indigo",
              },
              {
                id: "requests",
                label: "Requests",
                icon: BellIcon,
                badge: pendingRequests.length,
                badgeColor: "red",
              },
            ]}
          />
        </div>
      )}

      {/* Desktop Friend Requests Section */}
      {!isMobile && showDesktopRequests && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <UserGroupIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Friend Requests
              {pendingRequests.length > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDesktopRequests}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
              >
                {desktopRequestsExpanded ? (
                  <ChevronDownIcon className="w-5 h-5 transition-transform duration-300" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 transition-transform duration-300" />
                )}
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-700 ease-in-out ${
              desktopRequestsExpanded
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-6">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No pending friend requests
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/30 dark:bg-gray-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            request.photoURL ||
                            "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                          }
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {request.displayName || request.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            wants to be your friend
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleAcceptFriendRequest(request.from)
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleRejectFriendRequest(request.from)
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Section */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
        {/* Mobile: Show content based on active tab */}
        <div className={isMobile ? "" : "hidden lg:block"}>
          {!isMobile || friendsActiveTab === "friends" ? (
            /* Friends List */
            friends.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UserGroupIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  No friends yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Start connecting with people to share your travel memories
                </p>
                <button
                  onClick={openAddFriendModal}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Add Your First Friend
                </button>
              </div>
            ) : (
              <div
                className={`space-y-3 ${
                  isMobile ? "" : "lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0"
                }`}
              >
                {friends.map((friend) => (
                  <div
                    key={friend.uid}
                    className="flex items-center p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenUserProfile(friend.uid)}
                  >
                    <img
                      src={
                        friend.photoURL ||
                        "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                      }
                      alt={friend.displayName}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                        {friend.displayName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {friend.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : /* Mobile Friend Requests */
          pendingRequests.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BellIcon className="w-12 h-12 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No friend requests
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                When someone sends you a friend request, it will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/30 dark:bg-gray-700/30"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {request.displayName || request.email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        wants to be your friend
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => handleAcceptFriendRequest(request.from)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectFriendRequest(request.from)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: Show only friends (requests are above) */}
        <div className="hidden lg:block">
          {friends.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <UserGroupIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No friends yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start connecting with people to share your travel memories
              </p>
              <button
                onClick={openAddFriendModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Add Your First Friend
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.uid}
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => handleOpenUserProfile(friend.uid)}
                >
                  <img
                    src={
                      friend.photoURL ||
                      "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                    }
                    alt={friend.displayName}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                      {friend.displayName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {friend.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsSection;
