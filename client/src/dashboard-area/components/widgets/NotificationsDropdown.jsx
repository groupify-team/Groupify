// client/src/dashboard-area/components/widgets/NotificationsDropdown.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  UsersIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@auth/hooks/useAuth";
import { useEventContext } from "@shared/contexts/EventContext";
import { useFriendsContext } from "@shared/contexts/FriendsContext";
import { usePlanLimits } from "@shared/hooks/usePlanLimits"; // NEW: Add plan limits hook
import { useDashboardData } from "../../hooks/useDashboardData";
import {
  formatNotificationMessage,
  getRelativeTime,
} from "@dashboard/utils/dashboardHelpers";
import toast from "react-hot-toast";

const NotificationsDropdown = () => {
  const { currentUser } = useAuth();
  const [processingNotification, setProcessingNotification] = useState(null);

  const {
    eventInvitations,
    acceptEventInvitation,
    rejectEventInvitation,
    events,
  } = useEventContext();

  const { pendingRequests, acceptFriendRequest, rejectFriendRequest } =
    useFriendsContext();

  const { canPerformAction, showUpgradePrompt, getUsageInfo } = usePlanLimits();

  const { refreshevents, showSuccessMessage, showErrorMessage } =
    useDashboardData();

  const [canAcceptMoreEvents, setCanAcceptMoreEvents] = useState(true);
  const [currentEventCount, setCurrentEventCount] = useState(0);

  useEffect(() => {
    const checkEventAcceptanceAbility = () => {
      if (currentUser?.uid) {
        const usageInfo = getUsageInfo();
        if (usageInfo?.events) {
          const { used: eventCount, limit } = usageInfo.events;
          setCurrentEventCount(eventCount);
          const canAccept = limit === "unlimited" || eventCount < limit;
          setCanAcceptMoreEvents(canAccept);
        }
      }
    };

    checkEventAcceptanceAbility();
  }, [currentUser?.uid, getUsageInfo]);
  const allNotifications = [
    ...pendingRequests.map((req) => ({
      id: `friend-request-${req.id}`,
      type: "friend_request",
      title: "Friend Request",
      message: `${req.displayName || req.email} wants to be your friend`,
      avatar:
        req.photoURL ||
        "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg",
      time: req.createdAt,
      data: req,
      actions: [
        {
          label: "Accept",
          type: "accept",
          action: () => handleAcceptFriendRequest(req),
          disabled: false,
        },
        {
          label: "Decline",
          type: "decline",
          action: () => handleRejectFriendRequest(req),
          disabled: false,
        },
      ],
    })),
    ...eventInvitations.map((invite) => ({
      id: `event-invite-${invite.id}`,
      type: "event_invite",
      title: "Event Invitation",
      message: `${invite.senderName} invited you to "${invite.eventTitle}"`,
      avatar:
        invite.senderPhotoURL ||
        "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg",
      time: invite.createdAt,
      data: invite,
      actions: [
        {
          label: "Accept",
          type: "accept",
          action: () => handleAcceptEventInvitation(invite),
          disabled: !canAcceptMoreEvents,
        },
        {
          label: "Decline",
          type: "decline",
          action: () => handleRejectEventInvitation(invite),
          disabled: false,
        },
      ],
    })),
  ];

  const sortedNotifications = allNotifications.sort((a, b) => {
    const timeA = a.time?.toDate?.() || a.time || new Date(0);
    const timeB = b.time?.toDate?.() || b.time || new Date(0);
    return new Date(timeB) - new Date(timeA);
  });

  const handleAcceptFriendRequest = async (request) => {
    try {
      setProcessingNotification(`friend-request-${request.id}`);
      await acceptFriendRequest(request.id, request.from || request.uid);
      toast.success("Friend request accepted! 🎉");
    } catch (error) {
      console.error(
        "❌ NotificationsDropdown: Error accepting friend request:",
        error
      );
      toast.error("Failed to accept friend request");
    } finally {
      setProcessingNotification(null);
    }
  };

  const handleRejectFriendRequest = async (request) => {
    try {
      setProcessingNotification(`friend-request-${request.id}`);
      await rejectFriendRequest(request.id, request.from || request.uid);
      toast.success("Friend request declined");
    } catch (error) {
      console.error(
        "❌ NotificationsDropdown: Error rejecting friend request:",
        error
      );
      toast.error("Failed to decline friend request");
    } finally {
      setProcessingNotification(null);
    }
  };

  const handleAcceptEventInvitation = useCallback(
    async (invitation) => {
      if (processingNotification === `event-invite-${invitation.id}`) return;

      try {
        setProcessingNotification(`event-invite-${invitation.id}`);
        const usageInfo = getUsageInfo();
        const currentUsedEvents = usageInfo?.events?.used || 0;
        const limitCheck = canPerformAction("create_event", {
          currentEventCount: currentUsedEvents,
        });

        if (!limitCheck.allowed) {
          showUpgradePrompt(limitCheck.reason, {
            title: "Upgrade to Accept Invitation",
            persistent: true,
          });
          return;
        }

        await acceptEventInvitation(invitation.id, invitation.eventId);
        const updatedUsageInfo = getUsageInfo();
        const newEventCount =
          updatedUsageInfo?.events?.used || currentEventCount + 1;
        setCurrentEventCount(newEventCount);
        const { limit } = updatedUsageInfo?.events || {};
        const stillCanAccept = limit === "unlimited" || newEventCount < limit;
        setCanAcceptMoreEvents(stillCanAccept);
        const finalUsageInfo = getUsageInfo();
        toast.success(
          `Joined "${invitation.eventTitle}"! (${newEventCount}/${
            finalUsageInfo?.events?.limit === "unlimited"
              ? "∞"
              : finalUsageInfo?.events?.limit
          } events) 🎉`
        );
      } catch (error) {
        console.error(
          "NotificationsDropdown: Error accepting event invitation:",
          error
        );

        if (
          error.message?.includes("limit") ||
          error.message?.includes("upgrade")
        ) {
          showUpgradePrompt(error.message, {
            title: "Upgrade Required",
            persistent: true,
          });
        } else {
          toast.error("Failed to accept event invitation");
        }
      } finally {
        setProcessingNotification(null);
      }
    },
    [
      processingNotification,
      canPerformAction,
      events?.length,
      showUpgradePrompt,
      acceptEventInvitation,
      currentEventCount,
      getUsageInfo,
    ]
  );

  const handleRejectEventInvitation = async (invitation) => {
    try {
      setProcessingNotification(`event-invite-${invitation.id}`);
      await rejectEventInvitation(invitation.id);
      toast.success("Event invitation declined");
    } catch (error) {
      console.error(
        "NotificationsDropdown: Error rejecting event invitation:",
        error
      );
      toast.error("Failed to decline event invitation");
    } finally {
      setProcessingNotification(null);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "friend_request":
        return "👤";
      case "event_invite":
        return "📅";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "friend_request":
        return "from-blue-500 to-indigo-600";
      case "event_invite":
        return "from-purple-500 to-pink-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const hasBlockedEventInvites =
    eventInvitations.length > 0 && !canAcceptMoreEvents;

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden max-w-[calc(100vw-1rem)]"
      style={{
        transformOrigin: "top right",
        right: "-8px",
      }}
    >
      {" "}
      {/* Header */}
      <div className="p-4 border-b border-gray-100/50 dark:border-gray-700/50 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Notifications
          </h3>
          {sortedNotifications.length > 0 && (
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              {sortedNotifications.length}
            </span>
          )}
        </div>
      </div>
      {/* NEW: Plan limit warning banner */}
      {hasBlockedEventInvites && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200/50 dark:border-amber-700/50">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Event limit reached
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                Upgrade to accept event invitations ({currentEventCount}/
                {getUsageInfo()?.events?.limit || 5} events)
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Notifications Content */}
      <div className="max-h-80 overflow-y-auto">
        {sortedNotifications.length === 0 ? (
          /* Empty State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BellIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="font-medium text-gray-600 dark:text-gray-300 mb-2">
              All caught up!
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No new notifications to show
            </p>
          </div>
        ) : (
          /* Notifications List */
          <div className="divide-y divide-gray-100/50 dark:divide-gray-700/50">
            {sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors duration-200"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar with notification type indicator */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={notification.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
                    />
                    <div
                      className={`absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r ${getNotificationColor(
                        notification.type
                      )} rounded-full flex items-center justify-center text-xs border-2 border-white dark:border-gray-800`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title and Time */}
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {notification.title}
                      </h4>
                      {notification.time && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                          {getRelativeTime(notification.time)}
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {notification.message}
                    </p>

                    {/* NEW: Plan limit notice for disabled event invitations */}
                    {notification.type === "event_invite" &&
                      !canAcceptMoreEvents && (
                        <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            Event limit reached. Upgrade to accept this
                            invitation.
                          </p>
                        </div>
                      )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {notification.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.action();
                          }}
                          disabled={
                            processingNotification === notification.id ||
                            action.disabled // NEW: Respect the disabled state
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            action.type === "accept"
                              ? action.disabled
                                ? "bg-gray-100 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400" // NEW: Disabled styling
                                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 hover:scale-105"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 hover:scale-105"
                          }`}
                          title={
                            action.disabled &&
                            notification.type === "event_invite"
                              ? `Event limit reached (${currentEventCount}/${
                                  getUsageInfo()?.events?.limit || 5
                                }) - upgrade to accept`
                              : ""
                          }
                        >
                          {processingNotification === notification.id ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : action.type === "accept" ? (
                            <CheckCircleIcon className="w-3 h-3" />
                          ) : (
                            <XCircleIcon className="w-3 h-3" />
                          )}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Footer */}
      {sortedNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-100/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="text-center">
            <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors">
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
