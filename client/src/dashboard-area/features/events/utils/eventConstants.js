/**
 * event-related constants and configuration values
 * Defines limits, statuses, roles, and application-wide event settings
 */

export const EVENT_CONSTANTS = {
  MAX_EVENTS_PER_USER: 5,
  MAX_PHOTOS_PER_EVENT: 100,
  MAX_EVENT_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_LOCATION_LENGTH: 100,

  EVENT_STATUS: {
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
