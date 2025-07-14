import React from "react";
import { useUserPresence } from "@shared/hooks/useUserPresence";

const UserCard = ({
  user,
  onClick,
  rightContent,
  className = "",
  context = "general",
  showStatus = false,
  status = null,
  role = null,
  isCurrentUser = false,
  actions = null,
  size = "normal",
  variant = "premium", // "premium", "glass", "minimal", "floating"
}) => {
  if (!user) {
    console.warn("UserCard: user prop is undefined");
    return (
      <div
        className={`flex items-center p-4 gap-3 rounded-3xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border border-gray-200 dark:border-slate-500 ${className}`}
      >
        <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-500 dark:to-slate-400 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-500 dark:to-slate-400 rounded-lg animate-pulse mb-2"></div>
          <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-600 dark:to-slate-500 rounded-lg animate-pulse w-3/4"></div>
        </div>
      </div>
    );
  }
  const userPresence = useUserPresence(user?.uid);

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "p-3 gap-3";
      case "large":
        return "p-6 gap-4";
      default:
        return "p-4 gap-4";
    }
  };

  const getImageSize = () => {
    switch (size) {
      case "small":
        return "w-10 h-10";
      case "large":
        return "w-16 h-16";
      default:
        return "w-14 h-14";
    }
  };

  const getTextSizes = () => {
    switch (size) {
      case "small":
        return { name: "text-sm", email: "text-xs" };
      case "large":
        return { name: "text-lg", email: "text-base" };
      default:
        return { name: "text-base", email: "text-sm" };
    }
  };

  const renderStatusIndicator = () => {
    if (!showStatus) return null;

    // Use real presence data if available, fallback to prop
    const currentStatus = userPresence.loading
      ? status || "offline"
      : userPresence.isOnline
      ? userPresence.status
      : "offline";

    const statusConfig = {
      online: {
        color: "bg-emerald-500",
        ring: "ring-emerald-200 dark:ring-emerald-800",
        pulse: "animate-pulse",
      },
      offline: {
        color: "bg-gray-400 dark:bg-gray-500",
        ring: "ring-gray-200 dark:ring-gray-700",
        pulse: "",
      },
      away: {
        color: "bg-amber-500",
        ring: "ring-amber-200 dark:ring-amber-800",
        pulse: "animate-pulse",
      },
      busy: {
        color: "bg-red-500",
        ring: "ring-red-200 dark:ring-red-800",
        pulse: "",
      },
    };

    const config = statusConfig[currentStatus] || statusConfig.offline;

    return (
      <div
        className={`absolute -bottom-1 -right-1 w-5 h-5 ${config.color} border-3 border-white dark:border-slate-800 rounded-full ${config.ring} ring-2 ${config.pulse} shadow-lg`}
        title={
          userPresence.loading
            ? "Loading status..."
            : userPresence.isOnline
            ? `${
                userPresence.status.charAt(0).toUpperCase() +
                userPresence.status.slice(1)
              }`
            : userPresence.lastSeen
            ? `Last seen ${formatLastSeen(userPresence.lastSeen)}`
            : "Offline"
        }
      ></div>
    );
  };

  // Add this helper function after renderStatusIndicator
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "";

    const now = new Date();
    const lastSeenDate = lastSeen.toDate
      ? lastSeen.toDate()
      : new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return lastSeenDate.toLocaleDateString();
  };

  const renderRoleBadge = () => {
    if (!role || context !== "event-member") return null;

    const roleConfig = {
      creator: {
        gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
        icon: "👑",
        text: "Creator",
        shadow: "shadow-lg shadow-purple-500/30",
      },
      admin: {
        gradient: "from-blue-600 via-cyan-600 to-teal-600",
        icon: "⚡",
        text: "Admin",
        shadow: "shadow-lg shadow-blue-500/30",
      },
      member: {
        gradient: "from-emerald-500 to-green-600",
        icon: "✓",
        text: "Member",
        shadow: "shadow-md shadow-green-500/25",
      },
    };

    const config = roleConfig[role] || roleConfig.member;

    return (
      <div className="ml-auto flex-shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${config.gradient} text-white text-xs font-bold px-3 py-1.5 rounded-full ${config.shadow} border border-white/20 backdrop-blur-sm`}
        >
          <span className="text-xs">{config.icon}</span>
          {config.text}
        </span>
      </div>
    );
  };

  const getVariantClasses = () => {
    const baseTransition = "transition-all duration-300 ease-out";
    const baseHover = onClick ? "cursor-pointer" : "";
    // Add this line to control width:
    const widthConstraint = "w-full max-w-md min-w-0"; // Adjust max-w-md as needed

    switch (variant) {
      case "glass":
        return `
        ${baseTransition} ${baseHover} ${widthConstraint}
        bg-white/20 dark:bg-slate-800/20 backdrop-blur-xl
        border border-white/30 dark:border-slate-600/30
        shadow-lg hover:shadow-2xl
        hover:bg-white/30 dark:hover:bg-slate-800/30
        hover:-translate-y-1 hover:scale-[1.02]
        rounded-3xl
      `;

      case "minimal":
        return `
          ${baseTransition} ${baseHover}
          bg-white dark:bg-slate-800
          border border-gray-100 dark:border-slate-700
          shadow-sm hover:shadow-lg
          hover:border-blue-200 dark:hover:border-slate-600
          hover:-translate-y-0.5
          rounded-2xl
        `;

      case "floating":
        return `
          ${baseTransition} ${baseHover}
          bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50
          dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-800/90
          border-0 shadow-xl hover:shadow-2xl
          hover:-translate-y-2 hover:scale-[1.03]
          hover:shadow-blue-500/20 dark:hover:shadow-purple-500/20
          rounded-3xl
          before:absolute before:inset-0 before:rounded-3xl
          before:bg-gradient-to-r before:from-blue-500/10 before:to-purple-500/10
          before:opacity-0 hover:before:opacity-100 before:transition-opacity
          relative before:pointer-events-none
        `;

      case "premium":
      default:
        return `
          ${baseTransition} ${baseHover}
          bg-gradient-to-r from-white via-blue-50/40 to-purple-50/40
          dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-800/90
          border border-white/60 dark:border-slate-600/50
          shadow-lg hover:shadow-xl dark:shadow-slate-900/25
          hover:shadow-blue-200/50 dark:hover:shadow-slate-900/50
          hover:border-blue-300/70 dark:hover:border-slate-500/70
          hover:-translate-y-1 hover:scale-[1.01]
          backdrop-blur-sm rounded-3xl
          relative overflow-hidden
          before:absolute before:inset-0 before:bg-gradient-to-r 
          before:from-blue-500/5 before:via-transparent before:to-purple-500/5
          before:opacity-0 hover:before:opacity-100 before:transition-opacity
          before:pointer-events-none
        `;
    }
  };

  const textSizes = getTextSizes();
  const userPhotoURL =
    user?.photoURL ||
    "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg";
  const userDisplayName = user?.displayName || user?.email || "Unknown User";
  const userEmail = user?.email;

  return (
    <div
      className={`flex items-center ${getSizeClasses()} ${getVariantClasses()} ${className} w-80`} // Fixed width
      onClick={onClick}
    >
      {/* Floating Orbs for Premium Variant */}
      {variant === "premium" && (
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-400/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-purple-400/20 rounded-full blur-lg"></div>
        </div>
      )}

      {/* Profile Image Section */}
      <div className="relative flex-shrink-0 z-10">
        <div
          className={`${getImageSize()} rounded-full overflow-hidden ring-2 ${
            isCurrentUser
              ? "ring-blue-500/70 dark:ring-blue-400/70 ring-offset-2 ring-offset-white dark:ring-offset-slate-800"
              : "ring-white/60 dark:ring-slate-700/60 ring-offset-1 ring-offset-transparent"
          } shadow-lg`}
        >
          <img
            src={userPhotoURL}
            alt={`${userDisplayName}'s avatar`}
            className="w-full h-full object-cover bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-600 dark:to-slate-700"
            onError={(e) => {
              e.target.src =
                "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg";
            }}
          />
        </div>

        {renderStatusIndicator()}

        {isCurrentUser && (
          <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center shadow-xl">
            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 max-w-xs z-10">
        {" "}
        {/* Added max-w-xs */}
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={`font-semibold text-gray-900 dark:text-white ${textSizes.name} truncate leading-tight max-w-full`}
          >
            {userDisplayName}
            {isCurrentUser && (
              <span className="text-blue-600 dark:text-blue-400 text-xs ml-2 font-bold bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-full border border-blue-200/50 dark:border-blue-800/50 flex-shrink-0">
                You
              </span>
            )}
          </h4>
        </div>
        {userEmail && (
          <p
            className={`text-gray-600 dark:text-slate-400 ${textSizes.email} truncate leading-tight font-medium max-w-full`}
          >
            {userEmail}
          </p>
        )}
      </div>

      {/* Role Badge */}
      {renderRoleBadge()}

      {/* Right Content & Actions */}
      {(rightContent || actions) && (
        <div className="ml-3 flex-shrink-0 flex items-center gap-2 z-10">
          {actions}
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default UserCard;
