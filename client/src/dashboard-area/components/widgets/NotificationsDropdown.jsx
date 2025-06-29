// NotificationsDropdown.jsx - Notifications dropdown widget
import React from "react";
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@auth/contexts/AuthContext";
import { useDashboardData } from "../../hooks/useDashboardData";
import {
  acceptFriendRequest,
  rejectFriendRequest,
} from "@shared/services/firebase/users";
import {
  acceptTripInvite,
  declineTripInvite,
} from "@shared/services/firebase/trips";
import {
  formatNotificationMessage,
  getRelativeTime,
} from "@dashboard/utils/dashboardHelpers";

const NotificationsDropdown = ({ pendingRequests, tripInvites }) => {
  const { currentUser } = useAuth();
  const {
    refreshTrips,
    removePendingRequest,
    removeTripInvite,
    showSuccessMessage,
    showErrorMessage,
  } = useDashboardData();

  // Transform data into unified notification format
  const allNotifications = [
    ...pendingRequests.map((req) => ({
      id: `friend-request-${req.id}`,
      type: "friend_request",
      title: "Friend Request",
      message: formatNotificationMessage({
        type: "friend_request",
        senderName: req.displayName,
        senderEmail: req.email,
      }),
      avatar:
        req.photoURL ||
        "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg",
      time: req.createdAt,
      data: req,
      actions: [
        {
          label: "Accept",
          type: "accept",
          action: () => handleAcceptFriendRequest(req.from),
        },
        {
          label: "Decline",
          type: "decline",
          action: () => handleRejectFriendRequest(req.from),
        },
      ],
    })),
    ...tripInvites.map((invite) => ({
      id: `trip-invite-${invite.id}`,
      type: "trip_invite",
      title: "Trip Invitation",
      message: formatNotificationMessage({
        type: "trip_invite",
        inviterName: invite.inviterName,
        tripName: invite.tripName,
      }),
      avatar:
        invite.inviterPhoto ||
        "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg",
      time: invite.createdAt,
      data: invite,
      actions: [
        {
          label: "Accept",
          type: "accept",
          action: () => handleAcceptTripInvite(invite),
        },
        {
          label: "Decline",
          type: "decline",
          action: () => handleDeclineTripInvite(invite),
        },
      ],
    })),
  ];

  // Sort notifications by time (newest first)
  const sortedNotifications = allNotifications.sort((a, b) => {
    const timeA = a.time?.toDate?.() || a.time || new Date(0);
    const timeB = b.time?.toDate?.() || b.time || new Date(0);
    return new Date(timeB) - new Date(timeA);
  });

  const handleAcceptFriendRequest = async (fromUid) => {
    try {
      await acceptFriendRequest(currentUser.uid, fromUid);
      removePendingRequest(fromUid);
      showSuccessMessage("Friend request accepted");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      showErrorMessage("Failed to accept friend request");
    }
  };

  const handleRejectFriendRequest = async (senderUid) => {
    try {
      await rejectFriendRequest(currentUser.uid, senderUid);
      removePendingRequest(senderUid);
      showSuccessMessage("Friend request declined");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      showErrorMessage("Failed to decline friend request");
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case "friend_request":
        return "👥";
      case "trip_invite":
        return "✈️";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "friend_request":
        return "from-blue-500 to-indigo-600";
      case "trip_invite":
        return "from-purple-500 to-pink-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 max-h-96 overflow-hidden max-w-[calc(100vw-1rem)] mr-2 sm:mr-0">
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

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {notification.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.action();
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                            action.type === "accept"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 hover:scale-105"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 hover:scale-105"
                          }`}
                        >
                          {action.type === "accept" ? (
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
