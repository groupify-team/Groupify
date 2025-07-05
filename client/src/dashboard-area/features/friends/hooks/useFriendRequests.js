import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import { FriendsService } from "../services/friendsService";

export const useFriendRequests = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load pending requests
  const loadRequests = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const pendingRequests = await FriendsService.getPendingRequests(
        currentUser.uid
      );
      setRequests(pendingRequests);
    } catch (err) {
      console.error("Error loading friend requests:", err);
      setError(err.message);
      setRequests({ sent: [], received: [] });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  // Send friend request
  const sendFriendRequest = useCallback(
    async (toUserId) => {
      if (!currentUser?.uid) return false;

      try {
        setActionLoading(true);
        setError(null);

        const requestId = await FriendsService.sendFriendRequest(
          currentUser.uid,
          toUserId
        );

        // Refresh requests to show the new one
        await loadRequests();
        return requestId;
      } catch (err) {
        console.error("Error sending friend request:", err);
        setError(err.message);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [currentUser?.uid, loadRequests]
  );

  // Accept friend request
  const acceptFriendRequest = useCallback(
    async (requestId) => {
      if (!currentUser?.uid) return false;

      try {
        setActionLoading(true);
        setError(null);

        await FriendsService.acceptFriendRequest(requestId, currentUser.uid);

        // Update local state
        setRequests((prev) => ({
          ...prev,
          received: prev.received.filter((req) => req.id !== requestId),
        }));

        return true;
      } catch (err) {
        console.error("Error accepting friend request:", err);
        setError(err.message);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [currentUser?.uid]
  );

  // Decline friend request
  const declineFriendRequest = useCallback(
    async (requestId) => {
      if (!currentUser?.uid) return false;

      try {
        setActionLoading(true);
        setError(null);

        await FriendsService.declineFriendRequest(requestId, currentUser.uid);

        // Update local state
        setRequests((prev) => ({
          ...prev,
          received: prev.received.filter((req) => req.id !== requestId),
        }));

        return true;
      } catch (err) {
        console.error("Error declining friend request:", err);
        setError(err.message);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [currentUser?.uid]
  );

  // Cancel sent request
  const cancelFriendRequest = useCallback(
    async (requestId) => {
      if (!currentUser?.uid) return false;

      try {
        setActionLoading(true);
        setError(null);

        await FriendsService.declineFriendRequest(requestId, currentUser.uid);

        // Update local state
        setRequests((prev) => ({
          ...prev,
          sent: prev.sent.filter((req) => req.id !== requestId),
        }));

        return true;
      } catch (err) {
        console.error("Error canceling friend request:", err);
        setError(err.message);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [currentUser?.uid]
  );

  // Get counts
  const getCounts = useCallback(() => {
    return {
      sentCount: requests.sent.length,
      receivedCount: requests.received.length,
      totalPending: requests.sent.length + requests.received.length,
    };
  }, [requests]);

  // Load requests on mount and when user changes
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return {
    requests,
    loading,
    error,
    actionLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    getCounts,
    loadRequests,
  };
};
