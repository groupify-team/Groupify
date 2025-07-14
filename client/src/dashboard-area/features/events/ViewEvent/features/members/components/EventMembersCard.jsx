import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEventContext } from "@shared/contexts/EventContext";
import { useUserPresence } from "@shared/hooks/useUserPresence";

import {
  UserGroupIcon,
  StarIcon,
  ShieldCheckIcon,
  EllipsisVerticalIcon,
  ArrowRightOnRectangleIcon,
  UserMinusIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Enhanced Member Card with Real-Time Presence
const MemberCardWithPresence = ({ member, currentUserId, onClick, role }) => {
  const memberPresence = useUserPresence(member.uid);

  // Get status indicator config
  const getStatusConfig = () => {
    if (memberPresence.loading) {
      return {
        color: "bg-gray-400",
        ring: "ring-gray-200 dark:ring-gray-700",
        pulse: "animate-pulse",
        title: "Loading status...",
      };
    }

    if (memberPresence.isOnline) {
      switch (memberPresence.status) {
        case "online":
          return {
            color: "bg-emerald-500",
            ring: "ring-emerald-200 dark:ring-emerald-800",
            pulse: "animate-pulse",
            title: "Online now",
          };
        case "away":
          return {
            color: "bg-amber-500",
            ring: "ring-amber-200 dark:ring-amber-800",
            pulse: "",
            title: "Away",
          };
        case "busy":
          return {
            color: "bg-red-500",
            ring: "ring-red-200 dark:ring-red-800",
            pulse: "",
            title: "Busy",
          };
        default:
          return {
            color: "bg-emerald-500",
            ring: "ring-emerald-200 dark:ring-emerald-800",
            pulse: "animate-pulse",
            title: "Online",
          };
      }
    }

    return {
      color: "bg-gray-400",
      ring: "ring-gray-200 dark:ring-gray-700",
      pulse: "",
      title: memberPresence.lastSeen
        ? `Last seen ${formatLastSeen(memberPresence.lastSeen)}`
        : "Offline",
    };
  };

  const statusConfig = getStatusConfig();

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderRoleBadge = () => {
    if (role === "creator") {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
          <StarIcon className="w-3 h-3" />
          Creator
        </div>
      );
    }

    if (role === "admin") {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
          <ShieldCheckIcon className="w-3 h-3" />
          Admin
        </div>
      );
    }

    return null;
  };

  // Helper function to format last seen
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "";

    const now = new Date();
    const lastSeenDate = lastSeen.toDate
      ? lastSeen.toDate()
      : new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return lastSeenDate.toLocaleDateString();
  };

  return (
    <div
      className="group/member p-3 rounded-lg bg-gradient-to-r from-gray-50/50 to-orange-50/50 dark:from-gray-800/50 dark:to-orange-900/20 hover:from-orange-50 hover:to-orange-100 dark:hover:from-orange-900/30 dark:hover:to-orange-900/40 transition-all duration-300 cursor-pointer border border-gray-200/30 dark:border-gray-700/30 backdrop-blur-sm hover:shadow-md relative"
      onClick={() => onClick(member, currentUserId)}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with Real-Time Presence */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            {member.photoURL ? (
              <img
                src={member.photoURL}
                alt={member.displayName || member.email}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-sm font-semibold">
                {getInitials(member.displayName || member.email)}
              </span>
            )}
          </div>

          {/* Real-Time Status Indicator - ONLY presence circle */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${statusConfig.color} border-2 border-white dark:border-gray-800 rounded-full ${statusConfig.ring} ring-2 ${statusConfig.pulse} shadow-lg`}
            title={statusConfig.title}
          ></div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
              {member.displayName || "Unknown User"}
              {member.uid === currentUserId && (
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  (You)
                </span>
              )}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {member.email}
          </p>

          {/* Real-Time Presence Status Text */}
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
            {memberPresence.loading
              ? "Loading..."
              : memberPresence.isOnline
              ? `${
                  memberPresence.status.charAt(0).toUpperCase() +
                  memberPresence.status.slice(1)
                }`
              : memberPresence.lastSeen
              ? `Last seen ${formatLastSeen(memberPresence.lastSeen)}`
              : "Offline"}
          </p>
        </div>

        {/* Role Badge */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {renderRoleBadge()}
        </div>
      </div>
    </div>
  );
};

const EventMembersCard = ({
  event,
  currentUserId,
  onMemberClick,
  onPromoteToAdmin,
  onDemoteFromAdmin,
  onRemoveFromEvent,
  onLeaveEvent,
}) => {
  const navigate = useNavigate();
  const [showMenuForMember, setShowMenuForMember] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get real-time event members from context
  const { getEventMembers, getEventById } = useEventContext();

  // Get real-time data
  const currentEvent = useMemo(() => {
    return event?.id ? getEventById(event.id) : event;
  }, [event, getEventById]);

  const eventMembers = useMemo(() => {
    return event?.id ? getEventMembers(event.id) : [];
  }, [event?.id, getEventMembers]);

  // Debug logging
  console.log("EventMembersCard props:", {
    eventMembersCount: eventMembers?.length,
    eventMembers,
    eventData: currentEvent,
    currentUserId,
  });

  // Sort members: current user first, then creator, then admins, then by join date
  const sortedMembers = useMemo(() => {
    return [...eventMembers].sort((a, b) => {
      // 1. Current user first
      if (a.uid === currentUserId) return -1;
      if (b.uid === currentUserId) return 1;

      // 2. Creator second (if not current user)
      if (a.uid === currentEvent?.createdBy) return -1;
      if (b.uid === currentEvent?.createdBy) return 1;

      // 3. Both are admins - sort by join date (oldest first)
      const aIsAdmin = currentEvent?.admins?.includes(a.uid);
      const bIsAdmin = currentEvent?.admins?.includes(b.uid);

      if (aIsAdmin && bIsAdmin) {
        const aJoinDate = new Date(a.joinDate || a.createdAt || 0);
        const bJoinDate = new Date(b.joinDate || b.createdAt || 0);
        return aJoinDate - bJoinDate;
      }

      // 4. Admin vs non-admin
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;

      // 5. Both are regular members - sort by join date (oldest first)
      const aJoinDate = new Date(a.joinDate || a.createdAt || 0);
      const bJoinDate = new Date(b.joinDate || b.createdAt || 0);
      return aJoinDate - bJoinDate;
    });
  }, [eventMembers, currentUserId, currentEvent]);

  const getMemberRole = (member) => {
    if (member.uid === currentEvent?.createdBy) return "creator";
    if (currentEvent?.admins?.includes(member.uid)) return "admin";
    return "member";
  };

  // Check if current user can manage another user
  const canManageUser = (targetMember) => {
    const isCurrentUserCreator = currentUserId === currentEvent?.createdBy;
    const isCurrentUserAdmin = currentEvent?.admins?.includes(currentUserId);
    const isTargetCreator = targetMember.uid === currentEvent?.createdBy;
    const isTargetCurrentUser = targetMember.uid === currentUserId;

    // Current user can't manage themselves (except leaving)
    if (isTargetCurrentUser) return false;

    // Creator can manage everyone except themselves
    if (isCurrentUserCreator && !isTargetCreator) return true;

    // Admin can manage regular members only (not creator or other admins)
    if (
      isCurrentUserAdmin &&
      !isTargetCreator &&
      !currentEvent?.admins?.includes(targetMember.uid)
    )
      return true;

    return false;
  };

  // Handle confirmed actions
  const handleConfirmedAction = async () => {
    if (!confirmAction) return;

    setLoading(true);
    try {
      const { action, member } = confirmAction;

      switch (action) {
        case "promote":
          await onPromoteToAdmin(member.uid);
          break;
        case "demote":
          await onDemoteFromAdmin(member.uid);
          break;
        case "remove":
          await onRemoveFromEvent(member.uid);
          break;
        case "leave":
          await onLeaveEvent();
          setTimeout(() => {
            navigate("/dashboard/events");
          }, 1500);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setLoading(false);
      setConfirmAction(null);
      setShowMenuForMember(null);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-3 sm:p-6 border border-white/20 dark:border-gray-700/50">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 justify-center sm:justify-start">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 justify-center sm:justify-start">
              Event Members
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                {eventMembers.length}
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              Manage members and permissions
            </p>
          </div>
        </div>

        {eventMembers.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No members found
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300 dark:scrollbar-thumb-orange-700 scrollbar-track-transparent">
            {sortedMembers.map((member, index) => (
              <MemberCardWithPresence
                key={member.uid || `member-${index}`}
                member={member}
                currentUserId={currentUserId}
                onClick={onMemberClick}
                role={getMemberRole(member)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full border border-gray-200 dark:border-slate-700 shadow-2xl transform transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                {confirmAction.action === "leave" ? (
                  <ArrowRightOnRectangleIcon className="w-8 h-8 text-white" />
                ) : confirmAction.action === "promote" ? (
                  <ShieldCheckIcon className="w-8 h-8 text-white" />
                ) : (
                  <ExclamationTriangleIcon className="w-8 h-8 text-white" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {confirmAction.action === "leave" && "Leave Event"}
                {confirmAction.action === "promote" && "Promote to Admin"}
                {confirmAction.action === "demote" && "Remove Admin"}
                {confirmAction.action === "remove" && "Remove Member"}
              </h3>
              <p className="text-gray-600 dark:text-slate-300">
                {confirmAction.action === "leave" &&
                  "Are you sure you want to leave this event? You won't be able to access it anymore."}
                {confirmAction.action === "promote" &&
                  `Are you sure you want to promote ${
                    confirmAction.member?.displayName || "this user"
                  } to admin?`}
                {confirmAction.action === "demote" &&
                  `Are you sure you want to remove admin privileges from ${
                    confirmAction.member?.displayName || "this user"
                  }?`}
                {confirmAction.action === "remove" &&
                  `Are you sure you want to remove ${
                    confirmAction.member?.displayName || "this user"
                  } from the event?`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-2xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedAction}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-2xl font-bold transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventMembersCard;
