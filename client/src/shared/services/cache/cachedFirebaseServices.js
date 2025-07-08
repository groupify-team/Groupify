/**
 * Cached Firebase Services - Wrapper around Firebase with intelligent caching
 * This will dramatically reduce Firebase calls and improve performance
 */

import {
  getEvent as getEvent_original,
  updateEvent as updateEvent_original,
} from "../firebase/events";
import { getEventPhotos as getEventPhotos_original } from "../firebase/storage";
import { getUserProfile as getUserProfile_original } from "../firebase/users";
import {
  getCachedData,
  setCachedData,
  invalidateCache,
  invalidateCacheType,
} from "./apiCache";

// === events ===
export const getEvent = async (eventId) => {
  // Check cache first
  const cached = getCachedData("events", eventId);
  if (cached) return cached;

  // Fetch from Firebase
  const event = await getEvent_original(eventId);

  // Cache the result
  setCachedData("events", eventId, event);

  return event;
};

export const updateEvent = async (eventId, updates) => {
  // Update in Firebase
  const result = await updateEvent_original(eventId, updates);

  // Invalidate cache for this event
  invalidateCache("events", eventId);

  return result;
};

// === PHOTOS ===
export const getEventPhotos = async (eventId) => {
  // Check cache first
  const cached = getCachedData("photos", eventId);
  if (cached) return cached;

  // Fetch from Firebase
  const photos = await getEventPhotos_original(eventId);

  // Cache the result
  setCachedData("photos", eventId, photos);

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
export const refreshEventCache = (eventId) => {
  invalidateCache("events", eventId);
  invalidateCache("photos", eventId);
};

export const refreshUserCache = (userId) => {
  invalidateCache("users", userId);
};

export const clearAllCaches = () => {
  invalidateCacheType("events");
  invalidateCacheType("photos");
  invalidateCacheType("users");
};
