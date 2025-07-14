import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { UserService } from "@shared/services/user/UserService";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@shared/services/firebase/config";

/**
 * Unified hook for managing user relationships (friends, requests, etc.)
 */
export const useUserRelationships = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFriends = useCallback(async () => {
    if (!user?.uid) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const friendsData = await UserService.getUserFriends(user.uid);
      const friendIds = friendsData.map((friend) => friend.uid || friend.id);
      setFriends(friendIds);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const friendRequestsData = userData.friendRequests || [];
        setFriendRequests(friendRequestsData);
      }
      setLoading(false);
    } catch (err) {
      console.error("Exception in loadFriends function:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [user?.uid]);

  const loadPendingRequests = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, "friendRequests"),
        where("from", "==", user.uid),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      const pending = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingRequests(pending);
    } catch (err) {
      console.error("Error loading pending requests:", err);
    }
  }, [user?.uid]);

  const isFriend = useCallback(
    (userId) => {
      return friends.includes(userId);
    },
    [friends]
  );

  const isPending = useCallback(
    (userId) => {
      return (
        pendingRequests.some((req) => req.to === userId) ||
        friendRequests.some((req) => req.from === userId)
      );
    },
    [pendingRequests, friendRequests]
  );

  const getFriendStatus = useCallback(
    (userId) => {
      if (isFriend(userId)) return "friend";
      if (isPending(userId)) return "pending";
      return "none";
    },
    [isFriend, isPending]
  );

  const getUserRelationshipContext = useCallback(
    (userId) => {
      return {
        isFriend: isFriend(userId),
        isPending: isPending(userId),
        status: getFriendStatus(userId),
      };
    },
    [isFriend, isPending, getFriendStatus]
  );

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setFriends([]);
      setFriendRequests([]);
      setPendingRequests([]);
      return;
    }
    setLoading(true);
    const loadFriendsLocal = async () => {
      try {
        setError(null);
        const friendsData = await UserService.getUserFriends(user.uid);
        const friendIds = friendsData.map((friend) => friend.uid || friend.id);
        setFriends(friendIds);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const friendRequestsData = userData.friendRequests || [];
          setFriendRequests(friendRequestsData);
        }

        setLoading(false);
      } catch (err) {
        console.error("Exception in loadFriends function:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    const loadPendingRequestsLocal = async () => {
      try {
        const q = query(
          collection(db, "friendRequests"),
          where("from", "==", user.uid),
          where("status", "==", "pending")
        );
        const querySnapshot = await getDocs(q);
        const pending = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingRequests(pending);
      } catch (err) {
        console.error("Error loading pending requests:", err);
      }
    };

    const initializeData = async () => {
      try {
        await loadFriendsLocal();
        await loadPendingRequestsLocal();
      } catch (error) {
        console.error("Error initializing user relationships:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeData();
  }, [user?.uid]);

  return {
    friends,
    friendRequests,
    pendingRequests,
    loading,
    error,
    isFriend,
    isPending,
    getFriendStatus,
    getUserRelationshipContext,
    loadFriends,
    loadPendingRequests,
  };
};
