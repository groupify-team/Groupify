import React, { useState } from "react";
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  UsersIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import { useInviteFriends } from "../hooks/useInviteFriends";
import { useEventMemberLimits } from "../hooks/useEventMemberLimits";
import { useUserPresence } from "@shared/hooks/useUserPresence";

// Enhanced Friend Card with Real-Time Presence
const FriendCardWithPresence = ({
  friend,
  isInviting,
  canInviteThisFriend,
  onInvite,
  onViewProfile,
}) => {
  const friendPresence = useUserPresence(friend.uid);

  // Helper function to format last seen (MOVED BEFORE getStatusConfig)
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

  // Get status indicator config
  const getStatusConfig = () => {
    if (friendPresence.loading) {
      return {
        color: "bg-gray-400",
        ring: "ring-gray-200 dark:ring-gray-700",
        pulse: "animate-pulse",
        title: "Loading status...",
      };
    }

    if (friendPresence.isOnline) {
      switch (friendPresence.status) {
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
      title: friendPresence.lastSeen
        ? `Last seen ${formatLastSeen(friendPresence.lastSeen)}`
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

  return (
    <div
      className={`flex items-center gap-3 p-3 transition-all duration-200 group ${
        isInviting
          ? "opacity-50 cursor-not-allowed"
          : canInviteThisFriend
          ? "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
          : "opacity-60"
      }`}
    >
      {/* Avatar with Real-Time Presence */}
      <div className="relative">
        {friend.photoURL ? (
          <img
            src={friend.photoURL}
            alt={friend.displayName}
            className="w-8 h-8 rounded-full object-cover border border-emerald-200 dark:border-emerald-700 group-hover:border-emerald-400 dark:group-hover:border-emerald-500 transition-colors"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-medium text-xs border border-emerald-200 dark:border-emerald-700 group-hover:border-emerald-400 dark:group-hover:border-emerald-500 transition-colors">
            {getInitials(friend.displayName)}
          </div>
        )}

        {/* Real-Time Status Indicator */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${statusConfig.color} border-2 border-white dark:border-gray-800 rounded-full ${statusConfig.ring} ring-1 ${statusConfig.pulse} shadow-sm`}
          title={statusConfig.title}
        ></div>
      </div>

      {/* Friend Info - Clickable to show profile */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => {
          if (!isInviting && onViewProfile) {
            onViewProfile(friend);
          }
        }}
      >
        <p className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate text-sm">
          {friend.displayName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {friend.email}
        </p>

        {/* Real-Time Presence Status Text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {friendPresence.loading
            ? "Loading..."
            : friendPresence.isOnline
            ? `${
                friendPresence.status.charAt(0).toUpperCase() +
                friendPresence.status.slice(1)
              }`
            : friendPresence.lastSeen
            ? `Last seen ${formatLastSeen(friendPresence.lastSeen)}`
            : "Offline"}
        </p>
      </div>

      {/* Action Button */}
      {canInviteThisFriend ? (
        <button
          onClick={() => !isInviting && onInvite(friend)}
          disabled={isInviting}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-105 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isInviting ? (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <UserPlusIcon className="w-3 h-3" />
          )}
        </button>
      ) : (
        <button
          onClick={() => setShowUpgradePrompt(true)}
          className="bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0"
        >
          <ShieldExclamationIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

// 🧩 Enhanced component for inviting friends to a event with plan validation
const InviteFriendDropdown = ({
  currentUser,
  eventId,
  excludedUserIds = [],
  currentMemberCount = 0,
  onFriendClick = null,
}) => {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const {
    friends,
    searchTerm,
    filteredFriends,
    isLoading,
    isInviting,
    setSearchTerm,
    clearSearch,
    handleInviteFriend,
  } = useInviteFriends(currentUser, eventId, excludedUserIds);

  // Debug logging for invite friends dropdown
  console.log("InviteFriendDropdown state:", {
    friendsCount: friends?.length,
    searchTerm,
    filteredFriendsCount: filteredFriends?.length,
    isLoading,
    excludedUserIds,
    friends,
  });

  const {
    planLimits,
    canInviteMore,
    limitStatus: memberLimitStatus,
    remainingSlots: memberRemainingSlots,
    isFreePlan,
    isPremiumPlan,
  } = useEventMemberLimits(eventId, currentMemberCount);

  // Get values for backward compatibility
  const canAddMoreMembers = canInviteMore;
  const limitStatus =
    memberLimitStatus === "full"
      ? "full"
      : canAddMoreMembers
      ? "ok"
      : "warning";
  const remainingSlots = memberRemainingSlots;

  // Debug logging to understand member limits
  console.log("🔍 Member Limit Debug:", {
    eventId,
    currentMemberCount,
    planLimits,
    canInviteMore,
    canAddMoreMembers,
    memberLimitStatus,
    limitStatus,
    remainingSlots,
    isFreePlan,
    isPremiumPlan,
    membersPerEvent: planLimits?.membersPerEvent,
    calculation: `${currentMemberCount} + 1 <= ${planLimits?.membersPerEvent}`,
  });

  // Enhanced invite friend handler with plan validation
  const handleEnhancedInviteFriend = async (friend) => {
    console.log("🎯 handleEnhancedInviteFriend called with:", friend);
    console.log("🎯 canAddMoreMembers:", canAddMoreMembers);

    // Check if we can invite (simple check based on member limit)
    if (!canAddMoreMembers) {
      console.log("❌ Cannot add more members, showing upgrade prompt");
      setShowUpgradePrompt(true);
      return;
    }

    console.log("✅ Can add more members, proceeding with invitation...");
    // Proceed with invitation using the hook's handler
    await handleInviteFriend(friend);
  };

  // 🧾 Render search input and filtered friend list
  return (
    <div className="w-full space-y-3">
      {/* Member Limit Status */}
      {limitStatus === "full" ? (
        <div className="bg-red-50/90 dark:bg-red-900/30 backdrop-blur-lg rounded-xl p-3 border border-red-200/50 dark:border-red-800/50">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 dark:text-red-400 text-sm">
                Member Limit Reached
              </h4>
              <p className="text-red-700 dark:text-red-300 text-xs">
                Maximum {planLimits.membersPerEvent} members allowed.
                {isFreePlan || isPremiumPlan ? " Upgrade for more!" : ""}
              </p>
            </div>
            {(isFreePlan || isPremiumPlan) && (
              <button
                onClick={() => setShowUpgradePrompt(true)}
                className="bg-red-100 dark:bg-red-800/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-700 dark:text-red-400 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      ) : limitStatus === "warning" ? (
        <div className="bg-yellow-50/90 dark:bg-yellow-900/30 backdrop-blur-lg rounded-xl p-3 border border-yellow-200/50 dark:border-yellow-800/50">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-400 text-sm">
                Almost Full
              </h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                Only {remainingSlots} member slots remaining.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        </div>
        <input
          type="text"
          placeholder={
            limitStatus === "full"
              ? "Member limit reached"
              : friends.length > 0
              ? "Search friends or see all below..."
              : "Search friends by name or email..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isInviting || limitStatus === "full"}
          className="w-full pl-8 pr-8 py-2 sm:pl-10 sm:pr-10 sm:py-3 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-700/50 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-500 ease-in-out text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {searchTerm && !isInviting && limitStatus !== "full" && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors" />
          </button>
        )}
      </div>

      {/* Results - Show friends when searching OR when search is empty and there are friends */}
      {((searchTerm.trim().length > 0 && filteredFriends.length > 0) ||
        (searchTerm.trim().length === 0 && friends.length > 0)) &&
        limitStatus !== "full" && (
          <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl border border-emerald-200/30 dark:border-emerald-700/30 overflow-hidden shadow-sm animate-slide-in-scale transition-all duration-500 ease-in-out">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-emerald-200 dark:border-emerald-700 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {searchTerm.trim().length > 0
                    ? "Searching..."
                    : "Loading friends..."}
                </p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <div className="p-3 border-b border-emerald-200/30 dark:border-emerald-700/30 bg-emerald-50/50 dark:bg-emerald-900/20">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                      <UsersIcon className="w-3 h-3" />
                      <span>
                        {searchTerm.trim().length > 0 ? (
                          <>
                            {filteredFriends.length} friend
                            {filteredFriends.length !== 1 ? "s" : ""} found
                          </>
                        ) : (
                          <>
                            {friends.length} friend
                            {friends.length !== 1 ? "s" : ""} available
                          </>
                        )}
                      </span>
                    </div>
                    {remainingSlots !== "unlimited" && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {remainingSlots} slots left
                      </span>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-emerald-200/20 dark:divide-emerald-700/20">
                  {(searchTerm.trim().length > 0
                    ? filteredFriends
                    : friends
                  ).map((friend) => {
                    const canInviteThisFriend =
                      remainingSlots === "unlimited" || remainingSlots > 0;

                    return (
                      <FriendCardWithPresence
                        key={friend.uid}
                        friend={friend}
                        isInviting={isInviting}
                        canInviteThisFriend={canInviteThisFriend}
                        onInvite={handleEnhancedInviteFriend}
                        onViewProfile={onFriendClick}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Empty State - only show when search is entered but no results found */}
      {searchTerm.trim().length > 0 &&
        filteredFriends.length === 0 &&
        limitStatus !== "full" && (
          <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl border border-emerald-200/30 dark:border-emerald-700/30 overflow-hidden shadow-sm animate-slide-in-scale transition-all duration-500 ease-in-out">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <UsersIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                No friends found
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Try searching with a different name
              </p>
            </div>
          </div>
        )}

      {/* Initial State - when no search term and no friends */}
      {searchTerm.trim().length === 0 &&
        friends.length === 0 &&
        limitStatus !== "full" && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MagnifyingGlassIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              No friends yet
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add friends to invite them to events
            </p>
          </div>
        )}

      {/* Friends Count Info */}
      {friends.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-emerald-200/30 dark:border-emerald-700/30">
          <span>
            {friends.length} friend{friends.length !== 1 ? "s" : ""} available
          </span>
          {excludedUserIds.length > 0 && (
            <span className="bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
              {excludedUserIds.length} in event
            </span>
          )}
        </div>
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
          onClick={() => setShowUpgradePrompt(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 transform transition-all duration-300 animate-slide-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 rounded-t-2xl text-center">
              <SparklesIcon className="w-8 h-8 text-white mx-auto mb-2" />
              <h3 className="font-bold text-white text-lg">Upgrade Required</h3>
              <p className="text-white/80 text-sm">Need more member slots?</p>
            </div>

            <div className="p-6">
              <div className="text-center mb-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                  You've reached your member limit of{" "}
                  <strong>{planLimits.membersPerEvent} members</strong> for this
                  event.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Upgrade your plan to invite more friends!
                </p>
              </div>

              {/* Upgrade Options */}
              <div className="space-y-3 mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white capitalize">
                        Premium Plan
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Up to 50 members per event
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        Perfect for larger groups
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600 dark:text-purple-400">
                        $9.99/mo
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-all"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowUpgradePrompt(false);
                    // Navigate to upgrade page
                    console.log("Navigate to upgrade page");
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-lg"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for inviting */}
      {isInviting && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-emerald-200 dark:border-emerald-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-200 dark:border-emerald-700 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Sending invite...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteFriendDropdown;
