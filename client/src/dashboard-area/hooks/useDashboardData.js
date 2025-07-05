// useDashboardData.js - Fixed version with proper real-time updates
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
} from "@firebase-services/users";
import { tripsService } from "@trips/services/tripsService";
import {
  hasFaceProfile,
  getProfilePhotos,
} from "@face-recognition/service/faceRecognitionService";
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
   * Load all dashboard data
   */
  const loadDashboardData = useCallback(async () => {
    if (!currentUser?.uid || loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);

      // Load data in parallel
      const [userProfile, userFriends, friendRequests, invites] =
        await Promise.all([
          getUserProfile(currentUser.uid),
          getFriends(currentUser.uid),
          getPendingFriendRequests(currentUser.uid),
        ]);

      // Load trips with fallback approach
      let userTrips = [];

      try {
        userTrips = await tripsService.getTrips(currentUser.uid);

        if (userTrips.length === 0) {
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
        userTrips = [];
      }

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
      const updatedTrips = await tripsService.getTrips(currentUser.uid);
      setTrips(updatedTrips);
    } catch (error) {
      console.error("❌ Error refreshing trips:", error);
    }
  }, [currentUser?.uid]);

  const refreshFriends = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      const updatedFriends = await getFriends(currentUser.uid);
      setFriends(updatedFriends);
    } catch (error) {
      console.error("❌ Error refreshing friends:", error);
    }
  }, [currentUser?.uid]);

  const refreshPendingRequests = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      const requests = await getPendingFriendRequests(currentUser.uid);
      setPendingRequests(requests || []);
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

      return filtered;
    });
  }, []);

  const addPendingRequest = useCallback((request) => {
    setPendingRequests((prev) => [...prev, request]);
  }, []);

  const removePendingRequest = useCallback((requestId) => {
    setPendingRequests((prev) => {
      const filtered = prev.filter(
        (req) => req.id !== requestId && req.from !== requestId
      );

      return filtered;
    });
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

  // Set up real-time listeners ONLY ONCE per user
  useEffect(() => {
    if (!currentUser?.uid) return;

    let isMounted = true;
    const currentUid = currentUser.uid; // Capture current UID

    const setupListeners = async () => {
      try {
        // Clean up existing listeners first
        unsubscribersRef.current.forEach((unsubscribe) => {
          if (typeof unsubscribe === "function") {
            unsubscribe();
          }
        });
        unsubscribersRef.current = [];

        // --- FRIENDS LISTENER ---
        const userDocRef = doc(db, "users", currentUid);

        const unsubscribeFriends = onSnapshot(userDocRef, async (docSnap) => {
          if (!docSnap.exists() || !isMounted) return;

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
          const uniqueFriendsData = friendsData.filter(
            (friend, index, self) =>
              index === self.findIndex((f) => f.uid === friend.uid)
          );

          if (isMounted) {
            setFriends(uniqueFriendsData);
          }
        });

        // --- PENDING FRIEND REQUESTS LISTENER ---
        const pendingRequestsQuery = query(
          collection(db, "friendRequests"),
          where("to", "==", currentUid),
          where("status", "==", "pending")
        );

        const unsubscribePendingRequests = onSnapshot(
          pendingRequestsQuery,
          async (snapshot) => {
            if (!isMounted) return;

            const requests = [];

            for (const docSnap of snapshot.docs) {
              const data = docSnap.data();

              if (data.from === currentUid) {
                continue;
              }

              try {
                const senderRef = doc(db, "users", data.from);
                const senderSnap = await getDoc(senderRef);

                if (senderSnap.exists()) {
                  const requestData = {
                    id: docSnap.id,
                    from: data.from,
                    displayName: senderSnap.data().displayName || "",
                    email: senderSnap.data().email || "",
                    photoURL: senderSnap.data().photoURL || null,
                    createdAt: data.createdAt,
                  };

                  requests.push(requestData);
                } else {
                  console.warn(
                    "⚠️ Sender document doesn't exist for:",
                    data.from
                  );
                }
              } catch (err) {
                console.warn("⚠️ Error fetching sender:", data.from, err);
              }
            }

            if (isMounted) {
              setPendingRequests(requests);

              // Show toast notification for new requests
              if (requests.length > 0) {
              }
            }
          },
          (error) => {
            console.error("❌ Error in friend requests listener:", error);
          }
        );

        // Store unsubscribers
        unsubscribersRef.current = [
          unsubscribeFriends,
          unsubscribePendingRequests,
        ];
      } catch (error) {
        console.error("❌ Error setting up listeners:", error);
      }
    };

    // Initial load and setup listeners
    if (!initialLoadDone.current && !loadingRef.current) {
      loadDashboardData().then(() => {
        if (isMounted) {
          setupListeners();
        }
      });
    } else if (initialLoadDone.current) {
      setupListeners();
    }

    // Cleanup
    return () => {
      isMounted = false;
      unsubscribersRef.current.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
      unsubscribersRef.current = [];
    };
  }, [currentUser?.uid]); // Only depend on currentUser.uid

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
