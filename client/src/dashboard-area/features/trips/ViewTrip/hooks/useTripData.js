/**
 * Hook for managin  // PERFORMANCE OPTIMIZED: Fetch data in parallel + add timing + prevent duplicates
  const fetchTripAndPhotos = useCallback(async () => {
    const currentKey = `${tripId}-${currentUserId}`;
    
    // PERFORMANCE: Prevent duplicate fetches
    if (fetchInProgress.current || lastFetchKey.current === currentKey) {
      console.log("⏭️ Skipping duplicate fetch for", currentKey);
      return;
    }
    
    fetchInProgress.current = true;
    lastFetchKey.current = currentKey;
    
    try {
      setLoading(true);
      setError(null);

      console.log("🚀 Starting trip data fetch...");
      const startTime = performance.now();

      // OPTIMIZATION 1: Fetch trip and photos in parallel
      const [tripData, photosData] = await Promise.all([
        measureAsyncPerformance("Trip fetch", () => getTrip(tripId)),
        measureAsyncPerformance("Photos fetch", () => getTripPhotos(tripId))
      ]);hotos, and members in trip detail view
 * PERFORMANCE OPTIMIZED VERSION
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getTrip, updateTrip } from "@shared/services/firebase/trips";
import { getTripPhotos } from "@shared/services/firebase/storage";
import { getUserProfile } from "@firebase-services/users";
import { measureAsyncPerformance } from "@shared/utils/performance";

export const useTripData = (tripId, currentUserId) => {
  const [trip, setTrip] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [tripMembers, setTripMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // PERFORMANCE: Add dependency tracking to prevent duplicate calls
  const lastFetchKey = useRef(null);
  const fetchInProgress = useRef(false);

  // PERFORMANCE OPTIMIZED: Fetch data in parallel + add timing
  const fetchTripAndPhotos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🚀 Starting trip data fetch...");
      const startTime = performance.now();

      // OPTIMIZATION 1: Fetch trip and photos in parallel
      const [tripData, photosData] = await Promise.all([
        measureAsyncPerformance("Trip fetch", () => getTrip(tripId)),
        measureAsyncPerformance("Photos fetch", () => getTripPhotos(tripId)),
      ]);

      // Ensure creator is in admins array
      let updatedTripData = tripData;
      if (!tripData.admins?.includes(tripData.createdBy)) {
        updatedTripData = {
          ...tripData,
          admins: [...(tripData.admins || []), tripData.createdBy],
        };
        await updateTrip(tripId, updatedTripData);
      }

      setTrip(updatedTripData);
      setIsAdmin(updatedTripData?.admins?.includes(currentUserId));

      // Check if current user has access
      if (!updatedTripData.members.includes(currentUserId)) {
        setError("You do not have access to this trip");
        setLoading(false);
        return;
      }

      // Set photos immediately for faster UI
      setPhotos(photosData);

      // OPTIMIZATION 2: Load member profiles in background (non-blocking)
      if (updatedTripData.members.length > 0) {
        // Don't await - load in background
        measureAsyncPerformance("Member profiles fetch", async () => {
          const memberData = await Promise.all(
            updatedTripData.members.map((uid) => getUserProfile(uid))
          );
          setMemberProfiles(memberData);
          setTripMembers(memberData);
        });
      }

      const endTime = performance.now();
      console.log(
        `✅ Trip data loaded in ${(endTime - startTime).toFixed(2)}ms`
      );
    } catch (error) {
      console.error("❌ Error fetching trip data:", error);
      setError("Failed to load trip data. Please try again.");
    } finally {
      setLoading(false);
      fetchInProgress.current = false; // Reset flag
    }
  }, [tripId, currentUserId]);

  const refreshTripData = async () => {
    await fetchTripAndPhotos();
  };

  useEffect(() => {
    if (tripId && currentUserId) {
      fetchTripAndPhotos();
    }
  }, [tripId, currentUserId, fetchTripAndPhotos]);

  return {
    // Data
    trip,
    photos,
    tripMembers: useMemo(
      () =>
        [...tripMembers].sort((a, b) => {
          if (a.uid === currentUserId) return -1;
          if (b.uid === currentUserId) return 1;
          if (a.uid === trip?.createdBy) return -1;
          if (b.uid === trip?.createdBy) return 1;
          return (a.displayName || a.email || "").localeCompare(
            b.displayName || b.email || ""
          );
        }),
      [tripMembers, currentUserId, trip?.createdBy]
    ),
    memberProfiles,
    isAdmin,
    loading,
    error,
    setTrip,
    setPhotos,
    setTripMembers,
    refreshTripData,
  };
};
