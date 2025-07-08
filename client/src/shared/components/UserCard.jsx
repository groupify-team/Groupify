import React from "react";

const UserCard = ({ user, onClick, rightContent, className = "" }) => {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-slate-700/80 border border-gray-200/60 dark:border-slate-600/60 shadow-sm hover:bg-white/90 dark:hover:bg-slate-700/90 transition-all duration-200 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        <img
          src={
            user.photoURL ||
            "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
          }
          alt={
            user.displayName ? `${user.displayName}'s avatar` : "User avatar"
          }
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-400 dark:border-slate-500"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white text-base truncate">
          {user.displayName || user.email || "Unknown User"}
        </h4>
        {user.email && (
          <p className="text-gray-600 dark:text-slate-400 text-sm truncate">
            {user.email}
          </p>
        )}
      </div>
      {rightContent && <div className="ml-2 flex-shrink-0">{rightContent}</div>}
    </div>
  );
};

export default UserCard;
