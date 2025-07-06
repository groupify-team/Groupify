// useDashboardData.js - COMPLETE FIXED VERSION with Trip Deletion Handler
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // ← ADDED
import { useAuth } from "@auth/contexts/AuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  documentId,
} from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import {
  getFriends,
  getPendingFriendRequests,
  getUserProfile,
} from "@firebase-services/users";
import { tripsService } from "@trips/services/tripsService";
import {
  hasFaceProfile,
  getProfilePhotos,
} from "@face-recognition/service/faceRecognitionService";
import { ERROR_MESSAGES } from "@dashboard/utils/dashboardConstants";

// Global state to share data between instances
let globalLoadPromise = null;
let globalUserId = null;
let globalData = null;
const globalSubscribers = new Set();

// Helper to notify all subscribers
const notifySubscribers = (data) => {
  globalSubscribers.forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      console.error("Error notifying subscriber:", error);
    }
  });
};

export const useDashboardData = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const location = useLocation(); // ← ADDED
  const navigate = useNavigate(); // ← ADDED

  // Refs
  const initialLoadDone = useRef(false);
  const unsubscribersRef = useRef([]);
  const loadingRef = useRef(false);
  const subscriberCallbackRef = useRef(null);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [trips, setTrips] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [tripInvites, setTripInvites] = useState([]);
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
    
    console.log("🔄 Updating from global data");
    setUserData(data.userProfile);
    setTrips(data.userTrips);
    setTripInvites(data.pendingInvites);
    setFriends(data.friendsData);
    setPendingRequests(data.friendRequests);
    setLoading(false);
  }, []);

  /**
   * Load face profile data
   */
  const loadFaceProfile = useCallback(() => {
    if (!currentUser?.uid) return;

    try {
      if (hasFaceProfile(currentUser.uid)) {
        setHasProfile(true);
        setProfilePhotos(getProfilePhotos(currentUser.uid));
      } else {
        setHasProfile(false);
        setProfilePhotos([]);
      }
    } catch (error) {
      console.error("❌ Error loading face profile:", error);
      setHasProfile(false);
      setProfilePhotos([]);
    }
  }, [currentUser?.uid]);

  /**
   * Load all dashboard data (with global deduplication and sharing)
   */
  const loadDashboardData = useCallback(async () => {
    // AUTH LOADING CHECK
    if (authLoading) {
      console.log("⏸️ Auth still loading, waiting...");
      return;
    }

    if (!currentUser?.uid) {
      console.log("⏸️ No user, setting loading to false");
      setLoading(false);
      return;
    }

    // If we have global data for this user, use it immediately
    if (globalData && globalUserId === currentUser.uid) {
      console.log("✅ Using cached global data");
      updateFromGlobalData(globalData);
      loadFaceProfile();
      return globalData;
    }

    // If already loading for this user, wait for it
    if (globalLoadPromise && globalUserId === currentUser.uid) {
      console.log("⏸️ Waiting for existing load operation...");
      try {
        const result = await globalLoadPromise;
        updateFromGlobalData(result);
        loadFaceProfile();
        return result;
      } catch (error) {
        console.error("❌ Global load operation failed:", error);
      }
    }

    // Prevent multiple simultaneous loads from same hook instance
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);

      const startTime = performance.now();
      console.log("🚀 Dashboard loading started...");

      // Set global tracking
      globalUserId = currentUser.uid;
      
      const loadOperation = async () => {
        // Load data in parallel
        const [userProfile, userTrips, pendingInvites] = await Promise.all([
          getUserProfile(currentUser.uid),
          getUserTrips(currentUser.uid),
          getPendingInvites(currentUser.uid)
        ]);

        console.log(`✅ Phase 1 completed in ${Math.round(performance.now() - startTime)}ms`);
        console.log(`📈 Found ${userTrips.length} trips`);

        // Load friends
        const friendIds = userProfile?.friends || [];
        let friendsData = [];
        let friendRequests = [];
        
        if (friendIds.length > 0) {
          try {
            [friendsData, friendRequests] = await Promise.all([
              getFriends(currentUser.uid),
              getPendingFriendRequests(currentUser.uid)
            ]);
          } catch (error) {
            console.error("❌ Error loading friends:", error);
          }
        }

        const totalTime = performance.now() - startTime;
        console.log(`🎉 Dashboard loading completed in ${Math.round(totalTime)}ms`);

        const result = {
          userProfile,
          userTrips,
          pendingInvites,
          friendsData,
          friendRequests
        };

        // Store globally and notify all subscribers
        globalData = result;
        notifySubscribers(result);

        return result;
      };

      // Set global promise
      globalLoadPromise = loadOperation();
      const result = await globalLoadPromise;

      // Update local state
      updateFromGlobalData(result);
      loadFaceProfile();

      initialLoadDone.current = true;
      
      return result;
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
      setError(ERROR_MESSAGES.loadingDashboard);
      showErrorMessage(ERROR_MESSAGES.loadingDashboard);
      
      // Clear global tracking on error
      globalLoadPromise = null;
      globalUserId = null;
      globalData = null;
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [authLoading, currentUser?.uid, loadFaceProfile, updateFromGlobalData]);

  // ← NEW: Function to immediately remove trip from state
  const removeTripFromState = useCallback((tripId) => {
    console.log(`🗑️ Immediately removing trip ${tripId} from state`);
    setTrips(currentTrips => {
      const updatedTrips = currentTrips.filter(trip => trip.id !== tripId);
      console.log(`🗑️ Trips updated: ${currentTrips.length} -> ${updatedTrips.length}`);
      return updatedTrips;
    });
    
    // Also update global data if it exists
    if (globalData && globalData.userTrips) {
      globalData.userTrips = globalData.userTrips.filter(trip => trip.id !== tripId);
      // Notify other subscribers
      notifySubscribers(globalData);
    }
  }, []);

  // Refresh functions
  const refreshTrips = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const updatedTrips = await getUserTrips(currentUser.uid);
      setTrips(updatedTrips);
      
      // Update global data
      if (globalData) {
        globalData.userTrips = updatedTrips;
      }
    } catch (error) {
      console.error("❌ Error refreshing trips:", error);
    }
  }, [currentUser?.uid]);

  const refreshFriends = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const updatedFriends = await getFriends(currentUser.uid);
      setFriends(updatedFriends);
      
      // Update global data
      if (globalData) {
        globalData.friendsData = updatedFriends;
      }
    } catch (error) {
      console.error("❌ Error refreshing friends:", error);
    }
  }, [currentUser?.uid]);

  const refreshPendingRequests = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const requests = await getPendingFriendRequests(currentUser.uid);
      setPendingRequests(requests || []);
      
      // Update global data
      if (globalData) {
        globalData.friendRequests = requests || [];
      }
    } catch (error) {
      console.error("❌ Error refreshing pending requests:", error);
    }
  }, [currentUser?.uid]);

  // Message functions
  const showSuccessMessage = useCallback((message, duration = 3000) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(null), duration);
  }, []);

  const showErrorMessage = useCallback((message, duration = 4000) => {
    setShowError(message);
    setTimeout(() => setShowError(null), duration);
  }, []);

  // State updater functions
  const updateFaceProfile = useCallback((hasProfileData, photos = []) => {
    setHasProfile(hasProfileData);
    setProfilePhotos(photos);
  }, []);

  const addTrip = useCallback((newTrip) => {
    console.log("➕ Adding trip:", newTrip);
    setTrips((prev) => [newTrip, ...prev]);
  }, []);

  const removeTrip = useCallback((tripId) => {
    console.log("➖ Removing trip:", tripId);
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
  }, []);

  const updateTrip = useCallback((tripId, updatedData) => {
    console.log("✏️ Updating trip:", tripId, updatedData);
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, ...updatedData } : trip
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

  const addTripInvite = useCallback((invite) => {
    setTripInvites((prev) => [...prev, invite]);
  }, []);

  const removeTripInvite = useCallback((inviteId) => {
    setTripInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
  }, []);

  const manualRefresh = useCallback(() => {
    console.log("🔄 Manual refresh triggered");
    initialLoadDone.current = false;
    loadingRef.current = false;
    // Clear global state to force fresh load
    globalLoadPromise = null;
    globalUserId = null;
    globalData = null;
    loadDashboardData();
  }, [loadDashboardData]);

  // ← NEW: Effect to handle navigation state (trip deletions, etc.)
  useEffect(() => {
    const state = location.state;
    
    if (state && state.deletedTripId) {
      console.log(`🗑️ Processing deleted trip from navigation: ${state.deletedTripId}`);
      
      // Immediately remove from state
      removeTripFromState(state.deletedTripId);
      
      // Clear the navigation state to prevent re-processing
      navigate(location.pathname, { 
        replace: true, 
        state: { ...state, deletedTripId: null } 
      });
      
      // Show success message
      showSuccessMessage("Trip deleted successfully!");
    }
    
    // Handle force refresh if needed
    if (state && state.forceRefresh && !state.deletedTripId) {
      console.log("🔄 Force refresh requested from navigation");
      refreshTrips();
      
      // Clear the state
      navigate(location.pathname, { 
        replace: true, 
        state: null 
      });
    }
  }, [location.state, removeTripFromState, navigate, location.pathname, refreshTrips, showSuccessMessage]);

  // Effect to handle global data sharing
  useEffect(() => {
    // AUTH LOADING CHECK
    if (authLoading) {
      console.log("⏸️ Auth still loading, skipping dashboard setup");
      return;
    }

    if (!currentUser?.uid) {
      console.log("⏸️ No user, skipping dashboard load");
      setLoading(false);
      return;
    }

    // Create subscriber callback
    subscriberCallbackRef.current = updateFromGlobalData;
    globalSubscribers.add(subscriberCallbackRef.current);

    // Load data if needed
    if (!initialLoadDone.current || globalUserId !== currentUser.uid) {
      console.log("🚀 Initializing dashboard for:", currentUser.uid);
      loadDashboardData();
    } else if (globalData && globalUserId === currentUser.uid) {
      console.log("✅ Using existing global data");
      updateFromGlobalData(globalData);
      loadFaceProfile();
    }

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up dashboard listeners");
      
      // Remove from global subscribers
      if (subscriberCallbackRef.current) {
        globalSubscribers.delete(subscriberCallbackRef.current);
      }
      
      // Cleanup local listeners
      unsubscribersRef.current.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          try {
            unsubscribe();
          } catch (error) {
            console.warn("⚠️ Error unsubscribing:", error);
          }
        }
      });
      unsubscribersRef.current = [];
    };
  }, [authLoading, currentUser?.uid, loadDashboardData, updateFromGlobalData, loadFaceProfile]);

  return {
    // Data states
    userData,
    trips,
    friends,
    pendingRequests,
    tripInvites,
    hasProfile,
    profilePhotos,

    // Loading states
    loading,
    error,
    isLoadingProfile,

    // Message states
    showSuccess,
    showError,

    // Data actions
    refreshTrips,
    refreshFriends,
    refreshPendingRequests,
    loadFaceProfile,

    // State updaters
    addTrip,
    removeTrip,
    updateTrip,
    addFriend,
    removeFriend,
    addPendingRequest,
    removePendingRequest,
    addTripInvite,
    removeTripInvite,
    updateFaceProfile,
    removeTripFromState, // ← NEW: Added to exports

    // Message actions
    showSuccessMessage,
    showErrorMessage,

    // Manual refresh
    loadDashboardData: manualRefresh,
  };
};