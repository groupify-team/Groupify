// index.js - Main barrel export for events feature

// Components
export { default as createEventModal } from "./components/createEventModal";
export { default as EditEventModal } from "./components/EventDetailView/components/EditEventModal";
export { default as EventCard } from "./components/EventCard";
export { default as EventDetailView } from "./components/EventDetailView";
export { default as InviteFriendDropdown } from "./components/EventDetailView/components/InviteFriendDropdown";

// Hooks
export { useEvents } from "./hooks/useEvents";
export { useEventDetail } from "./hooks/useEventDetail";
export { useFaceRecognition } from "./hooks/useFaceRecognition";

// Services
export { eventsService } from "./services/eventsService";

// Utils
export * from "@dashboard/utils/eventHelpers";

// Constants
export const EVENT_LIMITS = {
  MAX_EVENTS_PER_USER: 5,
  MAX_PHOTOS_PER_EVENT: 100,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
};

export const GRID_CLASSES = {
  PHOTOS: "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
  CARDS: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  STATS: "grid-cols-2 sm:grid-cols-4",
};
