import { useState, useEffect, useRef, useCallback } from "react";
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
} from "@shared/services/faceRecognitionService";
import { ERROR_MESSAGES } from "@dashboard/utils/dashboardConstants";

export const useDashboardData = () => {
  const { currentUser } = useAuth();

  // ALL useRef hooks must be at the top, called unconditionally
  const initialLoadDone = useRef(false);
  const unsubscribersRef = useRef([]);
  const loadingRef = useRef(false);

  // ALL useState hooks must be called unconditionally
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
   * Load face profile data
   */
  const loadFaceProfile = useCallback(() => {
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
  }, [currentUser?.uid]);

  /**
   * Load all dashboard data
   */
  const loadDashboardData = useCallback(async () => {
    if (!currentUser?.uid || loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
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
        userTrips = await getUserTrips(currentUser.uid);
        console.log("📋 getUserTrips result:", userTrips);

        if (userTrips.length === 0) {
          console.log("🔍 No trips from getUserTrips, trying direct queries...");

          const createdTripsQuery = query(
            collection(db, "trips"),
            where("createdBy", "==", currentUser.uid)
          );

          const memberTripsQuery = query(
            collection(db, "trips"),
            where("members", "array-contains", currentUser.uid)
          );

          const [createdSnapshot, memberSnapshot] = await Promise.all([
            getDocs(createdTripsQuery),
            getDocs(memberTripsQuery),
          ]);

          const foundTripIds = new Set();
          const foundTrips = [];

          createdSnapshot.forEach((doc) => {
            const trip = { id: doc.id, ...doc.data() };
            foundTrips.push(trip);
            foundTripIds.add(doc.id);
          });

          memberSnapshot.forEach((doc) => {
            if (!foundTripIds.has(doc.id)) {
              const trip = { id: doc.id, ...doc.data() };
              foundTrips.push(trip);
              foundTripIds.add(doc.id);
            }
          });

          userTrips = foundTrips;

          if (foundTripIds.size > 0) {
            try {
              const { updateDoc } = await import("firebase/firestore");
              const userRef = doc(db, "users", currentUser.uid);
              await updateDoc(userRef, {
                trips: Array.from(foundTripIds),
                updatedAt: new Date().toISOString(),
              });
              console.log("✅ User trips array updated successfully!");
            } catch (updateError) {
              console.warn("⚠️ Could not update user trips array:", updateError);
            }
          }
        }
      } catch (tripsError) {
        console.error("❌ Error loading trips:", tripsError);
        userTrips = [];
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
      
      // Mark initial load as done
      initialLoadDone.current = true;

    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
      setError(ERROR_MESSAGES.loadingDashboard);
      showErrorMessage(ERROR_MESSAGES.loadingDashboard);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [currentUser?.uid, loadFaceProfile]);

  /**
   * Refresh functions
   */
  const refreshTrips = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      const updatedTrips = await getUserTrips(currentUser.uid);
      setTrips(updatedTrips);
      console.log("🔄 Trips refreshed:", updatedTrips.length);
    } catch (error) {
      console.error("❌ Error refreshing trips:", error);
    }
  }, [currentUser?.uid]);

  const refreshFriends = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      const updatedFriends = await getFriends(currentUser.uid);
      setFriends(updatedFriends);
      console.log("🔄 Friends refreshed:", updatedFriends.length);
    } catch (error) {
      console.error("❌ Error refreshing friends:", error);
    }
  }, [currentUser?.uid]);

  const refreshPendingRequests = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      const requests = await getPendingFriendRequests(currentUser.uid);
      setPendingRequests(requests || []);
      console.log("🔄 Pending requests refreshed:", requests?.length || 0);
    } catch (error) {
      console.error("❌ Error refreshing pending requests:", error);
    }
  }, [currentUser?.uid]);

  /**
   * Message functions
   */
  const showSuccessMessage = useCallback((message, duration = 3000) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(null), duration);
  }, []);

  const showErrorMessage = useCallback((message, duration = 4000) => {
    setShowError(message);
    setTimeout(() => setShowError(null), duration);
  }, []);

  /**
   * State updater functions
   */
  const updateFaceProfile = useCallback((hasProfileData, photos = []) => {
    setHasProfile(hasProfileData);
    setProfilePhotos(photos);
  }, []);

  const addTrip = useCallback((newTrip) => {
    setTrips((prev) => [newTrip, ...prev]);
  }, []);

  const removeTrip = useCallback((tripId) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
  }, []);

  const updateTrip = useCallback((tripId, updatedData) => {
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
    setFriends((prev) => {
      const filtered = prev.filter((friend) => friend.uid !== friendUid);
      console.log("🗑️ Removing friend from state:", friendUid);
      console.log("🗑️ Before:", prev.length, "After:", filtered.length);
      return filtered;
    });
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
    initialLoadDone.current = false;
    loadingRef.current = false;
    loadDashboardData();
  }, [loadDashboardData]);

  // Set up real-time listeners (only once)
  useEffect(() => {
    if (!currentUser?.uid) return;

    let isMounted = true;

    const setupListeners = async () => {
      try {
        // Clean up existing listeners
        unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
        unsubscribersRef.current = [];

        const userDocRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userDocRef);
        
        if (!snap.exists() || !isMounted) {
          console.warn("⚠️ userDoc does not exist yet:", currentUser.uid);
          return;
        }

        // Friends listener
        const unsubscribeFriends = onSnapshot(userDocRef, async (docSnap) => {
          if (!docSnap.exists() || !isMounted) return;
          console.log("🔁 Friends snapshot triggered");

          const data = docSnap.data();
          const friendIds = [...new Set(data.friends || [])]; // Remove duplicates
          
          const friendsData = [];

          for (const fid of friendIds) {
            if (!fid || typeof fid !== "string" || fid.trim() === "") {
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

          // Remove duplicates in final data
          const uniqueFriendsData = friendsData.filter((friend, index, self) => 
            index === self.findIndex((f) => f.uid === friend.uid)
          );

          if (isMounted) {
            setFriends(uniqueFriendsData);
          }
        });

        // Pending requests listener
        const pendingRequestsQuery = query(
          collection(db, "friendRequests"),
          where("to", "==", currentUser.uid),
          where("status", "==", "pending")
        );

        const unsubscribePendingRequests = onSnapshot(
          pendingRequestsQuery,
          async (snapshot) => {
            if (!isMounted) return;
            
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
                  displayName: senderSnap.exists() ? senderSnap.data().displayName : "",
                  email: senderSnap.exists() ? senderSnap.data().email : "",
                  photoURL: senderSnap.exists() ? senderSnap.data().photoURL : null,
                  createdAt: data.createdAt,
                });
              } catch (err) {
                console.warn("⚠️ Error fetching sender:", data.from, err);
              }
            }

            if (isMounted) {
              setPendingRequests(requests);
            }
          }
        );

        // Store unsubscribers
        unsubscribersRef.current = [unsubscribeFriends, unsubscribePendingRequests];

      } catch (error) {
        console.error("❌ Error setting up listeners:", error);
      }
    };

    // Initial load only if not done
    if (!initialLoadDone.current) {
      loadDashboardData().then(() => {
        if (isMounted) {
          setupListeners();
        }
      });
    } else {
      setupListeners();
    }

    // Cleanup
    return () => {
      isMounted = false;
      unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribersRef.current = [];
    };
  }, [currentUser?.uid, loadDashboardData]);

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
    loadDashboardData: manualRefresh,
  };
};