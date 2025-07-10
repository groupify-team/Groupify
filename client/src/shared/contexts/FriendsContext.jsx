// client/src/shared/contexts/FriendsContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { UserService } from "@shared/services/user/UserService";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@shared/services/firebase/config";

// Actions
const FRIENDS_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_FRIENDS: "SET_FRIENDS",
  SET_PENDING_REQUESTS: "SET_PENDING_REQUESTS",
  SET_SENT_REQUESTS: "SET_SENT_REQUESTS",
  ADD_FRIEND: "ADD_FRIEND",
  REMOVE_FRIEND: "REMOVE_FRIEND",
  ADD_PENDING_REQUEST: "ADD_PENDING_REQUEST",
  REMOVE_PENDING_REQUEST: "REMOVE_PENDING_REQUEST",
  SET_ERROR: "SET_ERROR",
};

// Initial state
const initialState = {
  friends: [],
  friendIds: [], // Just UIDs for quick lookup
  pendingRequests: [], // Requests TO current user
  pendingRequestIds: [], // Just UIDs for quick lookup
  sentRequests: [], // Requests FROM current user
  sentRequestIds: [], // Just UIDs for quick lookup
  loading: true,
  error: null,
};

// Reducer
function friendsReducer(state, action) {
  switch (action.type) {
    case FRIENDS_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case FRIENDS_ACTIONS.SET_FRIENDS:
      return {
        ...state,
        friends: action.payload,
        friendIds: action.payload.map((f) => f.uid || f.id),
      };

    case FRIENDS_ACTIONS.SET_PENDING_REQUESTS:
      return {
        ...state,
        pendingRequests: action.payload,
        pendingRequestIds: action.payload.map((r) => r.uid || r.id || r.from),
      };

    case FRIENDS_ACTIONS.SET_SENT_REQUESTS:
      return {
        ...state,
        sentRequests: action.payload,
        sentRequestIds: action.payload.map((r) => r.uid || r.id || r.to),
      };

    case FRIENDS_ACTIONS.ADD_FRIEND:
      const newFriend = action.payload;
      const friendId = newFriend.uid || newFriend.id;
      return {
        ...state,
        friends: [...state.friends, newFriend],
        friendIds: [...state.friendIds, friendId],
        // Remove from pending/sent if exists
        pendingRequests: state.pendingRequests.filter(
          (r) => (r.uid || r.id || r.from) !== friendId
        ),
        pendingRequestIds: state.pendingRequestIds.filter(
          (id) => id !== friendId
        ),
        sentRequests: state.sentRequests.filter(
          (r) => (r.uid || r.id || r.to) !== friendId
        ),
        sentRequestIds: state.sentRequestIds.filter((id) => id !== friendId),
      };

    case FRIENDS_ACTIONS.REMOVE_FRIEND:
      const friendIdToRemove = action.payload;
      return {
        ...state,
        friends: state.friends.filter(
          (f) => (f.uid || f.id) !== friendIdToRemove
        ),
        friendIds: state.friendIds.filter((id) => id !== friendIdToRemove),
      };

    case FRIENDS_ACTIONS.ADD_PENDING_REQUEST:
      const newRequest = action.payload;
      const requestId = newRequest.uid || newRequest.id || newRequest.to;
      // Don't add if already exists
      if (state.sentRequestIds.includes(requestId)) {
        return state;
      }
      return {
        ...state,
        sentRequests: [...state.sentRequests, newRequest],
        sentRequestIds: [...state.sentRequestIds, requestId],
      };

    case FRIENDS_ACTIONS.REMOVE_PENDING_REQUEST:
      const requestIdToRemove = action.payload;
      return {
        ...state,
        pendingRequests: state.pendingRequests.filter(
          (r) => (r.uid || r.id || r.from) !== requestIdToRemove
        ),
        pendingRequestIds: state.pendingRequestIds.filter(
          (id) => id !== requestIdToRemove
        ),
        sentRequests: state.sentRequests.filter(
          (r) => (r.uid || r.id || r.to) !== requestIdToRemove
        ),
        sentRequestIds: state.sentRequestIds.filter(
          (id) => id !== requestIdToRemove
        ),
      };

    case FRIENDS_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };

    default:
      return state;
  }
}

// Context
const FriendsContext = createContext();

// Provider component
export const FriendsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(friendsReducer, initialState);

  // Set up real-time listeners
  useEffect(() => {
    if (!currentUser?.uid) {
      dispatch({ type: FRIENDS_ACTIONS.SET_LOADING, payload: false });
      return;
    }

    let unsubscribeFriends;
    let unsubscribePendingRequests;
    let unsubscribeSentRequests;

    const setupListeners = async () => {
      try {
        dispatch({ type: FRIENDS_ACTIONS.SET_LOADING, payload: true });

        // 1. Friends listener
        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeFriends = onSnapshot(userDocRef, async (docSnap) => {
          if (!docSnap.exists()) return;

          const data = docSnap.data();
          const friendIds = [...new Set(data.friends || [])];

          if (friendIds.length === 0) {
            dispatch({ type: FRIENDS_ACTIONS.SET_FRIENDS, payload: [] });
            return;
          }

          // Get friend profiles
          const friendsData = [];
          for (const fid of friendIds) {
            if (!fid || typeof fid !== "string") continue;

            try {
              const friendProfile = await UserService.getUserProfile(fid);
              if (friendProfile) {
                friendsData.push({
                  ...friendProfile,
                  uid: friendProfile.uid || friendProfile.id || fid,
                  id: friendProfile.id || friendProfile.uid || fid,
                });
              }
            } catch (error) {
              console.warn(`Failed to fetch friend ${fid}:`, error);
            }
          }

          dispatch({ type: FRIENDS_ACTIONS.SET_FRIENDS, payload: friendsData });
        });

        // 2. Pending requests listener (requests TO current user)
        const pendingRequestsQuery = query(
          collection(db, "friendRequests"),
          where("to", "==", currentUser.uid),
          where("status", "==", "pending")
        );

        unsubscribePendingRequests = onSnapshot(
          pendingRequestsQuery,
          async (snapshot) => {
            const requests = [];

            for (const docSnap of snapshot.docs) {
              const data = docSnap.data();

              try {
                const senderProfile = await UserService.getUserProfile(
                  data.from
                );
                if (senderProfile) {
                  requests.push({
                    id: docSnap.id,
                    ...data,
                    ...senderProfile,
                    uid: senderProfile.uid || senderProfile.id || data.from,
                  });
                }
              } catch (error) {
                console.warn(`Failed to fetch sender ${data.from}:`, error);
              }
            }

            dispatch({
              type: FRIENDS_ACTIONS.SET_PENDING_REQUESTS,
              payload: requests,
            });
          }
        );

        // 3. Sent requests listener (requests FROM current user)
        const sentRequestsQuery = query(
          collection(db, "friendRequests"),
          where("from", "==", currentUser.uid),
          where("status", "==", "pending")
        );

        unsubscribeSentRequests = onSnapshot(
          sentRequestsQuery,
          async (snapshot) => {
            const sentRequests = [];

            for (const docSnap of snapshot.docs) {
              const data = docSnap.data();

              try {
                const recipientProfile = await UserService.getUserProfile(
                  data.to
                );
                if (recipientProfile) {
                  sentRequests.push({
                    id: docSnap.id,
                    ...data,
                    uid: data.to, // The recipient's UID
                    displayName: recipientProfile.displayName,
                    email: recipientProfile.email,
                    photoURL: recipientProfile.photoURL,
                  });
                } else {
                  // Even if we can't get profile, track the request
                  sentRequests.push({
                    id: docSnap.id,
                    ...data,
                    uid: data.to,
                  });
                }
              } catch (error) {
                console.warn(`Failed to fetch recipient ${data.to}:`, error);
                // Still track the request
                sentRequests.push({
                  id: docSnap.id,
                  ...data,
                  uid: data.to,
                });
              }
            }

            console.log(
              "🔍 Sent requests updated:",
              sentRequests.map((r) => ({ to: r.to, uid: r.uid }))
            );
            dispatch({
              type: FRIENDS_ACTIONS.SET_SENT_REQUESTS,
              payload: sentRequests,
            });
          }
        );

        dispatch({ type: FRIENDS_ACTIONS.SET_LOADING, payload: false });
      } catch (error) {
        console.error("Error setting up friends listeners:", error);
        dispatch({ type: FRIENDS_ACTIONS.SET_ERROR, payload: error.message });
        dispatch({ type: FRIENDS_ACTIONS.SET_LOADING, payload: false });
      }
    };

    setupListeners();

    // Cleanup
    return () => {
      if (unsubscribeFriends) unsubscribeFriends();
      if (unsubscribePendingRequests) unsubscribePendingRequests();
      if (unsubscribeSentRequests) unsubscribeSentRequests();
    };
  }, [currentUser?.uid]);

  // Action creators
  const sendFriendRequest = async (targetUserId) => {
    try {
      console.log("🚀 Sending friend request to:", targetUserId);
      console.log("🔍 Current sent request IDs:", state.sentRequestIds);
      console.log("🔍 Current friend IDs:", state.friendIds);

      // Check if already friends
      if (state.friendIds.includes(targetUserId)) {
        throw new Error("Users are already friends");
      }

      // Check if request already sent
      if (state.sentRequestIds.includes(targetUserId)) {
        throw new Error("Friend request already exists");
      }

      await UserService.sendFriendRequest(currentUser.uid, targetUserId);

      // Add to pending immediately for UI responsiveness
      dispatch({
        type: FRIENDS_ACTIONS.ADD_PENDING_REQUEST,
        payload: { uid: targetUserId, from: currentUser.uid, to: targetUserId },
      });

      return true;
    } catch (error) {
      console.error("Error sending friend request:", error);
      throw error;
    }
  };

  const acceptFriendRequest = async (requestId, fromUserId) => {
    try {
      await UserService.acceptFriendRequest(requestId, currentUser.uid);

      // The listeners will automatically update the state
      return true;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  };

  const rejectFriendRequest = async (requestId, fromUserId) => {
    try {
      await UserService.rejectFriendRequest(requestId, currentUser.uid);

      // Remove from pending immediately
      dispatch({
        type: FRIENDS_ACTIONS.REMOVE_PENDING_REQUEST,
        payload: fromUserId,
      });

      return true;
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      throw error;
    }
  };

  const cancelFriendRequest = async (targetUserId) => {
    try {
      await UserService.cancelFriendRequest(currentUser.uid, targetUserId);

      // Remove from sent immediately
      dispatch({
        type: FRIENDS_ACTIONS.REMOVE_PENDING_REQUEST,
        payload: targetUserId,
      });

      return true;
    } catch (error) {
      console.error("Error canceling friend request:", error);
      throw error;
    }
  };

  const removeFriend = async (friendUserId) => {
    try {
      await UserService.removeFriend(currentUser.uid, friendUserId);

      // Remove from friends immediately
      dispatch({
        type: FRIENDS_ACTIONS.REMOVE_FRIEND,
        payload: friendUserId,
      });

      return true;
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  };

  // Helper functions
  const isFriend = (userId) => {
    return state.friendIds.includes(userId);
  };

  const isPending = (userId) => {
    // Check both directions: requests TO us and requests FROM us
    return (
      state.pendingRequestIds.includes(userId) ||
      state.sentRequestIds.includes(userId)
    );
  };

  const getFriendStatus = (userId) => {
    if (isFriend(userId)) return "friend";
    if (isPending(userId)) return "pending";
    return "none";
  };

  const getUserRelationshipData = (userId) => {
    const relationship = {
      isFriend: isFriend(userId),
      isPending: isPending(userId),
      status: getFriendStatus(userId),
    };

    console.log(`🔍 getUserRelationshipData for ${userId}:`, relationship);
    console.log("🔍 Current state:", {
      friendIds: state.friendIds,
      pendingRequestIds: state.pendingRequestIds,
      sentRequestIds: state.sentRequestIds,
    });

    return relationship;
  };

  const contextValue = {
    // State
    ...state,

    // Actions
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,

    // Helpers
    isFriend,
    isPending,
    getFriendStatus,
    getUserRelationshipData,
  };

  return (
    <FriendsContext.Provider value={contextValue}>
      {children}
    </FriendsContext.Provider>
  );
};

// Hook to use the context
export const useFriendsContext = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error("useFriendsContext must be used within a FriendsProvider");
  }
  return context;
};
