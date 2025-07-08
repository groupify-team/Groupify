import React from "react";
import {
  UserPlusIcon,
  UserMinusIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

/**
 * Reusable action buttons for user interactions
 */
export const FriendActionButton = ({
  status,
  onClick,
  loading = false,
  size = "sm",
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return "p-1 text-xs";
      case "sm":
        return "p-2 text-sm";
      case "md":
        return "p-3 text-base";
      default:
        return "p-2 text-sm";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "xs":
        return "w-3 h-3";
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-5 h-5";
      default:
        return "w-4 h-4";
    }
  };

  const baseClasses = `${getSizeClasses()} rounded-lg font-medium transition-colors duration-200 flex items-center gap-1 disabled:opacity-50`;
  const iconSize = getIconSize();

  switch (status) {
    case "friend":
      return (
        <button
          onClick={onClick}
          disabled={loading}
          className={`${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-300 dark:border-green-700`}
        >
          <CheckCircleIcon className={iconSize} />
          {size !== "xs" && "Friends"}
        </button>
      );

    case "pending":
      return (
        <button
          onClick={onClick}
          disabled={loading}
          className={`${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700`}
        >
          <ClockIcon className={iconSize} />
          {size !== "xs" && "Pending"}
        </button>
      );

    case "add":
    default:
      return (
        <button
          onClick={onClick}
          disabled={loading}
          className={`${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 border border-blue-300 dark:border-blue-700`}
        >
          <UserPlusIcon className={iconSize} />
          {size !== "xs" && "Add"}
        </button>
      );
  }
};

export const EventMemberActionButton = ({
  action,
  onClick,
  loading = false,
  size = "sm",
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return "p-1 text-xs";
      case "sm":
        return "p-2 text-sm";
      case "md":
        return "p-3 text-base";
      default:
        return "p-2 text-sm";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "xs":
        return "w-3 h-3";
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-5 h-5";
      default:
        return "w-4 h-4";
    }
  };

  const baseClasses = `${getSizeClasses()} rounded-lg font-medium transition-colors duration-200 flex items-center gap-1 disabled:opacity-50`;
  const iconSize = getIconSize();

  switch (action) {
    case "promote":
      return (
        <button
          onClick={onClick}
          disabled={loading}
          className={`${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 border border-blue-300 dark:border-blue-700`}
        >
          <ShieldCheckIcon className={iconSize} />
          {size !== "xs" && "Promote"}
        </button>
      );

    case "demote":
      return (
        <button
          onClick={onClick}
          disabled={loading}
          className={`${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700`}
        >
          <ShieldExclamationIcon className={iconSize} />
          {size !== "xs" && "Demote"}
        </button>
      );

    case "remove":
      return (
        <button
          onClick={onClick}
          disabled={loading}
          className={`${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-700`}
        >
          <TrashIcon className={iconSize} />
          {size !== "xs" && "Remove"}
        </button>
      );

    case "invite":
      return (
        <button
          onClick={onClick}
          disabled={loading}
          className={`${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-300 dark:border-green-700`}
        >
          <UserPlusIcon className={iconSize} />
          {size !== "xs" && "Invite"}
        </button>
      );

    default:
      return null;
  }
};

export const QuickActionButtons = ({ actions, loading = false }) => {
  return (
    <div className="flex gap-1">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          disabled={loading}
          className={`p-1 rounded-lg transition-colors duration-200 ${
            action.className ||
            "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          } disabled:opacity-50`}
          title={action.title}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
};
