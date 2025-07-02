// index.js - Main barrel export for trips feature

// Components
export { default as CreateTripModal } from "./components/CreateTripModal";
export { default as EditTripModal } from "./components/TripDetailView/components/EditTripModal";
export { default as TripCard } from "./components/TripCard";
export { default as TripDetailView } from "./components/TripDetailView";
export { default as InviteFriendDropdown } from "./components/TripDetailView/components/InviteFriendDropdown";

// Hooks
export { useTrips } from "./hooks/useTrips";
export { useTripDetail } from "./hooks/useTripDetail";
export { useFaceRecognition } from "./hooks/useFaceRecognition";

// Services
export { tripsService } from "./services/tripsService";

// Utils
export * from "@dashboard/utils/tripHelpers";

// Constants
export const TRIP_LIMITS = {
  MAX_TRIPS_PER_USER: 5,
  MAX_PHOTOS_PER_TRIP: 100,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
};

export const GRID_CLASSES = {
  PHOTOS: "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
  CARDS: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  STATS: "grid-cols-2 sm:grid-cols-4",
};
