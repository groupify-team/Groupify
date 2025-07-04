// TripsSection.jsx - Clean Production Version
import React, { useState } from "react";
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
} from "@heroicons/react/24/outline";

// Auth Context
import { useAuth } from "@/auth-area/contexts/AuthContext";

// Dashboard Hooks
import { useDashboardLayout } from "@/dashboard-area/hooks/useDashboardLayout";
import { useDashboardData } from "@/dashboard-area/hooks/useDashboardData";
import { useDashboardModals } from "@dashboard/contexts/DashboardModalsContext";

// Dashboard Components
import TabSwitcher from "@/dashboard-area/components/ui/TabSwitcher";
import FilterDropdown from "@/dashboard-area/components/ui/FilterDropdown";

// Trip Components
import TripCard from "@/dashboard-area/features/trips/components/TripCard";
import CreateTripModal from "@/dashboard-area/features/trips/components/CreateTripModal";

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
} from "@trips/services/tripsService";

const TripsSection = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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

  const {
    createTrip: { open: openCreateTripModal },
  } = useDashboardModals();

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Filtered trips based on search and date filters
  const filteredTrips = filterTrips(trips, searchTerm, dateFilter);
  
  // Click outside ref for filter dropdown
  const filterDropdownRef = useClickOutside(() => closeFilterDropdown());

  // Event handlers
  const handleCreateTrip = async () => {
    try {
      const canCreate = await canUserCreateTrip(currentUser.uid);
      if (!canCreate) {
        const currentCount = await getUserTripCount(currentUser.uid);
        showErrorMessage(
          `Trip limit reached! You can only create ${MAX_TRIPS_PER_USER} trips. You currently have ${currentCount} trips.`,
          6000
        );
        return;
      }
      setShowCreateModal(true);
    } catch (error) {
      console.error("Error checking trip creation limit:", error);
      showErrorMessage("Failed to check trip limit. Please try again.");
    }
  };

  const handleAcceptTripInvite = async (invite) => {
    try {
      await acceptTripInvite(invite.id, currentUser.uid);
      removeTripInvite(invite.id);
      await refreshTrips();
      showSuccessMessage("Trip invitation accepted");
    } catch (error) {
      console.error("Error accepting trip invite:", error);
      showErrorMessage("Failed to accept trip invitation");
    }
  };

  const handleDeclineTripInvite = async (invite) => {
    try {
      await declineTripInvite(invite.id);
      removeTripInvite(invite.id);
      showSuccessMessage("Trip invitation declined");
    } catch (error) {
      console.error("Error declining trip invite:", error);
      showErrorMessage("Failed to decline trip invitation");
    }
  };

  const handleTripCreated = (newTrip) => {
    refreshTrips();
    showSuccessMessage("Trip created successfully!");
  };

  const handleViewTrip = (tripId) => {
    const tripCard = document.querySelector(`[data-trip-id="${tripId}"]`);
    if (tripCard) {
      tripCard.style.transform = "scale(0.95)";
      tripCard.style.opacity = "0.7";
    }

    setTimeout(() => {
      navigate(`/dashboard/trip/${tripId}`);
    }, 150);
  };

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

        {/* Create Trip Button - only show when on trips tab */}
        {tripsActiveTab === "trips" && (
          <button
            onClick={handleCreateTrip}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-2 py-2 rounded-lg font-medium transition-all duration-300 shadow-md flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-0"
            style={{ fontSize: window.innerWidth <= 320 ? "0.55rem" : "" }}
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">
              Create Trip ({trips?.length || 0}/{MAX_TRIPS_PER_USER})
            </span>
            <span className="sm:hidden">
              Create ({trips?.length || 0}/{MAX_TRIPS_PER_USER})
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
                badge: trips?.length || 0,
                badgeColor: "indigo",
              },
              {
                id: "invitations",
                label: "Invites",
                icon: BellIcon,
                badge: tripInvites?.length || 0,
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
              {(tripInvites?.length || 0) > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {tripInvites?.length || 0}
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
              {(tripInvites?.length || 0) === 0 ? (
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptTripInvite(invite)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineTripInvite(invite)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          Decline
                        </button>
                      </div>
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
            {(filteredTrips?.length || 0) === 0 ? (
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
            {(tripInvites?.length || 0) === 0 ? (
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
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAcceptTripInvite(invite)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineTripInvite(invite)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTripCreated={handleTripCreated}
      />
    </div>
  );
};

export default TripsSection;