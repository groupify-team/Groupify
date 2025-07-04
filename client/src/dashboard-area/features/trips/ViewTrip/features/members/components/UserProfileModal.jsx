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
  ChatBubbleLeftIcon,
  CalendarIcon,
  MapPinIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

const UserProfileModal = ({
  user,
  currentUserId,
  context = "general", // "trip" | "friends" | "general"

  // Friendship props
  isFriend,
  isPending,
  onAddFriend,
  onRemoveFriend,
  onCancelRequest,

  // Trip-specific props (only used when context === "trip")
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
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
          <StarIcon className="w-4 h-4" />
          Trip Creator
        </div>
      );
    }
    if (isUserAdmin) {
      return (
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
          <ShieldCheckIcon className="w-4 h-4" />
          Trip Admin
        </div>
      );
    }
    if (isTripMember) {
      return (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
          Trip Member
        </div>
      );
    }
  };

  // Render friendship status
  const renderFriendshipStatus = () => {
    if (isOwnProfile) return null;

    if (isFriend) {
      return (
        <div className="flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-semibold border border-green-200 dark:border-green-800">
          <HeartIcon className="w-4 h-4" />
          Friends
        </div>
      );
    }
    if (isPending) {
      return (
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-700 dark:text-yellow-300 px-4 py-2 rounded-full text-sm font-semibold border border-yellow-200 dark:border-yellow-800">
          <ClockIcon className="w-4 h-4" />
          Request Pending
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 animate-slide-in-scale transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div
          className={`relative bg-gradient-to-br ${getHeaderGradient()} p-8 rounded-t-3xl overflow-hidden`}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>

          {/* Profile Section */}
          <div className="text-center relative z-10">
            <div className="relative inline-block mb-4">
              <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm p-1 mx-auto shadow-2xl">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover bg-gray-200 dark:bg-gray-700"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-3xl font-bold">
                    {getInitials(user.displayName || user.email)}
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 border-4 border-white dark:border-gray-800 rounded-full flex items-center justify-center shadow-lg">
                  <StarIcon className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
              {user.displayName || "Unknown User"}
              {isOwnProfile && (
                <span className="text-white/80 ml-2 text-lg font-normal">
                  (You)
                </span>
              )}
            </h1>

            <p className="text-white/80 text-sm break-all px-4">{user.email}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap justify-center gap-3">
            {renderRoleBadge()}
            {renderFriendshipStatus()}
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CameraIcon className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {context === "trip" ? "0" : "—"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                Photos {context === "trip" ? "in Trip" : "Shared"}
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                {context === "trip" ? (
                  <MapPinIcon className="w-4 h-4 text-white" />
                ) : (
                  <HeartIcon className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {context === "trip" ? trip?.members?.length || 0 : "—"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                {context === "trip" ? "Trip Members" : "Mutual Friends"}
              </div>
            </div>
          </div>

          {/* Confirmation Dialog */}
          {confirmAction && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-5">
              <h3 className="font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                <TrashIcon className="w-5 h-5" />
                Confirm Action
              </h3>
              <p className="text-red-700 dark:text-red-300 text-sm mb-4 leading-relaxed">
                {confirmAction === "remove-friend" &&
                  `Remove ${user.displayName || user.email} from your friends?`}
                {confirmAction === "demote" &&
                  `Remove admin privileges from ${
                    user.displayName || user.email
                  }?`}
                {confirmAction === "kick" &&
                  `Remove ${
                    user.displayName || user.email
                  } from this trip? They will lose access to all photos and data.`}
                {confirmAction === "invite-to-trip" &&
                  `Invite ${user.displayName || user.email} to this trip?`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-all border border-gray-200 dark:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedAction}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl font-medium disabled:opacity-50 transition-all shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="space-y-4">
              {/* Friendship Actions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Friendship
                </h3>
                {isFriend ? (
                  <button
                    onClick={() => setConfirmAction("remove-friend")}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 hover:from-red-200 hover:to-pink-200 dark:hover:from-red-900/50 dark:hover:to-pink-900/50 text-red-700 dark:text-red-400 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-red-800"
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
                    className="w-full bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 hover:from-yellow-200 hover:to-orange-200 dark:hover:from-yellow-900/50 dark:hover:to-orange-900/50 text-yellow-700 dark:text-yellow-400 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-yellow-200 dark:border-yellow-800"
                  >
                    <ClockIcon className="w-4 h-4" />
                    Cancel Request
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(() => onAddFriend(user.uid))}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Send Friend Request
                  </button>
                )}
              </div>

              {/* Trip Management Actions (Only in trip context) */}
              {context === "trip" &&
                (isCurrentUserCreator || isCurrentUserAdmin) &&
                !isUserCreator && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Trip Management
                    </h3>

                    {/* Invite to trip (if not a member) */}
                    {!isTripMember && onInviteToTrip && (
                      <button
                        onClick={() => setConfirmAction("invite-to-trip")}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
                      >
                        <UserPlusIcon className="w-4 h-4" />
                        Invite to Trip
                      </button>
                    )}

                    {/* Admin Management (Creator only) */}
                    {isTripMember && isCurrentUserCreator && (
                      <div className="space-y-2">
                        {isUserAdmin ? (
                          <button
                            onClick={() => setConfirmAction("demote")}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 hover:from-orange-200 hover:to-red-200 dark:hover:from-orange-900/50 dark:hover:to-red-900/50 text-orange-700 dark:text-orange-400 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-orange-200 dark:border-orange-800"
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
                            className="w-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 hover:from-blue-200 hover:to-indigo-200 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 text-blue-700 dark:text-blue-400 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800"
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
                        className="w-full bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 hover:from-red-200 hover:to-pink-200 dark:hover:from-red-900/50 dark:hover:to-pink-900/50 text-red-700 dark:text-red-400 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-red-800"
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
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <StarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                This is your profile
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
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
