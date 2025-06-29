// hooks/useFriendship.js
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  getFriends,
  sendFriendRequest,
  removeFriend,
  getPendingFriendRequests,
} from "../../../services/firebase/users";

export const useFriendship = (currentUser) => {
  const [friends, setFriends] = useState([]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(null);

  useEffect(() => {
    if (currentUser?.uid) {
      loadFriendsData();
    }
  }, [currentUser]);

  const loadFriendsData = async () => {
    try {
      const [userFriends, pending] = await Promise.all([
        getFriends(currentUser.uid),
        getPendingFriendRequests(currentUser.uid),
      ]);

      setFriends(userFriends.map((f) => f.uid));
      setPendingFriendRequests(pending.map((r) => r.uid));
    } catch (error) {
      console.error("Failed to fetch friends data:", error);
    }
  };

  const addFriend = async (targetUid) => {
    try {
      await sendFriendRequest(currentUser.uid, targetUid);
      setPendingFriendRequests((prev) => [...prev, targetUid]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to send friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const removeFriendship = async (targetUid) => {
    try {
      await removeFriend(currentUser.uid, targetUid);
      setFriends((prev) => prev.filter((uid) => uid !== targetUid));
    } catch (error) {
      console.error("Failed to remove friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  return {
    friends,
    pendingFriendRequests,
    showSuccess,
    cancelSuccess,
    setCancelSuccess,
    addFriend,
    removeFriendship,
    loadFriendsData,
  };
};
