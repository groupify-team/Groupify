// hooks/useTripActions.js
import { useState, useCallback } from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import { toast } from "react-hot-toast";
import {
  createTrip,
  updateTrip,
  deleteTrip,
  canUserCreateTrip,
  getUserTripCount,
  MAX_TRIPS_PER_USER,
} from "../services/tripsService";

export const useTripActions = ({
  onTripCreated,
  onTripUpdated,
  onTripDeleted,
} = {}) => {
  const { currentUser } = useAuth();

  const [loadingStates, setLoadingStates] = useState({
    creating: false,
    updating: false,
    deleting: false,
  });

  const setLoading = useCallback((operation, isLoading) => {
    setLoadingStates((prev) => ({
      ...prev,
      [operation]: isLoading,
    }));
  }, []);

  const handleCreateTrip = useCallback(
    async (tripData) => {
      if (!currentUser?.uid) {
        toast.error("You must be logged in to create a trip");
        return null;
      }

      try {
        setLoading("creating", true);

        const canCreate = await canUserCreateTrip(currentUser.uid);
        if (!canCreate) {
          const currentCount = await getUserTripCount(currentUser.uid);
          toast.error(
            `Trip limit reached! You can only create ${MAX_TRIPS_PER_USER} trips. You currently have ${currentCount} trips.`
          );

          return null;
        }

        const newTripData = {
          ...tripData,
          createdBy: currentUser.uid,
          members: [currentUser.uid],
          admins: [currentUser.uid],
          status: "active",
        };

        const newTrip = await createTrip(newTripData);

        toast.success("Trip created successfully!");

        if (onTripCreated) {
          onTripCreated(newTrip);
        }

        return newTrip;
      } catch (error) {
        console.error("Error creating trip:", error);
        toast.error("Failed to create trip. Please try again.");
        return null;
      } finally {
        setLoading("creating", false);
      }
    },
    [currentUser?.uid, onTripCreated, setLoading]
  );

  const isLoading = useCallback(
    (operation = null) => {
      if (operation) {
        return loadingStates[operation] || false;
      }
      return Object.values(loadingStates).some((loading) => loading);
    },
    [loadingStates]
  );

  return {
    createTrip: handleCreateTrip,
    isLoading,
    loadingStates,
  };
};
