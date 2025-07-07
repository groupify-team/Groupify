// TripsSection.jsx - Performance Optimized with Plan Limit Validation
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  lazy,
  Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import { useClickOutside } from "@/shared/hooks/useClickOutside";

// Icons
import {
  BellIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  MapIcon,
  PlusIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Auth Context
import { useAuth } from "@/auth-area/contexts/AuthContext";

// Dashboard Hooks
import { useDashboardLayout } from "@/dashboard-area/hooks/useDashboardLayout";
import { useDashboardData } from "@/dashboard-area/hooks/useDashboardData";
import { useDashboardModals } from "@dashboard/contexts/DashboardModalsContext";

// Plan Limits Hook
import { usePlanLimits } from "@shared/hooks/usePlanLimits";

// Dashboard Components
import TabSwitcher from "@/dashboard-area/components/ui/TabSwitcher";
import FilterDropdown from "@/dashboard-area/components/ui/FilterDropdown";

// Trip Components
import TripCard from "@/dashboard-area/features/trips/components/TripCard";
const CreateTripModal = lazy(() =>
  import("@/dashboard-area/features/trips/components/CreateTripModal")
);

// Utils
import {
  filterTrips,
  getFilterLabel,
} from "@/dashboard-area/utils/dashboardHelpers";

// Services
import {
  canUserCreateTrip,
  getUserTripCount,
  MAX_TRIPS_PER_USER,
  acceptTripInvite,
  declineTripInvite,
} from "@firebase-services/trips";

const TripsSection = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Plan Limits Hook
  const { 
    canPerformAction, 
    showUpgradePrompt, 
    getUsageInfo,
    isFreePlan 
  } = usePlanLimits();

  // Layout state and actions
  const {
    layout: { isMobile },
    tabs: { tripsActiveTab },
    filters: { searchTerm, dateFilter },
    refs: { searchInputRef },
    tabActions: { switchTripsTab },
    filterActions: { updateSearchTerm, updateDateFilter, focusSearchInput },
    desktop: { tripInvitesExpanded },
    desktopActions: { toggleTripInvites },
    dropdowns: { filterDropdownOpen },
    dropdownActions: { toggleFilterDropdown, closeFilterDropdown },
  } = useDashboardLayout();

  // Dashboard data and actions
  const {
    trips,
    tripInvites,
    refreshTrips,
    removeTripInvite,
    showSuccessMessage,
    showErrorMessage,
    loading,
  } = useDashboardData();

  // Modal state
  const {
    createTrip: { open: openCreateTripModal },
  } = useDashboardModals();

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [canAcceptMoreInvitations, setCanAcceptMoreInvitations] = useState(true);
  const [currentTripCount, setCurrentTripCount] = useState(0);
  const [processingInviteId, setProcessingInviteId] = useState(null);
  
  // Memoize filtered trips to prevent unnecessary recalculations
  const filteredTrips = useMemo(() => {
    return filterTrips(trips, searchTerm, dateFilter);
  }, [trips, searchTerm, dateFilter]);
  
  // Click outside ref for filter dropdown
  const filterDropdownRef = useClickOutside(() => closeFilterDropdown());

  // CHECK TRIP ACCEPTANCE ABILITY ON LOAD AND WHEN TRIPS CHANGE
  useEffect(() => {
    const checkTripAcceptanceAbility = async () => {
      if (currentUser?.uid) {
        try {
          const tripCount = await getUserTripCount(currentUser.uid);
          setCurrentTripCount(tripCount);
          
          const usageInfo = getUsageInfo();
          if (usageInfo?.trips) {
            const { limit } = usageInfo.trips;
            setCanAcceptMoreInvitations(limit === "unlimited" || tripCount < limit);
          }
        } catch (error) {
          console.error("Error checking trip acceptance ability:", error);
        }
      }
    };

    checkTripAcceptanceAbility();
  }, [currentUser?.uid, trips.length, getUsageInfo]);

  // Enhanced Create Trip Handler with Performance Optimization
  const handleCreateTrip = useCallback(async () => {
    try {
      // Use plan limits validation instead of hardcoded check
      const limitCheck = canPerformAction("create_trip", { 
        currentTripCount: trips.length 
      });

      if (!limitCheck.allowed) {
        showUpgradePrompt(limitCheck.reason, {
          title: "Upgrade to Create More Trips",
          persistent: true
        });
        return;
      }

      setShowCreateModal(true);
    } catch (error) {
      console.error("Error checking trip creation limit:", error);
      showErrorMessage("Failed to check trip limit. Please try again.");
    }
  }, [canPerformAction, trips.length, showUpgradePrompt, showErrorMessage]);

  // Enhanced Accept Invite Handler with Validation and Performance Optimization
  const handleAcceptTripInvite = useCallback(async (invite) => {
    if (processingInviteId === invite.id) return; // Prevent double-processing

    try {
      setProcessingInviteId(invite.id);

      // Check if user can accept more trips
      const limitCheck = canPerformAction("create_trip", { 
        currentTripCount: currentTripCount + 1 // +1 because they're joining a new trip
      });

      if (!limitCheck.allowed) {
        showUpgradePrompt(
          `You've reached your trip limit (${limitCheck.limit} trips). Upgrade to accept more invitations!`,
          {
            title: "Upgrade to Accept Invitation",
            persistent: true
          }
        );
        return;
      }

      // Proceed with accepting the invitation
      await acceptTripInvite(invite.id, currentUser.uid);
      removeTripInvite(invite.id);
      await refreshTrips();

      // Update local state
      setCurrentTripCount(prev => prev + 1);
      
      // Check if user can still accept more invitations
      const usageInfo = getUsageInfo();
      if (usageInfo?.trips) {
        const { limit } = usageInfo.trips;
        setCanAcceptMoreInvitations(limit === "unlimited" || (currentTripCount + 1) < limit);
      }

      // Show success message with usage info
      const usageInfo2 = getUsageInfo();
      if (usageInfo2?.trips) {
        showSuccessMessage(
          `Joined ${invite.tripName}! (${currentTripCount + 1}/${usageInfo2.trips.limit === "unlimited" ? "∞" : usageInfo2.trips.limit} trips)`
        );
      } else {
        showSuccessMessage("Trip invitation accepted");
      }

    } catch (error) {
      console.error("Error accepting trip invite:", error);
      
      // Check if error is related to plan limits
      if (error.message?.includes("limit") || error.message?.includes("upgrade")) {
        showErrorMessage(error.message);
        showUpgradePrompt(error.message, {
          title: "Upgrade Required",
          persistent: true
        });
      } else {
        showErrorMessage("Failed to accept trip invitation");
      }
    } finally {
      setProcessingInviteId(null);
    }
  }, [
    processingInviteId,
    canPerformAction,
    currentTripCount,
    showUpgradePrompt,
    currentUser.uid,
    removeTripInvite,
    refreshTrips,
    getUsageInfo,
    showSuccessMessage,
    showErrorMessage
  ]);

  // Decline invite handler with Performance Optimization
  const handleDeclineTripInvite = useCallback(async (invite) => {
    if (processingInviteId === invite.id) return;

    try {
      setProcessingInviteId(invite.id);
      await declineTripInvite(invite.id);
      removeTripInvite(invite.id);
      showSuccessMessage("Trip invitation declined");
    } catch (error) {
      console.error("Error declining trip invite:", error);
      showErrorMessage("Failed to decline trip invitation");
    } finally {
      setProcessingInviteId(null);
    }
  }, [processingInviteId, removeTripInvite, showSuccessMessage, showErrorMessage]);

  const handleTripCreated = useCallback(() => {
    refreshTrips();
    showSuccessMessage("Trip created successfully!");
  }, [refreshTrips, showSuccessMessage]);

  const handleViewTrip = useCallback(
    (tripId) => {
      const tripCard = document.querySelector(`[data-trip-id="${tripId}"]`);
      if (tripCard) {
        tripCard.style.transform = "scale(0.95)";
        tripCard.style.opacity = "0.7";
      }

      setTimeout(() => {
        navigate(`/dashboard/trip/${tripId}`);
      }, 150);
    },
    [navigate]
  );

  // Helper function to render invitation action buttons
  const renderInvitationButtons = useCallback((invite) => {
    const isProcessing = processingInviteId === invite.id;
    const canAccept = canAcceptMoreInvitations && !isProcessing;

    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleAcceptTripInvite(invite)}
          disabled={!canAccept}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 ${
            canAccept
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!canAcceptMoreInvitations ? "Trip limit reached - upgrade to accept" : "Accept invitation"}
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircleIcon className="w-4 h-4" />
          )}
          Accept
        </button>
        <button
          onClick={() => handleDeclineTripInvite(invite)}
          disabled={isProcessing}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <XCircleIcon className="w-4 h-4" />
          )}
          Decline
        </button>
      </div>
    );
  }, [processingInviteId, canAcceptMoreInvitations, handleAcceptTripInvite, handleDeclineTripInvite]);

  // Helper function to render mobile invitation buttons
  const renderMobileInvitationButtons = useCallback((invite) => {
    const isProcessing = processingInviteId === invite.id;
    const canAccept = canAcceptMoreInvitations && !isProcessing;

    return (
      <div className="flex gap-3">
        <button
          onClick={() => handleAcceptTripInvite(invite)}
          disabled={!canAccept}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            canAccept
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircleIcon className="w-4 h-4" />
          )}
          Accept
        </button>
        <button
          onClick={() => handleDeclineTripInvite(invite)}
          disabled={isProcessing}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <XCircleIcon className="w-4 h-4" />
          )}
          Decline
        </button>
      </div>
    );
  }, [processingInviteId, canAcceptMoreInvitations, handleAcceptTripInvite, handleDeclineTripInvite]);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="h-6 sm:h-8 lg:h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-48"></div>
            <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse w-64"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-32"></div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-4"
            >
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1
            className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white"
            style={{ fontSize: window.innerWidth <= 320 ? "0.99rem" : "" }}
          >
            My Trips
          </h1>
          <p
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1"
            style={{ fontSize: window.innerWidth <= 320 ? "0.6rem" : "" }}
          >
            Organize and manage your travel memories
          </p>
        </div>

        {/* Create Trip Button with dynamic limit display */}
        {tripsActiveTab === "trips" && (
          <button
            onClick={handleCreateTrip}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-2 py-2 rounded-lg font-medium transition-all duration-300 shadow-md flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-0"
            style={{ fontSize: window.innerWidth <= 320 ? "0.55rem" : "" }}
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">
              {(() => {
                const usageInfo = getUsageInfo();
                const limit = usageInfo?.trips?.limit || MAX_TRIPS_PER_USER;
                return `Create Trip (${trips.length}/${limit === "unlimited" ? "∞" : limit})`;
              })()}
            </span>
            <span className="sm:hidden">
              {(() => {
                const usageInfo = getUsageInfo();
                const limit = usageInfo?.trips?.limit || MAX_TRIPS_PER_USER;
                return `Create (${trips.length}/${limit === "unlimited" ? "∞" : limit})`;
              })()}
            </span>
          </button>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      {isMobile && (
        <div
          className="mb-6"
          style={{ fontSize: window.innerWidth <= 320 ? "0.65rem" : "" }}
        >
          <TabSwitcher
            activeTab={tripsActiveTab}
            onTabChange={switchTripsTab}
            tabs={[
              {
                id: "trips",
                label: "Trips",
                icon: MapIcon,
                badge: trips.length,
                badgeColor: "indigo",
              },
              {
                id: "invitations",
                label: "Invites",
                icon: BellIcon,
                badge: tripInvites.length,
                badgeColor: "red",
              },
            ]}
          />
        </div>
      )}

      {/* Desktop Trip Invitations Section */}
      {!isMobile && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <MapIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              Trip Invitations
              {tripInvites.length > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {tripInvites.length}
                </span>
              )}
            </h2>
            <button
              onClick={toggleTripInvites}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
            >
              {tripInvitesExpanded ? (
                <ChevronDownIcon className="w-5 h-5 transition-transform duration-300" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 transition-transform duration-300" />
              )}
            </button>
          </div>

          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              tripInvitesExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-6">
              {/* Plan limit warning for desktop */}
              {!canAcceptMoreInvitations && tripInvites.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Trip Limit Reached</p>
                      <p className="text-amber-700">
                        You've reached your plan's trip limit. Upgrade to accept more invitations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tripInvites.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No pending trip invitations
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tripInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/30 dark:bg-gray-700/30"
                    >
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {invite.tripName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Invited by {invite.inviterName}
                        </p>
                      </div>
                      {renderInvitationButtons(invite)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters - only show on desktop or when on trips tab on mobile */}
      {(tripsActiveTab === "trips" || !isMobile) && (
        <div
          className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-4 lg:p-6 border border-white/20 dark:border-gray-700/50"
          style={{ fontSize: window.innerWidth <= 320 ? "0.7rem" : "" }}
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => updateSearchTerm(e.target.value)}
                onFocus={focusSearchInput}
                className="w-full pl-8 pr-3 py-2 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative z-[100]" ref={filterDropdownRef}>
              <FilterDropdown
                isOpen={filterDropdownOpen}
                onToggle={toggleFilterDropdown}
                onClose={closeFilterDropdown}
                currentFilter={dateFilter}
                onFilterChange={updateDateFilter}
                filterLabel={getFilterLabel(dateFilter)}
                className="z-50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      <div className={isMobile ? "" : "hidden lg:block"}>
        {!isMobile || tripsActiveTab === "trips" ? (
          /* Trips Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 transition-all duration-300">
            {filteredTrips.length === 0 ? (
              <div className="col-span-full text-center py-16 animate-fade-in">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MapIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  {searchTerm || dateFilter !== "all"
                    ? "No trips match your filters"
                    : "No trips yet"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || dateFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first trip to get started"}
                </p>
                {!searchTerm && dateFilter === "all" && (
                  <button
                    onClick={handleCreateTrip}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    Create Your First Trip
                  </button>
                )}
              </div>
            ) : (
              filteredTrips.map((trip, index) => (
                <div
                  key={trip.id}
                  className="animate-fade-in"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <TripCard trip={trip} onViewTrip={handleViewTrip} />
                </div>
              ))
            )}
          </div>
        ) : (
          /* Mobile Trip Invitations */
          <div className="space-y-4">
            {/* Plan limit warning for mobile */}
            {!canAcceptMoreInvitations && tripInvites.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800 text-sm">Trip Limit Reached</p>
                    <p className="text-amber-700 text-sm mt-1">
                      You've reached your plan's trip limit. Upgrade to accept more invitations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {tripInvites.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BellIcon className="w-12 h-12 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  No trip invitations
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  When someone invites you to a trip, it will appear here
                </p>
              </div>
            ) : (
              tripInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-4 border border-white/20 dark:border-gray-700/50"
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                      {invite.tripName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Invited by {invite.inviterName}
                    </p>
                  </div>
                  {renderMobileInvitationButtons(invite)}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Trip Modal */}
      <Suspense fallback={<div>Loading modal...</div>}>
        <CreateTripModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTripCreated={handleTripCreated}
        />
      </Suspense>
    </div>
  );
};

export default memo(TripsSection);