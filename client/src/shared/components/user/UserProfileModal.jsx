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

  const isUserCreator = context === "event" && event?.createdBy === user.uid;
  const isUserAdmin = context === "event" && event?.admins?.includes(user.uid);
  const isCurrentUserCreator =
    context === "event" && event?.createdBy === currentUserId;
  const isCurrentUserAdmin =
    context === "event" && event?.admins?.includes(currentUserId);
  const isOwnProfile = user.uid === currentUserId;
  const isEventMember =
    context === "event" && event?.members?.includes(user.uid);

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
          className={`inline-flex items-center gap-2 bg-gradient-to-r ${config.gradient} text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-sm font-bold ${config.shadow} border border-white/20`}
        >
          <span className="text-sm sm:text-base">{config.icon}</span>
          <span className="hidden sm:inline">{config.text}</span>
          <span className="sm:hidden">{config.text.split(" ")[1]}</span>
        </span>
      </div>
    );
  };

  const renderFriendActions = () => {
    if (isOwnProfile) return null;

    const buttonBaseClasses =
      "w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100";

    return (
      <div className="space-y-3">
        {!isFriend && !isPending && (
          <button
            onClick={() => handleAction(() => onAddFriend(user.uid))}
            disabled={loading}
            className={`${buttonBaseClasses} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border border-blue-500/20`}
          >
            <UserPlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            Add Friend
          </button>
        )}

        {isPending && (
          <button
            onClick={() => setConfirmAction("cancel-request")}
            disabled={loading}
            className={`${buttonBaseClasses} bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-400/20`}
          >
            <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            Cancel Request
          </button>
        )}

        {isFriend && (
          <button
            onClick={() => setConfirmAction("remove-friend")}
            disabled={loading}
            className={`${buttonBaseClasses} bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border border-emerald-400/20`}
          >
            <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            Friends
          </button>
        )}
      </div>
    );
  };

  const renderEventActions = () => {
    if (context !== "event" || isOwnProfile) return null;

    return (
      <div className="space-y-3">
        {!isEventMember && onInviteToEvent && (
          <button
            onClick={() => handleAction(() => onInviteToEvent(user.uid))}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 border border-indigo-500/20"
          >
            <UserPlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            Invite to Event
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 lg:p-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="min-h-full flex items-center justify-center p-2 sm:p-4 lg:p-8">
        <div
          className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl 
                     w-full 
                     min-w-[400px] max-w-[500px] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] xl:max-w-[900px] 
                     mx-auto overflow-visible 
                     border border-white/60 dark:border-slate-600/40 
                     transform transition-all duration-300 animate-in slide-in-from-bottom-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Beautiful Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5"></div>
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-red-400/20 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
          </div>

          {/* Header with Action Menu and Close Button */}
          <div className="relative flex justify-between items-center p-4 sm:p-6 pb-2">
            {/* Manage Button */}
            {context === "event" &&
              !isOwnProfile &&
              (isCurrentUserCreator ||
                (isCurrentUserAdmin && !isUserCreator)) &&
              isEventMember && (
                <div className="relative">
                  <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    <EllipsisVerticalIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  {showActionMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowActionMenu(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-slate-600/40 overflow-hidden z-50 min-w-48 sm:min-w-64 w-48 sm:w-64">
                        {!isUserAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmAction("promote");
                              setShowActionMenu(false);
                            }}
                            className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium flex items-center gap-3 text-sm sm:text-base"
                          >
                            <span className="text-base sm:text-lg">🛡️</span>
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
                            className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 text-gray-900 dark:text-white hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors font-medium flex items-center gap-3 text-sm sm:text-base"
                          >
                            <span className="text-base sm:text-lg">⬇️</span>
                            <span>Remove Admin</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmAction("kick");
                            setShowActionMenu(false);
                          }}
                          className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium flex items-center gap-3 border-t border-gray-100 dark:border-slate-700 text-sm sm:text-base"
                        >
                          <span className="text-base sm:text-lg">🚫</span>
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
              (isCurrentUserCreator ||
                (isCurrentUserAdmin && !isUserCreator)) &&
              isEventMember
            ) && <div></div>}

            {/* Close Button */}
            <button
              onClick={() => {
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Profile Section */}
          <div className="relative px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
            {/* Profile Image */}
            <div className="text-center mb-2 sm:mb-3 -mt-8 sm:-mt-12">
              <div className="relative inline-block">
                <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1 mx-auto shadow-2xl">
                  <img
                    src={
                      user.photoURL ||
                      "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                    }
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-700"
                  />
                </div>

                {/* Online Status with Better Design - Real Presence */}
                <div
                  className={`absolute bottom-0 right-0 sm:bottom-1 sm:right-0 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 border-2 sm:border-4 border-white dark:border-slate-800 rounded-full shadow-xl flex items-center justify-center ${
                    userPresence.isOnline
                      ? userPresence.status === "busy"
                        ? "bg-red-500"
                        : userPresence.status === "away"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                      : "bg-gray-400"
                  }`}
                >
                  <div
                    className={`w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-white rounded-full ${
                      userPresence.isOnline && userPresence.status === "online"
                        ? "animate-pulse"
                        : ""
                    }`}
                  ></div>
                </div>
              </div>
            </div>

            {/* Role Badge - Outside of image */}
            {renderRoleBadge()}

            {/* User Info */}
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 leading-tight px-2">
                {user.displayName || "Unknown User"}
                {isOwnProfile && (
                  <span className="text-blue-600 dark:text-blue-400 text-sm sm:text-base lg:text-lg ml-2 font-medium bg-blue-50 dark:bg-blue-900/30 px-2 sm:px-3 py-1 rounded-full">
                    You
                  </span>
                )}
              </h2>

              <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 px-2">
                <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                <p className="text-gray-600 dark:text-slate-400 text-sm sm:text-base break-all">
                  {user.email}
                </p>
              </div>

              {/* Stats Section - From main stats to online indicator */}
              {showStats && (
                <div className="space-y-4 mb-3 sm:mb-3 max-w-lg mx-auto">
                  {/* Primary Stats Grid - Compact */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Events Stat */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-200/30 dark:border-blue-700/20">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <CalendarIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {userStats.loading ? (
                            <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                          ) : userStats.error ? (
                            <span className="text-gray-400">--</span>
                          ) : (
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
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
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-3 border border-pink-200/30 dark:border-pink-700/20">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <UsersIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {userStats.loading ? (
                            <div className="w-4 h-4 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin mx-auto"></div>
                          ) : userStats.error ? (
                            <span className="text-gray-400">--</span>
                          ) : (
                            <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
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

                  {/* Member Since - Compact */}
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-3 border border-purple-200/30 dark:border-purple-700/20">
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

                  {/* Status Bar - Compact */}
                  <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800/50 dark:via-slate-700/30 dark:to-slate-800/50 rounded-xl p-3 border border-slate-200/50 dark:border-slate-600/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            userPresence.isOnline
                              ? userPresence.status === "busy"
                                ? "bg-red-500"
                                : userPresence.status === "away"
                                ? "bg-amber-500 animate-pulse"
                                : "bg-emerald-500 animate-pulse"
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
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full opacity-60"></div>
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full opacity-40"></div>
                          <div className="w-1.5 h-1.5 bg-pink-400 rounded-full opacity-60"></div>
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                          Social Hub Member
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="space-y-3 sm:space-y-4 max-w-md mx-auto">
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
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setConfirmAction(null)
          }
        >
          <div className="min-h-full flex items-center justify-center p-4 event-modal-enter">
            <div
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 
                         w-full max-w-xs sm:max-w-sm 
                         border border-white/60 dark:border-slate-600/40 shadow-2xl 
                         transform transition-all duration-300 animate-in slide-in-from-bottom-4 
                         event-modal-enter cursor-default modal-content-standard"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl border-2 border-white/20">
                  <SparklesIcon className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Confirm Action
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-slate-300 px-2">
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
                  className="flex-1 px-4 sm:px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-600 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-2xl font-bold transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedAction}
                  disabled={loading}
                  className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileModal;
