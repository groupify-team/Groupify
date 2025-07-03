/**
 * Hook for generic trip operations and management
 * Handles trip fetching, updating, member management, and photo operations
 */

import { useState, useEffect } from "react";
import { tripsService } from "../services/tripsService";
import {
  isUserTripAdmin,
  isUserTripMember,
} from "@dashboard/utils/tripHelpers";

export const useTripDetail = (tripId, currentUser) => {
  const [trip, setTrip] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Permission checks
  const isAdmin = trip ? isUserTripAdmin(trip, currentUser?.uid) : false;
  const isMember = trip ? isUserTripMember(trip, currentUser?.uid) : false;

  const fetchTripData = async () => {
    if (!tripId || !currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch trip details
      let tripData = await tripsService.getTripById(tripId);

      // Ensure creator is in admins array
      if (!tripData.admins?.includes(tripData.createdBy)) {
        tripData = {
          ...tripData,
          admins: [...(tripData.admins || []), tripData.createdBy],
        };
        await tripsService.updateTrip(tripId, tripData);
      }

      setTrip(tripData);

      // Check if user has access
      if (!tripData.members.includes(currentUser.uid)) {
        setError("You do not have access to this trip");
        return;
      }

      // Fetch photos and members in parallel
      const [photosData, membersData] = await Promise.all([
        tripsService.getTripPhotos(tripId),
        tripsService.getTripMembers(tripData.members),
      ]);

      setPhotos(photosData);
      setMembers(membersData);
    } catch (err) {
      console.error("Error fetching trip data:", err);
      setError(err.message || "Failed to load trip data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateTrip = async (updates) => {
    try {
      const updatedTrip = await tripsService.updateTrip(tripId, updates);
      setTrip((prev) => ({ ...prev, ...updates }));
      return updatedTrip;
    } catch (err) {
      console.error("Error updating trip:", err);
      throw err;
    }
  };

  const addPhotos = (newPhotos) => {
    setPhotos((prev) => [...newPhotos, ...prev]);
    if (trip) {
      setTrip((prev) => ({
        ...prev,
        photoCount: (prev.photoCount || 0) + newPhotos.length,
      }));
    }
  };

  const removePhotos = (photoIds) => {
    setPhotos((prev) => prev.filter((photo) => !photoIds.includes(photo.id)));
    if (trip) {
      setTrip((prev) => ({
        ...prev,
        photoCount: Math.max((prev.photoCount || 0) - photoIds.length, 0),
      }));
    }
  };

  const updateMember = (memberId, updates) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.uid === memberId ? { ...member, ...updates } : member
      )
    );
  };

  const removeMember = (memberId) => {
    setMembers((prev) => prev.filter((member) => member.uid !== memberId));
    if (trip) {
      setTrip((prev) => ({
        ...prev,
        members: prev.members?.filter((id) => id !== memberId),
        admins: prev.admins?.filter((id) => id !== memberId),
      }));
    }
  };

  const addMember = (newMember) => {
    setMembers((prev) => [...prev, newMember]);
    if (trip) {
      setTrip((prev) => ({
        ...prev,
        members: [...(prev.members || []), newMember.uid],
      }));
    }
  };

  useEffect(() => {
    fetchTripData();
  }, [tripId, currentUser]);

  return {
    // Data
    trip,
    photos,
    members,
    loading,
    error,

    // Permissions
    isAdmin,
    isMember,

    // Setters (for direct updates)
    setTrip,
    setPhotos,
    setMembers,
    setError,

    // Actions
    updateTrip,
    addPhotos,
    removePhotos,
    updateMember,
    removeMember,
    addMember,
    refetch: fetchTripData,
  };
};
