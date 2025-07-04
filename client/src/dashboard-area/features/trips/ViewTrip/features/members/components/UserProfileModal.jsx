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
  CalendarDaysIcon,
  EllipsisVerticalIcon,
  UserIcon,
  PhotoIcon,
  ClockIcon as JoinDateIcon,
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
  const [showAdminMenu, setShowAdminMenu] = useState(false);

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

  // Calculate user statistics
  const getUserStats = () => {
    if (context === "trip" && trip) {
      // Mock data - replace with actual data from your backend
      const joinDate = new Date(2024, 0, 15); // Mock join date
      const photosCount = Math.floor(Math.random() * 20); // Mock photos count
      const daysInTrip = Math.floor(
        (new Date() - joinDate) / (1000 * 60 * 60 * 24)
      );

      return {
        photosCount,
        joinDate: joinDate.toLocaleDateString(),
        daysInTrip,
        memberCount: trip.members?.length || 0,
      };
    }
    return {
      photosCount: 0,
      joinDate: "N/A",
      daysInTrip: 0,
      memberCount: 0,
    };
  };

  const stats = getUserStats();

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
      case "promote":
        await handleAction(() => onPromoteToAdmin(user.uid));
        break;
      case "kick":
        await handleAction(() =>
          onRemoveFromTrip(user.uid, trip, tripMembers, setTrip, setTripMembers)
        );
        break;
      case "invite-to-trip":
        await handleAction(() => onInviteToTrip(user));
        break;
      case "leave-trip":
        await handleAction(() =>
          onRemoveFromTrip(
            currentUserId,
            trip,
            tripMembers,
            setTrip,
            setTripMembers
          )
        );
        break;
      case "leave-admin":
        await handleAction(() => onDemoteFromAdmin(currentUserId));
        break;
    }
    setConfirmAction(null);
    setShowAdminMenu(false);
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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all duration-300 animate-slide-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`relative bg-gradient-to-br ${getHeaderGradient()} p-2`}
        >
          <div className="flex justify-between items-start">
            {/* Admin Menu (3 dots) */}
            {context === "trip" &&
              (((isCurrentUserCreator || isCurrentUserAdmin) &&
                !isUserCreator &&
                !isOwnProfile &&
                isTripMember) ||
                (isOwnProfile && isTripMember)) && (
                <div className="relative">
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
                  >
                    <EllipsisVerticalIcon className="w-4 h-4 text-white" />
                  </button>

                  {/* Admin Dropdown Menu */}
                  {showAdminMenu && (
                    <div className="absolute top-8 left-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-600/50 min-w-[180px] z-10 overflow-hidden">
                      {!isOwnProfile && isCurrentUserCreator && (
                        <>
                          {isUserAdmin ? (
                            <button
                              onClick={() => {
                                setConfirmAction("demote");
                                setShowAdminMenu(false);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 dark:hover:from-orange-900/20 dark:hover:to-orange-900/30 flex items-center gap-3 transition-all duration-200 font-medium"
                            >
                              <ShieldExclamationIcon className="w-4 h-4" />
                              Remove Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setConfirmAction("promote");
                                setShowAdminMenu(false);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-900/30 flex items-center gap-3 transition-all duration-200 font-medium"
                            >
                              <ShieldCheckIcon className="w-4 h-4" />
                              Make Admin
                            </button>
                          )}
                          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-1"></div>
                          <button
                            onClick={() => {
                              setConfirmAction("kick");
                              setShowAdminMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-900/30 flex items-center gap-3 transition-all duration-200 font-medium"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Remove from Trip
                          </button>
                        </>
                      )}

                      {isOwnProfile && (
                        <>
                          <button
                            onClick={() => {
                              setConfirmAction("leave-trip");
                              setShowAdminMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-900/30 flex items-center gap-3 transition-all duration-200 font-medium"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Leave Trip
                          </button>
                          {isCurrentUserAdmin && (
                            <>
                              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-1"></div>
                              <button
                                onClick={() => {
                                  setConfirmAction("leave-admin");
                                  setShowAdminMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 dark:hover:from-orange-900/20 dark:hover:to-orange-900/30 flex items-center gap-3 transition-all duration-200 font-medium"
                              >
                                <ShieldExclamationIcon className="w-4 h-4" />
                                Leave Admin
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm ml-auto"
            >
              <XMarkIcon className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Profile Section */}
          <div className="text-center">
            <div className="relative inline-block mb-1">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm p-0.5 mx-auto shadow-lg">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover bg-gray-200 dark:bg-gray-700"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-lg font-bold">
                    {getInitials(user.displayName || user.email)}
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center shadow-sm">
                  <StarIcon className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            <h1 className="text-xl font-bold text-white mb-0.5 drop-shadow-sm">
              {user.displayName || "Unknown User"}
              {isOwnProfile && (
                <span className="text-white/80 ml-1 text-sm font-normal">
                  (You)
                </span>
              )}
            </h1>

            <p className="text-white/80 text-sm break-all px-2">{user.email}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Badges */}
          <div className="flex flex-wrap justify-center gap-2 -mt-2">
            {renderRoleBadge()}
            {renderFriendshipStatus()}
          </div>

          {/* Personal Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              Personal Details
            </h3>
            <div
              className={`space-y-2 ${
                isOwnProfile ? "inline-block text-left" : ""
              }`}
            >
              <div
                className={`flex items-center gap-2 text-sm ${
                  isOwnProfile ? "" : "justify-center"
                }`}
              >
                <UserIcon className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  Member since: <span className="font-medium">Jan 2024</span>
                </span>
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${
                  isOwnProfile ? "" : "justify-center"
                }`}
              >
                <CalendarDaysIcon className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  Birthday: <span className="font-medium">Not set</span>
                </span>
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${
                  isOwnProfile ? "" : "justify-center"
                }`}
              >
                <HeartIcon className="w-4 h-4 text-pink-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  Gender: <span className="font-medium">Not specified</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="space-y-3">
              {/* Friendship Actions */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  {/* Friendship Button */}
                  {isFriend ? (
                    <button
                      onClick={() => setConfirmAction("remove-friend")}
                      disabled={loading}
                      className="flex-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-red-800 text-sm"
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
                      className="flex-1 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border border-yellow-200 dark:border-yellow-800 text-sm"
                    >
                      <ClockIcon className="w-4 h-4" />
                      Cancel Request
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(() => onAddFriend(user.uid))}
                      disabled={loading}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                    >
                      <UserPlusIcon className="w-4 h-4" />
                      Add Friend
                    </button>
                  )}

                  {/* Trip Action Button */}
                  {context === "trip" && !isTripMember && onInviteToTrip && (
                    <button
                      onClick={() => setConfirmAction("invite-to-trip")}
                      disabled={loading}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                    >
                      <UserPlusIcon className="w-4 h-4" />
                      Invite to Trip
                    </button>
                  )}
                </div>
              </div>
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

      {/* Confirmation Modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 transform transition-all duration-300 animate-slide-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`p-4 rounded-t-2xl text-center ${
                confirmAction === "demote" ||
                confirmAction === "kick" ||
                confirmAction === "remove-friend" ||
                confirmAction === "leave-trip" ||
                confirmAction === "leave-admin"
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              }`}
            >
              <h3 className="font-bold text-white text-lg flex items-center justify-center gap-2">
                {confirmAction === "demote" ||
                confirmAction === "kick" ||
                confirmAction === "remove-friend" ||
                confirmAction === "leave-trip" ||
                confirmAction === "leave-admin" ? (
                  <TrashIcon className="w-5 h-5" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5" />
                )}
                {confirmAction === "demote" && "Remove Admin"}
                {confirmAction === "promote" && "Make Admin"}
                {confirmAction === "kick" && "Remove from Trip"}
                {confirmAction === "remove-friend" && "Remove Friend"}
                {confirmAction === "invite-to-trip" && "Invite to Trip"}
                {confirmAction === "leave-trip" && "Leave Trip"}
                {confirmAction === "leave-admin" && "Leave Admin"}
              </h3>
            </div>

            <div className="p-4 text-center">
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                {confirmAction === "remove-friend" &&
                  `Remove ${user.displayName || user.email} from your friends?`}
                {confirmAction === "demote" &&
                  `Remove admin privileges from ${
                    user.displayName || user.email
                  }?`}
                {confirmAction === "promote" &&
                  `Give admin privileges to ${user.displayName || user.email}?`}
                {confirmAction === "kick" &&
                  `Remove ${user.displayName || user.email} from this trip?`}
                {confirmAction === "invite-to-trip" &&
                  `Invite ${user.displayName || user.email} to this trip?`}
                {confirmAction === "leave-trip" &&
                  `Leave this trip? You can be re-invited later.`}
                {confirmAction === "leave-admin" &&
                  `Remove your admin privileges?`}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedAction}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium disabled:opacity-50 transition-all shadow-sm text-white ${
                    confirmAction === "demote" ||
                    confirmAction === "kick" ||
                    confirmAction === "remove-friend" ||
                    confirmAction === "leave-trip" ||
                    confirmAction === "leave-admin"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {loading ? "..." : "Confirm"}
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
