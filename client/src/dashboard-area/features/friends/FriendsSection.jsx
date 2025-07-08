// FriendsSection.jsx - updated to use shared components
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@auth/hooks/useAuth";
import { useUserRelationships } from "@shared/hooks";
import { UserService } from "@shared/services/user/UserService";
import { UserProfileModal } from "@shared/components/user";
import toast from "react-hot-toast";

import AddFriend from "@dashboard/features/friends/components/AddFriend";
import FriendRequestsList from "@dashboard/features/friends/components/FriendRequestsList";
import FriendsList from "@dashboard/features/friends/components/FriendsList";

const FriendsSection = () => {
  const { user } = useAuth();
  console.log("FriendsSection rendered, user:", user?.uid);

  const {
    friends: friendIds,
    friendRequests,
    loading,
    error,
    loadFriends,
    loadPendingRequests,
  } = useUserRelationships();

  // Debug logging
  console.log("FriendsSection state:", {
    friendIds,
    friendIdsLength: friendIds?.length,
    friendRequests,
    loading,
    error,
    userUid: user?.uid,
  });

  const [friends, setFriends] = useState([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  // Load friend profiles
  useEffect(() => {
    console.log("FriendsSection useEffect: Friend IDs changed:", friendIds);
    console.log("FriendsSection useEffect: Loading state:", loading);

    const loadFriendProfiles = async () => {
      // Don't load profiles while still loading the friend IDs or if user is not available
      if (loading || !user?.uid) {
        console.log(
          "FriendsSection: Still loading friend IDs or user not available, skipping profile loading"
        );
        return;
      }

      if (friendIds && friendIds.length > 0) {
        try {
          console.log(
            "FriendsSection: Loading profiles for friends:",
            friendIds
          );
          // Get individual friend profiles based on the friend IDs
          const profiles = await UserService.getUserProfiles(friendIds);
          console.log("FriendsSection: Friend profiles loaded:", profiles);
          setFriends(profiles);
        } catch (error) {
          console.error(
            "FriendsSection: Error loading friend profiles:",
            error
          );
          toast.error("Failed to load friend profiles");
        }
      } else {
        console.log(
          "FriendsSection: No friend IDs found, setting empty friends array"
        );
        setFriends([]);
      }
    };

    loadFriendProfiles();
  }, [friendIds, loading, user?.uid]);

  const handleOpenProfile = (user) => {
    console.log("Opening profile for user:", user);
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
      await loadFriends();
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
      await loadFriends();
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
      await loadFriends();
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
      await loadPendingRequests();
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
      await loadPendingRequests();
      toast.success("Friend request canceled.");
    } catch (error) {
      console.error("Error canceling friend request:", error);
      toast.error("Error canceling friend request.");
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-slate-400 mt-2">
          Loading friends...
        </p>
      </div>
    );
  }

  // Add guard for user not being available
  if (!user?.uid) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-slate-400 mt-2">
          Loading user data...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Friends</h1>
      <AddFriend />

      {/* Friend Requests Section */}
      <FriendRequestsList
        pendingRequests={friendRequests}
        showFriendRequests={showFriendRequests}
        setShowFriendRequests={setShowFriendRequests}
        handleAcceptRequest={handleAcceptFriendRequest}
        handleRejectRequest={handleRejectFriendRequest}
      />

      {/* Friends List */}
      <FriendsList friends={friends} handleViewProfile={handleOpenProfile} />

      {/* User Profile Modal */}
      {openProfile && profileUser && user?.uid && (
        <>
          {console.log(
            "Rendering user profile modal for:",
            profileUser,
            "isOpen:",
            openProfile
          )}
          {createPortal(
            <UserProfileModal
              isOpen={openProfile}
              onClose={handleCloseProfile}
              user={profileUser}
              currentUserId={user.uid}
              context="friends"
              friends={friendIds}
              pendingRequests={[]} // TODO: Get pending requests for this user
              onAddFriend={handleAddFriend}
              onRemoveFriend={handleRemoveFriend}
              onCancelRequest={handleCancelRequest}
            />,
            document.body
          )}
        </>
      )}
    </div>
  );
};

export default FriendsSection;
