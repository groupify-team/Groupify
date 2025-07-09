import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  UserPlusIcon,
  UserMinusIcon,
  ShieldCheckIcon,
  StarIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  UsersIcon,
  EnvelopeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { userStatsCache } from "@shared/services/userStatsCache";
import { toast } from "react-hot-toast";

/**
 * Enhanced UserProfileModal with beautiful modern design
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

  if (!isOpen || !user) {
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
        <div className="absolute -top-2 -right-2 flex items-center gap-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border-2 border-white z-10">
          <StarIcon className="w-3 h-3" />
          Creator
        </div>
      );
    }

    if (isUserAdmin) {
      return (
        <div className="absolute -top-2 -right-2 flex items-center gap-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border-2 border-white z-10">
          <ShieldCheckIcon className="w-3 h-3" />
          Admin
        </div>
      );
    }

    if (isEventMember) {
      return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold border-2 border-white shadow-lg z-10">
          Member
        </div>
      );
    }

    return null;
  };

  // Render friend actions
  const renderFriendActions = () => {
    if (isOwnProfile || context === "event") return null;

    return (
      <div className="space-y-3">
        {!isFriend && !isPending && (
          <button
            onClick={() => handleAction(() => onAddFriend(user.uid))}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-xl disabled:opacity-50"
          >
            <UserPlusIcon className="w-6 h-6" />
            Add Friend
          </button>
        )}

        {isFriend && (
          <button
            onClick={() => setConfirmAction("remove-friend")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-xl disabled:opacity-50"
          >
            <UserMinusIcon className="w-6 h-6" />
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
      <div className="space-y-3">
        {canManageUser && isEventMember && (
          <div className="relative">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-xl"
            >
              <EllipsisVerticalIcon className="w-6 h-6" />
              Manage User
            </button>

            {showActionMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-600 overflow-hidden z-20">
                {!isUserAdmin && (
                  <button
                    onClick={() => {
                      setConfirmAction("promote");
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-6 py-4 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
                  >
                    🛡️ Promote to Admin
                  </button>
                )}

                {isUserAdmin && !isUserCreator && (
                  <button
                    onClick={() => {
                      setConfirmAction("demote");
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-6 py-4 text-gray-900 dark:text-white hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors font-medium"
                  >
                    ⬇️ Remove Admin
                  </button>
                )}

                <button
                  onClick={() => {
                    setConfirmAction("kick");
                    setShowActionMenu(false);
                  }}
                  className="w-full text-left px-6 py-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                >
                  🚫 Remove from Event
                </button>
              </div>
            )}
          </div>
        )}

        {!isEventMember && onInviteToEvent && (
          <button
            onClick={() => handleAction(() => onInviteToEvent(user.uid))}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-xl disabled:opacity-50"
          >
            <UserPlusIcon className="w-6 h-6" />
            Invite to Event
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200 dark:border-slate-700 transform transition-all duration-300 animate-in slide-in-from-bottom-4">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5"></div>

        {/* Header with Close Button */}
        <div className="relative flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="relative px-8 pb-8 -mt-4">
          {/* Profile Image with Role Badge */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1 mx-auto shadow-2xl">
                  <img
                    src={
                      user.photoURL ||
                      "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                    }
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-700"
                  />
                </div>

                {/* Online Status */}
                <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>

              {renderRoleBadge()}
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {user.displayName || "Unknown User"}
              {isOwnProfile && (
                <span className="text-blue-500 text-sm ml-2">(You)</span>
              )}
            </h2>

            <div className="flex items-center justify-center gap-2 mb-4">
              <EnvelopeIcon className="w-4 h-4 text-gray-500" />
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                {user.email}
              </p>
            </div>

            {/* Stats */}
            {showStats && (
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white h-8 flex items-center justify-center">
                    {userStats.loading ? (
                      <div className="w-4 h-4 border-2 border-gray-300 dark:border-slate-400 border-t-blue-500 rounded-full animate-spin"></div>
                    ) : userStats.error ? (
                      <span className="text-gray-400 text-lg">-</span>
                    ) : (
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {userStats.eventsCount}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide font-medium">
                    Events
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <UsersIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white h-8 flex items-center justify-center">
                    {userStats.loading ? (
                      <div className="w-4 h-4 border-2 border-gray-300 dark:border-slate-400 border-t-pink-500 rounded-full animate-spin"></div>
                    ) : userStats.error ? (
                      <span className="text-gray-400 text-lg">-</span>
                    ) : (
                      <span className="bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                        {userStats.friendsCount}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide font-medium">
                    Friends
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="space-y-4">
              {renderFriendActions()}
              {renderEventActions()}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full border border-gray-200 dark:border-slate-700 shadow-2xl transform transition-all duration-300 animate-in slide-in-from-bottom-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Confirm Action
              </h3>
              <p className="text-gray-600 dark:text-slate-300">
                {confirmAction === "remove-friend" &&
                  "Are you sure you want to remove this friend?"}
                {confirmAction === "promote" &&
                  "Are you sure you want to promote this user to admin?"}
                {confirmAction === "demote" &&
                  "Are you sure you want to remove admin privileges?"}
                {confirmAction === "kick" &&
                  "Are you sure you want to remove this user from the event?"}
                {confirmAction === "invite-to-event" &&
                  "Are you sure you want to invite this user to the event?"}
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

export default UserProfileModal;