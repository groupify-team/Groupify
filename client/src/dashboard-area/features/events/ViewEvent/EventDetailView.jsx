import React, {
  useState,
  Suspense,
  useMemo,
  useCallback,
  memo,
  lazy,
  useTransition,
  useEffect,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRenderTracker } from "@shared/hooks/usePerformanceMonitor";
import { useAuth } from "@auth/hooks/useAuth";
import { useEventContext } from "@shared/contexts/EventContext";
import { useEnhancedNavigation } from "@shared/hooks/useEnhancedNavigation";
import { modalToast } from "@shared/utils/modalToast";
import {
  getPhotoLimitStatus,
  getRemainingPhotoSlots,
} from "./features/gallery/utils/photoHelpers";

// Import components
import EventHeader from "./features/header/components/EventHeader";
import EventMembersCard from "./features/members/components/EventMembersCard";
import InvitePeopleCard from "./features/members/components/InvitePeopleCard";
import EventStatistics from "./features/statistics/components/EventStatistics";
import PhotoGallery from "./features/gallery/components/PhotoGallery";

// Import hooks
import { useEventPhotos } from "./hooks/useEventPhotos";
import { usePhotoOperations } from "./features/gallery/hooks/usePhotoOperations";
import { useEventMembers } from "./features/members/hooks/useEventMembers";
import { usePhotoModal } from "./features/gallery/hooks/usePhotoModal";
import { useFaceRecognition } from "./features/faceRecognition/hooks/useFaceRecognition";

// Lazy load heavy components
const UserProfileModal = lazy(() =>
  import("@shared/components/user/UserProfileModal").then((module) => ({
    default: module.default,
  }))
);

const FaceRecognitionCard = lazy(() =>
  import("./features/faceRecognition/components/FaceRecognitionCard").then(
    (module) => ({ default: module.default })
  )
);

const FaceRecognitionModal = lazy(() =>
  import("./features/faceRecognition/components/FaceRecognitionModal")
);

const FaceRecognitionResults = lazy(() =>
  import("./features/faceRecognition/components/FaceRecognitionResults")
);

const PhotoModal = lazy(() => import("./components/PhotoModal"));

const AllPhotosModal = lazy(() =>
  import("./features/gallery/components/modals/AllPhotosModal")
);

const EditEventModal = lazy(() =>
  import("./features/header/hooks/EditEventModal")
);

// Loading Spinner Component
const EventLoadingSpinner = memo(() => (
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
        Loading event details
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        Getting everything ready for your amazing memories...
      </p>
    </div>
  </div>
));

EventLoadingSpinner.displayName = "EventLoadingSpinner";

// Error Display Component
const ErrorDisplay = memo(({ error }) => (
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
));

ErrorDisplay.displayName = "ErrorDisplay";

// Leaving Event Overlay Component
const LeavingEventOverlay = memo(() => (
  <div className="fixed inset-0 bg-white/95 dark:bg-gray-900/95 z-50 flex items-center justify-center backdrop-blur-sm">
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
        </div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-300 border-t-indigo-600 rounded-2xl animate-spin"></div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 font-medium">
        Leaving event...
      </p>
    </div>
  </div>
));

LeavingEventOverlay.displayName = "LeavingEventOverlay";

// Mobile Tab Switcher Component
const MobileTabSwitcher = memo(({ activeTab, setActiveTab }) => (
  <div className="xl:hidden relative mb-6">
    <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-lg shadow-lg p-1.5 border border-white/20 dark:border-gray-700/50">
      <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <div
          className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md transition-all duration-300 ease-in-out transform ${
            activeTab === "event" ? "translate-x-0" : "translate-x-full"
          }`}
        />
        <button
          onClick={() => setActiveTab("event")}
          className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
            activeTab === "event"
              ? "text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          Event
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`relative z-10 flex-1 py-1.5 px-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
            activeTab === "members"
              ? "text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          Members
        </button>
      </div>
    </div>
  </div>
));

MobileTabSwitcher.displayName = "MobileTabSwitcher";
const EventDetailView = ({ eventId: propEventId }) => {
  // ===== ROUTE & AUTH SETUP =====
  const { eventId: paramEventId } = useParams();
  const eventId = propEventId || paramEventId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isPending, startTransition] = useTransition();

  // ===== NAVIGATION SETUP =====
  const { smoothNavigate } = useEnhancedNavigation();

  // ===== EVENT CONTEXT SETUP =====
  const {
    getEventById,
    getEventMembers,
    isEventAdmin,
    isEventCreator,
    isEventMember,
    leaveEvent,
    loading: eventLoading,
    error: eventError,
  } = useEventContext();

  // ===== STATE MANAGEMENT =====
  const [isLeavingEvent, setIsLeavingEvent] = useState(false);
  const [localEvent, setLocalEvent] = useState(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalSource, setModalSource] = useState(null);

  // ===== COMPUTED VALUES =====
  const event = useMemo(() => {
    return eventId ? getEventById(eventId) : null;
  }, [eventId, getEventById]);

  const eventMembers = useMemo(() => {
    return eventId ? getEventMembers(eventId) : [];
  }, [eventId, getEventMembers]);

  const isAdmin = useMemo(() => {
    return currentUser?.uid && eventId
      ? isEventAdmin(eventId, currentUser.uid)
      : false;
  }, [eventId, currentUser?.uid, isEventAdmin]);

  const isCreator = useMemo(() => {
    return currentUser?.uid && eventId
      ? isEventCreator(eventId, currentUser.uid)
      : false;
  }, [eventId, currentUser?.uid, isEventCreator]);

  const isMember = useMemo(() => {
    return currentUser?.uid && eventId
      ? isEventMember(eventId, currentUser.uid)
      : false;
  }, [eventId, currentUser?.uid, isEventMember]);

  // ===== HOOKS SETUP =====
  const {
    photos,
    loading: photosLoading,
    error: photosError,
    setPhotos,
  } = useEventPhotos(eventId);

  const shouldLoadFaceRecognition = useMemo(() => {
    return photos && photos.length > 0;
  }, [photos]);

  const faceRecognitionHook = useFaceRecognition(
    photos || [],
    currentUser?.uid,
    event?.members?.includes(currentUser?.uid) || false,
    eventId
  );

  const {
    showUploadForm,
    showAllPhotosModal,
    setShowUploadForm,
    setShowAllPhotosModal,
    handlePhotoUploaded,
  } = usePhotoOperations(
    eventId,
    photos,
    localEvent,
    setPhotos,
    setLocalEvent,
    shouldLoadFaceRecognition ? faceRecognitionHook.filteredPhotos : undefined,
    shouldLoadFaceRecognition
      ? faceRecognitionHook.setFilteredPhotos
      : undefined,
    shouldLoadFaceRecognition ? faceRecognitionHook.filterActive : false
  );

  const {
    friends,
    selectedUser,
    showSuccess,
    cancelSuccess,
    pendingFriendRequests,
    setSelectedUser,
    handleMemberClick,
    handleAddFriend,
    handleRemoveFriend,
    handleCancelFriendRequest,
    handleInviteToEvent,
    handlePromoteToAdmin,
    handleDemoteFromAdmin,
    handleRemoveFromEvent,
    handleLeaveEvent,
  } = useEventMembers(currentUser?.uid, localEvent, setLocalEvent);

  const {
    selectedPhoto,
    mobileActiveTab,
    setSelectedPhoto,
    setMobileActiveTab,
    navigateToNext,
    navigateToPrevious,
  } = usePhotoModal();

  // ===== COMPUTED STATE =====
  const loading = eventLoading || photosLoading;
  const error = eventError || photosError;

  const photoLimitStatus = useMemo(() => {
    return getPhotoLimitStatus(photos?.length || 0);
  }, [photos?.length]);

  const remainingPhotoSlots = useMemo(() => {
    return getRemainingPhotoSlots(photos?.length || 0);
  }, [photos?.length]);

  // ===== EFFECTS =====
  useEffect(() => {
    if (event && JSON.stringify(event) !== JSON.stringify(localEvent)) {
      console.log(
        "🔄 EventDetailView: Updating local event from context",
        event
      );
      setLocalEvent(event);
    }
  }, [event, localEvent]);

  // Performance logging
  useRenderTracker("EventDetailView", {
    eventId,
    currentUserId: currentUser?.uid,
    hasEvent: !!event,
    photosLength: photos?.length,
    eventMembersLength: eventMembers?.length,
    loading,
    error: !!error,
    isPending,
    isLeavingEvent,
  });

  // ===== EVENT HANDLERS =====
  const handleLeaveEventFromHeader = useCallback(() => {
    setShowLeaveConfirmation(true);
  }, []);

  const handleConfirmLeaveEvent = useCallback(async () => {
    if (!currentUser?.uid || !eventId) return;

    try {
      // Close modal and start leaving process
      setShowLeaveConfirmation(false);

      // Wait for modal to close smoothly
      setTimeout(async () => {
        setIsLeavingEvent(true);

        try {
          console.log("🚪 Leaving event:", eventId);
          await leaveEvent(eventId);

          // Use smooth navigation to dashboard
          smoothNavigate("/dashboard/events", {
            delay: 100,
            showLoader: true,
            replace: true,
          });

          // Show success message after navigation starts
          setTimeout(() => {
            modalToast.success("You've successfully left the event", {
              duration: 3000,
              icon: "👋",
            });
          }, 300);
        } catch (leaveError) {
          console.error("Error leaving event:", leaveError);
          setIsLeavingEvent(false);
          modalToast.error("Failed to leave event. Please try again.", {
            duration: 4000,
            icon: "❌",
          });
        }
      }, 200);
    } catch (error) {
      console.error("Error in leave event handler:", error);
      modalToast.error("Failed to leave event. Please try again.", {
        duration: 4000,
        icon: "❌",
      });
    }
  }, [leaveEvent, currentUser?.uid, eventId, smoothNavigate]);

  const handleLeaveEventWithNavigation = useCallback(async () => {
    try {
      await handleLeaveEvent();
      navigate("/dashboard/events", {
        replace: true,
        state: {
          leftEventId: eventId,
          forceRefresh: true,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error("Error leaving event:", error);
    }
  }, [handleLeaveEvent, navigate, eventId]);

  const handleEventUpdated = useCallback((updatedEvent) => {
    startTransition(() => {
      setLocalEvent(updatedEvent);
      setShowEditModal(false);
    });
  }, []);

  const handleEventDeleted = useCallback(
    (deletedEventId) => {
      setShowEditModal(false);
      startTransition(() => {
        navigate("/dashboard", {
          replace: true,
          state: {
            deletedEventId: deletedEventId,
            forceRefresh: true,
            timestamp: Date.now(),
          },
        });
      });
    },
    [navigate]
  );

  const handleToggleUploadForm = useCallback(() => {
    startTransition(() => {
      setShowUploadForm(!showUploadForm);
    });
  }, [showUploadForm, setShowUploadForm]);

  const handleEditEvent = useCallback(() => {
    startTransition(() => {
      setShowEditModal(true);
    });
  }, []);

  const handleMobileTabChange = useCallback(
    (tab) => {
      startTransition(() => {
        setMobileActiveTab(tab);
      });
    },
    [setMobileActiveTab]
  );

  // ===== RENDER CONDITIONS =====
  // If we're leaving the event, show custom overlay
  if (isLeavingEvent) {
    return <LeavingEventOverlay />;
  }

  // Don't show loading or errors if we're in the process of leaving
  if (loading && !isLeavingEvent) {
    return <EventLoadingSpinner />;
  }

  if (error && !isLeavingEvent) {
    return <ErrorDisplay error={error} />;
  }

  if (!event && !isLeavingEvent) {
    return (
      <ErrorDisplay error="Event not found or you don't have access to this event." />
    );
  }

  // Don't render anything if we don't have an event and we're not loading
  if (!event) {
    return null;
  }
  // ===== MAIN RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 animate-fade-in-smooth">
      <div className="space-y-4 sm:space-y-8 p-3 sm:p-6 max-w-7xl mx-auto pb-20 sm:pb-6 animate-slide-in-smooth">
        {/* ===== EVENT HEADER ===== */}
        <EventHeader
          event={event}
          photos={photos || []}
          eventMembers={eventMembers || []}
          isAdmin={isAdmin}
          isCreator={isCreator}
          isMember={isMember}
          currentUserId={currentUser?.uid}
          showUploadForm={showUploadForm}
          photoLimitStatus={photoLimitStatus}
          remainingPhotoSlots={remainingPhotoSlots}
          onEditEvent={handleEditEvent}
          onLeaveEvent={handleLeaveEventFromHeader}
          onToggleUploadForm={handleToggleUploadForm}
        />

        {/* ===== MOBILE TAB SWITCHER ===== */}
        <MobileTabSwitcher
          activeTab={mobileActiveTab}
          setActiveTab={handleMobileTabChange}
        />

        {/* ===== MAIN CONTENT GRID ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-0 xl:items-start">
          {/* ===== LEFT COLUMN - PHOTOS & FACE RECOGNITION ===== */}
          <div
            className={`xl:col-span-2 space-y-6 ${
              mobileActiveTab === "event" ? "block" : "hidden xl:block"
            }`}
          >
            {/* Photo Upload Modal */}
            {showUploadForm && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
                onClick={() => setShowUploadForm(false)}
              >
                {/* Upload form content would go here */}
              </div>
            )}

            {/* Photo Gallery */}
            <PhotoGallery
              photos={photos || []}
              eventId={eventId}
              onPhotoSelect={(photo) => {
                setSelectedPhoto(photo);
                setModalSource("gallery");
              }}
              onShowAllPhotos={() => setShowAllPhotosModal(true)}
              onPhotoUploaded={handlePhotoUploaded}
            />

            {/* Face Recognition - Only load if we have photos */}
            {shouldLoadFaceRecognition && (
              <div className="face-recognition-wrapper">
                <Suspense
                  fallback={
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse">
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Loading face recognition...
                      </div>
                    </div>
                  }
                >
                  <FaceRecognitionCard
                    hasProfile={faceRecognitionHook.hasProfile}
                    isLoadingProfile={faceRecognitionHook.isLoadingProfile}
                    isLoadingFaceRecognition={
                      faceRecognitionHook.isProcessingFaces
                    }
                    filterActive={faceRecognitionHook.filterActive}
                    filteredPhotos={faceRecognitionHook.filteredPhotos}
                    onFindMyPhotos={
                      faceRecognitionHook.enhancedHandleFindMyPhotos
                    }
                    onPhotoSelect={setSelectedPhoto}
                    onViewAllResults={() =>
                      faceRecognitionHook.setShowResultsModal(true)
                    }
                    onClearScan={faceRecognitionHook.handleClearScan}
                    lastScanInfo={faceRecognitionHook.lastScanInfo}
                  />
                </Suspense>

                {/* Face Recognition Modal */}
                <Suspense fallback={<div>Loading modal...</div>}>
                  <FaceRecognitionModal
                    isOpen={faceRecognitionHook.showScanModal}
                    hasProfile={faceRecognitionHook.hasProfile}
                    isProcessingFaces={faceRecognitionHook.isProcessingFaces}
                    faceRecognitionProgress={
                      faceRecognitionHook.faceRecognitionProgress
                    }
                    onClose={() => faceRecognitionHook.setShowScanModal(false)}
                    onStartFaceRecognition={
                      faceRecognitionHook.handleFindMyPhotos
                    }
                    onCancelProcessing={
                      faceRecognitionHook.enhancedHandleCancelFaceRecognition
                    }
                    onNavigateToProfile={() => {
                      faceRecognitionHook.setShowScanModal(false);
                      navigate("/dashboard/settings");
                    }}
                  />
                </Suspense>

                {/* Face Recognition Results */}
                <Suspense fallback={<div>Loading results...</div>}>
                  <FaceRecognitionResults
                    isOpen={faceRecognitionHook.showResultsModal}
                    filteredPhotos={faceRecognitionHook.filteredPhotos}
                    onClose={() =>
                      faceRecognitionHook.setShowResultsModal(false)
                    }
                    onPhotoSelect={setSelectedPhoto}
                    onRescan={faceRecognitionHook.enhancedHandleFindMyPhotos}
                    onClearScan={faceRecognitionHook.handleClearScan}
                  />
                </Suspense>
              </div>
            )}

            {/* Event Statistics */}
            <EventStatistics
              event={event}
              photos={photos || []}
              eventMembers={eventMembers || []}
            />
          </div>

          {/* ===== RIGHT COLUMN - MEMBERS & INVITES ===== */}
          <div
            className={`xl:col-span-1 space-y-6 ${
              mobileActiveTab === "members" ? "block" : "hidden xl:block"
            }`}
          >
            {/* Event Members */}
            <EventMembersCard
              event={event}
              currentUserId={currentUser?.uid}
              onMemberClick={(member) =>
                handleMemberClick(member, currentUser?.uid)
              }
              onPromoteToAdmin={handlePromoteToAdmin}
              onDemoteFromAdmin={handleDemoteFromAdmin}
              onRemoveFromEvent={handleRemoveFromEvent}
              onLeaveEvent={handleLeaveEventWithNavigation}
            />

            {/* Invite People */}
            <InvitePeopleCard
              currentUser={currentUser}
              eventId={eventId}
              eventMembers={event?.members || []}
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

        {/* ===== MODALS ===== */}

        {/* Photo Modal */}
        {selectedPhoto && (
          <Suspense fallback={<div>Loading photo modal...</div>}>
            <PhotoModal
              photo={selectedPhoto}
              photos={photos || []}
              isOpen={!!selectedPhoto}
              onClose={() => {
                setSelectedPhoto(null);
                if (modalSource === "allPhotos") {
                  setShowAllPhotosModal(true);
                }
                setModalSource(null);
              }}
              onNext={() => navigateToNext(photos || [])}
              onPrevious={() => navigateToPrevious(photos || [])}
            />
          </Suspense>
        )}

        {/* All Photos Modal */}
        {showAllPhotosModal && (
          <Suspense fallback={<div>Loading photo gallery...</div>}>
            <AllPhotosModal
              isOpen={showAllPhotosModal}
              photos={photos || []}
              eventId={eventId}
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
          </Suspense>
        )}

        {/* Edit Event Modal */}
        {showEditModal && (
          <Suspense fallback={<div>Loading edit modal...</div>}>
            <EditEventModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              event={localEvent}
              onEventUpdated={handleEventUpdated}
              onEventDeleted={handleEventDeleted}
            />
          </Suspense>
        )}

        {/* User Profile Modal */}
        {selectedUser && (
          <Suspense fallback={<div>Loading user profile...</div>}>
            <UserProfileModal
              isOpen={!!selectedUser}
              user={selectedUser}
              currentUserId={currentUser?.uid}
              context="event"
              friends={friends || []}
              pendingRequests={pendingFriendRequests || []}
              onAddFriend={handleAddFriend}
              onRemoveFriend={handleRemoveFriend}
              onCancelRequest={handleCancelFriendRequest}
              event={localEvent}
              onPromoteToAdmin={handlePromoteToAdmin}
              onDemoteFromAdmin={handleDemoteFromAdmin}
              onRemoveFromEvent={handleRemoveFromEvent}
              onInviteToEvent={handleInviteToEvent}
              onClose={() => setSelectedUser(null)}
            />
          </Suspense>
        )}

        {/* ===== SUCCESS NOTIFICATIONS ===== */}
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

      {/* ===== LEAVE EVENT CONFIRMATION MODAL ===== */}
      {showLeaveConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Leave Event?
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Are you sure you want to leave{" "}
                <span className="font-semibold">{event?.name}</span>?
              </p>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 text-left space-y-1">
                  <li>• You won't be able to see photos anymore</li>
                  <li>• You'll lose access to event updates</li>
                  <li>• You'll need to be re-invited to rejoin</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveConfirmation(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLeaveEvent}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                >
                  Leave Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(EventDetailView);
