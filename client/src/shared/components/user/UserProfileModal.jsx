import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
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
  onCancelRequest,
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
      default:
        break;
    }
    setConfirmAction(null);
  };

  const handleAddFriendWithCache = async (targetUid) => {
    try {
      await onAddFriend?.(targetUid);
      userStatsCache.invalidateUser(targetUid);
      userStatsCache.invalidateUser(currentUserId);
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  const handleRemoveFriendWithCache = async (targetUid) => {
    try {
      await onRemoveFriend?.(targetUid);
      userStatsCache.invalidateUser(targetUid);
      userStatsCache.invalidateUser(currentUserId);
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const renderRoleBadge = () => {
    if (context !== "event") return null;

    if (isUserCreator) {
      return (
        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
          Creator
        </span>
      );
    }

    if (isUserAdmin) {
      return (
        <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
          Admin
        </span>
      );
    }

    if (isEventMember) {
      return (
        <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold px-2 py-1 rounded-full">
          Member
        </span>
      );
    }

    return null;
  };

  const renderFriendActions = () => {
    if (isOwnProfile) return null;

    return (
      <div className="space-y-3">
        {isFriend ? (
          <button
            onClick={() => handleRemoveFriendWithCache(user.uid)}
            disabled={loading}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? "Removing..." : "Remove Friend"}
          </button>
        ) : isPending ? (
          <button
            onClick={() => onCancelRequest?.(user.uid)}
            disabled={loading}
            className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? "Canceling..." : "Cancel Request"}
          </button>
        ) : (
          <button
            onClick={() => handleAddFriendWithCache(user.uid)}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Friend Request"}
          </button>
        )}
      </div>
    );
  };

  const renderEventActions = () => {
    if (context !== "event" || isOwnProfile) return null;

    const canManageUser =
      isCurrentUserCreator || (isCurrentUserAdmin && !isUserCreator);

    if (!canManageUser) return null;

    return (
      <div className="space-y-3 mt-4 pt-4 border-t border-slate-600">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">
          Event Actions
        </h3>

        {isEventMember && (
          <>
            {!isUserAdmin && onPromoteToAdmin && (
              <button
                onClick={() => setConfirmAction("promote")}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50"
              >
                Promote to Admin
              </button>
            )}

            {isUserAdmin && !isUserCreator && onDemoteFromAdmin && (
              <button
                onClick={() => setConfirmAction("demote")}
                disabled={loading}
                className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50"
              >
                Remove Admin
              </button>
            )}

            {!isUserCreator && onRemoveFromEvent && (
              <button
                onClick={() => setConfirmAction("kick")}
                disabled={loading}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50"
              >
                Remove from Event
              </button>
            )}
          </>
        )}

        {!isEventMember && onInviteToEvent && (
          <button
            onClick={() => handleAction(() => onInviteToEvent(user.uid))}
            disabled={loading}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50"
          >
            Invite to Event
          </button>
        )}
      </div>
    );
  };

  const renderRelationshipStatus = () => {
    if (isOwnProfile) return null;

    return (
      <div className="mb-4">
        {isFriend ? (
          <button className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            <span className="text-lg">✓</span>
            Friends
          </button>
        ) : isPending ? (
          <button className="w-full bg-yellow-600 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            <span className="text-lg">⏳</span>
            Request Pending
          </button>
        ) : (
          <button className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
            <span className="text-lg">+</span>
            Add Friend
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden border border-slate-700">
        {/* Header with Close Button */}
        <div className="relative p-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="px-6 pb-6">
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
                  className="w-full h-full rounded-full object-cover bg-slate-700"
                />
              </div>
              {renderRoleBadge() && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  {renderRoleBadge()}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-1">
              {user.displayName || "Unknown User"}
            </h2>
            <p className="text-slate-400 text-sm break-all mb-3">
              {user.email}
            </p>

            {/* Stats */}
            {showStats && (
              <div className="flex justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-slate-400 text-xs">📅</span>
                  </div>
                  <div className="text-2xl font-bold text-white h-8 flex items-center justify-center">
                    {userStats.loading ? (
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    ) : userStats.error ? (
                      <span className="text-slate-500 text-lg">-</span>
                    ) : (
                      <span className="text-2xl">{userStats.eventsCount}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">
                    Events
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-slate-400 text-xs">👥</span>
                  </div>
                  <div className="text-2xl font-bold text-white h-8 flex items-center justify-center">
                    {userStats.loading ? (
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    ) : userStats.error ? (
                      <span className="text-slate-500 text-lg">-</span>
                    ) : (
                      <span className="text-2xl">{userStats.friendsCount}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">
                    Friends
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Relationship Status */}
          {renderRelationshipStatus()}

          {/* Actions */}
          {showActions && (
            <>
              {renderFriendActions()}
              {renderEventActions()}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirm Action
            </h3>
            <p className="text-slate-300 mb-6">
              {confirmAction === "remove-friend" &&
                "Are you sure you want to remove this friend?"}
              {confirmAction === "promote" &&
                "Are you sure you want to promote this user to admin?"}
              {confirmAction === "demote" &&
                "Are you sure you want to remove admin privileges from this user?"}
              {confirmAction === "kick" &&
                "Are you sure you want to remove this user from the event?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
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
