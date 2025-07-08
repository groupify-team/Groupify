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
  // invalidateCacheType,
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

  // Ensure proper uid/id mapping for compatibility
  const enhancedProfile = profile
    ? {
        ...profile,
        uid: profile.uid || profile.id || userId,
        id: profile.id || profile.uid || userId,
      }
    : null;

  // Cache the result
  setCachedData("users", userId, enhancedProfile);

  return enhancedProfile;
};

// === BATCH OPERATIONS ===
export const getBatchUserProfiles = async (userIds) => {
  if (!userIds || userIds.length === 0) {
    return [];
  }

  console.log("getBatchUserProfiles called with userIds:", userIds);

  const profiles = [];
  const uncachedIds = [];

  // Check cache for each user
  for (const userId of userIds) {
    if (!userId) continue; // Skip null/undefined IDs

    const cached = getCachedData("users", userId);
    if (cached) {
      profiles.push({
        uid: cached.uid || cached.id || userId,
        id: cached.id || cached.uid || userId,
        ...cached,
      });
    } else {
      uncachedIds.push(userId);
    }
  }

  // Fetch uncached profiles in parallel
  if (uncachedIds.length > 0) {
    console.log("Fetching uncached user profiles for:", uncachedIds);

    const uncachedProfiles = await Promise.all(
      uncachedIds.map(async (userId) => {
        try {
          const profile = await getUserProfile_original(userId);
          if (profile) {
            const enhancedProfile = {
              uid: profile.uid || profile.id || userId,
              id: profile.id || profile.uid || userId,
              ...profile,
            };
            // Cache each profile
            setCachedData("users", userId, enhancedProfile);
            return enhancedProfile;
          }
          return null;
        } catch (error) {
          console.error(`Error fetching profile for user ${userId}:`, error);
          return null;
        }
      })
    );

    // Filter out null profiles and add to results
    profiles.push(...uncachedProfiles.filter((profile) => profile !== null));
  }

  console.log("getBatchUserProfiles returning:", profiles);
  return profiles;
};
