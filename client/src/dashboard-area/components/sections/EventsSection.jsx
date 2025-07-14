// Improved Events Section with horizontal cards and better mobile responsiveness
import React, { useState, useEffect } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import { useEventContext } from "@shared/contexts/EventContext";
import { usePlanLimits } from "@shared/hooks/usePlanLimits";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  EyeIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// Import the updated EventCard component
import EventCard from "@dashboard/features/events/components/EventCard";
// Import other components
import CreateEventModal from "@dashboard/features/events/components/CreateEventModal";
import EventsLimitBanner from "@dashboard/features/events/components/EventsLimitBanner";

const EventsSection = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { getUsageInfo, canPerformAction, showUpgradePrompt } = usePlanLimits();

  // Get real-time data from contexts
  const { events, loading: eventsLoading } = useDashboardData();
  const {
    eventInvitations,
    acceptEventInvitation,
    rejectEventInvitation,
    loading: invitationsLoading,
  } = useEventContext();

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [processingInvitation, setProcessingInvitation] = useState(null);
  const [activeTab, setActiveTab] = useState("events"); // for mobile tabs
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get current usage info
  const usageInfo = getUsageInfo();
  const currentEventCount = usageInfo?.events?.used || 0;
  const eventLimit = usageInfo?.events?.limit;
  const isAtLimit =
    eventLimit !== "unlimited" && currentEventCount >= eventLimit;

  // Get event status helper
  const getEventStatus = (event) => {
    const now = new Date();
    const startDate = event.startDate?.toDate?.() || new Date(event.startDate);
    const endDate = event.endDate?.toDate?.() || new Date(event.endDate);

    if (!startDate) return { status: "draft", color: "gray" };
    if (now < startDate) return { status: "upcoming", color: "blue" };
    if (endDate && now > endDate)
      return { status: "completed", color: "green" };
    return { status: "ongoing", color: "purple" };
  };

  // Filter events based on search and status
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (filterStatus !== "all") {
      const eventStatus = getEventStatus(event);
      matchesStatus = eventStatus.status === filterStatus;
    }

    // Date filter
    let matchesDate = true;
    if (filterDate !== "all") {
      const now = new Date();
      const startDate =
        event.startDate?.toDate?.() || new Date(event.startDate);

      switch (filterDate) {
        case "thisWeek":
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          matchesDate =
            startDate && startDate >= now && startDate <= weekFromNow;
          break;
        case "thisMonth":
          const monthFromNow = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            now.getDate()
          );
          matchesDate =
            startDate && startDate >= now && startDate <= monthFromNow;
          break;
        case "past":
          matchesDate = startDate && startDate < now;
          break;
        default:
          matchesDate = true;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Handle create event
  const handleCreateEvent = () => {
    if (isAtLimit) {
      showUpgradePrompt(
        `You've reached your plan limit of ${eventLimit} events. Upgrade to create more!`,
        { title: "Upgrade Required", persistent: true }
      );
      return;
    }
    setShowCreateModal(true);
  };

  // Handle event invitation actions
  const handleAcceptInvitation = async (invitation) => {
    if (isAtLimit) {
      showUpgradePrompt(
        `You've reached your plan limit. Upgrade to accept invitations!`,
        { title: "Upgrade Required", persistent: true }
      );
      return;
    }

    try {
      setProcessingInvitation(invitation.id);
      await acceptEventInvitation(invitation.id, invitation.eventId);
      toast.success(`Joined "${invitation.eventTitle}"! 🎉`);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("Failed to accept invitation");
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleRejectInvitation = async (invitation) => {
    try {
      setProcessingInvitation(invitation.id);
      await rejectEventInvitation(invitation.id);
      toast.success("Invitation declined");
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      toast.error("Failed to decline invitation");
    } finally {
      setProcessingInvitation(null);
    }
  };

  // Handle view event
  const handleViewEvent = (eventId) => {
    navigate(`/dashboard/event/${eventId}`);
  };

  // Format event date
  const formatEventDate = (date) => {
    if (!date) return "Date not set";
    const eventDate = date.toDate ? date.toDate() : new Date(date);
    return eventDate.toLocaleDateString();
  };

  // Enhanced Filter Dropdown Component with proper z-index
  const FilterDropdown = ({
    value,
    onChange,
    options,
    placeholder,
    icon: Icon,
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-400" />
            <span className="text-sm">
              {options.find((opt) => opt.value === value)?.label || placeholder}
            </span>
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                    value === option.value
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // Filter options
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "upcoming", label: "Upcoming" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
    { value: "draft", label: "Draft" },
  ];

  const dateOptions = [
    { value: "all", label: "All Dates" },
    { value: "thisWeek", label: "This Week" },
    { value: "thisMonth", label: "This Month" },
    { value: "past", label: "Past Events" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Enhanced Header Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            {/* Title Section */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  My Events
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
                  <span className="inline sm:hidden">
                    {events.length} events • {eventInvitations.length} invites
                  </span>
                  <span className="hidden sm:inline">
                    {events.length} events • {eventInvitations.length} pending
                    invitations
                  </span>
                </p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleCreateEvent}
              disabled={isAtLimit}
              className={`inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-white shadow-lg transform transition-all duration-200 text-sm sm:text-base ${
                isAtLimit
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105 hover:shadow-xl"
              }`}
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Create Event</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        {isMobile && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-1 mb-6">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setActiveTab("events")}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === "events"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Events ({events.length})
              </button>
              <button
                onClick={() => setActiveTab("invitations")}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === "invitations"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Invitations ({eventInvitations.length})
              </button>
            </div>
          </div>
        )}

        {/* Limit Banner */}
        {isAtLimit && (
          <EventsLimitBanner
            currentEventCount={currentEventCount}
            onUpgrade={() =>
              showUpgradePrompt("Upgrade to create more events!")
            }
          />
        )}

        {/* Event Invitations Section */}
        {(!isMobile || activeTab === "invitations") &&
          eventInvitations.length > 0 && (
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-amber-200/50 dark:border-amber-700/50 shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                  <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Event Invitations
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {eventInvitations.length} pending invitation
                    {eventInvitations.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Plan limit warning */}
              {isAtLimit && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Event limit reached
                      </p>
                      <p className="text-amber-700 dark:text-amber-300">
                        Upgrade your plan to accept event invitations (
                        {currentEventCount}/{eventLimit} events)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invitations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {eventInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-white/90 dark:bg-gray-700/90 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-3 sm:p-4 shadow-md"
                  >
                    <div className="flex items-start gap-3 mb-3 sm:mb-4">
                      <img
                        src={
                          invitation.senderPhotoURL ||
                          "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                        }
                        alt={invitation.senderName}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {invitation.eventTitle}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-xs">
                          From {invitation.senderName}
                        </p>
                        {invitation.eventDescription && (
                          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">
                            {invitation.eventDescription}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvitation(invitation)}
                        disabled={
                          processingInvitation === invitation.id || isAtLimit
                        }
                        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all ${
                          isAtLimit
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                        title={
                          isAtLimit
                            ? `Event limit reached - upgrade to accept`
                            : "Accept invitation"
                        }
                      >
                        {processingInvitation === invitation.id ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                        <span className="hidden sm:inline">Accept</span>
                        <span className="sm:hidden">✓</span>
                      </button>
                      <button
                        onClick={() => handleRejectInvitation(invitation)}
                        disabled={processingInvitation === invitation.id}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      >
                        {processingInvitation === invitation.id ? (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <XCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                        <span className="hidden sm:inline">Decline</span>
                        <span className="sm:hidden">✗</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Search and Filter Section */}
        {(!isMobile || activeTab === "events") && (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 relative z-40">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FilterDropdown
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={statusOptions}
                  placeholder="Filter by status"
                  icon={FunnelIcon}
                />
                <FilterDropdown
                  value={filterDate}
                  onChange={setFilterDate}
                  options={dateOptions}
                  placeholder="Filter by date"
                  icon={CalendarIcon}
                />
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
        {(!isMobile || activeTab === "events") && (
          <div className="relative z-10">
            {eventsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-4 sm:p-6 animate-pulse"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-48 h-48 sm:h-32 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-8 sm:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <CalendarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2 sm:mb-3">
                  {searchTerm ? "No events found" : "No events yet"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
                  {searchTerm
                    ? "Try adjusting your search terms or filters"
                    : "Create your first event to start organizing memorable experiences"}
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreateEvent}
                    disabled={isAtLimit}
                    className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-white transition-all text-sm sm:text-base ${
                      isAtLimit
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105"
                    }`}
                  >
                    <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">
                      Create Your First Event
                    </span>
                    <span className="sm:hidden">Create Event</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onViewEvent={handleViewEvent}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onEventCreated={() => {
            setShowCreateModal(false);
            // Refresh events will happen automatically via context
          }}
        />
      )}
    </div>
  );
};

export default EventsSection;
