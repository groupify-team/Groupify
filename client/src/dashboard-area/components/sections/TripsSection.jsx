// TripsSection.jsx - Trips management section
import React from "react";
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
import { useAuth } from "@auth/contexts/AuthContext";
import { useDashboardLayout } from "@dashboard/hooks/useDashboardLayout";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import { useDashboardModals } from "@dashboard/hooks/useDashboardModals";
import TripCard from "@trips/components/TripCard";
import TabSwitcher from "@dashboard/components/ui/TabSwitcher";
import FilterDropdown from "@dashboard/components/ui/FilterDropdown";
import { filterTrips, getFilterLabel } from "@dashboard/utils/dashboardHelpers";
import {
  canUserCreateTrip,
  getUserTripCount,
  MAX_TRIPS_PER_USER,
  acceptTripInvite,
  declineTripInvite,
} from "@shared/services/firebase/trips";

const TripsSection = () => {
  const { currentUser } = useAuth();

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

  const {
    trips,
    tripInvites,
    refreshTrips,
    removeTripInvite,
    showSuccessMessage,
    showErrorMessage,
  } = useDashboardData();

  const {
    createTrip: { open: openCreateTripModal },
  } = useDashboardModals();

  const filteredTrips = filterTrips(trips, searchTerm, dateFilter);

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
      openCreateTripModal();
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

  const handleViewTrip = (tripId) => {
    // This will be handled by the parent dashboard component
    // through the navigation hook
    console.log("View trip:", tripId);
  };

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
              Create Trip ({trips.length}/{MAX_TRIPS_PER_USER})
            </span>
            <span className="sm:hidden">
              Create ({trips.length}/{MAX_TRIPS_PER_USER})
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
            <FilterDropdown
              isOpen={filterDropdownOpen}
              onToggle={toggleFilterDropdown}
              onClose={closeFilterDropdown}
              currentFilter={dateFilter}
              onFilterChange={updateDateFilter}
              filterLabel={getFilterLabel(dateFilter)}
            />
          </div>
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

      {/* Content based on active tab */}
      <div className={isMobile ? "" : "hidden lg:block"}>
        {!isMobile || tripsActiveTab === "trips" ? (
          /* Trips Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
            {filteredTrips.length === 0 ? (
              <div className="col-span-full text-center py-16">
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
              filteredTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onViewTrip={handleViewTrip}
                />
              ))
            )}
          </div>
        ) : (
          /* Mobile Trip Invitations */
          <div className="space-y-4">
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
    </div>
  );
};

export default TripsSection;
