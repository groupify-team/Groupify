/**
 * Enhanced hook for managing user trips list and trip CRUD operations
 * Handles fetching all trips, creating new trips, and trip validation with plan limits
 */

import { useState, useEffect, useCallback } from "react";
import { tripsService } from "../services/tripsService";
import { usePlanLimits } from "../../../shared/hooks/usePlanLimits";
import { toast } from "react-hot-toast";

export const useTrips = (userId) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncingUsage, setSyncingUsage] = useState(false);

  // Plan limits integration
  const {
    canPerformAction,
    enforceLimit,
    updateUsage,
    getUsageInfo,
    getPlanFeatures,
    isFreePlan,
    isPremiumPlan,
    isProPlan
  } = usePlanLimits();

  const fetchTrips = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const userTrips = await tripsService.getTrips(userId);
      setTrips(userTrips);

      // Update usage tracking with actual trip count
      const currentUsage = getUsageInfo();
      if (currentUsage && userTrips.length !== currentUsage.trips.used) {
        updateUsage({ trips: userTrips.length });
      }
    } catch (err) {
      console.error("Error fetching trips:", err);
      setError(err.message || "Failed to fetch trips");
    } finally {
      setLoading(false);
    }
  }, [userId, getUsageInfo, updateUsage]);

  const createTrip = async (tripData) => {
    try {
      setError(null);

      // Enhanced plan validation before creation
      const currentTripCount = trips.length;
      const limitCheck = canPerformAction('create_trip', { currentTripCount });

      if (!limitCheck.allowed) {
        if (limitCheck.upgradeRequired) {
          throw new Error(
            `${limitCheck.reason}. Upgrade your plan to create more trips.`
          );
        } else {
          throw new Error(limitCheck.reason);
        }
      }

      // Check legacy limits for backward compatibility
      const canCreate = await tripsService.canUserCreateTrip(userId);
      if (!canCreate) {
        const currentCount = await tripsService.getUserTripCount(userId);
        const planFeatures = getPlanFeatures();
        const planLimit = planFeatures?.trips || tripsService.MAX_TRIPS_PER_USER;
        
        throw new Error(
          `Trip limit reached! You can only create ${planLimit} trips. You currently have ${currentCount} trips.`
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

      // Show success message with plan context
      const planFeatures = getPlanFeatures();
      const remaining = planFeatures?.trips === 'unlimited' 
        ? 'unlimited' 
        : planFeatures?.trips - (currentTripCount + 1);
      
      if (remaining !== 'unlimited' && remaining <= 2) {
        toast.success(
          `Trip created! ${remaining} trips remaining in your ${isFreePlan ? 'Free' : isPremiumPlan ? 'Premium' : 'Pro'} plan.`,
          { duration: 4000 }
        );
      } else {
        toast.success('Trip created successfully!');
      }

      return newTrip;
    } catch (err) {
      console.error("Error creating trip:", err);
      setError(err.message || "Failed to create trip");
      
      // Show upgrade prompt for plan limits
      if (err.message.includes('limit reached')) {
        toast.error(err.message, {
          duration: 6000,
          action: {
            label: 'Upgrade Plan',
            onClick: () => {
              // Navigate to upgrade page
              console.log('Navigate to upgrade page');
            }
          }
        });
      }
      
      throw err;
    }
  };

  const updateTrip = async (tripId, updates) => {
    try {
      setError(null);
      
      // Validate update based on plan limits if needed
      if (updates.members && updates.members.length > 0) {
        const planFeatures = getPlanFeatures();
        const memberLimit = tripsService.getMemberLimitForPlan(planFeatures?.plan || 'free');
        
        if (memberLimit !== 'unlimited' && updates.members.length > memberLimit) {
          throw new Error(
            `Member limit exceeded! Your plan allows ${memberLimit} members per trip.`
          );
        }
      }

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
      
      // Find trip to get photo count for usage tracking
      const tripToDelete = trips.find(trip => trip.id === tripId);
      const photoCount = tripToDelete?.photoCount || 0;
      
      await tripsService.deleteTrip(tripId);

      // Remove from local state
      setTrips((prev) => prev.filter((trip) => trip.id !== tripId));

      // Update usage statistics
      const currentUsage = getUsageInfo();
      if (currentUsage) {
        updateUsage({
          trips: Math.max(0, currentUsage.trips.used - 1),
          photos: Math.max(0, currentUsage.photos.used - photoCount)
        });
      }

      toast.success('Trip deleted successfully');
    } catch (err) {
      console.error("Error deleting trip:", err);
      setError(err.message || "Failed to delete trip");
      throw err;
    }
  };

  const addTripToList = useCallback((newTrip) => {
    setTrips((prev) => [newTrip, ...prev]);
    
    // Update usage tracking
    const currentUsage = getUsageInfo();
    if (currentUsage) {
      updateUsage({ trips: currentUsage.trips.used + 1 });
    }
  }, [getUsageInfo, updateUsage]);

  const removeTripFromList = useCallback((tripId) => {
    // Find trip before removing for usage tracking
    const tripToRemove = trips.find(trip => trip.id === tripId);
    const photoCount = tripToRemove?.photoCount || 0;
    
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
    
    // Update usage tracking
    const currentUsage = getUsageInfo();
    if (currentUsage) {
      updateUsage({
        trips: Math.max(0, currentUsage.trips.used - 1),
        photos: Math.max(0, currentUsage.photos.used - photoCount)
      });
    }
  }, [trips, getUsageInfo, updateUsage]);

  // Sync usage with actual data
  const syncUsageWithActualData = useCallback(async () => {
    if (!userId) return;

    try {
      setSyncingUsage(true);
      await tripsService.syncUsageWithSubscriptionService(userId);
      
      // Refresh trips to ensure consistency
      await fetchTrips();
    } catch (error) {
      console.error("Error syncing usage:", error);
    } finally {
      setSyncingUsage(false);
    }
  }, [userId, fetchTrips]);

  // Validate trip operations with plan limits
  const validateTripOperation = useCallback(async (operation, data = {}) => {
    try {
      switch (operation) {
        case 'create':
          return canPerformAction('create_trip', { 
            currentTripCount: trips.length 
          });
          
        case 'upload_photos':
          return await tripsService.validatePhotoUpload(
            data.tripId,
            data.photoCount,
            data.totalFileSize
          );
          
        case 'invite_member':
          const trip = trips.find(t => t.id === data.tripId);
          return canPerformAction('invite_members', {
            currentMemberCount: trip?.members?.length || 0,
            newMemberCount: 1
          });
          
        default:
          return { allowed: true };
      }
    } catch (error) {
      console.error("Error validating trip operation:", error);
      return { 
        allowed: false, 
        reason: "Failed to validate operation" 
      };
    }
  }, [trips, canPerformAction]);

  // Get plan-specific trip statistics
  const getTripStats = useCallback(() => {
    const planFeatures = getPlanFeatures();
    if (!planFeatures) return null;

    const currentCount = trips.length;
    const limit = planFeatures.trips;
    
    return {
      current: currentCount,
      limit: limit,
      remaining: limit === 'unlimited' ? 'unlimited' : Math.max(0, limit - currentCount),
      percentage: limit === 'unlimited' ? 0 : (currentCount / limit) * 100,
      nearLimit: limit !== 'unlimited' && (currentCount / limit) > 0.8,
      atLimit: limit !== 'unlimited' && currentCount >= limit
    };
  }, [trips, getPlanFeatures]);

  // Check if user can perform specific actions
  const canCreateTrip = useCallback(() => {
    const stats = getTripStats();
    return stats ? !stats.atLimit : false;
  }, [getTripStats]);

  const canUploadPhotos = useCallback((tripId, photoCount = 1, totalFileSize = 0) => {
    return validateTripOperation('upload_photos', {
      tripId,
      photoCount,
      totalFileSize
    });
  }, [validateTripOperation]);

  const canInviteMembers = useCallback((tripId) => {
    return validateTripOperation('invite_member', { tripId });
  }, [validateTripOperation]);

  // Initialize trips on mount
  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Sync usage periodically (optional)
  useEffect(() => {
    if (userId && trips.length > 0) {
      // Sync usage when trips change significantly
      const currentUsage = getUsageInfo();
      if (currentUsage && Math.abs(trips.length - currentUsage.trips.used) > 1) {
        syncUsageWithActualData();
      }
    }
  }, [userId, trips.length, getUsageInfo, syncUsageWithActualData]);

  return {
    // Data
    trips,
    loading,
    error,
    syncingUsage,

    // Actions
    createTrip,
    updateTrip,
    deleteTrip,
    addTripToList,
    removeTripFromList,
    refetch: fetchTrips,
    syncUsage: syncUsageWithActualData,

    // Validation
    validateTripOperation,
    canCreateTrip,
    canUploadPhotos,
    canInviteMembers,

    // Statistics
    getTripStats,
    
    // Plan information
    planFeatures: getPlanFeatures(),
    isFreePlan,
    isPremiumPlan,
    isProPlan,

    // Legacy compatibility
    setTrips,
  };
};