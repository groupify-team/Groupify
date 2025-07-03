/**
 * Hook for managing user trips list and trip CRUD operations
 * Handles fetching all trips, creating new trips, and trip validation
 */

import { useState, useEffect } from "react";
import { tripsService } from "../services/tripsService";

export const useTrips = (userId) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrips = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const userTrips = await tripsService.getTrips(userId);
      setTrips(userTrips);
    } catch (err) {
      console.error("Error fetching trips:", err);
      setError(err.message || "Failed to fetch trips");
    } finally {
      setLoading(false);
    }
  };

  const createTrip = async (tripData) => {
    try {
      setError(null);

      // Check if user can create more trips
      const canCreate = await tripsService.canUserCreateTrip(userId);
      if (!canCreate) {
        const currentCount = await tripsService.getUserTripCount(userId);
        throw new Error(
          `Trip limit reached! You can only create ${tripsService.MAX_TRIPS_PER_USER} trips. You currently have ${currentCount} trips.`
        );
      }

      const newTrip = await tripsService.createTrip({
        ...tripData,
        createdBy: userId,
        members: [userId],
        admins: [userId],
        photoCount: 0,
      });

      // Add to local state
      setTrips((prev) => [newTrip, ...prev]);
      return newTrip;
    } catch (err) {
      console.error("Error creating trip:", err);
      setError(err.message || "Failed to create trip");
      throw err;
    }
  };

  const updateTrip = async (tripId, updates) => {
    try {
      setError(null);
      const updatedTrip = await tripsService.updateTrip(tripId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setTrips((prev) =>
        prev.map((trip) =>
          trip.id === tripId ? { ...trip, ...updates } : trip
        )
      );

      return updatedTrip;
    } catch (err) {
      console.error("Error updating trip:", err);
      setError(err.message || "Failed to update trip");
      throw err;
    }
  };

  const deleteTrip = async (tripId) => {
    try {
      setError(null);
      await tripsService.deleteTrip(tripId);

      // Remove from local state
      setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
    } catch (err) {
      console.error("Error deleting trip:", err);
      setError(err.message || "Failed to delete trip");
      throw err;
    }
  };

  const addTripToList = (newTrip) => {
    setTrips((prev) => [newTrip, ...prev]);
  };

  const removeTripFromList = (tripId) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
  };

  useEffect(() => {
    fetchTrips();
  }, [userId]);

  return {
    trips,
    loading,
    error,
    setTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    addTripToList,
    removeTripFromList,
    refetch: fetchTrips,
  };
};
