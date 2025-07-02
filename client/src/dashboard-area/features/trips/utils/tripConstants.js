/**
 * Trip-related constants and configuration values
 * Defines limits, statuses, roles, and application-wide trip settings
 */

export const TRIP_CONSTANTS = {
  MAX_TRIPS_PER_USER: 5,
  MAX_PHOTOS_PER_TRIP: 100,
  MAX_TRIP_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_LOCATION_LENGTH: 100,

  TRIP_STATUS: {
    DRAFT: "draft",
    UPCOMING: "upcoming",
    ONGOING: "ongoing",
    COMPLETED: "completed",
  },

  MEMBER_ROLES: {
    CREATOR: "creator",
    ADMIN: "admin",
    MEMBER: "member",
  },

  PHOTO_LIMIT_STATUS: {
    NORMAL: "normal",
    WARNING: "warning",
    FULL: "full",
  },

  FACE_RECOGNITION: {
    BATCH_SIZE: 10,
    CONFIDENCE_THRESHOLD: 0.6,
    STRONG_MATCH_THRESHOLD: 0.8,
  },
};
