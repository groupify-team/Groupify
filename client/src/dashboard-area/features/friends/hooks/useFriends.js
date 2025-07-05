import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import { FriendsService } from "../services/friendsService";

export const useFriends = () => {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's friends
  const loadFriends = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const userFriends = await FriendsService.getUserFriends(currentUser.uid);
      setFriends(userFriends);
    } catch (err) {
      console.error("Error loading friends:", err);
      setError(err.message);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  // Remove a friend
  const removeFriend = useCallback(
    async (friendUserId) => {
      if (!currentUser?.uid) return false;

      try {
        setError(null);
        await FriendsService.removeFriend(currentUser.uid, friendUserId);

        // Update local state
        setFriends((prev) =>
          prev.filter((friend) => friend.id !== friendUserId)
        );
        return true;
      } catch (err) {
        console.error("Error removing friend:", err);
        setError(err.message);
        return false;
      }
    },
    [currentUser?.uid]
  );

  // Get friend count
  const getFriendCount = useCallback(() => {
    return friends.length;
  }, [friends.length]);

  // Check if user is a friend
  const isFriend = useCallback(
    (userId) => {
      return friends.some((friend) => friend.id === userId);
    },
    [friends]
  );

  // Search friends
  const searchFriends = useCallback(
    (searchTerm) => {
      if (!searchTerm.trim()) return friends;

      const term = searchTerm.toLowerCase();
      return friends.filter(
        (friend) =>
          friend.displayName?.toLowerCase().includes(term) ||
          friend.email?.toLowerCase().includes(term)
      );
    },
    [friends]
  );

  // Load friends on mount and when user changes
  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  return {
    friends,
    loading,
    error,
    removeFriend,
    getFriendCount,
    isFriend,
    searchFriends,
    loadFriends,
  };
};
