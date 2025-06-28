// useDashboardData.js - Main data management hook for dashboard
import { useState, useEffect } from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import {
  getFriends,
  getPendingFriendRequests,
  getUserProfile,
} from "@shared/services/firebase/users";
import {
  getUserTrips,
  getPendingInvites,
} from "@shared/services/firebase/trips";
import {
  hasFaceProfile,
  getProfilePhotos,
} from "@/features/trip-details/services/faceRecognitionService";
import { ERROR_MESSAGES } from "@dashboard/utils/dashboardConstants";

export const useDashboardData = () => {
  const { currentUser } = useAuth();

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Core data states
  const [userData, setUserData] = useState(null);
  const [trips, setTrips] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [tripInvites, setTripInvites] = useState([]);

  // Face profile states
  const [hasProfile, setHasProfile] = useState(false);
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Success/error message states
  const [showSuccess, setShowSuccess] = useState(null);
  const [showError, setShowError] = useState(null);

  /**
   * Load all dashboard data
   */
  const loadDashboardData = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      console.log("🔄 Loading dashboard data for user:", currentUser.uid);

      // Load data in parallel
      const [userProfile, userFriends, friendRequests, invites] =
        await Promise.all([
          getUserProfile(currentUser.uid),
          getFriends(currentUser.uid),
          getPendingFriendRequests(currentUser.uid),
          getPendingInvites(currentUser.uid),
        ]);

      console.log("👤 User profile:", userProfile);
      console.log("👥 Friends:", userFriends);
      console.log("📬 Friend requests:", friendRequests);
      console.log("🎫 Trip invites:", invites);

      // Load trips with fallback approach
      console.log("📋 Loading trips...");
      let userTrips = [];

      try {
        // First try the regular getUserTrips function
        userTrips = await getUserTrips(currentUser.uid);
        console.log("📋 getUserTrips result:", userTrips);

        // If no trips found, try alternative approach
        if (userTrips.length === 0) {
          console.log(
            "🔍 No trips from getUserTrips, trying direct queries..."
          );

          // Query trips where user is creator
          const createdTripsQuery = query(
            collection(db, "trips"),
            where("createdBy", "==", currentUser.uid)
          );

          // Query trips where user is member
          const memberTripsQuery = query(
            collection(db, "trips"),
            where("members", "array-contains", currentUser.uid)
          );

          const [createdSnapshot, memberSnapshot] = await Promise.all([
            getDocs(createdTripsQuery),
            getDocs(memberTripsQuery),
          ]);

          console.log("📋 Created trips found:", createdSnapshot.size);
          console.log("📋 Member trips found:", memberSnapshot.size);

          const foundTripIds = new Set();
          const foundTrips = [];

          createdSnapshot.forEach((doc) => {
            const trip = { id: doc.id, ...doc.data() };
            foundTrips.push(trip);
            foundTripIds.add(doc.id);
            console.log("📋 Found created trip:", doc.id, trip.name);
          });

          memberSnapshot.forEach((doc) => {
            if (!foundTripIds.has(doc.id)) {
              const trip = { id: doc.id, ...doc.data() };
              foundTrips.push(trip);
              foundTripIds.add(doc.id);
              console.log("📋 Found member trip:", doc.id, trip.name);
            }
          });

          userTrips = foundTrips;

          // Update user's trips array if we found trips
          if (foundTripIds.size > 0) {
            console.log("🔄 Updating user trips array...");
            try {
              const { updateDoc } = await import("firebase/firestore");
              const userRef = doc(db, "users", currentUser.uid);
              await updateDoc(userRef, {
                trips: Array.from(foundTripIds),
                updatedAt: new Date().toISOString(),
              });
              console.log("✅ User trips array updated successfully!");
            } catch (updateError) {
              console.warn(
                "⚠️ Could not update user trips array:",
                updateError
              );
            }
          }
        }
      } catch (tripsError) {
        console.error("❌ Error loading trips:", tripsError);
        userTrips = []; // Fallback to empty array
      }

      console.log("📋 Final trips result:", userTrips);

      // Update states
      setTrips(userTrips);
      setUserData(userProfile);
      setFriends(userFriends);
      setPendingRequests(friendRequests);
      setTripInvites(invites);

      // Load face profile
      loadFaceProfile();
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
      setError(ERROR_MESSAGES.loadingDashboard);
      showErrorMessage(ERROR_MESSAGES.loadingDashboard);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load face profile data
   */
  const loadFaceProfile = () => {
    if (!currentUser?.uid) return;

    try {
      if (hasFaceProfile(currentUser.uid)) {
        setHasProfile(true);
        setProfilePhotos(getProfilePhotos(currentUser.uid));
        console.log("✅ Face profile loaded");
      } else {
        setHasProfile(false);
        setProfilePhotos([]);
        console.log("ℹ️ No face profile found");
      }
    } catch (error) {
      console.error("❌ Error loading face profile:", error);
      setHasProfile(false);
      setProfilePhotos([]);
    }
  };

  /**
   * Refresh trips data
   */
  const refreshTrips = async () => {
    if (!currentUser?.uid) return;

    try {
      const updatedTrips = await getUserTrips(currentUser.uid);
      setTrips(updatedTrips);
      console.log("🔄 Trips refreshed:", updatedTrips.length);
    } catch (error) {
      console.error("❌ Error refreshing trips:", error);
    }
  };

  /**
   * Refresh friends data
   */
  const refreshFriends = async () => {
    if (!currentUser?.uid) return;

    try {
      const updatedFriends = await getFriends(currentUser.uid);
      setFriends(updatedFriends);
      console.log("🔄 Friends refreshed:", updatedFriends.length);
    } catch (error) {
      console.error("❌ Error refreshing friends:", error);
    }
  };

  /**
   * Refresh pending requests
   */
  const refreshPendingRequests = async () => {
    if (!currentUser?.uid) return;

    try {
      const requests = await getPendingFriendRequests(currentUser.uid);
      setPendingRequests(requests || []);
      console.log("🔄 Pending requests refreshed:", requests?.length || 0);
    } catch (error) {
      console.error("❌ Error refreshing pending requests:", error);
    }
  };

  /**
   * Show success message with auto-hide
   */
  const showSuccessMessage = (message, duration = 3000) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(null), duration);
  };

  /**
   * Show error message with auto-hide
   */
  const showErrorMessage = (message, duration = 4000) => {
    setShowError(message);
    setTimeout(() => setShowError(null), duration);
  };

  /**
   * Update face profile status
   */
  const updateFaceProfile = (hasProfileData, photos = []) => {
    setHasProfile(hasProfileData);
    setProfilePhotos(photos);
  };

  /**
   * Add new trip to state
   */
  const addTrip = (newTrip) => {
    setTrips((prev) => [newTrip, ...prev]);
  };

  /**
   * Remove trip from state
   */
  const removeTrip = (tripId) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
  };

  /**
   * Update trip in state
   */
  const updateTrip = (tripId, updatedData) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, ...updatedData } : trip
      )
    );
  };

  /**
   * Add friend to state
   */
  const addFriend = (newFriend) => {
    setFriends((prev) => [...prev, newFriend]);
  };

  /**
   * Remove friend from state
   */
  const removeFriend = (friendUid) => {
    setFriends((prev) => prev.filter((friend) => friend.uid !== friendUid));
  };

  /**
   * Add pending request to state
   */
  const addPendingRequest = (request) => {
    setPendingRequests((prev) => [...prev, request]);
  };

  /**
   * Remove pending request from state
   */
  const removePendingRequest = (requestId) => {
    setPendingRequests((prev) =>
      prev.filter((req) => req.id !== requestId && req.from !== requestId)
    );
  };

  /**
   * Add trip invite to state
   */
  const addTripInvite = (invite) => {
    setTripInvites((prev) => [...prev, invite]);
  };

  /**
   * Remove trip invite from state
   */
  const removeTripInvite = (inviteId) => {
    setTripInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
  };

  // Set up real-time listeners
  useEffect(() => {
    if (!currentUser?.uid) return;

    let unsubscribeFriends = () => {};
    let unsubscribePendingRequests = () => {};

    // --- Live Friends Listener ---
    const userDocRef = doc(db, "users", currentUser.uid);

    getDoc(userDocRef).then((snap) => {
      if (!snap.exists()) {
        console.warn("⚠️ userDoc does not exist yet:", currentUser.uid);
        return;
      }

      unsubscribeFriends = onSnapshot(userDocRef, async (docSnap) => {
        if (!docSnap.exists()) return;
        console.log("🔁 Friends snapshot triggered");

        const data = docSnap.data();
        const friendIds = data.friends || [];
        const friendsData = [];

        for (const fid of friendIds) {
          if (!fid || typeof fid !== "string" || fid.trim() === "") {
            console.warn("⚠️ Skipping invalid friend ID:", fid);
            continue;
          }

          try {
            const friendRef = doc(db, "users", fid);
            const friendSnap = await getDoc(friendRef);

            if (friendSnap.exists()) {
              const fData = friendSnap.data();
              friendsData.push({
                uid: fid,
                displayName: fData.displayName || fData.email || fid,
                email: fData.email || "",
                photoURL: fData.photoURL || "",
              });
            }
          } catch (err) {
            console.error(`❌ Error fetching friend ${fid}:`, err);
          }
        }

        setFriends(friendsData);
      });
    });

    // --- Live Pending Friend Requests Listener ---
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

          if (data.from === currentUser.uid) continue;

          try {
            const senderRef = doc(db, "users", data.from);
            const senderSnap = await getDoc(senderRef);

            requests.push({
              id: docSnap.id,
              from: data.from,
              displayName: senderSnap.exists()
                ? senderSnap.data().displayName
                : "",
              email: senderSnap.exists() ? senderSnap.data().email : "",
              photoURL: senderSnap.exists() ? senderSnap.data().photoURL : null,
              createdAt: data.createdAt,
            });
          } catch (err) {
            console.warn("⚠️ Error fetching sender:", data.from, err);
          }
        }

        setPendingRequests(requests);
      }
    );

    // Initial data load
    loadDashboardData();

    // Cleanup listeners
    return () => {
      unsubscribeFriends();
      unsubscribePendingRequests();
    };
  }, [currentUser]);

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

    // Message actions
    showSuccessMessage,
    showErrorMessage,

    // Manual refresh
    loadDashboardData,
  };
};
