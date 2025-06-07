import React, { useState, useEffect } from "react";
import { updateTrip } from "../../services/firebase/trips";
import { toast } from "react-hot-toast";

import {
  UserCircleIcon,
  MailIcon,
  GiftIcon,
  UsersIcon,
  MapPinIcon,
  MoreVertical,
} from "lucide-react";

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
  const [showSuccess, setShowSuccess] = useState(null);
  const [showError, setShowError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleSetAsAdmin = async (uid) => {
    try {
      const updatedTrip = {
        ...trip,
        admins: [...(trip.admins || []), uid],
      };
      await updateTrip(trip.id, updatedTrip);

      if (onPromoteToAdmin) {
        onPromoteToAdmin(uid);
      }

      setShowSuccess("User promoted to Group Admin ✅");
      setTimeout(() => setShowSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to set as admin:", error);
      setShowError("Failed to update admin status ❌");
      setTimeout(() => setShowError(null), 3000);
    }
  };

  const handleDemoteFromAdmin = async (uid) => {
    const isLastAdmin = trip.admins?.length === 1 && trip.admins[0] === uid;

    if (isLastAdmin) {
      setShowError(
        "❌ You are the only Group Admin. Either delete the trip or assign another admin first."
      );
      setTimeout(() => setShowError(null), 4000);
      return;
    }

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

      setShowSuccess("User removed from Group Admin ✅");
      setTimeout(() => setShowSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to remove admin:", error);
      setShowError("Failed to update admin status ❌");
      setTimeout(() => setShowError(null), 3000);
    }
  };

  const handleRemoveFromTrip = async (uid) => {
    try {
      await onRemoveFromTrip(uid);
      onClose();
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("❌ Failed to remove user from trip", { duration: 4000 });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-white via-indigo-100 to-indigo-200 rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fade-in border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button (Right side) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
        >
          ✕
        </button>

        {/* Admin menu (Left side) */}
        {isAdmin && user.uid !== currentUserId && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="text-gray-500 hover:text-black p-1"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="mt-2 bg-white shadow-lg rounded-lg border w-44 absolute left-0 top-8 z-50">
                <button
                  onClick={() => {
                    trip.admins?.includes(user.uid)
                      ? handleDemoteFromAdmin(user.uid)
                      : handleSetAsAdmin(user.uid);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  {trip.admins?.includes(user.uid)
                    ? "⬇️ Revoke Admin"
                    : "👑 Make Admin"}
                </button>
                <button
                  onClick={() => {
                    handleRemoveFromTrip(user.uid);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 text-sm"
                >
                  ❌ Remove from Trip
                </button>
              </div>
            )}
          </div>
        )}

        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <img
            src={
              user.photoURL ||
              "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
            }
            alt="User"
            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-indigo-500"
          />
          <h3 className="mt-4 text-2xl font-bold text-gray-800">
            {user.displayName || user.email}
          </h3>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MailIcon className="w-4 h-4" /> {user.email}
          </p>

          {/* Optional Info */}
          <div className="text-sm text-gray-600 mt-4 space-y-1">
            {user.birthdate && (
              <p className="flex items-center gap-1 justify-center">
                <GiftIcon className="w-4 h-4" /> {user.birthdate}
              </p>
            )}
            {user.gender && (
              <p className="flex items-center gap-1 justify-center">
                <UserCircleIcon className="w-4 h-4" /> {user.gender}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 mt-5 text-sm text-gray-700">
            <span className="flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" /> {user.tripsCount ?? 0} Trips
            </span>
            <span className="flex items-center gap-1">
              <UsersIcon className="w-4 h-4" /> {user.friendsCount ?? 0} Friends
            </span>
          </div>

          {/* Friend Request Actions */}
          {user.uid !== currentUserId && (
            <div className="mt-6 flex flex-col items-center gap-2">
              {friendStatus === "none" && (
                <button
                  onClick={async () => {
                    await onAddFriend(user.uid);
                    setFriendStatus("pending");
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-full text-sm shadow-md"
                >
                  ➕ Add Friend
                </button>
              )}

              {friendStatus === "pending" && (
                <>
                  <div className="bg-gray-300 text-gray-700 px-5 py-2 rounded-full text-sm shadow-md flex items-center gap-2 cursor-default">
                    ⏳ Pending
                  </div>
                  <button
                    onClick={async () => {
                      await onCancelRequest(user.uid);
                      setFriendStatus("none");
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Cancel Request
                  </button>
                </>
              )}

              {friendStatus === "friend" && (
                <div className="flex flex-col items-center gap-1">
                  <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold shadow">
                    ✅ Friends
                  </div>
                  {onRemoveFriend && (
                    <button
                      onClick={async () => {
                        await onRemoveFriend(user.uid);
                        setFriendStatus("none");
                      }}
                      className="text-xs text-red-600 hover:underline mt-1"
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

      {showSuccess && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {showSuccess}
        </div>
      )}
      {showError && (
        <div className="fixed top-5 right-5 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {showError}
        </div>
      )}
    </div>
  );
};

export default UserProfileModal;
