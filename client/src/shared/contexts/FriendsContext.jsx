import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { UserService } from "@shared/services/user/UserService";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@shared/services/firebase/config";

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

const initialState = {
  friends: [],
  friendIds: [],
  pendingRequests: [],
  pendingRequestIds: [],
  sentRequests: [],
  sentRequestIds: [],
  loading: true,
  error: null,
};

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

const FriendsContext = createContext();

export const FriendsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(friendsReducer, initialState);

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

        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeFriends = onSnapshot(userDocRef, async (docSnap) => {
          if (!docSnap.exists()) return;

          const data = docSnap.data();
          const friendIds = [...new Set(data.friends || [])];

          if (friendIds.length === 0) {
            dispatch({ type: FRIENDS_ACTIONS.SET_FRIENDS, payload: [] });
            return;
          }

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
                    uid: data.to,
                    displayName: recipientProfile.displayName,
                    email: recipientProfile.email,
                    photoURL: recipientProfile.photoURL,
                  });
                } else {
                  sentRequests.push({
                    id: docSnap.id,
                    ...data,
                    uid: data.to,
                  });
                }
              } catch (error) {
                console.warn(`Failed to fetch recipient ${data.to}:`, error);
                sentRequests.push({
                  id: docSnap.id,
                  ...data,
                  uid: data.to,
                });
              }
            }

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
    return () => {
      if (unsubscribeFriends) unsubscribeFriends();
      if (unsubscribePendingRequests) unsubscribePendingRequests();
      if (unsubscribeSentRequests) unsubscribeSentRequests();
    };
  }, [currentUser?.uid]);

  const sendFriendRequest = async (targetUserId) => {
    try {
      if (state.friendIds.includes(targetUserId)) {
        throw new Error("Users are already friends");
      }
      if (state.sentRequestIds.includes(targetUserId)) {
        throw new Error("Friend request already exists");
      }
      await UserService.sendFriendRequest(currentUser.uid, targetUserId);
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
      return true;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  };

  const rejectFriendRequest = async (requestId, fromUserId) => {
    try {
      await UserService.rejectFriendRequest(requestId, currentUser.uid);
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

  const isFriend = (userId) => {
    return state.friendIds.includes(userId);
  };

  const isPending = (userId) => {
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
    return relationship;
  };

  const contextValue = {
    ...state,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
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

export const useFriendsContext = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error("useFriendsContext must be used within a FriendsProvider");
  }
  return context;
};
