import React, { useState } from "react";
import {
  UserCircleIcon,
  MailIcon,
  GiftIcon,
  UsersIcon,
  MapPinIcon,
} from "lucide-react";

const UserProfileModal = ({
  user,
  onClose,
  isFriend,
  isPending,
  onAddFriend,
  onCancelRequest,
  onRemoveFriend,
  currentUserId,
}) => {
  if (!user) return null;

  const [friendStatus, setFriendStatus] = useState(() => {
    if (isFriend) return "friend";
    if (isPending) return "pending";
    return "none";
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-white via-indigo-100 to-indigo-200 rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fade-in border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
        >
          ✕
        </button>

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
    </div>
  );
};

export default UserProfileModal;
