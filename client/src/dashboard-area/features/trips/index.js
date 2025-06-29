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
export * from "./utils/tripHelpers";
