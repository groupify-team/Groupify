// client/src/dashboard-area/features/events/ViewEvent/features/members/hooks/useEventMembers.js
import { useState } from "react";
import { toast } from "@shared/utils/toast";
import { sendEventInvite } from "@shared/services/firebase/events";
import { useFriendsContext } from "@shared/contexts/FriendsContext";
import { useEventContext } from "@shared/contexts/EventContext";
import { modalToast } from "@shared/utils/modalToast";

export const useEventMembers = (currentUserId, event, setEvent) => {
  // Get global friends state
  const {
    friends,
    friendIds,
    pendingRequests,
    pendingRequestIds,
    sentRequestIds,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    isFriend,
    isPending,
    getUserRelationshipData,
  } = useFriendsContext();

  // Get global event state
  const {
    getEventById,
    getEventMembers,
    promoteToAdmin,
    demoteFromAdmin,
    removeEventMember,
    leaveEvent,
    isEventAdmin,
    isEventCreator,
  } = useEventContext();

  const [selectedUser, setSelectedUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(null);

  // Get real-time event data from context
  const currentEvent = event?.id ? getEventById(event.id) : event;
  const currentEventMembers = event?.id ? getEventMembers(event.id) : [];

  // Update local event state when context changes
  if (
    currentEvent &&
    setEvent &&
    JSON.stringify(currentEvent) !== JSON.stringify(event)
  ) {
    setEvent(currentEvent);
  }

  const handleMemberClick = async (member) => {
    console.log("🔍 handleMemberClick called with member:", member);
    console.log("🔍 Current user ID:", currentUserId);

    if (!member || !currentUserId) {
      console.error("❌ Missing member or currentUserId");
      return;
    }

    try {
      // Use global context to get relationship status
      const relationshipData = getUserRelationshipData(member.uid);

      console.log("🔍 Member relationship status:", {
        memberUid: member.uid,
        isFriend: relationshipData.isFriend,
        isPending: relationshipData.isPending,
        status: relationshipData.status,
        globalFriendIds: friendIds,
        globalPendingIds: pendingRequestIds,
        globalSentIds: sentRequestIds,
      });

      const enhancedMember = {
        ...member,
        __isFriend: relationshipData.isFriend,
        __isPending: relationshipData.isPending,
      };

      console.log("🚀 Setting selected user:", enhancedMember);
      setSelectedUser(enhancedMember);
    } catch (error) {
      console.error("Error checking member status:", error);
      setSelectedUser({
        ...member,
        __isFriend: false,
        __isPending: false,
      });
    }
  };

  const handleAddFriend = async (targetUid) => {
    try {
      await sendFriendRequest(targetUid);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Update the selected user to show pending status
      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isPending: true,
        __isFriend: false,
      }));

      // Don't close the modal immediately, let user see the change
      setTimeout(() => {
        setSelectedUser(null);
      }, 1500);
    } catch (error) {
      console.error("Failed to send friend request:", error);
      throw error;
    }
  };

  const handleInviteToEvent = async (friend) => {
    if (!event || !currentUserId) {
      toast.error("Event or user information not available");
      return;
    }

    try {
      await sendEventInvite(event.id, currentUserId, friend.uid);
      toast.success(`Invitation sent to ${friend.displayName}!`);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error sending event invite:", error);
      if (error.code === "permission-denied") {
        toast.error(
          "Permission denied. You may not have permission to send invites."
        );
      } else {
        toast.error("Failed to send invitation. Please try again.");
      }
    }
  };

  const handleRemoveFriend = async (targetUid) => {
    try {
      await removeFriend(targetUid);
      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isFriend: false,
      }));
      modalToast.success("Friend removed successfully", {
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to remove friend:", error);
      modalToast.error("Failed to remove friend. Please try again.", {
        duration: 4000,
      });
      throw error;
    }
  };

  const handleCancelFriendRequest = async (targetUid) => {
    try {
      await cancelFriendRequest(targetUid);
      setCancelSuccess(
        `Friend request to ${
          selectedUser?.displayName || selectedUser?.email
        } was cancelled.`
      );
      setTimeout(() => setCancelSuccess(null), 3000);

      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isPending: false,
      }));
    } catch (error) {
      console.error("Failed to cancel friend request:", error);
      throw error;
    }
  };

  const handlePromoteToAdmin = async (uid) => {
    if (!event?.id) {
      console.error("Event data not available");
      return;
    }

    try {
      await promoteToAdmin(event.id, uid);
      setSelectedUser(null);
      toast.success("User promoted to admin successfully!");
    } catch (error) {
      console.error("Error promoting to admin:", error);
      toast.error("Failed to promote user to admin");
      throw error;
    }
  };

  const handleDemoteFromAdmin = async (uid) => {
    if (!event?.id) {
      console.error("Event data not available");
      return;
    }

    // Check if this is the last admin
    const isLastAdmin =
      currentEvent?.admins?.length === 1 && currentEvent.admins[0] === uid;

    if (isLastAdmin) {
      toast.error(
        "Cannot remove the last admin. Either delete the event or assign another admin first."
      );
      return;
    }

    try {
      await demoteFromAdmin(event.id, uid);
      setSelectedUser(null);
      toast.success("Admin privileges removed successfully!");
    } catch (error) {
      console.error("Error demoting admin:", error);
      toast.error("Failed to remove admin privileges");
      throw error;
    }
  };

  const handleRemoveFromEvent = async (uid) => {
    if (!event?.id) {
      console.error("Event data not available");
      return;
    }

    try {
      await removeEventMember(event.id, uid);
      setSelectedUser(null);
      toast.success("User removed from event successfully!");
    } catch (error) {
      console.error("Error removing user from event:", error);
      toast.error("Failed to remove user from event");
      throw error;
    }
  };

  const handleLeaveEvent = async (navigate) => {
    if (!event?.id || !currentUserId) {
      console.error("Event data or user ID not available");
      return;
    }

    try {
      await leaveEvent(event.id);
      toast.success("You have left the event successfully!");

      if (navigate) {
        setTimeout(() => {
          navigate("/dashboard/events");
        }, 1000);
      }
    } catch (error) {
      console.error("Error leaving event:", error);
      toast.error("Failed to leave event");
      throw error;
    }
  };

  return {
    // Global friends state (unchanged for compatibility)
    friends: friends.map((f) => f.uid),
    selectedUser,
    showSuccess,
    cancelSuccess,
    pendingFriendRequests: sentRequestIds,

    // Real-time event members from context
    eventMembers: currentEventMembers,
    currentEvent,

    // State setters
    setSelectedUser,
    setShowSuccess,
    setCancelSuccess,

    // Event member actions (now using EventContext)
    handleMemberClick,
    handlePromoteToAdmin,
    handleDemoteFromAdmin,
    handleRemoveFromEvent,
    handleLeaveEvent,

    // Friend actions (unchanged)
    handleAddFriend,
    handleRemoveFriend,
    handleCancelFriendRequest,
    handleInviteToEvent,

    // Convenience helpers
    isAdmin: currentUserId ? isEventAdmin(event?.id, currentUserId) : false,
    isCreator: currentUserId ? isEventCreator(event?.id, currentUserId) : false,
  };
};
