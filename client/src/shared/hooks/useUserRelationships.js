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

  // Load friends data - simplified version for external calls
  const loadFriends = useCallback(async () => {
    if (!user?.uid) {
      console.log("No user ID in loadFriends, cannot fetch friends");
      return;
    }

    console.log("Starting to load friends for user:", user.uid);
    setLoading(true);
    setError(null);

    try {
      // Use UserService to get friends with full profiles
      const friendsData = await UserService.getUserFriends(user.uid);
      console.log("useUserRelationships: Friends loaded:", friendsData);

      // Extract friend IDs for compatibility with existing code
      const friendIds = friendsData.map((friend) => friend.uid || friend.id);
      setFriends(friendIds);

      // Load friend requests separately
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const friendRequestsData = userData.friendRequests || [];
        console.log(
          `useUserRelationships: Found ${friendRequestsData.length} friend requests`
        );
        setFriendRequests(friendRequestsData);
      }

      setLoading(false);
    } catch (err) {
      console.error("Exception in loadFriends function:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [user?.uid]);

  // Load pending requests - simplified version for external calls
  const loadPendingRequests = useCallback(async () => {
    if (!user?.uid) return;

    try {
      console.log("Loading pending friend requests for user:", user.uid);
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
      console.log("Pending friend requests loaded:", pending);
      setPendingRequests(pending);
    } catch (err) {
      console.error("Error loading pending requests:", err);
    }
  }, [user?.uid]);

  // Check if user is a friend
  const isFriend = useCallback(
    (userId) => {
      return friends.includes(userId);
    },
    [friends]
  );

  // Check if request is pending
  const isPending = useCallback(
    (userId) => {
      return (
        pendingRequests.some((req) => req.to === userId) ||
        friendRequests.some((req) => req.from === userId)
      );
    },
    [pendingRequests, friendRequests]
  );

  // Get friend status
  const getFriendStatus = useCallback(
    (userId) => {
      if (isFriend(userId)) return "friend";
      if (isPending(userId)) return "pending";
      return "none";
    },
    [isFriend, isPending]
  );

  // Get user relationship context
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
    console.log("useUserRelationships effect running, user:", user?.uid);

    // If no user yet, set loading to false since we can't load friends without a user
    if (!user?.uid) {
      console.log(
        "No user ID yet in useUserRelationships, setting loading to false"
      );
      setLoading(false);
      setFriends([]);
      setFriendRequests([]);
      setPendingRequests([]);
      return;
    }

    console.log("User authenticated, loading friends for:", user.uid);
    setLoading(true);

    // Define loadFriends inside the effect to avoid dependency issues
    const loadFriendsLocal = async () => {
      try {
        console.log("Starting to load friends for user:", user.uid);
        setError(null);

        // Use UserService to get friends with full profiles
        const friendsData = await UserService.getUserFriends(user.uid);
        console.log("useUserRelationships: Friends loaded:", friendsData);

        // Extract friend IDs for compatibility with existing code
        const friendIds = friendsData.map((friend) => friend.uid || friend.id);
        setFriends(friendIds);

        // Load friend requests separately
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const friendRequestsData = userData.friendRequests || [];
          console.log(
            `useUserRelationships: Found ${friendRequestsData.length} friend requests`
          );
          setFriendRequests(friendRequestsData);
        }

        setLoading(false);
      } catch (err) {
        console.error("Exception in loadFriends function:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    // Define loadPendingRequests inside the effect
    const loadPendingRequestsLocal = async () => {
      try {
        console.log("Loading pending friend requests for user:", user.uid);
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
        console.log("Pending friend requests loaded:", pending);
        setPendingRequests(pending);
      } catch (err) {
        console.error("Error loading pending requests:", err);
      }
    };

    // Load friends and pending requests
    const initializeData = async () => {
      try {
        await loadFriendsLocal();
        // Load pending requests
        await loadPendingRequestsLocal();
      } catch (error) {
        console.error("Error initializing user relationships:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeData();

    // No cleanup needed since we're not using listeners anymore
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
