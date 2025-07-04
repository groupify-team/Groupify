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
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

const UserProfileModal = ({
  user,
  currentUserId,
  isAdmin,
  isFriend,
  isPending,
  onAddFriend,
  onRemoveFriend,
  onCancelRequest,
  onClose,
  trip,
  setTrip,
  tripMembers,
  setTripMembers,
  setSelectedUser,
  onPromoteToAdmin,
  onDemoteFromAdmin,
  onRemoveFromTrip,
  onlyTripMembers = false, // If true, only show trip-related actions
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'remove-friend', 'demote', 'kick'

  if (!user) return null;

  // Check user roles in trip
  const isUserCreator = trip?.createdBy === user.uid;
  const isUserAdmin = trip?.admins?.includes(user.uid);
  const isCurrentUserCreator = trip?.createdBy === currentUserId;
  const isCurrentUserAdmin = trip?.admins?.includes(currentUserId);
  const isOwnProfile = user.uid === currentUserId;

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

  const handleAction = async (action, ...args) => {
    setLoading(true);
    try {
      await action(...args);
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
    }
    setConfirmAction(null);
  };

  // Render role badge
  const renderRoleBadge = () => {
    if (isUserCreator) {
      return (
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          <StarIcon className="w-4 h-4" />
          Creator
        </div>
      );
    }
    if (isUserAdmin) {
      return (
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          <ShieldCheckIcon className="w-4 h-4" />
          Admin
        </div>
      );
    }
    return (
      <div className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
        Member
      </div>
    );
  };

  // Render friendship status
  const renderFriendshipStatus = () => {
    if (isOwnProfile) return null;

    if (isFriend) {
      return (
        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
          <CheckCircleIcon className="w-4 h-4" />
          Friends
        </div>
      );
    }
    if (isPending) {
      return (
        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-medium">
          <ClockIcon className="w-4 h-4" />
          Request Pending
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 animate-slide-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>

          {/* Profile Image */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/20 to-white/10 p-1 mx-auto">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover bg-gray-200 dark:bg-gray-700"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-2xl font-bold">
                    {getInitials(user.displayName || user.email)}
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-3 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                  <StarIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.displayName || "Unknown User"}
              {isOwnProfile && (
                <span className="text-indigo-600 dark:text-indigo-400 ml-2 text-lg">
                  (You)
                </span>
              )}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm break-all">
              {user.email}
            </p>

            {/* Status Badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {renderRoleBadge()}
              {renderFriendshipStatus()}
            </div>
          </div>

          {/* Trip Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                0
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Photos
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {trip?.members?.length || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Trip Members
              </div>
            </div>
          </div>

          {/* Confirmation Dialog */}
          {confirmAction && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <h3 className="font-bold text-red-800 dark:text-red-400 mb-2">
                Confirm Action
              </h3>
              <p className="text-red-700 dark:text-red-300 text-sm mb-4">
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
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedAction}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="space-y-3">
              {/* Friendship Actions */}
              {!onlyTripMembers && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Friendship
                  </h3>
                  {isFriend ? (
                    <button
                      onClick={() => setConfirmAction("remove-friend")}
                      disabled={loading}
                      className="w-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
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
                      className="w-full bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <ClockIcon className="w-4 h-4" />
                      Cancel Request
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(() => onAddFriend(user.uid))}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlusIcon className="w-4 h-4" />
                      Send Friend Request
                    </button>
                  )}
                </div>
              )}

              {/* Trip Management Actions (Admin Only) */}
              {(isCurrentUserCreator || isCurrentUserAdmin) &&
                !isUserCreator && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Trip Management
                    </h3>

                    {/* Admin Management */}
                    {isCurrentUserCreator && (
                      <div className="space-y-2">
                        {isUserAdmin ? (
                          <button
                            onClick={() => setConfirmAction("demote")}
                            disabled={loading}
                            className="w-full bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
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
                            className="w-full bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                          >
                            <ShieldCheckIcon className="w-4 h-4" />
                            Make Admin
                          </button>
                        )}
                      </div>
                    )}

                    {/* Remove from Trip */}
                    <button
                      onClick={() => setConfirmAction("kick")}
                      disabled={loading}
                      className="w-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Remove from Trip
                    </button>
                  </div>
                )}
            </div>
          )}

          {/* Self Profile Actions */}
          {isOwnProfile && (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                This is your profile
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
