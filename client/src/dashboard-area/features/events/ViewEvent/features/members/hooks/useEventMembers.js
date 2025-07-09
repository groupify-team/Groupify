/**
 * Hook for event member management and friend operations
 * Handles member actions, role changes, friend requests, and member removal
 */

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  doc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import { updateEvent, sendEventInvite } from "@shared/services/firebase/events";
import { UserService } from "@shared/services/user/UserService";
import {
  sendFriendRequest,
  removeFriend,
} from "@shared/services/firebase/users";

export const useEventMembers = (currentUserId, event, setEvent) => {
  const [friends, setFriends] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(null);
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);

  // Get pending friend requests helper function
  const getPendingFriendRequests = async (uid) => {
    try {
      const q = query(
        collection(db, "friendRequests"),
        where("from", "==", uid), // Changed from "fromUid" to "from"
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        uid: doc.data().to, // Changed from "toUid" to "to"
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      return []; // Return empty array on error
    }
  };

  const checkFriendStatus = async (myUid, otherUid) => {
    const ref = doc(db, "friendRequests", `${myUid}_${otherUid}`);
    try {
      const docSnap = await import("firebase/firestore").then(({ getDoc }) =>
        getDoc(ref)
      );
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.status === "pending" ? "pending" : "none";
      }
      return "none";
    } catch (error) {
      return "none";
    }
  };

  useEffect(() => {
    const fetchFriendsAndPending = async () => {
      if (!currentUserId) return;
      try {
        const userFriends = await UserService.getUserFriends(currentUserId);
        const friendIds = userFriends.map((f) => f.uid);
        setFriends(friendIds);

        const pending = await getPendingFriendRequests(currentUserId);
        const pendingIds = pending.map((r) => r.uid);
        setPendingFriendRequests(pendingIds);
      } catch (error) {
        console.error("? Failed to fetch friends or pending:", error);
      }
    };

    fetchFriendsAndPending();
  }, [currentUserId]);

  const handleMemberClick = async (member) => {
    console.log("🔍 handleMemberClick called with member:", member);
    console.log("🔍 Current user ID:", currentUserId);

    if (!member || !currentUserId) {
      console.error("❌ Missing member or currentUserId");
      return;
    }

    try {
      const isFriendNow = friends.includes(member.uid);
      const status = await checkFriendStatus(currentUserId, member.uid);
      const isPendingNow = status === "pending";

      console.log("🔍 Member relationship status:", {
        memberUid: member.uid,
        isFriend: isFriendNow,
        isPending: isPendingNow,
        status,
      });

      const enhancedMember = {
        ...member,
        __isFriend: isFriendNow,
        __isPending: isPendingNow,
      };

      console.log("🚀 Setting selected user:", enhancedMember);
      setSelectedUser(enhancedMember);
    } catch (error) {
      console.error("Error checking member status:", error);
      // Still set the user even if we can't check friendship status
      console.log("⚠️ Setting member without friendship status");
      setSelectedUser({
        ...member,
        __isFriend: false,
        __isPending: false,
      });
    }
  };

  const handleAddFriend = async (targetUid) => {
    try {
      await sendFriendRequest(currentUserId, targetUid);
      setPendingFriendRequests((prev) => [...prev, targetUid]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isPending: true,
      }));
    } catch (error) {
      console.error("? Failed to send friend request:", error);
      throw error;
    }
  };

  const handleInviteToEvent = async (friend) => {
    if (!event || !currentUserId) {
      toast.error("event or user information not available");
      return;
    }

    try {
      // Check if invitation already exists
      const q = query(
        collection(db, "eventInvites"),
        where("eventId", "==", event.id),
        where("inviteeUid", "==", friend.uid),
        where("status", "==", "pending")
      );

      const existing = await getDocs(q);

      if (!existing.empty) {
        toast(`${friend.displayName} already has a pending invite.`, {
          style: {
            borderRadius: "10px",
            background: "#fdf6e3",
            color: "#333",
            border: "1px solid #f59e0b",
          },
          icon: "??",
        });
        return;
      }

      // Send the invitation
      await sendEventInvite(event.id, currentUserId, friend.uid);
      toast.success(`Invitation sent to ${friend.displayName}!`);

      // Close the modal
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
      await removeFriend(currentUserId, targetUid);
      setFriends((prev) => prev.filter((uid) => uid !== targetUid));
      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isFriend: false,
      }));
    } catch (error) {
      console.error("? Failed to remove friend:", error);
      throw error;
    }
  };

  const handleCancelFriendRequest = async (targetUid) => {
    try {
      // Try different possible document ID formats and query approaches
      let requestDeleted = false;

      // Method 1: Try the direct document ID format
      const possibleDocIds = [
        `${currentUserId}_${targetUid}`,
        `${targetUid}_${currentUserId}`,
      ];

      for (const docId of possibleDocIds) {
        try {
          const ref = doc(db, "friendRequests", docId);
          const docSnap = await import("firebase/firestore").then(
            ({ getDoc }) => getDoc(ref)
          );
          if (docSnap.exists()) {
            await deleteDoc(ref);
            requestDeleted = true;
            break;
          }
        } catch (error) {
          console.log("Method 1 failed, trying query method...", error.message);
        }
      }

      if (!requestDeleted) {
        const queries = [
          query(
            collection(db, "friendRequests"),
            where("from", "==", currentUserId),
            where("to", "==", targetUid),
            where("status", "==", "pending")
          ),
          query(
            collection(db, "friendRequests"),
            where("from", "==", targetUid),
            where("to", "==", currentUserId),
            where("status", "==", "pending")
          ),
        ];

        for (const q of queries) {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const docToDelete = querySnapshot.docs[0];
            await deleteDoc(docToDelete.ref);
            requestDeleted = true;
            break;
          }
        }
      }

      if (requestDeleted) {
        setPendingFriendRequests((prev) =>
          prev.filter((uid) => uid !== targetUid)
        );
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
      } else {
        throw new Error("Friend request not found");
      }
    } catch (error) {
      console.error("? Failed to cancel friend request:", error);
      throw error;
    }
  };

  const handleInviteFriend = async (friend, eventId, currentUserId) => {
    try {
      const q = query(
        collection(db, "eventInvites"),
        where("eventId", "==", eventId),
        where("inviteeUid", "==", friend.uid),
        where("status", "==", "pending")
      );

      const existing = await getDocs(q);

      if (!existing.empty) {
        toast(`${friend.displayName} already has a pending invite.`, {
          style: {
            borderRadius: "10px",
            background: "#fdf6e3",
            color: "#333",
            border: "1px solid #f59e0b",
          },
          icon: "??",
        });
        return;
      }

      await sendEventInvite(eventId, currentUserId, friend.uid);
      toast.success(`Invitation sent to ${friend.displayName}.`);
    } catch (error) {
      console.error("Error sending event invite:", error);
      toast.error("Failed to send invitation.");
    }
  };

  const handlePromoteToAdmin = async (uid) => {
    if (!event) {
      console.error("event data not available");
      return;
    }

    try {
      const updatedEvent = {
        ...event,
        admins: [...(event.admins || []), uid],
      };

      // Update in Firebase
      await updateEvent(event.id, { admins: updatedEvent.admins });

      // Update local state
      setEvent(updatedEvent);
      setSelectedUser(null);

      toast.success("User promoted to admin successfully!");
    } catch (error) {
      console.error("Error promoting to admin:", error);
      toast.error("Failed to promote user to admin");
      throw error;
    }
  };

  const handleDemoteFromAdmin = async (uid) => {
    if (!event) {
      console.error("event data not available");
      return;
    }

    const isLastAdmin = event.admins?.length === 1 && event.admins[0] === uid;

    if (isLastAdmin) {
      toast.error(
        "Cannot remove the last admin. Either delete the event or assign another admin first."
      );
      return;
    }

    try {
      const updatedAdmins = event.admins?.filter((id) => id !== uid) || [];

      // Update in Firebase
      await updateEvent(event.id, { admins: updatedAdmins });

      // Update local state
      setEvent({
        ...event,
        admins: updatedAdmins,
      });
      setSelectedUser(null);

      toast.success("Admin privileges removed successfully!");
    } catch (error) {
      console.error("Error demoting admin:", error);
      toast.error("Failed to remove admin privileges");
      throw error;
    }
  };

  const handleRemoveFromEvent = async (uid) => {
    if (!event) {
      console.error("event data not available");
      return;
    }

    try {
      const updatedMembers = event.members?.filter((id) => id !== uid) || [];
      const updatedAdmins = event.admins?.filter((id) => id !== uid) || [];

      const updatedEvent = {
        ...event,
        members: updatedMembers,
        admins: updatedAdmins,
      };

      await updateEvent(event.id, updatedEvent);

      // Update local state
      setEvent(updatedEvent);
      setSelectedUser(null);

      toast.success("User removed from event successfully!");
    } catch (error) {
      console.error("Error removing user from event:", error);
      toast.error("Failed to remove user from event");
      throw error;
    }
  };

  const handleLeaveEvent = async () => {
    if (!event || !currentUserId) {
      console.error("event data or user ID not available");
      return;
    }

    try {
      const updatedMembers =
        event.members?.filter((id) => id !== currentUserId) || [];
      const updatedAdmins =
        event.admins?.filter((id) => id !== currentUserId) || [];

      const updatedEvent = {
        ...event,
        members: updatedMembers,
        admins: updatedAdmins,
      };

      await updateEvent(event.id, updatedEvent);

      // Navigate away from the event (you'll need to import useNavigate)
      // For now, just show success message
      toast.success("You have left the event successfully!");

      // You can add navigation logic here if needed
      // navigate('/events');
    } catch (error) {
      console.error("Error leaving event:", error);
      toast.error("Failed to leave event");
      throw error;
    }
  };

  return {
    friends,
    selectedUser,
    showSuccess,
    cancelSuccess,
    pendingFriendRequests,
    setSelectedUser,
    setShowSuccess,
    setCancelSuccess,
    handleMemberClick,
    handleAddFriend,
    handleRemoveFriend,
    handleCancelFriendRequest,
    handleInviteFriend,
    handleInviteToEvent,
    handlePromoteToAdmin,
    handleDemoteFromAdmin,
    handleRemoveFromEvent,
    handleLeaveEvent,
  };
};
