// 📁 client/src/components/layout/Navbar.jsx
import React from "react";
import {
  Moon,
  Sun,
  Bell,
  UserCircle,
  LogOut,
  Settings,
  Pencil,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const Navbar = ({
  userData,
  currentUser,
  showUserMenu,
  setShowUserMenu,
  showNotifications,
  setShowNotifications,
  pendingRequests,
  handleLogout,
  setShowEditProfileModal,
  setShowSettingsModal,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md dark:shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center relative">
          {/* 👤 Left section – Profile + Dropdown */}
          <div className="flex items-center space-x-4 relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="relative"
            >
              <img
                src={
                  userData?.photoURL ||
                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                }
                alt="Profile"
                className="w-11 h-11 rounded-full object-cover border-2 dark:border-gray-700"
              />
              <span className="absolute bottom-0 right-[-6px] bg-white/80 dark:bg-gray-800/80 rounded-full p-0.5 shadow">
                <svg
                  className={`w-3 h-3 text-gray-700 dark:text-gray-200 transition-transform ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute left-0 top-14 w-48 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border dark:border-gray-600 rounded-lg shadow z-50">
                <button
                  onClick={() => {
                    setShowEditProfileModal(true);
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Pencil size={16} /> Edit Profile
                </button>
                <button
                  onClick={() => {
                    setShowSettingsModal(true);
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings size={16} /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}

            <span className="text-gray-700 dark:text-gray-100 text-base font-medium">
              Welcome,{" "}
              {userData?.displayName ||
                currentUser?.displayName ||
                currentUser?.email}
            </span>
          </div>

          {/* 🏷️ Center – Logo/Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Groupify Dashboard
            </h1>
          </div>

          {/* 🌙 Right section – Notifications + Theme Toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="w-6 h-6 text-gray-600 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400" />
              {pendingRequests?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
              )}
            </button>

            <button onClick={toggleTheme} className="focus:outline-none">
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-800" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
