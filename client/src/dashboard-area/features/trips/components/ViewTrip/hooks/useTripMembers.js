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
import { db } from "../../../services/firebase/config";
import { updateTrip, sendTripInvite } from "../../../services/firebase/trips";
import {
  getFriends,
  getUserProfile,
  sendFriendRequest,
  removeFriend,
} from "../../../services/firebase/users";

export const useTripMembers = (currentUserId) => {
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
        where("fromUid", "==", uid),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        uid: doc.data().toUid,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      return [];
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
        console.log("✅ Loaded friends:", friendIds);

        const pending = await getPendingFriendRequests(currentUserId);
        const pendingIds = pending.map((r) => r.uid);
        setPendingFriendRequests(pendingIds);
        console.log("🕒 Pending requests:", pendingIds);
      } catch (error) {
        console.error("❌ Failed to fetch friends or pending:", error);
      }
    };

    fetchFriendsAndPending();
  }, [currentUserId]);

  const handleMemberClick = async (member, currentUserId) => {
    const isFriendNow = friends.includes(member.uid);
    const status = await checkFriendStatus(currentUserId, member.uid);
    const isPendingNow = status === "pending";
    setSelectedUser({
      ...member,
      __isFriend: isFriendNow,
      __isPending: isPendingNow,
    });
  };

  const handleAddFriend = async (targetUid, currentUserId) => {
    try {
      await sendFriendRequest(currentUserId, targetUid);
      setPendingFriendRequests((prev) => [...prev, targetUid]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      console.log("✅ Friend request sent to:", targetUid);

      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isPending: true,
      }));
    } catch (error) {
      console.error("❌ Failed to send friend request:", error);
    }
  };

  const handleRemoveFriend = async (targetUid, currentUserId) => {
    try {
      await removeFriend(currentUserId, targetUid);
      setFriends((prev) => prev.filter((uid) => uid !== targetUid));
      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isFriend: false,
      }));
      console.log("🗑️ Removed friend:", targetUid);
    } catch (error) {
      console.error("❌ Failed to remove friend:", error);
    }
  };

  const handleCancelFriendRequest = async (targetUid, currentUserId) => {
    try {
      const ref = doc(db, "friendRequests", `${currentUserId}_${targetUid}`);
      await deleteDoc(ref);
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

      console.log("🗑️ Friend request canceled:", targetUid);
    } catch (error) {
      console.error("❌ Failed to cancel friend request:", error);
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

  const handlePromoteToAdmin = (uid, trip, setTrip) => {
    setTrip({
      ...trip,
      admins: [...(trip.admins || []), uid],
    });
  };

  const handleDemoteFromAdmin = (uid, trip, setTrip) => {
    const isLastAdmin = trip.admins?.length === 1 && trip.admins[0] === uid;

    if (isLastAdmin) {
      alert(
        "❌ You are the only Group Admin. Either delete the trip or assign another admin first."
      );
      return;
    }

    setTrip({
      ...trip,
      admins: trip.admins?.filter((id) => id !== uid),
    });
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
    handlePromoteToAdmin,
    handleDemoteFromAdmin,
    handleRemoveFromTrip,
  };
};
