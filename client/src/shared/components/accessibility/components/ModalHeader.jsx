import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Accessibility icon (iPhone-style)
const AccessibilityIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L13.5 7.5C13.1 7.4 12.6 7.2 12.1 7.1L12 7L11.9 7.1C11.4 7.2 10.9 7.4 10.5 7.5L3 7V9L10.5 9.5L8.5 16.5C8.4 16.9 8.6 17.4 9 17.5C9.4 17.6 9.9 17.4 10 17L12 10.5L14 17C14.1 17.4 14.6 17.6 15 17.5C15.4 17.4 15.6 16.9 15.5 16.5L13.5 9.5L21 9Z" />
  </svg>
);

const ModalHeader = ({ onClose }) => {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
          <AccessibilityIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2
            id="accessibility-title"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Accessibility Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Customize your experience
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Close accessibility settings"
      >
        <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
};

export default ModalHeader;