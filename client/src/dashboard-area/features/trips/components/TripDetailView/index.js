// index.js - Main barrel export for trips feature

// Components
export { default as CreateTripModal } from "./components/CreateTripModal";
export { default as EditTripModal } from "./components/EditTripModal";
export { default as TripCard } from "./components/TripCard";
export { default as TripDetailView } from "./components/TripDetailView";
export { default as InviteFriendDropdown } from "./components/InviteFriendDropdown";
export { default as TripMembersList } from "./components/TripMembersList";
export { default as PhotoUploadSection } from "./components/PhotoUploadSection";

// Hooks
export { useTrips } from "./hooks/useTrips";
export { useTripDetail } from "./hooks/useTripDetail";
export { useFaceRecognition } from "./hooks/useFaceRecognition";
export { useTripPhotos } from "./hooks/useTripPhotos";
export { useTripMembers } from "./hooks/useTripMembers";
export { usePhotoSelection } from "./hooks/usePhotoSelection";
export { useFriendship } from "./hooks/useFriendship";
export { useTripInvitations } from "./hooks/useTripInvitations";
export { usePerformanceMonitoring } from "./hooks/usePerformanceMonitoring";

// Services
export { tripsService } from "./services/tripsService";

// Utils
export * from "./utils/tripHelpers";
export * from "./utils/tripConstants";
export * from "./utils/tripValidation";

// Types
export * from "./types/trip.types";
export * from "./types/member.types";
export * from "./types/photo.types";
