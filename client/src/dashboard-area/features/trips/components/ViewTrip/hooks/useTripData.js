/**
 * Hook for managing trip data, photos, and members in trip detail view
 * Handles data fetching, loading states, and permission checks
 */

import { useState, useEffect, useMemo } from "react";
import { getTrip, updateTrip } from "@shared/services/firebase/trips";
import { getTripPhotos } from "@shared/services/firebase/storage";
import { getUserProfile } from "@shared/services/firebase/users";

export const useTripData = (tripId, currentUserId) => {
  const [trip, setTrip] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [tripMembers, setTripMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTripAndPhotos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trip data
      let tripData = await getTrip(tripId);

      // Ensure creator is in admins array
      if (!tripData.admins?.includes(tripData.createdBy)) {
        tripData = {
          ...tripData,
          admins: [...(tripData.admins || []), tripData.createdBy],
        };
        await updateTrip(tripId, tripData);
      }

      setTrip(tripData);
      setIsAdmin(tripData?.admins?.includes(currentUserId));

      // Check if current user has access
      if (!tripData.members.includes(currentUserId)) {
        setError("You do not have access to this trip");
        setLoading(false);
        return;
      }

      // Fetch photos
      const photosData = await getTripPhotos(tripId);
      setPhotos(photosData);

      // Fetch member profiles
      if (tripData.members.length > 0) {
        const memberData = await Promise.all(
          tripData.members.map((uid) => getUserProfile(uid))
        );
        setMemberProfiles(memberData);
        setTripMembers(memberData);
      }
    } catch (error) {
      console.error("Error fetching trip data:", error);
      setError("Failed to load trip data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const refreshTripData = async () => {
    await fetchTripAndPhotos();
  };

  useEffect(() => {
    if (tripId && currentUserId) {
      fetchTripAndPhotos();
    }
  }, [tripId, currentUserId]);

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
