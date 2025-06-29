// trips/index.js (Main barrel export for trips feature)

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

// Services
export { tripsService } from "./services/tripsService";

// Utils
export * from "./utils/tripHelpers";

// ================================================================
// components/TripDetailView/index.js (TripDetailView barrel export)

export { default } from "./TripDetailView";
export { default as FaceRecognitionSection } from "./FaceRecognitionSection";
export { default as MembersSection } from "./MembersSection";
export { default as PhotosSection } from "./PhotosSection";
export { default as TripHeader } from "./TripHeader";
export { default as TripSidebar } from "./TripSidebar";
export { default as PhotoModal } from "./PhotoModal";
export { default as PhotoGalleryModal } from "./PhotoGalleryModal";
