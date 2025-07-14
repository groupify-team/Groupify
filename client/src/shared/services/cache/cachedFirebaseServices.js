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
import { getCachedData, setCachedData, invalidateCache } from "./apiCache";

export const getEvent = async (eventId) => {
  const cached = getCachedData("events", eventId);
  if (cached) return cached;
  const event = await getEvent_original(eventId);
  setCachedData("events", eventId, event);
  return event;
};

export const updateEvent = async (eventId, updates) => {
  const result = await updateEvent_original(eventId, updates);
  invalidateCache("events", eventId);
  return result;
};

export const getEventPhotos = async (eventId) => {
  const cached = getCachedData("photos", eventId);
  if (cached) return cached;
  const photos = await getEventPhotos_original(eventId);
  setCachedData("photos", eventId, photos);
  return photos;
};

export const getUserProfile = async (userId) => {
  const cached = getCachedData("users", userId);
  if (cached) return cached;
  const profile = await getUserProfile_original(userId);
  const enhancedProfile = profile
    ? {
        ...profile,
        uid: profile.uid || profile.id || userId,
        id: profile.id || profile.uid || userId,
      }
    : null;
  setCachedData("users", userId, enhancedProfile);
  return enhancedProfile;
};

export const getBatchUserProfiles = async (userIds) => {
  if (!userIds || userIds.length === 0) {
    return [];
  }

  const profiles = [];
  const uncachedIds = [];

  for (const userId of userIds) {
    if (!userId) continue;

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

  if (uncachedIds.length > 0) {
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
    profiles.push(...uncachedProfiles.filter((profile) => profile !== null));
  }
  return profiles;
};
