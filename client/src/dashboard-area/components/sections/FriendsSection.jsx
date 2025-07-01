import React, { useEffect, useState } from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import { useDashboardModals } from "@dashboard/contexts/DashboardModalsContext";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import {
  UserPlusIcon,
  UsersIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
} from "@shared/services/firebase/users";
import toast from "react-hot-toast";

const FriendsSection = () => {
  const { currentUser } = useAuth();
  const {
    friends,
    pendingRequests,
    loading,
    refreshFriends,
    refreshPendingRequests,
  } = useDashboardData();

  const {
    addFriend: { open: openAddFriendModal },
    userProfileActions: { open: openUserProfile },
  } = useDashboardModals();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [showFriendRequests, setShowFriendRequests] = useState(true);

  // Filter friends based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(
        (friend) =>
          friend.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          friend.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [friends, searchTerm]);

  const handleAcceptRequest = async (senderUid) => {
    try {
      await acceptFriendRequest(currentUser.uid, senderUid);
      await refreshPendingRequests();
      await refreshFriends();
      toast.success("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (senderUid) => {
    try {
      await rejectFriendRequest(currentUser.uid, senderUid);
      await refreshPendingRequests();
      toast.success("Friend request declined");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const handleViewProfile = (friend) => {
    openUserProfile(friend);
  };

  const handleRefreshFriends = async () => {
    try {
      await refreshFriends();
      toast.success("Friends list refreshed!");
    } catch (error) {
      console.error("Error refreshing friends:", error);
      toast.error("Failed to refresh friends list");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-800 dark:text-white font-medium">
            Loading friends...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  My Friends ({friends.length})
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Connect and share memories with friends
                </p>
              </div>
            </div>
            <button
              onClick={openAddFriendModal}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <UserPlusIcon className="w-5 h-5" />
              Add Friend
            </button>
          </div>
        </div>

        {/* Friend Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 mb-6 overflow-hidden">
            <button
              onClick={() => setShowFriendRequests(!showFriendRequests)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Friend Requests
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {pendingRequests.length} pending
                  </p>
                </div>
              </div>
              {showFriendRequests ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showFriendRequests && (
              <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src="https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                          alt="User avatar"
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-600"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {request.displayName || "Unknown User"}
                          </h4>
                          <p className="text-blue-600 dark:text-blue-400 text-xs">
                            {request.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.from)}
                          className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-xs font-medium transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.from)}
                          className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded-md text-xs font-medium transition-colors"
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
          <div className="text-center py-8">
            <h3 className="text-lg text-gray-600 dark:text-gray-400">
              No friends yet. Start building your network!
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <div
                key={friend.uid}
                className="bg-gradient-to-r from-gray-700/80 to-gray-800/80 dark:from-gray-700/60 dark:to-gray-800/60 backdrop-blur-lg border border-gray-600/30 dark:border-gray-600/30 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
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
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-base truncate">
                      {friend.displayName || "Unknown User"}
                    </h4>
                    <p className="text-gray-300 text-sm truncate">
                      {friend.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsSection;