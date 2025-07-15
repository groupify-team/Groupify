import React, { useState } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { UserService } from "@shared/services/user";
import { useFriendsContext } from "@shared/contexts/FriendsContext";
import toast from "react-hot-toast";

import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  AtSymbolIcon,
  SparklesIcon,
  EyeIcon,
  ClockIcon,
  UserMinusIcon,
  HandRaisedIcon, // For "yo" gesture
} from "@heroicons/react/24/outline";

const AddFriend = ({
  onUserSelect,
  onAddFriendDirect,
  preservedInput = "",
  preservedUser = null,
}) => {
  const authData = useAuth();
  const currentUser = authData.currentUser; // Use the direct property
  const { getUserRelationshipData, cancelFriendRequest, removeFriend } =
    useFriendsContext();

  // Early return if auth is still loading or not initialized
  if (authData.loading || !authData.initialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading...
        </span>
      </div>
    );
  }

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

  const isCurrentUser =
    foundUser &&
    currentUser &&
    (foundUser.uid === currentUser.uid ||
      foundUser.id === currentUser.uid ||
      foundUser.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
      foundUser.uid === authData.uid ||
      foundUser.email?.toLowerCase() === authData.email?.toLowerCase());

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

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.trim())) {
        setStatus({
          type: "error",
          message: "Please enter a valid email address.",
        });
        setLoading(false);
        return;
      }

      const users = await UserService.findUsersByEmail(input.trim());
      const targetUser = users.find(
        (u) => u.email?.toLowerCase() === input.trim().toLowerCase()
      );

      if (!targetUser) {
        setStatus({
          type: "error",
          message:
            "User not found. Make sure they have an account with this email.",
        });
        setLoading(false);
        return;
      }
      const targetUserId = targetUser.uid || targetUser.id;
      const currentUserId = currentUser?.uid;
      setFoundUser(targetUser);
      if (
        targetUserId === currentUserId ||
        targetUser.email === currentUser?.email ||
        targetUser.email?.toLowerCase() === currentUser?.email?.toLowerCase()
      ) {
        setStatus({
          type: "info",
          message: `Hey, that's you! 👋`,
        });
      } else {
        setStatus({
          type: "success",
          message: `Found user: ${targetUser.displayName || targetUser.email}`,
        });
      }
    } catch (error) {
      console.error("Error searching for user:", error);
      setStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriendDirect = async () => {
    if (isCurrentUser) {
      toast.error("You cannot add yourself as a friend!");
      return;
    }

    if (foundUser && onAddFriendDirect) {
      const targetUserId = foundUser.uid || foundUser.id;
      const currentUserId = currentUser?.uid;
      if (targetUserId === currentUserId) {
        toast.error("You cannot add yourself as a friend!");
        return;
      }
      try {
        setLoading(true);
        await onAddFriendDirect(foundUser.uid || foundUser.id);
        setInput("");
        setFoundUser(null);
        setStatus({
          type: "success",
          message: "Friend request sent successfully!",
        });
      } catch (error) {
        console.error("Error adding friend:", error);
        setStatus({
          type: "error",
          message: "Failed to send friend request. Please try again.",
        });
        toast.error("Failed to send friend request!");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelRequest = async () => {
    if (foundUser && !isCurrentUser) {
      try {
        setLoading(true);
        await cancelFriendRequest(foundUser.uid || foundUser.id);
        setStatus({
          type: "success",
          message: "Friend request cancelled successfully!",
        });
      } catch (error) {
        console.error("Error cancelling friend request:", error);
        setStatus({
          type: "error",
          message: "Failed to cancel friend request.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveFriend = async () => {
    if (foundUser && !isCurrentUser) {
      try {
        setLoading(true);
        await removeFriend(foundUser.uid || foundUser.id);
        setStatus({
          type: "success",
          message: "Friend removed successfully!",
        });
      } catch (error) {
        console.error("Error removing friend:", error);
        setStatus({
          type: "error",
          message: "Failed to remove friend.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewProfile = () => {
    if (foundUser && onUserSelect) {
      onUserSelect(foundUser);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };

  const relationshipData =
    foundUser && !isCurrentUser
      ? getUserRelationshipData(foundUser.uid || foundUser.id)
      : null;

  const getActionButtonConfig = () => {
    if (!foundUser) return null;
    if (isCurrentUser) {
      return null;
    }
    if (!relationshipData) return null;
    if (relationshipData.isFriend) {
      return {
        text: "Friends",
        icon: CheckCircleIcon,
        bgColor:
          "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
        onClick: handleRemoveFriend,
        disabled: false,
      };
    }

    if (relationshipData.isPending) {
      return {
        text: "Request Sent",
        icon: ClockIcon,
        bgColor:
          "from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700",
        onClick: handleCancelRequest,
        disabled: false,
      };
    }

    return {
      text: "Add Friend",
      icon: UserPlusIcon,
      bgColor:
        "from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700",
      onClick: handleAddFriendDirect,
      disabled: false,
    };
  };

  const buttonConfig = getActionButtonConfig();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Add New Friends
        </h2>
        <p className="text-gray-600 dark:text-slate-400">
          Search for friends by email address and send connection requests
        </p>
      </div>

      {/* Search Input */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <AtSymbolIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <input
            type="email"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter email address"
            disabled={loading}
            className="w-full pl-12 pr-12 py-4 bg-white/70 dark:bg-slate-700/70 backdrop-blur-lg border-2 border-emerald-200/50 dark:border-emerald-700/50 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg disabled:opacity-50 text-lg"
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {loading && (
              <div className="w-5 h-5 border-2 border-emerald-200 dark:border-emerald-700 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin"></div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading || !input.trim()}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-xl hover:shadow-2xl disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span>Find User</span>
            </>
          )}
        </button>
      </div>

      {/* Found User Card */}
      {foundUser && (
        <div
          className={`bg-gradient-to-br backdrop-blur-lg border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg ${
            isCurrentUser
              ? "from-blue-50/80 to-purple-50/80 dark:from-blue-900/30 dark:to-purple-900/30 border-blue-200/50 dark:border-blue-800/50"
              : "from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-200/50 dark:border-emerald-800/50"
          }`}
        >
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
              {/* Status indicator */}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center ${
                  isCurrentUser
                    ? "bg-blue-500"
                    : relationshipData?.isFriend
                    ? "bg-green-500"
                    : relationshipData?.isPending
                    ? "bg-yellow-500"
                    : "bg-emerald-500"
                }`}
              >
                {isCurrentUser ? (
                  <HandRaisedIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                ) : relationshipData?.isFriend ? (
                  <CheckCircleIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                ) : relationshipData?.isPending ? (
                  <ClockIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                ) : (
                  <CheckCircleIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg truncate">
                {isCurrentUser
                  ? "That's You!"
                  : foundUser.displayName || "User"}
              </h4>
              <p
                className={`text-xs sm:text-sm font-medium truncate ${
                  isCurrentUser
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {foundUser.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {isCurrentUser ? (
                  <HandRaisedIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                )}
                <span
                  className={`text-xs font-medium ${
                    isCurrentUser
                      ? "text-blue-700 dark:text-blue-400"
                      : relationshipData?.isFriend
                      ? "text-emerald-700 dark:text-emerald-400"
                      : relationshipData?.isPending
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {isCurrentUser
                    ? "Yo! 👋"
                    : relationshipData?.isFriend
                    ? "Already friends!"
                    : relationshipData?.isPending
                    ? "Request pending..."
                    : "Ready to connect!"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Only show for non-self users */}
          {!isCurrentUser && (
            <div className="flex gap-2 sm:gap-3 mt-4">
              {buttonConfig && (
                <button
                  onClick={buttonConfig.onClick}
                  disabled={loading || buttonConfig.disabled}
                  className={`flex-1 bg-gradient-to-r ${buttonConfig.bgColor} text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <buttonConfig.icon className="w-4 h-4" />
                  )}
                  <span className="hidden xs:inline">{buttonConfig.text}</span>
                  <span className="xs:hidden">
                    {relationshipData?.isFriend
                      ? "Friends"
                      : relationshipData?.isPending
                      ? "Sent"
                      : "Add"}
                  </span>
                </button>
              )}

              {onUserSelect && (
                <button
                  onClick={handleViewProfile}
                  disabled={loading}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span className="hidden xs:inline">View Profile</span>
                  <span className="xs:hidden">View</span>
                </button>
              )}
            </div>
          )}

          {/* Self user gets a different action */}
          {isCurrentUser && onUserSelect && (
            <div className="flex gap-2 sm:gap-3 mt-4">
              <button
                onClick={handleViewProfile}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <EyeIcon className="w-4 h-4" />
                <span className="hidden xs:inline">View Your Profile</span>
                <span className="xs:hidden">Your Profile</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {status && (
        <div
          className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl backdrop-blur-lg shadow-lg transition-all duration-300 ${
            status.type === "error"
              ? "bg-red-50/90 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              : status.type === "info"
              ? "bg-blue-50/90 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
              : "bg-green-50/90 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
          }`}
        >
          {status.type === "error" ? (
            <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          ) : status.type === "info" ? (
            <HandRaisedIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
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
              <li>✓ Make sure they have registered with this email</li>
              <li>✓ Check for typos in the email address</li>
              <li>✓ They'll receive a friend request notification</li>
              <li>✓ Green status = friends, Yellow = request sent</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriend;
