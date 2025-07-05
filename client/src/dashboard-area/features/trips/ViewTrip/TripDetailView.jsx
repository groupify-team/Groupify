import React, { useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// Context
import { useAuth } from "@/auth-area/contexts/AuthContext";

// Components
import TripHeader from "./features/header/components/TripHeader";
import PhotoGallery from "./features/gallery/components/PhotoGallery";
import TripMembersCard from "./features/members/components/TripMembersCard";
import InvitePeopleCard from "./features/members/components/InvitePeopleCard";
import UserProfileModal from "./features/members/components/UserProfileModal";
import TripStatistics from "./features/statistics/components/TripStatistics";

// Lazy-loaded components for performance
const FaceRecognition = lazy(() =>
  import(
    "@/dashboard-area/features/trips/ViewTrip/features/faceRecognition/components/FaceRecognition"
  )
);

// Modals
import PhotoModal from "./components/PhotoModal";
import AllPhotosModal from "./features/gallery/components/modals/AllPhotosModal";
import EditTripModal from "./features/header/hooks/EditTripModal";

// Hooks
import { useTripData } from "./hooks/useTripData";
import { useFaceRecognition } from "./features/faceRecognition/hooks/useFaceRecognition";
import { usePhotoOperations } from "./features/gallery/hooks/usePhotoOperations";
import { useTripMembers } from "./features/members/hooks/useTripMembers";
import { usePhotoModal } from "./features/gallery/hooks/usePhotoModal";

// Utils
import {
  getPhotoLimitStatus,
  getRemainingPhotoSlots,
} from "./features/gallery/utils/photoHelpers";

const TripDetailView = ({ tripId: propTripId }) => {
  const { tripId: paramTripId } = useParams();
  const tripId = propTripId || paramTripId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  // Core trip data and loading
  const {
    trip,
    photos,
    tripMembers,
    memberProfiles,
    isAdmin,
    loading,
    error,
    setTrip,
    setPhotos,
    setTripMembers,
  } = useTripData(tripId, currentUser?.uid);

  // Face recognition functionality
  const {
    hasProfile,
    isLoadingProfile,
    isProcessingFaces,
    filterActive,
    filteredPhotos,
    faceRecognitionProgress,
    canFilterByFace,
    handleFindMyPhotos,
    handleCancelFaceRecognition,
    setFilterActive,
    setFilteredPhotos,
  } = useFaceRecognition(
    photos,
    currentUser?.uid,
    trip?.members?.includes(currentUser?.uid)
  );

  // Photo operations (upload, delete, select)
  const {
    selectMode,
    selectedPhotos,
    showUploadForm,
    showAllPhotosModal,
    showDeleteConfirm,
    setSelectMode,
    setSelectedPhotos,
    setShowUploadForm,
    setShowAllPhotosModal,
    setShowDeleteConfirm,
    handlePhotoUploaded,
    handleDeleteSelectedPhotos,
    confirmDeletePhotos,
    toggleSelectMode,
    selectPhoto,
  } = usePhotoOperations(
    tripId,
    photos,
    trip,
    setPhotos,
    setTrip,
    filteredPhotos,
    setFilteredPhotos,
    filterActive
  );

  // Trip members management
  const {
    friends,
    selectedUser,
    showSuccess,
    cancelSuccess,
    pendingFriendRequests,
    setSelectedUser,
    setShowSuccess,
    setCancelSuccess,
    handleMemberClick,
    handleAddFriend,
    handleRemoveFriend,
    handleCancelFriendRequest,
    handleInviteFriend,
    handleInviteToTrip,
    handlePromoteToAdmin,
    handleDemoteFromAdmin,
    handleRemoveFromTrip,
  } = useTripMembers(currentUser?.uid, trip, setTrip);

  // Photo modal navigation
  const {
    selectedPhoto,
    mobileActiveTab,
    setSelectedPhoto,
    setMobileActiveTab,
    navigateToNext,
    navigateToPrevious,
    selectRandomPhoto,
    closeModal,
  } = usePhotoModal();

  // Additional handlers
  const [showEditModal, setShowEditModal] = React.useState(false);

  // Helper functions
  const photoLimitStatus = getPhotoLimitStatus(photos.length);
  const remainingPhotoSlots = getRemainingPhotoSlots(photos.length);

  const [modalSource, setModalSource] = useState(null); // 'gallery' or 'allPhotos'

  const handleNavigateToProfile = () => {
    navigate("/dashboard?section=faceprofile");
  };

  const handleTripUpdated = (updatedTrip) => {
    setTrip(updatedTrip);
    setShowEditModal(false);
  };

  const handleTripDeleted = (deletedTripId) => {
    setShowEditModal(false);
    setTimeout(() => {
      navigate("/dashboard", {
        state: {
          refreshTrips: true,
          deletedTripId: deletedTripId,
        },
      });
    }, 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 relative mx-auto">
              <div className="absolute inset-0 border-4 border-indigo-200/30 dark:border-indigo-800/30 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
              <div
                className="absolute inset-2 border-4 border-transparent border-t-purple-500 dark:border-t-purple-400 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Loading Trip Details
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Getting everything ready for your amazing memories...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="relative group h-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50 h-full flex flex-col">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h2>
              <p className="text-red-700 dark:text-red-400 mb-8 leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 animate-fade-in-smooth">
      <div className="space-y-4 sm:space-y-8 p-3 sm:p-6 max-w-7xl mx-auto pb-20 sm:pb-6 animate-slide-in-smooth">
        {/* Trip Header */}
        <TripHeader
          trip={trip}
          photos={photos}
          tripMembers={tripMembers}
          isAdmin={isAdmin}
          showUploadForm={showUploadForm}
          photoLimitStatus={photoLimitStatus}
          remainingPhotoSlots={remainingPhotoSlots}
          onEditTrip={() => setShowEditModal(true)}
          onToggleUploadForm={() => setShowUploadForm(!showUploadForm)}
        />

        {/* Mobile Tab Switcher */}
        <div className="xl:hidden relative mb-6">
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-lg p-1.5 border border-white/20 dark:border-gray-700/50">
            <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <div
                className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md transition-all duration-300 ease-in-out transform ${
                  mobileActiveTab === "trip"
                    ? "translate-x-0"
                    : "translate-x-full"
                }`}
              />
              <button
                onClick={() => setMobileActiveTab("trip")}
                className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                  mobileActiveTab === "trip"
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                Trip
              </button>
              <button
                onClick={() => setMobileActiveTab("members")}
                className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                  mobileActiveTab === "members"
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                Members
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-0 xl:items-start">
          {/* Main Content - Photos and Face Recognition */}
          <div
            className={`xl:col-span-2 space-y-6 ${
              mobileActiveTab === "trip" ? "block" : "hidden xl:block"
            }`}
          >
            {/* Photo Upload Section */}
            {showUploadForm && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
                onClick={() => setShowUploadForm(false)}
              >
                <div
                  className="relative w-full max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden animate-slide-in-scale"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            Upload Photos
                          </h3>
                          <p className="text-white/70 text-xs">
                            Add memories to your trip
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowUploadForm(false)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Photo limit warning */}
                    {photoLimitStatus === "full" ? (
                      <div className="bg-red-50/90 dark:bg-red-900/30 backdrop-blur-lg rounded-xl p-4 border border-red-200/50 dark:border-red-800/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-bold text-red-800 dark:text-red-400">
                              Photo Limit Reached
                            </h3>
                            <p className="text-red-700 dark:text-red-300 text-sm">
                              This trip has reached the maximum of 100 photos.
                              Please delete some photos before uploading new
                              ones.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : photoLimitStatus === "warning" ? (
                      <div className="bg-yellow-50/90 dark:bg-yellow-900/30 backdrop-blur-lg rounded-xl p-4 border border-yellow-200/50 dark:border-yellow-800/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01M12 17h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-bold text-yellow-800 dark:text-yellow-400">
                              Almost Full
                            </h3>
                            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                              Only {remainingPhotoSlots} photo slots remaining
                              out of 100.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Upload Area */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-8 border border-white/20 dark:border-gray-700/50">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                          Drag & Drop Photos Here
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          or click to browse ({remainingPhotoSlots} slots
                          remaining)
                        </p>

                        {/* Upload Status */}
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Used: {photos.length} / 100
                            </span>
                            <span className="font-medium text-indigo-600 dark:text-indigo-400">
                              {Math.round((photos.length / 100) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(photos.length / 100) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <button className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
                          Choose Photos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            <PhotoGallery
              photos={photos}
              tripMembers={tripMembers}
              tripId={tripId} // Add this line
              maxPhotos={100}
              onPhotoSelect={(photo) => {
                setSelectedPhoto(photo);
                setModalSource("gallery");
              }}
              onShowAllPhotos={() => setShowAllPhotosModal(true)}
              onRandomPhoto={() => selectRandomPhoto(photos)}
              onUploadFirst={() => setShowUploadForm(true)}
              onPhotoUploaded={handlePhotoUploaded}
            />

            {/* Face Recognition Section */}
            <Suspense fallback={<div>Loading face recognition...</div>}>
              <FaceRecognition
                canFilterByFace={canFilterByFace}
                hasProfile={hasProfile}
                isLoadingProfile={isLoadingProfile}
                isProcessingFaces={isProcessingFaces}
                filterActive={filterActive}
                filteredPhotos={filteredPhotos}
                faceRecognitionProgress={faceRecognitionProgress}
                onFindMyPhotos={handleFindMyPhotos}
                onCancelProcessing={handleCancelFaceRecognition}
                onNavigateToProfile={handleNavigateToProfile}
                onPhotoSelect={setSelectedPhoto}
              />
            </Suspense>

            {/* ADD THIS - Trip Statistics */}
            <TripStatistics
              trip={trip}
              photos={photos}
              tripMembers={tripMembers}
            />
          </div>

          {/* Sidebar - Members and Invites */}
          <div
            className={`xl:col-span-1 space-y-6 ${
              mobileActiveTab === "members" ? "block" : "hidden xl:block"
            }`}
          >
            {/* Trip Members */}
            <TripMembersCard
              tripMembers={tripMembers}
              trip={trip}
              currentUserId={currentUser?.uid}
              onMemberClick={(member) =>
                handleMemberClick(member, currentUser?.uid)
              }
            />

            {/* Invite People */}
            <InvitePeopleCard
              currentUser={currentUser}
              tripId={tripId}
              tripMembers={trip.members}
              onFriendClick={(friend) => {
                // Show the friend's profile modal
                setSelectedUser({
                  ...friend,
                  __isFriend: true, // They're in the friends list
                  __isPending: false,
                });
              }}
            />
          </div>
        </div>

        {/* Modals */}

        {/* Photo Modal */}
        <PhotoModal
          photo={selectedPhoto}
          photos={photos}
          isOpen={!!selectedPhoto}
          onClose={() => {
            setSelectedPhoto(null);
            if (modalSource === "allPhotos") {
              setShowAllPhotosModal(true);
            }
            setModalSource(null);
          }}
          onNext={() => navigateToNext(photos)}
          onPrevious={() => navigateToPrevious(photos)}
        />

        {/* All Photos Modal */}
        <AllPhotosModal
          isOpen={showAllPhotosModal}
          photos={photos}
          tripId={tripId}
          maxPhotos={100}
          isAdmin={isAdmin}
          onClose={() => setShowAllPhotosModal(false)}
          onPhotoSelect={(photo) => {
            setSelectedPhoto(photo);
            setModalSource("allPhotos");
            setShowAllPhotosModal(false);
          }}
          onPhotoDeleted={(updatedPhotos) => {
            setPhotos(updatedPhotos);
          }}
        />

        {/* Edit Trip Modal */}
        <EditTripModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          trip={trip}
          onTripUpdated={handleTripUpdated}
          onTripDeleted={handleTripDeleted}
        />

        {/* User Profile Modal */}
        {selectedUser && (
          <UserProfileModal
            user={selectedUser}
            currentUserId={currentUser?.uid}
            context="trip"
            // Friendship props
            isFriend={selectedUser.__isFriend || false}
            isPending={selectedUser.__isPending || false}
            onAddFriend={handleAddFriend}
            onRemoveFriend={handleRemoveFriend}
            onCancelRequest={handleCancelFriendRequest}
            // Trip props
            trip={trip}
            setTrip={setTrip}
            tripMembers={tripMembers}
            setTripMembers={setTripMembers}
            isAdmin={isAdmin}
            onPromoteToAdmin={handlePromoteToAdmin}
            onDemoteFromAdmin={handleDemoteFromAdmin}
            onRemoveFromTrip={handleRemoveFromTrip}
            onInviteToTrip={handleInviteToTrip} // NEW - for inviting friends to trip
            onClose={() => setSelectedUser(null)}
            setSelectedUser={setSelectedUser}
          />
        )}

        {/* Success Notifications */}
        {showSuccess && (
          <div className="fixed top-8 right-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 transform animate-bounce backdrop-blur-lg border border-green-400/30">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-medium">
                Friend request sent successfully!
              </span>
            </div>
          </div>
        )}

        {cancelSuccess && (
          <div className="fixed top-8 right-8 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 transform animate-bounce backdrop-blur-lg border border-red-400/30">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="font-medium">{cancelSuccess}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetailView;
