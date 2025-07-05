import React from "react";

const ContrastSettings = ({ highContrast, setHighContrast }) => {
  const toggleContrast = () => {
    setHighContrast(!highContrast);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div>
        <span className="font-medium text-gray-900 dark:text-white">
          High Contrast Mode
        </span>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Increases contrast for better visibility (WCAG AAA)
        </p>
      </div>
      <button
        onClick={toggleContrast}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          highContrast ? "bg-indigo-600" : "bg-gray-200"
        }`}
        role="switch"
        aria-checked={highContrast}
        aria-label="Toggle high contrast mode"
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
            highContrast ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

export default ContrastSettings;