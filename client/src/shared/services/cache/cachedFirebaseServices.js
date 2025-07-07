/**
 * Cached Firebase Services - Wrapper around Firebase with intelligent caching
 * This will dramatically reduce Firebase calls and improve performance
 */

import {
  getTrip as getTrip_original,
  updateTrip as updateTrip_original,
} from "../firebase/trips";
import { getTripPhotos as getTripPhotos_original } from "../firebase/storage";
import { getUserProfile as getUserProfile_original } from "../firebase/users";
import {
  getCachedData,
  setCachedData,
  invalidateCache,
  invalidateCacheType,
} from "./apiCache";

// === TRIPS ===
export const getTrip = async (tripId) => {
  // Check cache first
  const cached = getCachedData("trips", tripId);
  if (cached) return cached;

  // Fetch from Firebase
  const trip = await getTrip_original(tripId);

  // Cache the result
  setCachedData("trips", tripId, trip);

  return trip;
};

export const updateTrip = async (tripId, updates) => {
  // Update in Firebase
  const result = await updateTrip_original(tripId, updates);

  // Invalidate cache for this trip
  invalidateCache("trips", tripId);

  return result;
};

// === PHOTOS ===
export const getTripPhotos = async (tripId) => {
  // Check cache first
  const cached = getCachedData("photos", tripId);
  if (cached) return cached;

  // Fetch from Firebase
  const photos = await getTripPhotos_original(tripId);

  // Cache the result
  setCachedData("photos", tripId, photos);

  return photos;
};

// === USERS ===
export const getUserProfile = async (userId) => {
  // Check cache first
  const cached = getCachedData("users", userId);
  if (cached) return cached;

  // Fetch from Firebase
  const profile = await getUserProfile_original(userId);

  // Cache the result
  setCachedData("users", userId, profile);

  return profile;
};

// === BATCH OPERATIONS ===
export const getBatchUserProfiles = async (userIds) => {
  const profiles = [];
  const uncachedIds = [];

  // Check cache for each user
  for (const userId of userIds) {
    const cached = getCachedData("users", userId);
    if (cached) {
      profiles.push(cached);
    } else {
      uncachedIds.push(userId);
    }
  }

  // Fetch uncached profiles in parallel
  if (uncachedIds.length > 0) {
    const uncachedProfiles = await Promise.all(
      uncachedIds.map(async (userId) => {
        const profile = await getUserProfile_original(userId);
        // Cache each profile
        setCachedData("users", userId, profile);
        return profile;
      })
    );

    profiles.push(...uncachedProfiles);
  }

  return profiles;
};

// === CACHE MANAGEMENT ===
export const refreshTripCache = (tripId) => {
  invalidateCache("trips", tripId);
  invalidateCache("photos", tripId);
};

export const refreshUserCache = (userId) => {
  invalidateCache("users", userId);
};

export const clearAllCaches = () => {
  invalidateCacheType("trips");
  invalidateCacheType("photos");
  invalidateCacheType("users");
};
