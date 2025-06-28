import React, { useState } from "react";
import { useAuth } from "../../auth/contexts/AuthContext";
import { findUsersByEmail } from "../../../shared/services/firebase/users";
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  AtSymbolIcon,
  SparklesIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const AddFriend = ({
  onUserSelect,
  onAddFriendDirect,
  preservedInput = "",
  preservedUser = null,
}) => {
  const { currentUser } = useAuth();
  const [input, setInput] = useState(preservedInput);
  const [status, setStatus] = useState(
    preservedUser
      ? {
          type: "success",
          message: `Found user: ${
            preservedUser.displayName || preservedUser.email
          }`,
        }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(preservedUser);

  const handleSearch = async () => {
    setLoading(true);
    setStatus(null);
    setFoundUser(null);

    try {
      if (!input.trim()) {
        setStatus({ type: "error", message: "Please enter an email address." });
        setLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.trim())) {
        setStatus({
          type: "error",
          message: "Please enter a valid email address.",
        });
        setLoading(false);
        return;
      }

      const users = await findUsersByEmail(input.trim());
      const targetUser = users.find((u) => u.uid !== currentUser.uid);

      if (!targetUser) {
        setStatus({
          type: "error",
          message:
            "User not found. Make sure they have an account with this email.",
        });
        setLoading(false);
        return;
      }

      if (targetUser.uid === currentUser.uid) {
        setStatus({
          type: "error",
          message: "You cannot add yourself as a friend.",
        });
        setLoading(false);
        return;
      }

      // Show found user
      setFoundUser(targetUser);
      setStatus({
        type: "success",
        message: `Found user: ${targetUser.displayName || targetUser.email}`,
      });
    } catch (error) {
      console.error("Error:", error);
      setStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriendDirect = async () => {
    if (foundUser && onAddFriendDirect) {
      try {
        await onAddFriendDirect(foundUser.uid);
        setInput("");
        setFoundUser(null);
        setStatus({
          type: "success",
          message: "Friend request sent successfully!",
        });
      } catch (error) {
        setStatus({
          type: "error",
          message: "Failed to send friend request. Please try again.",
        });
      }
    }
  };

  const handleViewProfile = () => {
    if (foundUser && onUserSelect) {
      onUserSelect(foundUser.uid);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Search Input */}
      <div className="space-y-3 sm:space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <AtSymbolIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="email"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter email address"
            disabled={loading}
            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/60 dark:bg-gray-700/60 backdrop-blur-lg border border-gray-200/50 dark:border-gray-600/50 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg disabled:opacity-50"
          />
          <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center">
            {loading && (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-emerald-200 dark:border-emerald-700 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin"></div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading || !input.trim()}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-sm sm:text-base">Searching...</span>
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Find User</span>
            </>
          )}
        </button>
      </div>

      {/* Found User Card */}
      {foundUser && (
        <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/30 dark:to-teal-900/30 backdrop-blur-lg border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={
                  foundUser.photoURL ||
                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                }
                alt="User avatar"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 sm:border-3 border-white dark:border-gray-600 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg truncate">
                {foundUser.displayName || "User"}
              </h4>
              <p className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium truncate">
                {foundUser.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Ready to connect!
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 mt-4">
            <button
              onClick={handleAddFriendDirect}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <UserPlusIcon className="w-4 h-4" />
              <span className="hidden xs:inline">Add Friend</span>
              <span className="xs:hidden">Add</span>
            </button>
            <button
              onClick={handleViewProfile}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <EyeIcon className="w-4 h-4" />
              <span className="hidden xs:inline">View Profile</span>
              <span className="xs:hidden">View</span>
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {status && (
        <div
          className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-lg shadow-lg transition-all duration-300 ${
            status.type === "error"
              ? "bg-red-50/90 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              : "bg-green-50/90 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
          }`}
        >
          {status.type === "error" ? (
            <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          )}
          <span className="font-medium text-xs sm:text-sm leading-relaxed">
            {status.message}
          </span>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-lg border border-blue-200/50 dark:border-blue-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">💡</span>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-400 text-xs sm:text-sm mb-2">
              Tips for adding friends:
            </h4>
            <ul className="text-blue-700 dark:text-blue-300 text-xs space-y-1">
              <li>• Make sure they have registered with this email</li>
              <li>• Check for typos in the email address</li>
              <li>• They'll receive a friend request notification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriend;
