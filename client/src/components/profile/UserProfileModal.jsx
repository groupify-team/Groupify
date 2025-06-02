import React from "react";

const UserProfileModal = ({
  user,
  onClose,
  isFriend,
  isPending,
  onAddFriend,
  currentUserId,
  onCancelRequest,
}) => {
  if (!user) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-lg"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-6">User Profile</h2>

        {/* User Info */}
        <div className="flex flex-col items-center text-center">
          <img
            src={
              user.photoURL ||
              "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
            }
            alt="User"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-800">
            {user.displayName || user.email}
          </h3>
          <p className="text-sm text-gray-500">{user.email}</p>

          {user.birthdate && (
            <p className="text-sm mt-2 text-gray-600">🎂 {user.birthdate}</p>
          )}
          {user.gender && (
            <p className="text-sm text-gray-600">👤 {user.gender}</p>
          )}

          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-700">
            <span>🗺️ Trips: {user.tripsCount ?? 0}</span>
            <span>👥 Friends: {user.friendsCount ?? 0}</span>
          </div>

          {/* Add Friend Button */}
          {user.uid !== currentUserId &&
            !isFriend &&
            (isPending ? (
              <div className="mt-6 flex flex-col items-center gap-2">
                <button
                  className="bg-gray-400 text-white px-5 py-2 rounded-full text-sm shadow-md cursor-not-allowed flex items-center justify-center gap-2"
                  disabled
                >
                  ⏳ Pending
                </button>
                <button
                  onClick={() => onCancelRequest(user.uid)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Cancel Request
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddFriend(user.uid)}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm shadow-md"
              >
                ➕ Add Friend
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
