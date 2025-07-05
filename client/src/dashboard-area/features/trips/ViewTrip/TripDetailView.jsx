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

// ✅ REMOVE the immediate lazy import - we'll load it dynamically
// const FaceRecognition = lazy(() => import("..."));

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

  // ✅ State for dynamic face recognition loading
  const [FaceRecognitionComponent, setFaceRecognitionComponent] =
    useState(null);
  const [isFaceRecognitionLoaded, setIsFaceRecognitionLoaded] = useState(false);
  const [isLoadingFaceRecognition, setIsLoadingFaceRecognition] =
    useState(false);

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

  // ✅ Function to dynamically load face recognition
  const loadFaceRecognition = async () => {
    if (isFaceRecognitionLoaded) {
      // Already loaded, just start the process
      handleFindMyPhotos();
      return;
    }

    setIsLoadingFaceRecognition(true);

    try {
      console.log("🔄 Loading Face Recognition component...");

      // Dynamic import - only loads when user clicks "Find My Photos"
      const FaceRecognitionModule = await import(
        "@/dashboard-area/features/trips/ViewTrip/features/faceRecognition/components/FaceRecognition"
      );

      const LazyFaceRecognition = lazy(() =>
        Promise.resolve(FaceRecognitionModule)
      );

      setFaceRecognitionComponent(() => LazyFaceRecognition);
      setIsFaceRecognitionLoaded(true);

      console.log("✅ Face Recognition component loaded!");

      // Small delay to ensure component is ready, then start face recognition
      setTimeout(() => {
        handleFindMyPhotos();
      }, 100);
    } catch (error) {
      console.error("❌ Failed to load Face Recognition component:", error);
      toast.error("Failed to load face recognition. Please try again.");
    } finally {
      setIsLoadingFaceRecognition(false);
    }
  };

  // ✅ Function to unload face recognition after completion
  const unloadFaceRecognition = () => {
    console.log("🗑️ Unloading Face Recognition component...");
    setFaceRecognitionComponent(null);
    setIsFaceRecognitionLoaded(false);
    setFilterActive(false);
    setFilteredPhotos([]);
  };

  // ✅ Enhanced face recognition handlers
  const enhancedHandleFindMyPhotos = () => {
    loadFaceRecognition();
  };

  const enhancedHandleCancelFaceRecognition = () => {
    handleCancelFaceRecognition();
    // Unload component after cancellation
    setTimeout(() => {
      unloadFaceRecognition();
    }, 500);
  };

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

  // ✅ Listen for face recognition completion to auto-unload
  React.useEffect(() => {
    // When face recognition processing finishes and we have results
    if (!isProcessingFaces && filterActive && isFaceRecognitionLoaded) {
      // Auto-unload after 30 seconds of inactivity (optional)
      const unloadTimer = setTimeout(() => {
        if (!isProcessingFaces) {
          console.log("⏱️ Auto-unloading Face Recognition after inactivity");
          unloadFaceRecognition();
        }
      }, 30000); // 30 seconds

      return () => clearTimeout(unloadTimer);
    }
  }, [isProcessingFaces, filterActive, isFaceRecognitionLoaded]);

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
            {/* Photo Upload Section - keeping existing code */}
            {showUploadForm && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
                onClick={() => setShowUploadForm(false)}
              >
                {/* ... existing upload form code ... */}
              </div>
            )}

            {/* Photo Gallery */}
            <PhotoGallery
              photos={photos}
              tripMembers={tripMembers}
              tripId={tripId}
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

            {/* ✅ Dynamic Face Recognition Section */}
            {isFaceRecognitionLoaded && FaceRecognitionComponent ? (
              <Suspense
                fallback={
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 p-8">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Loading face recognition...
                      </p>
                    </div>
                  </div>
                }
              >
                <FaceRecognitionComponent
                  canFilterByFace={canFilterByFace}
                  hasProfile={hasProfile}
                  isLoadingProfile={isLoadingProfile}
                  isProcessingFaces={isProcessingFaces}
                  filterActive={filterActive}
                  filteredPhotos={filteredPhotos}
                  faceRecognitionProgress={faceRecognitionProgress}
                  onFindMyPhotos={enhancedHandleFindMyPhotos}
                  onCancelProcessing={enhancedHandleCancelFaceRecognition}
                  onNavigateToProfile={handleNavigateToProfile}
                  onPhotoSelect={setSelectedPhoto}
                />
              </Suspense>
            ) : (
              /* ✅ Face Recognition Placeholder - Shows "Find My Photos" button */
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 border-b border-blue-200/30 dark:border-blue-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
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
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                          Photos With Me
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          AI-powered face detection
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={enhancedHandleFindMyPhotos}
                      disabled={isLoadingProfile || isLoadingFaceRecognition}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                    >
                      {isLoadingFaceRecognition ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          Find My Photos
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-blue-500 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {hasProfile
                        ? "Ready to find your photos!"
                        : "Setup your face profile"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 max-w-sm mx-auto">
                      {hasProfile
                        ? "Use AI face recognition to automatically identify photos containing you."
                        : "Create a face profile in your Dashboard to enable photo detection."}
                    </p>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                        hasProfile
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                          : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          hasProfile ? "bg-green-500" : "bg-orange-500"
                        } ${hasProfile ? "animate-pulse" : ""}`}
                      ></div>
                      {hasProfile ? "Profile Ready" : "No Profile"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trip Statistics */}
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
                setSelectedUser({
                  ...friend,
                  __isFriend: true,
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
