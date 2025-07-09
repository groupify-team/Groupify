// FriendsSection.jsx - Clean version without syntax errors
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@auth/hooks/useAuth";
import { UserService } from "@shared/services/user/UserService";
import { UserProfileModal } from "@shared/components/user";
import toast from "react-hot-toast";

import AddFriend from "@dashboard/features/friends/components/AddFriend";
import FriendRequestsList from "@dashboard/features/friends/components/FriendRequestsList";
import FriendsList from "@dashboard/features/friends/components/FriendsList";

const FriendsSection = () => {
  const { currentUser: user } = useAuth();
  console.log("FriendsSection rendered, user:", user?.uid);

  // State management
  const [friendIds, setFriendIds] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Component state
  const [friends, setFriends] = useState([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  // Data loading function
  const loadUserData = async () => {
    if (!user?.uid) {
      console.log("No user ID available");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Loading friends and requests for user:", user.uid);

      const [userFriends, pendingRequests] = await Promise.all([
        UserService.getUserFriends(user.uid),
        UserService.getPendingFriendRequests(user.uid),
      ]);

      console.log("Loaded friends:", userFriends);
      console.log("Loaded requests:", pendingRequests);

      setFriendIds(userFriends.map((friend) => friend.uid || friend.id));
      setFriendRequests(pendingRequests);
      setError(null);
    } catch (err) {
      console.error("Error loading user data:", err);
      setError(err.message);
      setFriendIds([]);
      setFriendRequests([]);
      toast.error("Failed to load friends data");
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    loadUserData();
  }, [user?.uid]);

  // Load friend profiles when friendIds change
  useEffect(() => {
    const loadFriendProfiles = async () => {
      if (loading || !user?.uid) {
        return;
      }

      if (friendIds && friendIds.length > 0) {
        try {
          const profiles = await UserService.getUserProfiles(friendIds);
          setFriends(profiles);
        } catch (error) {
          console.error("Error loading friend profiles:", error);
          toast.error("Failed to load friend profiles");
        }
      } else {
        setFriends([]);
      }
    };

    loadFriendProfiles();
  }, [friendIds, loading, user?.uid]);

  const handleOpenProfile = (user) => {
    setProfileUser(user);
    setOpenProfile(true);
  };

  const handleCloseProfile = () => {
    setOpenProfile(false);
    setProfileUser(null);
  };

  const handleAcceptFriendRequest = async (requestId) => {
    if (!user?.uid) return;

    try {
      await UserService.acceptFriendRequest(requestId, user.uid);
      await loadUserData();
      toast.success("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Error accepting friend request.");
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    if (!user?.uid) return;

    try {
      await UserService.rejectFriendRequest(requestId, user.uid);
      await loadUserData();
      toast.success("Friend request rejected.");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Error rejecting friend request.");
    }
  };

  const handleRemoveFriend = async (friendUserId) => {
    if (!user?.uid) return;

    try {
      await UserService.removeFriend(user.uid, friendUserId);
      await loadUserData();
      toast.success("Friend removed.");
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Error removing friend.");
    }
  };

  const handleAddFriend = async (targetUserId) => {
    if (!user?.uid) return;

    try {
      await UserService.sendFriendRequest(user.uid, targetUserId);
      await loadUserData();
      toast.success("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Error sending friend request.");
    }
  };

  const handleCancelRequest = async (targetUserId) => {
    if (!user?.uid) return;

    try {
      await UserService.cancelFriendRequest(user.uid, targetUserId);
      await loadUserData();
      toast.success("Friend request canceled.");
    } catch (error) {
      console.error("Error canceling friend request:", error);
      toast.error("Error canceling friend request.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400 text-lg">
            Loading friends...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Error: {error}</p>
          <button
            onClick={() => loadUserData()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user?.uid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400 text-lg">
            Loading user data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Friends
          </h1>
          <p className="text-gray-600 dark:text-slate-400 text-lg">
            Connect with friends and share amazing moments together
          </p>
        </div>

        {/* Add Friend Component */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-xl border border-gray-200/60 dark:border-slate-600/60 p-6 shadow-xl">
              <AddFriend
                onAddFriendDirect={handleAddFriend}
                onUserSelect={(userId) => console.log("User selected:", userId)}
              />
            </div>
          </div>
        </div>

        {/* Friend Requests Section */}
        <div className="max-w-4xl mx-auto">
          <FriendRequestsList
            pendingRequests={friendRequests}
            showFriendRequests={showFriendRequests}
            setShowFriendRequests={setShowFriendRequests}
            handleAcceptRequest={handleAcceptFriendRequest}
            handleRejectRequest={handleRejectFriendRequest}
          />
        </div>

        {/* Friends List */}
        <div className="max-w-6xl mx-auto">
          <FriendsList
            friends={friends}
            handleViewProfile={handleOpenProfile}
          />
        </div>
      </div>

      {/* User Profile Modal */}
      {openProfile &&
        profileUser &&
        user?.uid &&
        createPortal(
          <UserProfileModal
            isOpen={openProfile}
            onClose={handleCloseProfile}
            user={profileUser}
            currentUserId={user.uid}
            context="friends"
            friends={friendIds}
            pendingRequests={[]}
            onAddFriend={handleAddFriend}
            onRemoveFriend={handleRemoveFriend}
            onCancelRequest={handleCancelRequest}
          />,
          document.body
        )}
    </div>
  );
};

export default FriendsSection;
