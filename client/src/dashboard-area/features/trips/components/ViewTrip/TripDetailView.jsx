import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// Context
import { useAuth } from "../../contexts/AuthContext";

// Components
import TripHeader from "./components/TripHeader";
import PhotoUploadSection from "./components/PhotoUploadSection";
import PhotoGallery from "./components/PhotoGallery";
import FaceRecognitionSection from "./components/FaceRecognitionSection";
import TripMembersCard from "./components/TripMembersCard";
import InvitePeopleCard from "./components/InvitePeopleCard";

// Modals
import PhotoModal from "./components/modals/PhotoModal";
import AllPhotosModal from "./components/modals/AllPhotosModal";
import EditTripModal from "./components/modals/EditTripModal";
import UserProfileModal from "../profile/UserProfileModal";

// Hooks
import useTripData from "./hooks/useTripData";
import useFaceRecognition from "./hooks/useFaceRecognition";
import usePhotoOperations from "./hooks/usePhotoOperations";
import useTripMembers from "./hooks/useTripMembers";
import usePhotoModal from "./hooks/usePhotoModal";

// Utils
import {
  getPhotoLimitStatus,
  getRemainingPhotoSlots,
} from "./utils/photoHelpers";

const TripDetailView = ({ tripId: propTripId }) => {
  const { tripId: paramTripId } = useParams();
  const tripId = propTripId || paramTripId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();

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
    handlePromoteToAdmin,
    handleDemoteFromAdmin,
    handleRemoveFromTrip,
  } = useTripMembers(currentUser?.uid);

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
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-8 border border-red-200/50 dark:border-red-800/50 shadow-2xl">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="space-y-4 sm:space-y-8 p-3 sm:p-6 max-w-7xl mx-auto">
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
        <div className="xl:hidden relative">
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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content - Photos and Face Recognition */}
          <div
            className={`xl:col-span-2 space-y-6 ${
              mobileActiveTab === "trip" ? "block" : "hidden xl:block"
            }`}
          >
            {/* Photo Upload Section */}
            {showUploadForm && (
              <PhotoUploadSection
                tripId={tripId}
                photoLimitStatus={photoLimitStatus}
                remainingPhotoSlots={remainingPhotoSlots}
                maxPhotos={100} // MAX_PHOTOS_PER_TRIP
                currentPhotoCount={photos.length}
                onPhotoUploaded={handlePhotoUploaded}
              />
            )}

            {/* Photo Gallery */}
            <PhotoGallery
              photos={photos}
              tripMembers={tripMembers}
              maxPhotos={100} // MAX_PHOTOS_PER_TRIP
              onPhotoSelect={setSelectedPhoto}
              onShowAllPhotos={() => setShowAllPhotosModal(true)}
              onRandomPhoto={() => selectRandomPhoto(photos)}
              onUploadFirst={() => setShowUploadForm(true)}
            />

            {/* Face Recognition Section */}
            <FaceRecognitionSection
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
              tripMembers={trip.members}
              onInviteFriend={(friend) =>
                handleInviteFriend(friend, tripId, currentUser?.uid)
              }
            />
          </div>
        </div>

        {/* Modals */}

        {/* Photo Modal */}
        <PhotoModal
          photo={selectedPhoto}
          photos={photos}
          isOpen={!!selectedPhoto}
          onClose={closeModal}
          onNext={() => navigateToNext(photos)}
          onPrevious={() => navigateToPrevious(photos)}
        />

        {/* All Photos Modal */}
        <AllPhotosModal
          isOpen={showAllPhotosModal}
          photos={photos}
          maxPhotos={100} // MAX_PHOTOS_PER_TRIP
          isAdmin={isAdmin}
          selectMode={selectMode}
          selectedPhotos={selectedPhotos}
          onClose={() => setShowAllPhotosModal(false)}
          onPhotoSelect={setSelectedPhoto}
          onToggleSelectMode={toggleSelectMode}
          onSelectPhoto={selectPhoto}
          onDeleteSelected={handleDeleteSelectedPhotos}
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
            isAdmin={isAdmin}
            isFriend={friends.includes(selectedUser.uid)}
            isPending={pendingFriendRequests.includes(selectedUser.uid)}
            onAddFriend={() =>
              handleAddFriend(selectedUser.uid, currentUser?.uid)
            }
            onRemoveFriend={() =>
              handleRemoveFriend(selectedUser.uid, currentUser?.uid)
            }
            onCancelRequest={() =>
              handleCancelFriendRequest(selectedUser.uid, currentUser?.uid)
            }
            onClose={() => setSelectedUser(null)}
            trip={trip}
            setTrip={setTrip}
            tripMembers={tripMembers}
            setTripMembers={setTripMembers}
            setSelectedUser={setSelectedUser}
            onPromoteToAdmin={(uid) => handlePromoteToAdmin(uid, trip, setTrip)}
            onDemoteFromAdmin={(uid) =>
              handleDemoteFromAdmin(uid, trip, setTrip)
            }
            onRemoveFromTrip={(uid) =>
              handleRemoveFromTrip(
                uid,
                trip,
                tripMembers,
                setTrip,
                setTripMembers
              )
            }
            onlyTripMembers={true}
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
