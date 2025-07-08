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

  // Load friends data
  const loadFriends = useCallback(async () => {
    if (!user?.uid) {
      console.log("No user ID in loadFriends, cannot fetch friends");
      setLoading(false);
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

      // Load friend requests separately (not as part of this async function)
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

  // Load pending requests
  const loadPendingRequests = useCallback(() => {
    if (!user?.uid) return;

    // Using an IIFE (Immediately Invoked Function Expression) to handle the async code
    (async () => {
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
    })();

    // This function doesn't return an unsubscribe since it's not setting up a listener
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

    // If no user yet, just wait and keep loading state
    if (!user?.uid) {
      console.log(
        "No user ID yet in useUserRelationships, waiting for auth..."
      );
      // Don't set loading to false, we're still waiting for user to load
      return;
    }

    console.log("User authenticated, loading friends for:", user.uid);

    // Load friends and pending requests
    const initializeData = async () => {
      try {
        await loadFriends();
        // Load pending requests (this is an async function but doesn't return an unsubscribe)
        loadPendingRequests();
      } catch (error) {
        console.error("Error initializing user relationships:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeData();

    // No cleanup needed since we're not using listeners anymore
  }, [loadFriends, loadPendingRequests, user?.uid]);

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
