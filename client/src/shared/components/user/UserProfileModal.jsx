import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  UserPlusIcon,
  UserMinusIcon,
  ShieldCheckIcon,
  StarIcon,
  HeartIcon,
  ClockIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { userStatsCache } from "@shared/services/userStatsCache";
import { toast } from "react-hot-toast";

/**
 * Unified UserProfileModal component that works in different contexts
 * Supports both friend management and event member management
 */
const UserProfileModal = ({
  isOpen,
  onClose,
  user,
  currentUserId,

  // Context configuration
  context = "general", // "general", "friends", "event"

  // Friend-related props
  onAddFriend,
  onRemoveFriend,
  friends = [],
  pendingRequests = [],

  // Event-related props
  event = null,
  onPromoteToAdmin = null,
  onDemoteFromAdmin = null,
  onRemoveFromEvent = null,
  onInviteToEvent = null,

  // UI customization
  showStats = true,
  showActions = true,
}) => {
  const [userStats, setUserStats] = useState({
    friendsCount: 0,
    eventsCount: 0,
    loading: true,
    error: false,
  });
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Load user stats when modal opens
  useEffect(() => {
    if (!isOpen || !user?.uid || !showStats) {
      return;
    }

    let isMounted = true;

    const loadStats = async () => {
      try {
        setUserStats((prev) => ({ ...prev, loading: true, error: false }));
        const stats = await userStatsCache.getUserStats(user.uid);

        if (isMounted) {
          setUserStats(stats);
        }
      } catch (error) {
        console.error("Error loading user stats:", error);
        if (isMounted) {
          setUserStats({
            friendsCount: 0,
            eventsCount: 0,
            loading: false,
            error: true,
          });
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user?.uid, showStats]);

  console.log("UserProfileModal render:", {
    isOpen,
    user,
    currentUserId,
    context,
  });

  if (!isOpen || !user) {
    console.log("UserProfileModal not rendering - missing isOpen or user");
    return null;
  }

  // Context-aware role checking
  const isUserCreator = context === "event" && event?.createdBy === user.uid;
  const isUserAdmin = context === "event" && event?.admins?.includes(user.uid);
  const isCurrentUserCreator =
    context === "event" && event?.createdBy === currentUserId;
  const isCurrentUserAdmin =
    context === "event" && event?.admins?.includes(currentUserId);
  const isOwnProfile = user.uid === currentUserId;
  const isEventMember =
    context === "event" && event?.members?.includes(user.uid);

  // Friend status checking
  const isFriend = friends.includes(user.uid);
  const isPending = pendingRequests.some(
    (req) =>
      (req.from === currentUserId && req.to === user.uid) ||
      (req.from === user.uid && req.to === currentUserId)
  );

  // Helper functions
  const handleAction = async (action) => {
    setLoading(true);
    try {
      await action();
      onClose();
      toast.success("Action completed successfully!");
    } catch (error) {
      console.error("Action failed:", error);
      toast.error("Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmedAction = async () => {
    switch (confirmAction) {
      case "remove-friend":
        await handleAction(() => onRemoveFriend(user.uid));
        break;
      case "demote":
        await handleAction(() => onDemoteFromAdmin(user.uid));
        break;
      case "promote":
        await handleAction(() => onPromoteToAdmin(user.uid));
        break;
      case "kick":
        await handleAction(() => onRemoveFromEvent(user.uid));
        break;
      case "invite-to-event":
        await handleAction(() => onInviteToEvent(user.uid));
        break;
      case "leave-event":
        await handleAction(() => onRemoveFromEvent(currentUserId));
        break;
      case "leave-admin":
        await handleAction(() => onDemoteFromAdmin(currentUserId));
        break;
      default:
        break;
    }
    setConfirmAction(null);
    setShowActionMenu(false);
  };

  // Render role badge for event context
  const renderRoleBadge = () => {
    if (context !== "event") return null;

    if (isUserCreator) {
      return (
        <div className="role-badge">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg border-2 border-white">
            <StarIcon className="w-3 h-3" />
            Creator
          </div>
        </div>
      );
    }

    if (isUserAdmin) {
      return (
        <div className="role-badge">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg border-2 border-white">
            <ShieldCheckIcon className="w-3 h-3" />
            Admin
          </div>
        </div>
      );
    }

    if (isEventMember) {
      return (
        <div className="role-badge">
          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full text-xs font-medium border-2 border-white shadow-lg">
            Member
          </span>
        </div>
      );
    }

    return null;
  };

  // Render friendship status badge
  const renderFriendshipStatus = () => {
    if (isOwnProfile) return null;

    if (isFriend) {
      return (
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium border border-green-200 dark:border-green-800">
            <HeartIcon className="w-4 h-4" />
            Friends
          </div>
        </div>
      );
    }

    if (isPending) {
      return (
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-4 py-2 rounded-full text-sm font-medium border border-yellow-200 dark:border-yellow-800">
            <ClockIcon className="w-4 h-4" />
            Pending
          </div>
        </div>
      );
    }

    return null;
  };

  // Render friend actions
  const renderFriendActions = () => {
    if (isOwnProfile || context === "event") return null;

    return (
      <div className="space-y-2">
        {!isFriend && !isPending && (
          <button
            onClick={() => handleAction(() => onAddFriend(user.uid))}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <UserPlusIcon className="w-5 h-5" />
            Add Friend
          </button>
        )}

        {isFriend && (
          <button
            onClick={() => setConfirmAction("remove-friend")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <UserMinusIcon className="w-5 h-5" />
            Remove Friend
          </button>
        )}
      </div>
    );
  };

  // Render event-specific actions
  const renderEventActions = () => {
    if (context !== "event" || isOwnProfile) return null;

    const canManageUser =
      isCurrentUserCreator || (isCurrentUserAdmin && !isUserCreator);

    return (
      <div className="space-y-2">
        {canManageUser && isEventMember && (
          <div className="relative">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
              Manage User
            </button>

            {showActionMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-700 rounded-lg shadow-lg border border-slate-600 overflow-hidden">
                {!isUserAdmin && (
                  <button
                    onClick={() => {
                      setConfirmAction("promote");
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-white hover:bg-slate-600 transition-colors"
                  >
                    Promote to Admin
                  </button>
                )}

                {isUserAdmin && !isUserCreator && (
                  <button
                    onClick={() => {
                      setConfirmAction("demote");
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-white hover:bg-slate-600 transition-colors"
                  >
                    Remove Admin
                  </button>
                )}

                <button
                  onClick={() => {
                    setConfirmAction("kick");
                    setShowActionMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-red-400 hover:bg-slate-600 transition-colors"
                >
                  Remove from Event
                </button>
              </div>
            )}
          </div>
        )}

        {!isEventMember && onInviteToEvent && (
          <button
            onClick={() => handleAction(() => onInviteToEvent(user.uid))}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <UserPlusIcon className="w-5 h-5" />
            Invite to Event
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="user-profile-modal modal-backdrop">
      <div className="user-profile-modal-content">
        {/* Header with Close Button */}
        <div className="user-profile-modal-header">
          <button
            onClick={onClose}
            className="user-profile-modal-close text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="px-6 pt-6 pb-6">
          {/* Profile Image */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 mx-auto">
                <img
                  src={
                    user.photoURL ||
                    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                  }
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover bg-slate-200 dark:bg-slate-700"
                />
              </div>
              {renderRoleBadge()}
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {user.displayName || "Unknown User"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm break-all mb-4">
              {user.email}
            </p>

            {/* Stats */}
            {showStats && (
              <div className="flex justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-slate-600 dark:text-slate-400 text-xs">
                      📅
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white h-8 flex items-center justify-center">
                    {userStats.loading ? (
                      <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-400 border-t-blue-500 rounded-full animate-spin"></div>
                    ) : userStats.error ? (
                      <span className="text-slate-400 text-lg">-</span>
                    ) : (
                      <span className="text-2xl">{userStats.eventsCount}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Events
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-slate-600 dark:text-slate-400 text-xs">
                      👥
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white h-8 flex items-center justify-center">
                    {userStats.loading ? (
                      <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-400 border-t-blue-500 rounded-full animate-spin"></div>
                    ) : userStats.error ? (
                      <span className="text-slate-400 text-lg">-</span>
                    ) : (
                      <span className="text-2xl">{userStats.friendsCount}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Friends
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Relationship Status */}
          {renderFriendshipStatus()}

          {/* Actions */}
          {showActions && (
            <div className="space-y-3">
              {renderFriendActions()}
              {renderEventActions()}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Confirm Action
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {confirmAction === "remove-friend" &&
                "Are you sure you want to remove this friend?"}
              {confirmAction === "promote" &&
                "Are you sure you want to promote this user to admin?"}
              {confirmAction === "demote" &&
                "Are you sure you want to remove admin privileges from this user?"}
              {confirmAction === "kick" &&
                "Are you sure you want to remove this user from the event?"}
              {confirmAction === "invite-to-event" &&
                "Are you sure you want to invite this user to the event?"}
              {confirmAction === "leave-event" &&
                "Are you sure you want to leave this event?"}
              {confirmAction === "leave-admin" &&
                "Are you sure you want to give up your admin privileges?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedAction}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
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

export default UserProfileModal;
