// EventsSection.jsx - Performance Optimized with Plan Limit Validation
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
import { useAuth } from "@auth/hooks/useAuth";

// Dashboard Hooks
import { useDashboardLayout } from "@/dashboard-area/hooks/useDashboardLayout";
import { useDashboardData } from "@/dashboard-area/hooks/useDashboardData";
import { useEventContext } from "@shared/contexts/EventContext";
import { useDashboardModals } from "@dashboard/contexts/DashboardModalsContext";

// Plan Limits Hook
import { usePlanLimits } from "@shared/hooks/usePlanLimits";

// Dashboard Components
import TabSwitcher from "@/dashboard-area/components/ui/TabSwitcher";
import FilterDropdown from "@/dashboard-area/components/ui/FilterDropdown";

// Event Components
import EventCard from "@/dashboard-area/features/events/components/EventCard";
import EventsLimitBanner from "@/dashboard-area/features/events/components/EventsLimitBanner"; // New import

const CreateEventModal = lazy(() =>
  import("@/dashboard-area/features/events/components/CreateEventModal")
);

// Utils
import {
  filterevents,
  getFilterLabel,
} from "@/dashboard-area/utils/dashboardHelpers";

// Services
import {
  getUserEventCount,
  MAX_EVENTS_PER_USER,
} from "@firebase-services/events";

const EventsSection = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Plan Limits Hook
  const { canPerformAction, showUpgradePrompt, getUsageInfo } = usePlanLimits();

  // Layout state and actions
  const {
    layout: { isMobile },
    tabs: { eventsActiveTab },
    filters: { searchTerm, dateFilter },
    refs: { searchInputRef },
    tabActions: { switcheventsTab },
    filterActions: { updateSearchTerm, updateDateFilter, focusSearchInput },
    desktop: { eventInvitesExpanded },
    desktopActions: { toggleEventInvites },
    dropdowns: { filterDropdownOpen },
    dropdownActions: { toggleFilterDropdown, closeFilterDropdown },
  } = useDashboardLayout();

  // Dashboard data and actions
    const {
  events,
  eventInvitations,
  loading: eventContextLoading,
  acceptEventInvitation,
  rejectEventInvitation,
} = useEventContext();


    const {
  showSuccessMessage,
  showErrorMessage,
} = useDashboardData();

  // Modal state
  const {
    createEvent: { open: _opencreateEventModal },
  } = useDashboardModals();

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const loading = eventContextLoading;

  console.log("🎯 EventsSection: Using real-time data:", {
  eventsCount: events.length,
  eventInvitationsCount: eventInvitations.length,
  loading,
});

const uniqueEvents = useMemo(() => {
  const seen = new Set();
  return events.filter(event => {
    if (seen.has(event.id)) {
      console.warn("🔍 EventsSection: Removing duplicate event:", event.id);
      return false;
    }
    seen.add(event.id);
    return true;
  });
}, [events]);

  const [canAcceptMoreInvitations, setCanAcceptMoreInvitations] =
    useState(true);
  const [currentEventCount, setCurrentEventCount] = useState(0);
  const [processingInviteId, setProcessingInviteId] = useState(null);

  // Memoize filtered events to prevent unnecessary recalculations
  const filteredevents = useMemo(() => {
    return filterevents(uniqueEvents, searchTerm, dateFilter);
},  [uniqueEvents, searchTerm, dateFilter]);

  // Click outside ref for filter dropdown
  const filterDropdownRef = useClickOutside(() => closeFilterDropdown());

  // CHECK event ACCEPTANCE ABILITY ON LOAD AND WHEN events CHANGE
  useEffect(() => {
    const checkEventAcceptanceAbility = async () => {
    if (currentUser?.uid) {
      try {
        // FIXED: Use real-time events.length instead of fetching again
        const eventCount = events.length;
        setCurrentEventCount(eventCount);

        const usageInfo = getUsageInfo();
        if (usageInfo?.events) {
          const { limit } = usageInfo.events; // FIXED: Declare limit properly
          setCanAcceptMoreInvitations(
            limit === "unlimited" || eventCount < limit
          );

          console.log("🔍 EventsSection: Event acceptance check:", {
            eventCount,
            limit,
            canAcceptMore: limit === "unlimited" || eventCount < limit,
          });
        }
      } catch (error) {
        console.error("Error checking event acceptance ability:", error);
      }
    }
  };

    checkEventAcceptanceAbility();
  }, [currentUser?.uid, events.length, getUsageInfo]);

  // Enhanced Create Event Handler with Performance Optimization
  const handlecreateEvent = useCallback(async () => {
    try {
      // Use plan limits validation instead of hardcoded check
      const limitCheck = canPerformAction("create_event", {
        currentEventCount: uniqueEvents.length,

      });

      if (!limitCheck.allowed) {
        showUpgradePrompt(limitCheck.reason, {
          title: "Upgrade to Create More Events",
          persistent: true,
        });
        return;
      }

      setShowCreateModal(true);
    } catch (error) {
      console.error("Error checking event creation limit:", error);
      showErrorMessage("Failed to check event limit. Please try again.");
    }
  }, [canPerformAction, events.length, showUpgradePrompt, showErrorMessage]);

  // Enhanced Accept Invite Handler with Validation and Performance Optimization
 const handleAcceptEventInvite = useCallback(
  async (invite) => {
    if (processingInviteId === invite.id) return; // Prevent double-processing

    try {
      setProcessingInviteId(invite.id);
      console.log("🔍 EVENTS SECTION - Accepting invitation:", {
        inviteId: invite.id,
        currentEventCount,
        canAcceptMoreInvitations
      });

      // FIXED: Check if user can accept more events using simple logic
      if (!canAcceptMoreInvitations) {
        const usageInfo = getUsageInfo();
        showUpgradePrompt(
          `You've reached your event limit (${currentEventCount}/${usageInfo?.events?.limit || 5} events). Upgrade to accept more invitations!`,
          {
            title: "Upgrade to Accept Invitation",
            persistent: true,
          }
        );
        return;
      }

      // Use EventContext function
      await acceptEventInvitation(invite.id, invite.eventId);
      
      // Update local state
      const newEventCount = currentEventCount + 1;
      setCurrentEventCount(newEventCount);

      // FIXED: Check if user can still accept more invitations
      const usageInfo = getUsageInfo();
      if (usageInfo?.events) {
        const { limit } = usageInfo.events;
        const stillCanAccept = limit === "unlimited" || newEventCount < limit;
        console.log("🔍 EVENTS SECTION - Updated can accept:", {
          newEventCount,
          limit,
          stillCanAccept
        });
        setCanAcceptMoreInvitations(stillCanAccept);
      }

      // Show success message with usage info
      showSuccessMessage(
        `Joined ${invite.eventName || invite.eventTitle}! (${newEventCount}/${
          usageInfo?.events?.limit === "unlimited" ? "∞" : usageInfo?.events?.limit
        } events)`
      );
    } catch (error) {
      console.error("❌ EVENTS SECTION - Error accepting event invite:", error);

      // Check if error is related to plan limits
      if (
        error.message?.includes("limit") ||
        error.message?.includes("upgrade")
      ) {
        showErrorMessage(error.message);
        showUpgradePrompt(error.message, {
          title: "Upgrade Required",
          persistent: true,
        });
      } else {
        showErrorMessage("Failed to accept Event invitation");
      }
    } finally {
      setProcessingInviteId(null);
    }
  },
  [
  processingInviteId,
  currentEventCount,
  canAcceptMoreInvitations,
  showUpgradePrompt,
  acceptEventInvitation,
  getUsageInfo,
  showSuccessMessage,
  showErrorMessage,
]
);

  // Decline invite handler with Performance Optimization
  const handleDeclineEventInvite = useCallback(
  async (invite) => {
    if (processingInviteId === invite.id) return;

    try {
      setProcessingInviteId(invite.id);
      // Use EventContext function directly
      await rejectEventInvitation(invite.id);
      showSuccessMessage("Event invitation declined");
    } catch (error) {
      console.error("Error declining event invite:", error);
      showErrorMessage("Failed to decline Event invitation");
    } finally {
      setProcessingInviteId(null);
    }
  },
  [processingInviteId, showSuccessMessage, showErrorMessage, rejectEventInvitation]
);

  const handleEventCreated = useCallback(() => {
  // FIXED: No need to manually refresh since EventContext handles real-time updates
    showSuccessMessage("Event Created Successfully!");
}, [showSuccessMessage]);

  const handleViewEvent = useCallback(
    (eventId) => {
      const EventCard = document.querySelector(`[data-event-id="${eventId}"]`);
      if (EventCard) {
        EventCard.style.transform = "scale(0.95)";
        EventCard.style.opacity = "0.7";
      }

      setTimeout(() => {
        navigate(`/dashboard/event/${eventId}`);
      }, 150);
    },
    [navigate]
  );

  // Helper function to render invitation action buttons
  const renderInvitationButtons = useCallback(
  (invite) => {
    const isProcessing = processingInviteId === invite.id;
    const canAccept = canAcceptMoreInvitations && !isProcessing;
    
    // Debug logging for each button
    console.log("🔍 EVENTS SECTION - Button render:", {
      inviteId: invite.id,
      canAcceptMoreInvitations,
      isProcessing,
      canAccept,
      currentEventCount
    });

    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleAcceptEventInvite(invite)}
          disabled={!canAccept}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 ${
            canAccept
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          title={
            !canAcceptMoreInvitations
              ? `Event limit reached (${currentEventCount}/5) - upgrade to accept`
              : "Accept invitation"
          }
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircleIcon className="w-4 h-4" />
          )}
          Accept
        </button>
        <button
          onClick={() => handleDeclineEventInvite(invite)}
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
  },
  [
    processingInviteId,
    canAcceptMoreInvitations,
    currentEventCount,
    handleAcceptEventInvite,
    handleDeclineEventInvite,
  ]
);

  // Helper function to render mobile invitation buttons
  const renderMobileInvitationButtons = useCallback(
    (invite) => {
      const isProcessing = processingInviteId === invite.id;
      const canAccept = canAcceptMoreInvitations && !isProcessing;

      return (
        <div className="flex gap-3">
          <button
            onClick={() => handleAcceptEventInvite(invite)}
            disabled={!canAccept}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              canAccept
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
            onClick={() => handleDeclineEventInvite(invite)}
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
    },
    [
      processingInviteId,
      canAcceptMoreInvitations,
      handleAcceptEventInvite,
      handleDeclineEventInvite,
    ]
  );

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
            My events
          </h1>
          <p
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1"
            style={{ fontSize: window.innerWidth <= 320 ? "0.6rem" : "" }}
          >
            Organize and manage your travel memories
          </p>
        </div>

        {/* Create Event Button with dynamic limit display */}
        {eventsActiveTab === "events" && (
          <button
            onClick={handlecreateEvent}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-2 py-2 rounded-lg font-medium transition-all duration-300 shadow-md flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 min-w-0"
            style={{ fontSize: window.innerWidth <= 320 ? "0.55rem" : "" }}
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">
              {(() => {
                const usageInfo = getUsageInfo();
                const limit = usageInfo?.events?.limit || MAX_EVENTS_PER_USER;
                return `Create Event (${uniqueEvents.length}/${
                  limit === "unlimited" ? "∞" : limit
                })`;
              })()}
            </span>
            <span className="sm:hidden">
              {(() => {
                const usageInfo = getUsageInfo();
                const limit = usageInfo?.events?.limit || MAX_EVENTS_PER_USER;
                return `Create (${events.length}/${
                  limit === "unlimited" ? "∞" : limit
                })`;
              })()}
            </span>
          </button>
        )}
      </div>

      {/* Events Limit Banner - NEW ADDITION */}
      {eventsActiveTab === "events" && (
        <EventsLimitBanner 
          currentEventCount={uniqueEvents.length}
        />
      )}

      {/* Mobile Tab Switcher */}
      {isMobile && (
        <div
          className="mb-6"
          style={{ fontSize: window.innerWidth <= 320 ? "0.65rem" : "" }}
        >
          <TabSwitcher
            activeTab={eventsActiveTab}
            onTabChange={switcheventsTab}
            tabs={[
              {
                id: "events",
                label: "events",
                icon: MapIcon,
                badge: uniqueEvents.length,
                badgeColor: "indigo",
              },
              {
                id: "invitations",
                label: "Invites",
                icon: BellIcon,
                badge: eventInvitations.length,
                badgeColor: "red",
              },
            ]}
          />
        </div>
      )}

      {/* Desktop Event Invitations Section */}
      {!isMobile && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <MapIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              Event Invitations
              {eventInvitations.length > 0 && (
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {eventInvitations.length}
                </span>
              )}
            </h2>
            <button
              onClick={toggleEventInvites}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
            >
              {eventInvitesExpanded ? (
                <ChevronDownIcon className="w-5 h-5 transition-transform duration-300" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 transition-transform duration-300" />
              )}
            </button>
          </div>

          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              eventInvitesExpanded
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-6">
              {/* Plan limit warning for desktop */}
              {!canAcceptMoreInvitations && eventInvitations.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">
                        Event limit reached
                      </p>
                      <p className="text-amber-700">
                        You've reached your plan's event limit. Upgrade to
                        accept more invitations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {eventInvitations.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No pending Event invitations
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventInvitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/30 dark:bg-gray-700/30"
                    >
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {invite.eventTitle || invite.eventName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Invited by {invite.senderName || invite.inviterName}
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

      {/* Filters - only show on desktop or when on events tab on mobile */}
      {(eventsActiveTab === "events" || !isMobile) && (
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
                placeholder="Search events..."
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
        {!isMobile || eventsActiveTab === "events" ? (
          /* events Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 transition-all duration-300">
            {filteredevents.length === 0 ? (
              <div className="col-span-full text-center py-16 animate-fade-in">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MapIcon className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  {searchTerm || dateFilter !== "all"
                    ? "No events match your filters"
                    : "No events yet"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm || dateFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first event to get started"}
                </p>
                {!searchTerm && dateFilter === "all" && (
                  <button
                    onClick={handlecreateEvent}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    Create Your First event
                  </button>
                )}
              </div>
            ) : (
              filteredevents.map((event, index) => (
                <div
                  key={event.id}
                  className="animate-fade-in"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <EventCard event={event} onViewEvent={handleViewEvent} />
                </div>
              ))
            )}
          </div>
        ) : (
          /* Mobile Event Invitations */
          <div className="space-y-4">
            {/* Plan limit warning for mobile */}
            {!canAcceptMoreInvitations && eventInvitations.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800 text-sm">
                      Event limit reached
                    </p>
                    <p className="text-amber-700 text-sm mt-1">
                      You've reached your plan's event limit. Upgrade to accept
                      more invitations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {eventInvitations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BellIcon className="w-12 h-12 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  No event invitations
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  When someone invites you to a event, it will appear here
                </p>
              </div>
            ) : (
              eventInvitations.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-4 border border-white/20 dark:border-gray-700/50"
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                      {invite.eventTitle || invite.eventName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Invited by {invite.senderName || invite.inviterName}
                    </p>
                  </div>
                  {renderMobileInvitationButtons(invite)}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <Suspense fallback={<div>Loading modal...</div>}>
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onEventCreated={handleEventCreated}
        />
      </Suspense>
    </div>
  );
};

export default memo(EventsSection);