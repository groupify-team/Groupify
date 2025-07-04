/**
 * Hook for trip member management and friend operations
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
import { updateTrip, sendTripInvite } from "@shared/services/firebase/trips";
import {
  getFriends,
  getUserProfile,
  sendFriendRequest,
  removeFriend,
} from "@shared/services/firebase/users";

export const useTripMembers = (currentUserId, trip, setTrip) => {
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
        const userFriends = await getFriends(currentUserId);
        const friendIds = userFriends.map((f) => f.uid);
        setFriends(friendIds);

        const pending = await getPendingFriendRequests(currentUserId);
        const pendingIds = pending.map((r) => r.uid);
        setPendingFriendRequests(pendingIds);
      } catch (error) {
        console.error("❌ Failed to fetch friends or pending:", error);
      }
    };

    fetchFriendsAndPending();
  }, [currentUserId]);

  const handleMemberClick = async (member) => {
    try {
      const isFriendNow = friends.includes(member.uid);
      const status = await checkFriendStatus(currentUserId, member.uid);
      const isPendingNow = status === "pending";

      setSelectedUser({
        ...member,
        __isFriend: isFriendNow,
        __isPending: isPendingNow,
      });
    } catch (error) {
      console.error("Error checking member status:", error);
      setSelectedUser(member);
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
      console.error("❌ Failed to send friend request:", error);
      throw error;
    }
  };

  const handleInviteToTrip = async (friend) => {
    if (!trip || !currentUserId) {
      toast.error("Trip or user information not available");
      return;
    }

    try {
      // Check if invitation already exists
      const q = query(
        collection(db, "tripInvites"),
        where("tripId", "==", trip.id),
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
          icon: "⚠️",
        });
        return;
      }

      // Send the invitation
      await sendTripInvite(trip.id, currentUserId, friend.uid);
      toast.success(`Invitation sent to ${friend.displayName}!`);

      // Close the modal
      setSelectedUser(null);
    } catch (error) {
      console.error("Error sending trip invite:", error);
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
      console.error("❌ Failed to remove friend:", error);
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
          // Continue to next method if this fails
          console.log("Method 1 failed, trying query method...");
        }
      }

      // Method 2: If direct deletion failed, try query-based approach
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
      console.error("❌ Failed to cancel friend request:", error);
      throw error;
    }
  };

  const handleInviteFriend = async (friend, tripId, currentUserId) => {
    try {
      const q = query(
        collection(db, "tripInvites"),
        where("tripId", "==", tripId),
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
          icon: "⚠️",
        });
        return;
      }

      await sendTripInvite(tripId, currentUserId, friend.uid);
      toast.success(`Invitation sent to ${friend.displayName}.`);
    } catch (error) {
      console.error("Error sending trip invite:", error);
      toast.error("Failed to send invitation.");
    }
  };

  const handlePromoteToAdmin = async (uid) => {
    if (!trip) {
      console.error("Trip data not available");
      return;
    }

    try {
      const updatedTrip = {
        ...trip,
        admins: [...(trip.admins || []), uid],
      };

      // Update in Firebase
      await updateTrip(trip.id, { admins: updatedTrip.admins });

      // Update local state
      setTrip(updatedTrip);
      setSelectedUser(null);

      toast.success("User promoted to admin successfully!");
    } catch (error) {
      console.error("Error promoting to admin:", error);
      toast.error("Failed to promote user to admin");
      throw error;
    }
  };

  const handleDemoteFromAdmin = async (uid) => {
    if (!trip) {
      console.error("Trip data not available");
      return;
    }

    const isLastAdmin = trip.admins?.length === 1 && trip.admins[0] === uid;

    if (isLastAdmin) {
      toast.error(
        "Cannot remove the last admin. Either delete the trip or assign another admin first."
      );
      return;
    }

    try {
      const updatedAdmins = trip.admins?.filter((id) => id !== uid) || [];

      // Update in Firebase
      await updateTrip(trip.id, { admins: updatedAdmins });

      // Update local state
      setTrip({
        ...trip,
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

  const handleRemoveFromTrip = async (
    uid,
    trip,
    tripMembers,
    setTrip,
    setTripMembers
  ) => {
    try {
      const userToRemove = tripMembers.find((m) => m.uid === uid);

      const updatedMembers = trip.members?.filter((id) => id !== uid);
      const updatedAdmins = trip.admins?.filter((id) => id !== uid);

      const updatedTrip = {
        ...trip,
        members: updatedMembers,
        admins: updatedAdmins,
      };

      await updateTrip(trip.id, updatedTrip);

      const memberProfiles = await Promise.all(
        updatedMembers.map((id) => getUserProfile(id))
      );
      setTripMembers(memberProfiles);

      setTrip(updatedTrip);

      toast.success(
        `User ${userToRemove?.displayName || uid} was removed from the trip`
      );

      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to remove user from trip:", error);
      toast.error("Failed to remove user from trip");
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
    handleInviteToTrip,
    handlePromoteToAdmin,
    handleDemoteFromAdmin,
    handleRemoveFromTrip,
  };
};
