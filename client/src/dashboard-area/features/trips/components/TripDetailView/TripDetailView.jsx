// components/TripDetailView/TripDetailView.jsx (Refactored with all hooks)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// Contexts
import { useAuth } from "../../../../contexts/AuthContext";

// Hooks
import { useTripDetail } from "../../hooks/useTripDetail";
import { useTripPhotos } from "../../hooks/useTripPhotos";
import { useFaceRecognition } from "../../hooks/useFaceRecognition";
import { usePhotoSelection } from "../../hooks/usePhotoSelection";
import { useFriendship } from "../../hooks/useFriendship";
import { useTripInvitations } from "../../hooks/useTripInvitations";

// Components
import TripHeader from "./TripHeader";
import PhotoUploadSection from "../PhotoUploadSection";
import PhotosSection from "./PhotosSection";
import FaceRecognitionSection from "./FaceRecognitionSection";
import TripSidebar from "./TripSidebar";
import PhotoModal from "./PhotoModal";
import PhotoGalleryModal from "./PhotoGalleryModal";
import EditTripModal from "../EditTripModal";
import UserProfileModal from "../../../profile/UserProfileModal";

// Utils
import { getTripPhotos } from "../../../../services/firebase/storage";

// Icons for loading/error states
import {
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const TripDetailView = ({ tripId: propTripId }) => {
  const { tripId: paramTripId } = useParams();
  const tripId = propTripId || paramTripId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Main trip data
  const { trip, members, loading, error, isAdmin, isMember, setTrip } =
    useTripDetail(tripId, currentUser);

  // Photo management
  const {
    photos,
    setPhotos,
    selectedPhoto,
    setSelectedPhoto,
    showAllPhotosModal,
    setShowAllPhotosModal,
    handlePhotoUploaded,
    removePhotos,
    getPhotoLimitStatus,
    getRemainingPhotoSlots,
    MAX_PHOTOS_PER_TRIP,
  } = useTripPhotos(tripId, trip, setTrip);

  // Photo selection for batch operations
  const {
    selectMode,
    selectedPhotos,
    showDeleteConfirm,
    setShowDeleteConfirm,
    toggleSelectMode,
    togglePhotoSelection,
    deleteSelectedPhotos,
  } = usePhotoSelection(tripId, photos, removePhotos);

  // Face recognition
  const {
    isProcessing: isProcessingFaces,
    hasProfile,
    isLoadingProfile,
    filteredPhotos,
    filterActive,
    progress: faceRecognitionProgress,
    loadUserFaceProfile,
    findMyPhotos,
    cancelProcessing: cancelFaceRecognition,
    clearFilter,
  } = useFaceRecognition(currentUser?.uid);

  // Friendship management
  const { friends, showSuccess, cancelSuccess, addFriend, removeFriendship } =
    useFriendship(currentUser);

  // Trip invitations
  const { handleInviteFriend } = useTripInvitations(tripId, currentUser);

  // Local UI state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mobileActiveTab, setMobileActiveTab] = useState("trip");

  // Load photos when trip is available
  useEffect(() => {
    const loadPhotos = async () => {
      if (trip && trip.id) {
        try {
          const tripPhotos = await getTripPhotos(trip.id);
          setPhotos(tripPhotos);
        } catch (error) {
          console.error("Error loading photos:", error);
          toast.error("Failed to load photos");
        }
      }
    };

    loadPhotos();
  }, [trip?.id, setPhotos]);

  // Auto-load face profile when user is available
  useEffect(() => {
    if (currentUser?.uid) {
      loadUserFaceProfile();
    }
  }, [currentUser?.uid, loadUserFaceProfile]);

  // Handlers
  const handleFindMyPhotos = async () => {
    try {
      const matches = await findMyPhotos(photos);
      if (matches.length > 0) {
        toast.success(`Found ${matches.length} matching photos!`);
      } else {
        toast.info("No matching photos found");
      }
    } catch (error) {
      if (error.message.includes("No face profile found")) {
        toast.error(
          "No face profile found. Please create one in your Dashboard first."
        );
      } else {
        toast.error("Face recognition failed: " + error.message);
      }
    }
  };

  const handleMemberClick = async (member) => {
    const isFriendNow = friends.includes(member.uid);
    // You can add friend status checking logic here if needed
    setSelectedUser({
      ...member,
      __isFriend: isFriendNow,
      __isPending: false, // You can implement pending check if needed
    });
  };

  const handleRandomPhotoClick = () => {
    if (photos.length > 0) {
      const randomIndex = Math.floor(Math.random() * photos.length);
      setSelectedPhoto(photos[randomIndex]);
    }
  };

  // Loading Component
  const LoadingComponent = () => (
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
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Loading Trip Details
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Getting everything ready for your amazing memories...
          </p>
        </div>
      </div>
    </div>
  );

  // Error Component
  const ErrorComponent = ({ error }) => (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-8 border border-red-200/50 dark:border-red-800/50 shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExclamationTriangleIcon className="w-10 h-10 text-red-500 dark:text-red-400" />
            </div>
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

  // Mobile Tab Navigation
  const MobileTabNavigation = () => (
    <div className="xl:hidden relative">
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-lg p-1.5 border border-white/20 dark:border-gray-700/50">
        <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <div
            className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md transition-all duration-300 ease-in-out transform ${
              mobileActiveTab === "trip" ? "translate-x-0" : "translate-x-full"
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
  );

  // Render guards
  if (loading) return <LoadingComponent />;
  if (error) return <ErrorComponent error={error} />;
  if (!trip) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="space-y-4 sm:space-y-8 p-3 sm:p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <TripHeader
          trip={trip}
          photos={photos}
          tripMembers={members}
          isAdmin={isAdmin}
          showUploadForm={showUploadForm}
          onEditTrip={() => setShowEditModal(true)}
          onToggleUpload={() => setShowUploadForm(!showUploadForm)}
          getPhotoLimitStatus={getPhotoLimitStatus}
          getRemainingPhotoSlots={getRemainingPhotoSlots}
          MAX_PHOTOS_PER_TRIP={MAX_PHOTOS_PER_TRIP}
          mobileActiveTab={mobileActiveTab}
          onMobileTabChange={setMobileActiveTab}
        />

        {/* Mobile Tab Navigation */}
        <MobileTabNavigation />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div
            className={`xl:col-span-2 space-y-6 ${
              mobileActiveTab === "trip" ? "block" : "hidden xl:block"
            }`}
          >
            {/* Photo Upload Section */}
            <PhotoUploadSection
              showUploadForm={showUploadForm}
              tripId={tripId}
              onPhotoUploaded={handlePhotoUploaded}
              getPhotoLimitStatus={getPhotoLimitStatus}
              getRemainingPhotoSlots={getRemainingPhotoSlots}
              MAX_PHOTOS_PER_TRIP={MAX_PHOTOS_PER_TRIP}
              currentPhotoCount={photos.length}
            />

            {/* Photos Section */}
            <PhotosSection
              photos={photos}
              onPhotoClick={setSelectedPhoto}
              onViewAllClick={() => setShowAllPhotosModal(true)}
              onRandomPhotoClick={handleRandomPhotoClick}
              onUploadClick={() => setShowUploadForm(true)}
              tripMembers={members}
              MAX_PHOTOS_PER_TRIP={MAX_PHOTOS_PER_TRIP}
            />

            {/* Face Recognition Section */}
            <FaceRecognitionSection
              photos={photos}
              currentUser={currentUser}
              filteredPhotos={filteredPhotos}
              filterActive={filterActive}
              isProcessing={isProcessingFaces}
              hasProfile={hasProfile}
              isLoadingProfile={isLoadingProfile}
              progress={faceRecognitionProgress}
              canFilterByFace={isMember && currentUser?.uid}
              onFindPhotos={handleFindMyPhotos}
              onCancelProcessing={cancelFaceRecognition}
              onClearFilter={clearFilter}
            />
          </div>

          {/* Sidebar - Right Side */}
          <TripSidebar
            tripMembers={members}
            trip={trip}
            currentUser={currentUser}
            isAdmin={isAdmin}
            friends={friends}
            mobileActiveTab={mobileActiveTab}
            onMemberClick={handleMemberClick}
            onInviteFriend={handleInviteFriend}
          />
        </div>

        {/* Modals */}
        {selectedPhoto && (
          <PhotoModal
            selectedPhoto={selectedPhoto}
            photos={filterActive ? filteredPhotos : photos}
            onClose={() => setSelectedPhoto(null)}
            onNavigate={setSelectedPhoto}
          />
        )}

        {showAllPhotosModal && (
          <PhotoGalleryModal
            isOpen={showAllPhotosModal}
            onClose={() => setShowAllPhotosModal(false)}
            photos={photos}
            onPhotoClick={setSelectedPhoto}
            isAdmin={isAdmin}
            selectMode={selectMode}
            onToggleSelectMode={toggleSelectMode}
            selectedPhotos={selectedPhotos}
            onPhotoSelect={togglePhotoSelection}
            onDeleteSelected={() => setShowDeleteConfirm(true)}
            MAX_PHOTOS_PER_TRIP={MAX_PHOTOS_PER_TRIP}
          />
        )}

        {showEditModal && (
          <EditTripModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            trip={trip}
            onTripUpdated={setTrip}
            onTripDeleted={(deletedTripId) => {
              setShowEditModal(false);
              navigate("/dashboard");
            }}
          />
        )}

        {selectedUser && (
          <UserProfileModal
            user={selectedUser}
            currentUserId={currentUser?.uid}
            isAdmin={isAdmin}
            isFriend={friends.includes(selectedUser.uid)}
            onAddFriend={addFriend}
            onRemoveFriend={removeFriendship}
            onClose={() => setSelectedUser(null)}
            trip={trip}
            setTrip={setTrip}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full border border-white/20 dark:border-gray-700/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrashIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Delete Photos
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Are you sure you want to delete{" "}
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {selectedPhotos.length}
                    </span>{" "}
                    selected photo{selectedPhotos.length > 1 ? "s" : ""}?
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium transition-all duration-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteSelectedPhotos}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 text-sm shadow-lg"
                  >
                    Delete {selectedPhotos.length} Photo
                    {selectedPhotos.length > 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Toast Notifications */}
        {showSuccess && (
          <div className="fixed top-8 right-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 transform animate-bounce backdrop-blur-lg border border-green-400/30">
            <div className="flex items-center gap-3">
              <CheckIcon className="w-5 h-5" />
              <span className="font-medium">
                Friend request sent successfully!
              </span>
            </div>
          </div>
        )}

        {cancelSuccess && (
          <div className="fixed top-8 right-8 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 transform animate-bounce backdrop-blur-lg border border-red-400/30">
            <div className="flex items-center gap-3">
              <XMarkIcon className="w-5 h-5" />
              <span className="font-medium">{cancelSuccess}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetailView;
