// client/src/dashboard-area/features/friends/FriendsSection.jsx
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@auth/hooks/useAuth";
import {
  UserPlusIcon,
  UsersIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { useFriendsContext } from "@shared/contexts/FriendsContext";
import toast from "react-hot-toast";

import AddFriend from "@dashboard/features/friends/components/AddFriend";
import UserProfileModal from "@shared/components/user/UserProfileModal";

const FriendsSection = () => {
  const { currentUser } = useAuth();

  // Use global friends context
  const {
    friends,
    friendIds,
    pendingRequests,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    getUserRelationshipData,
  } = useFriendsContext();

  const [showFriendRequests, setShowFriendRequests] = useState(true);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);

  // Handler functions
  const handleAcceptRequest = async (requestId, fromUserId) => {
    try {
      await acceptFriendRequest(requestId, fromUserId);
      toast.success("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (requestId, fromUserId) => {
    try {
      await rejectFriendRequest(requestId, fromUserId);
      toast.success("Friend request declined");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const handleRemoveFriendLocal = async (friendUid) => {
    try {
      await removeFriend(friendUid);
      toast.success("Friend removed!");
      setShowUserProfileModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  const handleAddFriendDirect = async (targetUid) => {
    try {
      await sendFriendRequest(targetUid);
      toast.success("Friend request sent!");
      setShowAddFriendModal(false);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleCancelRequestLocal = async (targetUid) => {
    try {
      await cancelFriendRequest(targetUid);
      setShowUserProfileModal(false);
      setSelectedUser(null);
      toast.success("Friend request cancelled!");
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      toast.error("Failed to cancel friend request");
    }
  };

  const handleViewProfile = (friend) => {
    console.log("🔍 handleViewProfile called with:", friend);

    // Get the current relationship status from global context
    const relationshipData = getUserRelationshipData(friend.uid || friend.id);

    const enhancedFriend = {
      ...friend,
      __isFriend: relationshipData.isFriend,
      __isPending: relationshipData.isPending,
    };

    console.log("🚀 Setting enhanced friend:", enhancedFriend);
    setSelectedUser(enhancedFriend);
    setShowUserProfileModal(true);
  };

  const handleUserSelect = (userOrUid) => {
    if (typeof userOrUid === "object" && userOrUid.uid) {
      handleViewProfile(userOrUid);
    } else {
      const userData = friends.find((f) => f.uid === userOrUid);
      if (userData) {
        handleViewProfile(userData);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 dark:text-slate-300 font-medium">
            Loading friends...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 dark:text-red-400 font-medium">
            Error loading friends: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-slate-600/50 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Friends ({friends.length})
                </h1>
                <p className="text-gray-600 dark:text-slate-400">
                  Connect and share memories with friends
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddFriendModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
            >
              <UserPlusIcon className="w-5 h-5" />
              Add Friend
            </button>
          </div>
        </div>

        {/* Friend Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-slate-600/60 mb-6">
            <button
              onClick={() => setShowFriendRequests(!showFriendRequests)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50/60 dark:hover:bg-slate-700/60 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Friend Requests
                  </h2>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">
                    {pendingRequests.length} pending
                  </p>
                </div>
              </div>
              {showFriendRequests ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              )}
            </button>

            {showFriendRequests && (
              <div className="border-t border-gray-200/60 dark:border-slate-600/60 p-4 space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gray-100/80 dark:bg-slate-600/80 border border-gray-300/60 dark:border-slate-500/60 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            request.photoURL ||
                            "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                          }
                          alt="User avatar"
                          className="w-8 h-8 rounded-full object-cover border border-gray-400 dark:border-slate-500"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {request.displayName || "Unknown User"}
                          </h4>
                          <p className="text-gray-600 dark:text-slate-400 text-xs">
                            {request.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleAcceptRequest(
                              request.id,
                              request.from || request.uid
                            )
                          }
                          className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-xs font-medium transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleRejectRequest(
                              request.id,
                              request.from || request.uid
                            )
                          }
                          className="bg-gray-600 hover:bg-gray-700 dark:bg-slate-600 dark:hover:bg-slate-700 text-white py-1 px-3 rounded-md text-xs font-medium transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friends List */}
        {friends.length === 0 ? (
          <div className="bg-white/60 dark:bg-slate-700/60 rounded-xl border border-gray-200/60 dark:border-slate-600/60 p-12 text-center">
            <div className="w-16 h-16 bg-gray-200/50 dark:bg-slate-600/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-gray-500 dark:text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No friends yet
            </h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Start connecting with people to share your travel memories
            </p>
            <button
              onClick={() => setShowAddFriendModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
            >
              Add Your First Friend
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <div
                key={friend.uid || friend.id}
                className="bg-white/80 hover:bg-white/90 dark:bg-slate-700/80 dark:hover:bg-slate-700/90 backdrop-blur-sm border border-gray-200/60 dark:border-slate-600/60 rounded-xl p-4 transition-all duration-200 cursor-pointer group"
                onClick={() => handleViewProfile(friend)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        friend.photoURL ||
                        "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                      }
                      alt={`${friend.displayName}'s avatar`}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-400 dark:border-slate-500"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-700 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-base truncate">
                      {friend.displayName || "Unknown User"}
                    </h4>
                    <p className="text-gray-600 dark:text-slate-400 text-sm truncate">
                      {friend.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-800/95 rounded-2xl max-w-md w-full shadow-2xl border border-gray-300/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between p-4 border-b border-gray-300/80 dark:border-slate-700/80">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Friend
              </h3>
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <AddFriend
                onUserSelect={handleUserSelect}
                onAddFriendDirect={handleAddFriendDirect}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal - Updated with global context compatibility */}
      {showUserProfileModal &&
        selectedUser &&
        createPortal(
          <UserProfileModal
            isOpen={showUserProfileModal}
            user={selectedUser}
            currentUserId={currentUser?.uid}
            friends={friendIds} // Use global friend IDs
            pendingRequests={pendingRequests}
            onAddFriend={handleAddFriendDirect}
            onRemoveFriend={handleRemoveFriendLocal}
            onCancelRequest={handleCancelRequestLocal}
            onClose={() => {
              console.log("🚪 Closing UserProfileModal");
              setSelectedUser(null);
              setShowUserProfileModal(false);
            }}
          />,
          document.body
        )}
    </div>
  );
};

export default FriendsSection;
