import React from "react";

/**
 * UserCard component with support for different contexts and actions
 * Can be used in friends list, event members, search results, etc.
 */
const UserCard = ({
  user,
  onClick,
  rightContent,
  className = "",
  context = "general", // "general", "friend", "event-member", "search"
  showStatus = false,
  status = null, // "online", "offline", "away", etc.
  role = null, // For event context: "creator", "admin", "member"
  isCurrentUser = false,
  actions = null, // Custom action buttons
  size = "normal", // "small", "normal", "large"
}) => {
  // Add safety check for user prop
  if (!user) {
    console.warn("UserCard: user prop is undefined");
    return (
      <div
        className={`flex items-center p-3 gap-3 rounded-xl bg-gray-100 dark:bg-slate-600 border border-gray-200 dark:border-slate-500 ${className}`}
      >
        <div className="w-10 h-10 bg-gray-300 dark:bg-slate-400 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 dark:bg-slate-400 rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-slate-500 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "p-2 gap-2";
      case "large":
        return "p-4 gap-4";
      default:
        return "p-3 gap-3";
    }
  };

  const getImageSize = () => {
    switch (size) {
      case "small":
        return "w-8 h-8";
      case "large":
        return "w-12 h-12";
      default:
        return "w-10 h-10";
    }
  };

  const getTextSizes = () => {
    switch (size) {
      case "small":
        return {
          name: "text-sm",
          email: "text-xs",
        };
      case "large":
        return {
          name: "text-lg",
          email: "text-base",
        };
      default:
        return {
          name: "text-base",
          email: "text-sm",
        };
    }
  };

  const renderStatusIndicator = () => {
    if (!showStatus || !status) return null;

    const statusColors = {
      online: "bg-green-500",
      offline: "bg-gray-400",
      away: "bg-yellow-500",
      busy: "bg-red-500",
    };

    const statusColor = statusColors[status] || "bg-gray-400";

    return (
      <div
        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${statusColor} border-2 border-white dark:border-slate-700 rounded-full`}
      ></div>
    );
  };

  const renderRoleBadge = () => {
    if (!role || context !== "event-member") return null;

    const roleStyles = {
      creator: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      admin: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
      member: "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300",
    };

    const roleStyle = roleStyles[role] || roleStyles.member;

    return (
      <span
        className={`${roleStyle} text-xs font-semibold px-2 py-1 rounded-full shadow-sm`}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const textSizes = getTextSizes();

  // Safe access to user properties with fallbacks
  const userPhotoURL =
    user?.photoURL ||
    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg";
  const userDisplayName = user?.displayName || user?.email || "Unknown User";
  const userEmail = user?.email;

  return (
    <div
      className={`flex items-center ${getSizeClasses()} rounded-xl bg-white/80 dark:bg-slate-700/80 border border-gray-200/60 dark:border-slate-600/60 shadow-sm hover:bg-white/90 dark:hover:bg-slate-700/90 transition-all duration-200 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        <img
          src={userPhotoURL}
          alt={`${userDisplayName}'s avatar`}
          className={`${getImageSize()} rounded-full object-cover border-2 ${
            isCurrentUser
              ? "border-blue-400 dark:border-blue-500"
              : "border-gray-400 dark:border-slate-500"
          }`}
          onError={(e) => {
            // Fallback if image fails to load
            e.target.src =
              "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg";
          }}
        />
        {renderStatusIndicator()}
        {isCurrentUser && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-white dark:border-slate-700 rounded-full"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className={`font-medium text-gray-900 dark:text-white ${textSizes.name} truncate`}
          >
            {userDisplayName}
            {isCurrentUser && (
              <span className="text-blue-500 dark:text-blue-400 text-xs ml-1">
                (You)
              </span>
            )}
          </h4>
          {renderRoleBadge()}
        </div>
        {userEmail && (
          <p
            className={`text-gray-600 dark:text-slate-400 ${textSizes.email} truncate`}
          >
            {userEmail}
          </p>
        )}
      </div>

      {(rightContent || actions) && (
        <div className="ml-2 flex-shrink-0 flex items-center gap-2">
          {actions}
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default UserCard;
