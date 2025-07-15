import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  XMarkIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  StarIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  UsersIcon,
  EnvelopeIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { userStatsCache } from "@shared/services/userStatsCache";
import { toast } from "@shared/utils/toast";
import { useUserPresence } from "@shared/hooks/useUserPresence";

const UserProfileModal = ({
  isOpen,
  onClose,
  user,
  currentUserId,
  context = "general",
  onAddFriend,
  onRemoveFriend,
  onCancelRequest,
  friends = [],
  pendingRequests = [],
  event = null,
  onPromoteToAdmin = null,
  onDemoteFromAdmin = null,
  onRemoveFromEvent = null,
  onInviteToEvent = null,
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
  const userPresence = useUserPresence(user?.uid);

  // Memoize computed values to prevent unnecessary re-renders
  const userPermissions = useMemo(() => {
    if (context !== "event" || !event) return {};

    return {
      isUserCreator: event?.createdBy === user?.uid,
      isUserAdmin: event?.admins?.includes(user?.uid),
      isCurrentUserCreator: event?.createdBy === currentUserId,
      isCurrentUserAdmin: event?.admins?.includes(currentUserId),
      isOwnProfile: user?.uid === currentUserId,
      isEventMember: event?.members?.includes(user?.uid),
    };
  }, [context, event, user?.uid, currentUserId]);

  const friendshipStatus = useMemo(() => {
    const isFriend =
      user?.__isFriend !== undefined
        ? user.__isFriend
        : friends.includes(user?.uid);

    const isPending =
      user?.__isPending !== undefined
        ? user.__isPending
        : Array.isArray(pendingRequests) && pendingRequests.length > 0
        ? typeof pendingRequests[0] === "string"
          ? pendingRequests.includes(user?.uid)
          : pendingRequests.some(
              (req) =>
                (req.from === currentUserId && req.to === user?.uid) ||
                (req.from === user?.uid && req.to === currentUserId)
            )
        : false;

    return { isFriend, isPending };
  }, [user, friends, pendingRequests, currentUserId]);

  // Optimized close handlers
  const handleClose = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setShowActionMenu(false);
      onClose();
    },
    [onClose]
  );

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  const toggleActionMenu = useCallback((e) => {
    e.stopPropagation();
    setShowActionMenu((prev) => !prev);
  }, []);

  const closeActionMenu = useCallback((e) => {
    e.stopPropagation();
    setShowActionMenu(false);
  }, []);

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

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await action();
      handleClose();
    } catch (error) {
      console.error("Action failed:", error);
      toast.error("Action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatLastSeen = useCallback((lastSeen) => {
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
  }, []);

  const handleConfirmedAction = async () => {
    switch (confirmAction) {
      case "remove-friend":
        await handleAction(() => onRemoveFriend(user.uid));
        break;
      case "cancel-request":
        await handleAction(() => onCancelRequest(user.uid));
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

  const renderRoleBadge = () => {
    if (context !== "event") return null;

    const roleConfig = {
      creator: {
        gradient: "from-violet-600 to-purple-600",
        icon: "👑",
        text: "Event Creator",
      },
      admin: {
        gradient: "from-blue-600 to-cyan-600",
        icon: "⚡",
        text: "Event Admin",
      },
      member: {
        gradient: "from-emerald-500 to-green-600",
        icon: "✓",
        text: "Event Member",
      },
    };

    let config;
    if (userPermissions.isUserCreator) {
      config = roleConfig.creator;
    } else if (userPermissions.isUserAdmin) {
      config = roleConfig.admin;
    } else if (userPermissions.isEventMember) {
      config = roleConfig.member;
    } else {
      return null;
    }

    return (
      <div className="flex justify-center mb-4">
        <span
          className={`inline-flex items-center gap-2 bg-gradient-to-r ${config.gradient} text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/20`}
        >
          <span>{config.icon}</span>
          <span>{config.text}</span>
        </span>
      </div>
    );
  };

  const renderFriendActions = () => {
    if (userPermissions.isOwnProfile) return null;

    const buttonClasses =
      "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-colors duration-200 disabled:opacity-50";

    return (
      <div className="space-y-3">
        {!friendshipStatus.isFriend && !friendshipStatus.isPending && (
          <button
            onClick={() => handleAction(() => onAddFriend(user.uid))}
            disabled={loading}
            className={`${buttonClasses} bg-blue-600 hover:bg-blue-700 text-white`}
          >
            <UserPlusIcon className="w-5 h-5" />
            Add Friend
          </button>
        )}

        {friendshipStatus.isPending && (
          <button
            onClick={() => setConfirmAction("cancel-request")}
            disabled={loading}
            className={`${buttonClasses} bg-amber-500 hover:bg-amber-600 text-white`}
          >
            <ClockIcon className="w-5 h-5" />
            Cancel Request
          </button>
        )}

        {friendshipStatus.isFriend && (
          <button
            onClick={() => setConfirmAction("remove-friend")}
            disabled={loading}
            className={`${buttonClasses} bg-emerald-500 hover:bg-emerald-600 text-white`}
          >
            <CheckCircleIcon className="w-5 h-5" />
            Friends
          </button>
        )}
      </div>
    );
  };

  const renderEventActions = () => {
    if (context !== "event" || userPermissions.isOwnProfile) return null;

    return (
      <div className="space-y-3">
        {!userPermissions.isEventMember && onInviteToEvent && (
          <button
            onClick={() => handleAction(() => onInviteToEvent(user.uid))}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors duration-200 disabled:opacity-50"
          >
            <UserPlusIcon className="w-5 h-5" />
            Invite to Event
          </button>
        )}
      </div>
    );
  };

  const shouldShowActionMenu =
    context === "event" &&
    !userPermissions.isOwnProfile &&
    (userPermissions.isCurrentUserCreator ||
      (userPermissions.isCurrentUserAdmin && !userPermissions.isUserCreator)) &&
    userPermissions.isEventMember;

  if (!isOpen || !user) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="flex items-center justify-center w-full h-full p-4">
        <div
          className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-600"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700">
            {/* Action Menu Button */}
            {shouldShowActionMenu && (
              <div className="relative">
                <button
                  onClick={toggleActionMenu}
                  className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>

                {/* Dropdown menu */}
                {showActionMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={closeActionMenu}
                    />
                    <div className="absolute top-12 left-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 overflow-hidden min-w-48 z-20">
                      <div className="py-2">
                        {!userPermissions.isUserAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmAction("promote");
                              setShowActionMenu(false);
                            }}
                            className="w-full text-left px-4 py-3 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200 font-medium flex items-center gap-3"
                          >
                            <ShieldCheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm">Promote to Admin</span>
                          </button>
                        )}

                        {userPermissions.isUserAdmin &&
                          !userPermissions.isUserCreator && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction("demote");
                                setShowActionMenu(false);
                              }}
                              className="w-full text-left px-4 py-3 text-gray-900 dark:text-white hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors duration-200 font-medium flex items-center gap-3"
                            >
                              <span className="text-amber-600 dark:text-amber-400 text-sm">
                                ⬇️
                              </span>
                              <span className="text-sm">Remove Admin</span>
                            </button>
                          )}

                        <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmAction("kick");
                            setShowActionMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-200 font-medium flex items-center gap-3"
                        >
                          <span className="text-red-600 dark:text-red-400 text-sm">
                            🚫
                          </span>
                          <span className="text-sm">Remove from Event</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 ml-auto"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {/* Profile Image */}
            <div className="text-center mb-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-1 mx-auto">
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
                <div
                  className={`absolute bottom-0 right-0 w-6 h-6 border-2 border-white dark:border-slate-800 rounded-full ${
                    userPresence.isOnline
                      ? userPresence.status === "busy"
                        ? "bg-red-500"
                        : userPresence.status === "away"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                      : "bg-gray-400"
                  }`}
                >
                  <div className="w-2 h-2 bg-white rounded-full m-1"></div>
                </div>
              </div>
            </div>

            {/* Role Badge */}
            {renderRoleBadge()}

            {/* User Info */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {user.displayName || "Unknown User"}
                {userPermissions.isOwnProfile && (
                  <span className="text-blue-600 dark:text-blue-400 text-sm ml-2 font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                    You
                  </span>
                )}
              </h2>

              <div className="flex items-center justify-center gap-2 mb-4">
                <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                <p className="text-gray-600 dark:text-slate-400 text-sm">
                  {user.email}
                </p>
              </div>

              {/* Stats Section */}
              {showStats && (
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Events Stat */}
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-200 dark:border-slate-600">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <CalendarIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {userStats.loading ? (
                            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                          ) : userStats.error ? (
                            <span className="text-gray-400">--</span>
                          ) : (
                            <span className="text-blue-600">
                              {userStats.eventsCount}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide font-semibold">
                          Events Joined
                        </div>
                      </div>
                    </div>

                    {/* Friends Stat */}
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-200 dark:border-slate-600">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <UsersIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {userStats.loading ? (
                            <div className="w-4 h-4 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin mx-auto"></div>
                          ) : userStats.error ? (
                            <span className="text-gray-400">--</span>
                          ) : (
                            <span className="text-pink-600">
                              {userStats.friendsCount}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-pink-600 dark:text-pink-400 uppercase tracking-wide font-semibold">
                          Friends
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-200 dark:border-slate-600">
                    <div className="flex items-center justify-center gap-2">
                      <StarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Member since
                      </span>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        Jan 2024
                      </span>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 border border-gray-200 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            userPresence.isOnline
                              ? userPresence.status === "busy"
                                ? "bg-red-500"
                                : userPresence.status === "away"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                              : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="text-gray-900 dark:text-white font-medium text-sm">
                          {userPresence.loading
                            ? "Loading..."
                            : userPresence.isOnline
                            ? userPresence.status === "busy"
                              ? "Busy"
                              : userPresence.status === "away"
                              ? "Away"
                              : "Online now"
                            : userPresence.lastSeen
                            ? `Last seen ${formatLastSeen(
                                userPresence.lastSeen
                              )}`
                            : "Offline"}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                        Social Hub Member
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="space-y-3 max-w-md mx-auto">
                {renderFriendActions()}
                {renderEventActions()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setConfirmAction(null)
          }
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-slate-600">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Confirm Action
              </h3>
              <p className="text-gray-600 dark:text-slate-300">
                {confirmAction === "remove-friend" &&
                  "Are you sure you want to remove this friend?"}
                {confirmAction === "cancel-request" &&
                  "Are you sure you want to cancel the friend request?"}
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
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-600 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedAction}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
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
