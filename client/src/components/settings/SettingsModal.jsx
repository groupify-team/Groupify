import React, { useEffect, useState } from "react";

const SettingsModal = ({ isOpen, onClose }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white p-6 rounded-xl shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">⚙️ Settings</h2>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Dark Mode</span>
          <button
            onClick={() => setIsDarkMode((prev) => !prev)}
            className={`px-4 py-1 rounded-full text-sm font-semibold transition 
              ${
                isDarkMode
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-300 text-gray-800"
              }`}
          >
            {isDarkMode ? "ON" : "OFF"}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full text-center text-sm text-blue-500 hover:underline"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
