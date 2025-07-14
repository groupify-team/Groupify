// useDashboardData.js - COMPLETE FIXED VERSION with event Deletion Handler
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // ? ADDED
import { useAuth } from "@auth/hooks/useAuth";

import {
  getPendingFriendRequests,
  getUserProfile,
} from "@/shared/services/firebase/users";
import { UserService } from "@shared/services/user/UserService";
import {
  getUserEvents,
  getPendingInvites,
} from "@shared/services/firebase/events";
import {
  hasFaceProfile,
  getProfilePhotos,
  createFaceProfile,
} from "@/dashboard-area/features/events/ViewEvent/features/faceRecognition/service/faceRecognitionService";
import { getFaceProfileFromStorage } from "@shared/services/firebase/faceProfiles";
import { ERROR_MESSAGES } from "@/shared/constants/messages";

// Global state to share data between instances
let globalLoadPromise = null;
let globalUserId = null;
let globalData = null;
const globalSubscribers = new Set();

// Make global data accessible for logout cleanup
if (typeof window !== "undefined") {
  window.globalData = null;
  window.clearGlobalData = () => {
    globalData = null;
    globalUserId = null;
    globalLoadPromise = null;
    globalSubscribers.clear();
    window.globalData = null;
  };
}

// Helper to notify all subscribers
const notifySubscribers = (data) => {
  globalSubscribers.forEach((callback) => {
    try {
      callback(data);
    } catch (error) {
      console.error("Error notifying subscriber:", error);
    }
  });
};

export const useDashboardData = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const location = useLocation(); // ? ADDED
  const navigate = useNavigate(); // ? ADDED

  // Refs
  const initialLoadDone = useRef(false);
  const unsubscribersRef = useRef([]);
  const loadingRef = useRef(false);
  const subscriberCallbackRef = useRef(null);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [events, setevents] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [eventInvites, setEventInvites] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showSuccess, setShowSuccess] = useState(null);
  const [showError, setShowError] = useState(null);

  /**
   * Update local state from global data
   */
  const updateFromGlobalData = useCallback((data) => {
    if (!data) return;
    setUserData(data.userProfile);
    setevents(data.userevents);
    setEventInvites(data.pendingInvites);
    setFriends(data.friendsData);
    setPendingRequests(data.friendRequests);
    setLoading(false);
  }, []);

  /**
   * Load face profile data
   */
  const loadFaceProfile = useCallback(async () => {
    if (!currentUser?.uid) return;

    setIsLoadingProfile(true);
    try {
      if (hasFaceProfile(currentUser.uid)) {
        setHasProfile(true);
        setProfilePhotos(getProfilePhotos(currentUser.uid));
        return;
      }
      const storedProfile = await getFaceProfileFromStorage(currentUser.uid);
      if (
        storedProfile &&
        storedProfile.images &&
        storedProfile.images.length > 0
      ) {
        try {
          const imageUrls = storedProfile.images.map((img) => img.url);
          await createFaceProfile(currentUser.uid, imageUrls);
          setHasProfile(true);
          setProfilePhotos(getProfilePhotos(currentUser.uid));
        } catch (error) {
          console.error("❌ Failed to auto-load face profile:", error);
          setHasProfile(false);
          setProfilePhotos([]);
        }
      } else {
        setHasProfile(false);
        setProfilePhotos([]);
      }
    } catch (error) {
      console.error("❌ Error loading face profile:", error);
      setHasProfile(false);
      setProfilePhotos([]);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [currentUser?.uid]);

  const showErrorMessage = useCallback((message, duration = 4000) => {
    setShowError(message);
    setTimeout(() => setShowError(null), duration);
  }, []);

  const showSuccessMessage = useCallback((message, duration = 3000) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(null), duration);
  }, []);

  /**
   * Load all dashboard data (with global deduplication and sharing)
   */
  const loadDashboardData = useCallback(async () => {
    if (authLoading) {
      return;
    }
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    if (globalData && globalUserId === currentUser.uid) {
      updateFromGlobalData(globalData);
      loadFaceProfile();
      return globalData;
    }
    if (globalLoadPromise && globalUserId === currentUser.uid) {
      try {
        const result = await globalLoadPromise;
        updateFromGlobalData(result);
        loadFaceProfile();
        return result;
      } catch (error) {
        console.error("? Global load operation failed:", error);
      }
    }
    if (loadingRef.current) {
      return;
    }
    try {
      loadingRef.current = true;
      setLoading(true);
      globalUserId = currentUser.uid;
      const loadOperation = async () => {
        const [userProfile, userevents, pendingInvites] = await Promise.all([
          getUserProfile(currentUser.uid),
          getUserEvents(currentUser.uid),
          getPendingInvites(currentUser.uid),
        ]);
        const friendIds = userProfile?.friends || [];
        let friendsData = [];
        let friendRequests = [];
        if (friendIds.length > 0) {
          try {
            [friendsData, friendRequests] = await Promise.all([
              UserService.getUserFriends(currentUser.uid),
              getPendingFriendRequests(currentUser.uid),
            ]);
          } catch (error) {
            console.error("? Error loading friends:", error);
          }
        }
        const result = {
          userProfile,
          userevents,
          pendingInvites,
          friendsData,
          friendRequests,
        };

        globalData = result;
        notifySubscribers(result);
        return result;
      };

      globalLoadPromise = loadOperation();
      const result = await globalLoadPromise;
      updateFromGlobalData(result);
      loadFaceProfile();
      initialLoadDone.current = true;
      return result;
    } catch (error) {
      console.error("? Error loading dashboard data:", error);
      setError(ERROR_MESSAGES.dashboard.loadingDashboard);
      showErrorMessage(ERROR_MESSAGES.dashboard.loadingDashboard);
      globalLoadPromise = null;
      globalUserId = null;
      globalData = null;
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [
    authLoading,
    currentUser?.uid,
    loadFaceProfile,
    updateFromGlobalData,
    showErrorMessage,
  ]);

  const removeEventFromState = useCallback((eventId) => {
    setevents((currentevents) => {
      const updatedevents = currentevents.filter(
        (event) => event.id !== eventId
      );
      return updatedevents;
    });
    if (globalData && globalData.userevents) {
      globalData.userevents = globalData.userevents.filter(
        (event) => event.id !== eventId
      );
      notifySubscribers(globalData);
    }
  }, []);

  const refreshevents = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const updatedevents = await getUserEvents(currentUser.uid);
      setevents(updatedevents);
      if (globalData) {
        globalData.userevents = updatedevents;
      }
    } catch (error) {
      console.error("? Error refreshing events:", error);
    }
  }, [currentUser?.uid]);

  const refreshFriends = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const updatedFriends = await UserService.getUserFriends(currentUser.uid);
      setFriends(updatedFriends);

      // Update global data
      if (globalData) {
        globalData.friendsData = updatedFriends;
      }
    } catch (error) {
      console.error("? Error refreshing friends:", error);
    }
  }, [currentUser?.uid]);

  const refreshPendingRequests = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const requests = await getPendingFriendRequests(currentUser.uid);
      setPendingRequests(requests || []);

      if (globalData) {
        globalData.friendRequests = requests || [];
      }
    } catch (error) {
      console.error("? Error refreshing pending requests:", error);
    }
  }, [currentUser?.uid]);

  const updateFaceProfile = useCallback((hasProfileData, photos = []) => {
    setHasProfile(hasProfileData);
    setProfilePhotos(photos);
  }, []);

  const addEvent = useCallback((newEvent) => {
    setevents((prev) => [newEvent, ...prev]);
  }, []);

  const removeEvent = useCallback((eventId) => {
    setevents((prev) => prev.filter((event) => event.id !== eventId));
  }, []);

  const updateEvent = useCallback((eventId, updatedData) => {
    setevents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, ...updatedData } : event
      )
    );
  }, []);

  const addFriend = useCallback((newFriend) => {
    setFriends((prev) => [...prev, newFriend]);
  }, []);

  const removeFriend = useCallback((friendUid) => {
    setFriends((prev) => prev.filter((friend) => friend.uid !== friendUid));
  }, []);

  const addPendingRequest = useCallback((request) => {
    setPendingRequests((prev) => [...prev, request]);
  }, []);

  const removePendingRequest = useCallback((requestId) => {
    setPendingRequests((prev) =>
      prev.filter((req) => req.id !== requestId && req.from !== requestId)
    );
  }, []);

  const addEventInvite = useCallback((invite) => {
    setEventInvites((prev) => [...prev, invite]);
  }, []);

  const removeEventInvite = useCallback((inviteId) => {
    setEventInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
  }, []);

  const manualRefresh = useCallback(() => {
    initialLoadDone.current = false;
    loadingRef.current = false;
    globalLoadPromise = null;
    globalUserId = null;
    globalData = null;
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const state = location.state;
    if (state && state.leftEventId) {
      removeEventFromState(state.leftEventId);
      navigate(location.pathname, {
        replace: true,
        state: { ...state, leftEventId: null },
      });
      showSuccessMessage("You have left the event successfully!");
    }

    if (
      state &&
      state.forceRefresh &&
      !state.deletedeventId &&
      !state.leftEventId
    ) {
      refreshevents();

      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  }, [
    location.state,
    location.pathname,
    removeEventFromState,
    navigate,
    refreshevents,
    showSuccessMessage,
  ]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    subscriberCallbackRef.current = updateFromGlobalData;
    globalSubscribers.add(subscriberCallbackRef.current);

    if (!initialLoadDone.current || globalUserId !== currentUser.uid) {
      loadDashboardData();
    } else if (globalData && globalUserId === currentUser.uid) {
      updateFromGlobalData(globalData);
      loadFaceProfile();
    }

    return () => {
      if (subscriberCallbackRef.current) {
        globalSubscribers.delete(subscriberCallbackRef.current);
      }
      unsubscribersRef.current.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          try {
            unsubscribe();
          } catch (error) {
            console.warn("?? Error unsubscribing:", error);
          }
        }
      });
      unsubscribersRef.current = [];
    };
  }, [
    authLoading,
    currentUser?.uid,
    loadDashboardData,
    updateFromGlobalData,
    loadFaceProfile,
  ]);

  return {
    userData,
    events,
    friends,
    pendingRequests,
    eventInvites,
    hasProfile,
    profilePhotos,
    loading,
    error,
    isLoadingProfile,
    showSuccess,
    showError,
    refreshevents,
    refreshFriends,
    refreshPendingRequests,
    loadFaceProfile,
    addEvent,
    removeEvent,
    updateEvent,
    addFriend,
    removeFriend,
    addPendingRequest,
    removePendingRequest,
    addEventInvite,
    removeEventInvite,
    updateFaceProfile,
    removeEventFromState,
    showSuccessMessage,
    showErrorMessage,
    loadDashboardData: manualRefresh,
  };
};
