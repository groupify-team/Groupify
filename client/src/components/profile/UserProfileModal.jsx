import React, { useState, useEffect } from "react";
// import { updateTrip } from "../../services/firebase/trips";
// import { toast } from "react-hot-toast";

import {
  UserCircle,
  Mail,
  Gift,
  Users,
  MapPin,
  MoreVertical,
  X,
  Crown,
  Shield,
  Star,
  Sparkles,
  Calendar,
  Heart,
} from "lucide-react";

// Mock functions for demo purposes
const updateTrip = async (tripId, updatedTrip) => {
  // Simulate API call
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

const toast = {
  error: (message, options) => console.log("Toast Error:", message),
};

const UserProfileModal = ({
  user,
  currentUserId,
  isAdmin,
  isFriend,
  isPending,
  onAddFriend,
  onRemoveFriend,
  onCancelRequest,
  onRemoveFromTrip,
  onClose,
  trip,
  setTrip,
  onPromoteToAdmin,
  onDemoteFromAdmin,
  tripMembers,
  setTripMembers,
  onlyTripMembers = true,
}) => {
  if (!user) return null;
  if (onlyTripMembers && !tripMembers?.some((m) => m.uid === user.uid))
    return null;

  const [friendStatus, setFriendStatus] = useState(() => {
    if (typeof isFriend !== "undefined") return isFriend ? "friend" : "none";
    if (typeof isPending !== "undefined" && isPending) return "pending";
    return "none";
  });

  const isTripAdmin = trip?.admins?.includes(currentUserId);
  const isUserAdmin = trip?.admins?.includes(user.uid);
  const [showSuccess, setShowSuccess] = useState(null);
  const [showError, setShowError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  const handleSetAsAdmin = async (uid) => {
    setIsLoading(true);
    try {
      const updatedTrip = {
        ...trip,
        admins: [...(trip.admins || []), uid],
      };
      await updateTrip(trip.id, updatedTrip);

      if (onPromoteToAdmin) {
        onPromoteToAdmin(uid);
      }

      setShowSuccess("User promoted to Group Admin ✨");
      setTimeout(() => setShowSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to set as admin:", error);
      setShowError("Failed to update admin status");
      setTimeout(() => setShowError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoteFromAdmin = async (uid) => {
    const isLastAdmin = trip.admins?.length === 1 && trip.admins[0] === uid;

    if (isLastAdmin) {
      setShowError(
        "You are the only Group Admin. Either delete the trip or assign another admin first."
      );
      setTimeout(() => setShowError(null), 4000);
      return;
    }

    setIsLoading(true);
    try {
      const updatedTrip = {
        ...trip,
        admins: trip.admins?.filter((id) => id !== uid),
      };
      await updateTrip(trip.id, updatedTrip);

      setTrip(updatedTrip);

      if (onDemoteFromAdmin) {
        onDemoteFromAdmin(uid);
      }

      setShowSuccess("Admin privileges revoked");
      setTimeout(() => setShowSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to remove admin:", error);
      setShowError("Failed to update admin status");
      setTimeout(() => setShowError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromTrip = async (uid) => {
    setIsLoading(true);
    try {
      await onRemoveFromTrip(uid);
      onClose();
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Failed to remove user from trip", { duration: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-lg flex items-center justify-center z-50 transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-md mx-4 transform transition-all duration-300 ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Glassmorphism Background - ORIGINAL SIZE */}
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50"></div>

        {/* Content - ORIGINAL PADDING */}
        <div className="relative p-8">
          {/* Close Button - ORIGINAL SIZE */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 dark:bg-gray-800/30 dark:hover:bg-gray-700/50 transition-all duration-200 group backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors" />
          </button>

          {/* Admin Menu - ORIGINAL SIZE */}
          {isAdmin && user.uid !== currentUserId && (
            <div className="absolute top-4 left-4 z-10">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 dark:bg-gray-800/30 dark:hover:bg-gray-700/50 transition-all duration-200 group backdrop-blur-sm"
                disabled={isLoading}
              >
                <MoreVertical className="w-5 h-5 text-gray-600 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors" />
              </button>

              {showMenu && (
                <div className="absolute left-0 top-12 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden transform transition-all duration-200 animate-in slide-in-from-top-2">
                  <button
                    onClick={() => {
                      isUserAdmin
                        ? handleDemoteFromAdmin(user.uid)
                        : handleSetAsAdmin(user.uid);
                      setShowMenu(false);
                    }}
                    disabled={isLoading}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-3 text-sm font-medium"
                  >
                    {isUserAdmin ? (
                      <>
                        <Shield className="w-4 h-4 text-orange-500" />
                        <span>Revoke Admin</span>
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span>Make Admin</span>
                      </>
                    )}
                  </button>
                  <div className="h-px bg-gray-200/50 dark:bg-gray-600/50"></div>
                  <button
                    onClick={() => {
                      handleRemoveFromTrip(user.uid);
                      setShowMenu(false);
                    }}
                    disabled={isLoading}
                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    <span>Remove from Trip</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Profile Section */}
          <div className="flex flex-col items-center text-center">
            {/* Avatar with Status Indicator - ORIGINAL SIZE */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 p-1 shadow-2xl">
                <img
                  src={
                    user.photoURL ||
                    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                  }
                  alt={user.displayName || "User"}
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              {isUserAdmin && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2 shadow-lg">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* User Info - ORIGINAL SPACING */}
            <div className="mt-6 space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                {user.displayName || user.email}
              </h2>
              <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>

            {/* Additional Info - ORIGINAL SPACING */}
            {(user.birthdate || user.gender) && (
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {user.birthdate && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 rounded-full text-sm text-gray-700 dark:text-gray-300">
                    <Gift className="w-4 h-4 text-pink-500" />
                    <span>{user.birthdate}</span>
                  </div>
                )}
                {user.gender && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 rounded-full text-sm text-gray-700 dark:text-gray-300">
                    <UserCircle className="w-4 h-4 text-blue-500" />
                    <span>{user.gender}</span>
                  </div>
                )}
              </div>
            )}
            {/* Stats - ORIGINAL SIZE */}
            <div className="mt-6 flex justify-center gap-8">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-2xl font-bold text-gray-800 dark:text-white">
                  {user.tripsCount ?? 0}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Trips
                </span>
              </div>
              <div className="w-px h-16 bg-gray-200 dark:bg-gray-600"></div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-2xl font-bold text-gray-800 dark:text-white">
                  {user.friendsCount ?? 0}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Friends
                </span>
              </div>
            </div>

            {/* Action Buttons - ORIGINAL SIZE */}
            {user.uid !== currentUserId && (
              <div className="mt-8 w-full space-y-3">
                {friendStatus === "none" && (
                  <button
                    onClick={async () => {
                      setIsLoading(true);
                      await onAddFriend(user.uid);
                      setFriendStatus("pending");
                      setIsLoading(false);
                    }}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-6 rounded-2xl font-semibold shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Star className="w-5 h-5" />
                        Add Friend
                      </>
                    )}
                  </button>
                )}

                {friendStatus === "pending" && (
                  <div className="space-y-2">
                    <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 py-3 px-6 rounded-2xl font-semibold shadow-lg flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      Friend Request Pending
                    </div>
                    <button
                      onClick={async () => {
                        setIsLoading(true);
                        await onCancelRequest(user.uid);
                        setFriendStatus("none");
                        setIsLoading(false);
                      }}
                      disabled={isLoading}
                      className="w-full text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 py-2 px-4 text-sm font-medium transition-colors"
                    >
                      Cancel Request
                    </button>
                  </div>
                )}

                {friendStatus === "friend" && (
                  <div className="space-y-2">
                    <div className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-2xl font-semibold shadow-lg flex items-center justify-center gap-2">
                      <Star className="w-5 h-5 fill-current" />
                      Friends
                    </div>
                    {onRemoveFriend && (
                      <button
                        onClick={async () => {
                          setIsLoading(true);
                          await onRemoveFriend(user.uid);
                          setFriendStatus("none");
                          setIsLoading(false);
                        }}
                        disabled={isLoading}
                        className="w-full text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 py-2 px-4 text-sm font-medium transition-colors"
                      >
                        Remove Friend
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications - ORIGINAL SIZE */}
      {showSuccess && (
        <div className="fixed top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-60 transform transition-all duration-300 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">{showSuccess}</span>
          </div>
        </div>
      )}

      {showError && (
        <div className="fixed top-6 right-6 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-60 transform transition-all duration-300 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <X className="w-4 h-4" />
            <span className="font-medium">{showError}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay - ORIGINAL SIZE */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 text-center">
              Processing...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileModal;
