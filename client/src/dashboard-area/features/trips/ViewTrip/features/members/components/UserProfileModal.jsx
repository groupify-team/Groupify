import React, { useState } from "react";
import {
  XMarkIcon,
  UserPlusIcon,
  UserMinusIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  HeartIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

const UserProfileModal = ({
  user,
  currentUserId,
  context = "general",

  // Friendship props
  isFriend,
  isPending,
  onAddFriend,
  onRemoveFriend,
  onCancelRequest,

  // Trip-specific props
  trip = null,
  setTrip = null,
  tripMembers = [],
  setTripMembers = null,
  isAdmin = false,
  onPromoteToAdmin = null,
  onDemoteFromAdmin = null,
  onRemoveFromTrip = null,
  onInviteToTrip = null,

  // Modal props
  onClose,
  setSelectedUser = null,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  if (!user) return null;

  // Context-aware role checking
  const isUserCreator = context === "trip" && trip?.createdBy === user.uid;
  const isUserAdmin = context === "trip" && trip?.admins?.includes(user.uid);
  const isCurrentUserCreator =
    context === "trip" && trip?.createdBy === currentUserId;
  const isCurrentUserAdmin =
    context === "trip" && trip?.admins?.includes(currentUserId);
  const isOwnProfile = user.uid === currentUserId;
  const isTripMember = context === "trip" && trip?.members?.includes(user.uid);

  // Helper functions
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await action();
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
      case "kick":
        await handleAction(() =>
          onRemoveFromTrip(user.uid, trip, tripMembers, setTrip, setTripMembers)
        );
        break;
      case "invite-to-trip":
        await handleAction(() => onInviteToTrip(user));
        break;
    }
    setConfirmAction(null);
  };

  // Render role badge (trip context only)
  const renderRoleBadge = () => {
    if (context !== "trip" || !isTripMember) return null;

    if (isUserCreator) {
      return (
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
          <StarIcon className="w-3 h-3" />
          Creator
        </div>
      );
    }
    if (isUserAdmin) {
      return (
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
          <ShieldCheckIcon className="w-3 h-3" />
          Admin
        </div>
      );
    }
    if (isTripMember) {
      return (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">
          Member
        </div>
      );
    }
  };

  // Render friendship status
  const renderFriendshipStatus = () => {
    if (isOwnProfile) return null;

    if (isFriend) {
      return (
        <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-xs font-medium border border-green-200 dark:border-green-800">
          <HeartIcon className="w-3 h-3" />
          Friends
        </div>
      );
    }
    if (isPending) {
      return (
        <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-3 py-1.5 rounded-full text-xs font-medium border border-yellow-200 dark:border-yellow-800">
          <ClockIcon className="w-3 h-3" />
          Pending
        </div>
      );
    }
    return null;
  };

  // Get header gradient based on context
  const getHeaderGradient = () => {
    switch (context) {
      case "trip":
        return "from-indigo-500 via-purple-500 to-pink-500";
      case "friends":
        return "from-emerald-500 via-teal-500 to-cyan-500";
      default:
        return "from-blue-500 via-indigo-500 to-purple-500";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div
          className={`relative bg-gradient-to-br ${getHeaderGradient()} p-4 sm:p-6`}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
          >
            <XMarkIcon className="w-4 h-4 text-white" />
          </button>

          {/* Profile Section */}
          <div className="text-center">
            <div className="relative inline-block mb-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm p-0.5 mx-auto shadow-lg">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover bg-gray-200 dark:bg-gray-700"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                    {getInitials(user.displayName || user.email)}
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center shadow-sm">
                  <StarIcon className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-white mb-1 drop-shadow-sm">
              {user.displayName || "Unknown User"}
              {isOwnProfile && (
                <span className="text-white/80 ml-1 text-sm font-normal">
                  (You)
                </span>
              )}
            </h1>

            <p className="text-white/80 text-xs sm:text-sm break-all px-2">
              {user.email}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Status Badges */}
          <div className="flex flex-wrap justify-center gap-2">
            {renderRoleBadge()}
            {renderFriendshipStatus()}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
              <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-1">
                <CameraIcon className="w-3 h-3 text-white" />
              </div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {context === "trip" ? "0" : "—"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Photos
              </div>
            </div>

            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
              <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-1">
                <HeartIcon className="w-3 h-3 text-white" />
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {context === "trip" ? trip?.members?.length || 0 : "—"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {context === "trip" ? "Members" : "Friends"}
              </div>
            </div>
          </div>

          {/* Confirmation Dialog */}
          {confirmAction && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <h3 className="font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2 text-sm">
                <TrashIcon className="w-4 h-4" />
                Confirm Action
              </h3>
              <p className="text-red-700 dark:text-red-300 text-xs mb-3 leading-relaxed">
                {confirmAction === "remove-friend" &&
                  `Remove ${user.displayName || user.email} from your friends?`}
                {confirmAction === "demote" &&
                  `Remove admin privileges from ${
                    user.displayName || user.email
                  }?`}
                {confirmAction === "kick" &&
                  `Remove ${user.displayName || user.email} from this trip?`}
                {confirmAction === "invite-to-trip" &&
                  `Invite ${user.displayName || user.email} to this trip?`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-3 rounded-lg font-medium transition-all border border-gray-200 dark:border-gray-600 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedAction}
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg font-medium disabled:opacity-50 transition-all shadow-sm text-xs"
                >
                  {loading ? "..." : "Confirm"}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="space-y-3">
              {/* Friendship Actions */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Friendship
                </h3>
                {isFriend ? (
                  <button
                    onClick={() => setConfirmAction("remove-friend")}
                    disabled={loading}
                    className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-red-800 text-sm"
                  >
                    <UserMinusIcon className="w-4 h-4" />
                    Remove Friend
                  </button>
                ) : isPending ? (
                  <button
                    onClick={() =>
                      handleAction(() => onCancelRequest(user.uid))
                    }
                    disabled={loading}
                    className="w-full bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border border-yellow-200 dark:border-yellow-800 text-sm"
                  >
                    <ClockIcon className="w-4 h-4" />
                    Cancel Request
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(() => onAddFriend(user.uid))}
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Send Friend Request
                  </button>
                )}
              </div>

              {/* Trip Management Actions */}
              {context === "trip" &&
                (isCurrentUserCreator || isCurrentUserAdmin) &&
                !isUserCreator && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Trip Management
                    </h3>

                    {/* Invite to trip */}
                    {!isTripMember && onInviteToTrip && (
                      <button
                        onClick={() => setConfirmAction("invite-to-trip")}
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                      >
                        <UserPlusIcon className="w-4 h-4" />
                        Invite to Trip
                      </button>
                    )}

                    {/* Admin Management */}
                    {isTripMember && isCurrentUserCreator && (
                      <div className="space-y-2">
                        {isUserAdmin ? (
                          <button
                            onClick={() => setConfirmAction("demote")}
                            disabled={loading}
                            className="w-full bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-400 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border border-orange-200 dark:border-orange-800 text-sm"
                          >
                            <ShieldExclamationIcon className="w-4 h-4" />
                            Remove Admin
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleAction(() => onPromoteToAdmin(user.uid))
                            }
                            disabled={loading}
                            className="w-full bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800 text-sm"
                          >
                            <ShieldCheckIcon className="w-4 h-4" />
                            Make Admin
                          </button>
                        )}
                      </div>
                    )}

                    {/* Remove from Trip */}
                    {isTripMember && (
                      <button
                        onClick={() => setConfirmAction("kick")}
                        disabled={loading}
                        className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-red-800 text-sm"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Remove from Trip
                      </button>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Self Profile Message */}
          {isOwnProfile && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <StarIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                This is your profile
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Looking good! 🌟
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
