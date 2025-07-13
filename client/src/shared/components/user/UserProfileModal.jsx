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
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { userStatsCache } from "@shared/services/userStatsCache";
import { toast } from "@shared/utils/toast";

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
  const isFriend =
    user.__isFriend !== undefined
      ? user.__isFriend
      : friends.includes(user.uid);
  const isPending =
    user.__isPending !== undefined
      ? user.__isPending
      : Array.isArray(pendingRequests) && pendingRequests.length > 0
      ? typeof pendingRequests[0] === "string"
        ? pendingRequests.includes(user.uid)
        : pendingRequests.some(
            (req) =>
              (req.from === currentUserId && req.to === user.uid) ||
              (req.from === user.uid && req.to === currentUserId)
          )
      : false;

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

  // Render role badge - positioned outside profile image
  const renderRoleBadge = () => {
    if (context !== "event") return null;

    const roleConfig = {
      creator: {
        gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
        icon: "👑",
        text: "Event Creator",
        shadow: "shadow-xl shadow-purple-500/25",
      },
      admin: {
        gradient: "from-blue-600 via-cyan-600 to-teal-600",
        icon: "⚡",
        text: "Event Admin",
        shadow: "shadow-xl shadow-blue-500/25",
      },
      member: {
        gradient: "from-emerald-500 to-green-600",
        icon: "✓",
        text: "Event Member",
        shadow: "shadow-lg shadow-green-500/20",
      },
    };

    let config;
    if (isUserCreator) {
      config = roleConfig.creator;
    } else if (isUserAdmin) {
      config = roleConfig.admin;
    } else if (isEventMember) {
      config = roleConfig.member;
    } else {
      return null;
    }

    return (
      <div className="flex justify-center mb-4">
        <span
          className={`inline-flex items-center gap-2 bg-gradient-to-r ${config.gradient} text-white px-6 py-2.5 rounded-2xl text-sm font-bold ${config.shadow} border border-white/20`}
        >
          <span className="text-base">{config.icon}</span>
          {config.text}
        </span>
      </div>
    );
  };

  // Render friend actions
  const renderFriendActions = () => {
    if (isOwnProfile) return null;

    const buttonBaseClasses =
      "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100";

    return (
      <div className="space-y-3">
        {!isFriend && !isPending && (
          <button
            onClick={() => handleAction(() => onAddFriend(user.uid))}
            disabled={loading}
            className={`${buttonBaseClasses} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border border-blue-500/20`}
          >
            <UserPlusIcon className="w-6 h-6" />
            Add Friend
          </button>
        )}

        {isPending && (
          <button
            onClick={() => setConfirmAction("cancel-request")}
            disabled={loading}
            className={`${buttonBaseClasses} bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-400/20`}
          >
            <ClockIcon className="w-6 h-6" />
            Cancel Request
          </button>
        )}

        {isFriend && (
          <button
            onClick={() => setConfirmAction("remove-friend")}
            disabled={loading}
            className={`${buttonBaseClasses} bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border border-emerald-400/20`}
          >
            <CheckCircleIcon className="w-6 h-6" />
            Friends
          </button>
        )}
      </div>
    );
  };

  // Render event-specific actions
  const renderEventActions = () => {
    if (context !== "event" || isOwnProfile) return null;

    return (
      <div className="space-y-3">
        {!isEventMember && onInviteToEvent && (
          <button
            onClick={() => handleAction(() => onInviteToEvent(user.uid))}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 border border-indigo-500/20"
          >
            <UserPlusIcon className="w-6 h-6" />
            Invite to Event
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/60 dark:border-slate-600/40 transform transition-all duration-300 animate-in slide-in-from-bottom-4">
        {/* Beautiful Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-red-400/20 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        </div>

        {/* Header with Action Menu and Close Button */}
        <div className="relative flex justify-between items-center p-6 pb-2">
          {/* Manage Button */}
          {context === "event" &&
            !isOwnProfile &&
            (isCurrentUserCreator || (isCurrentUserAdmin && !isUserCreator)) &&
            isEventMember && (
              <div className="relative">
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <EllipsisVerticalIcon className="w-6 h-6" />
                </button>

                {showActionMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowActionMenu(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-slate-600/40 overflow-hidden z-50 min-w-64 w-64">
                      {!isUserAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmAction("promote");
                            setShowActionMenu(false);
                          }}
                          className="w-full text-left px-6 py-4 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium flex items-center gap-3"
                        >
                          <span className="text-lg">🛡️</span>
                          <span>Promote to Admin</span>
                        </button>
                      )}

                      {isUserAdmin && !isUserCreator && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmAction("demote");
                            setShowActionMenu(false);
                          }}
                          className="w-full text-left px-6 py-4 text-gray-900 dark:text-white hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors font-medium flex items-center gap-3"
                        >
                          <span className="text-lg">⬇️</span>
                          <span>Remove Admin</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmAction("kick");
                          setShowActionMenu(false);
                        }}
                        className="w-full text-left px-6 py-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium flex items-center gap-3 border-t border-gray-100 dark:border-slate-700"
                      >
                        <span className="text-lg">🚫</span>
                        <span>Remove from Event</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

          {/* Spacer */}
          {!(
            context === "event" &&
            !isOwnProfile &&
            (isCurrentUserCreator || (isCurrentUserAdmin && !isUserCreator)) &&
            isEventMember
          ) && <div></div>}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="relative px-8 pb-8">
          {/* Profile Image */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1 mx-auto shadow-2xl">
                <img
                  src={
                    user.photoURL ||
                    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                  }
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-700"
                />
              </div>

              {/* Online Status with Better Design */}
              <div className="absolute bottom-3 right-3 w-10 h-10 bg-emerald-500 border-4 border-white dark:border-slate-800 rounded-full shadow-xl flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Role Badge - Outside of image */}
          {renderRoleBadge()}

          {/* User Info */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
              {user.displayName || "Unknown User"}
              {isOwnProfile && (
                <span className="text-blue-600 dark:text-blue-400 text-lg ml-2 font-medium bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                  You
                </span>
              )}
            </h2>

            <div className="flex items-center justify-center gap-2 mb-6">
              <EnvelopeIcon className="w-5 h-5 text-gray-500" />
              <p className="text-gray-600 dark:text-slate-400 text-base">
                {user.email}
              </p>
            </div>

            {/* Stats */}
            {showStats && (
              <div className="flex justify-center gap-12 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <CalendarIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white h-10 flex items-center justify-center">
                    {userStats.loading ? (
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-slate-400 border-t-blue-500 rounded-full animate-spin"></div>
                    ) : userStats.error ? (
                      <span className="text-gray-400 text-xl">-</span>
                    ) : (
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {userStats.eventsCount}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 uppercase tracking-wide font-semibold">
                    Events
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <UsersIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white h-10 flex items-center justify-center">
                    {userStats.loading ? (
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-slate-400 border-t-pink-500 rounded-full animate-spin"></div>
                    ) : userStats.error ? (
                      <span className="text-gray-400 text-xl">-</span>
                    ) : (
                      <span className="bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                        {userStats.friendsCount}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 uppercase tracking-wide font-semibold">
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
        <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-purple-900/20 to-black/40 backdrop-blur-lg flex items-center justify-center z-60 p-4">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full border border-white/60 dark:border-slate-600/40 shadow-2xl transform transition-all duration-300 animate-in slide-in-from-bottom-4">
            <div className="text-center mb-6">
              <div className="w-18 h-18 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl border-2 border-white/20">
                <SparklesIcon className="w-9 h-9 text-white" />
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
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-600 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-2xl font-bold transition-colors"
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
