import React from "react";

const MotionSettings = ({ reducedMotion, setReducedMotion, toggleSetting }) => {
  const handleToggle = () => {
    if (toggleSetting) {
      toggleSetting(setReducedMotion, reducedMotion);
    } else {
      setReducedMotion(!reducedMotion);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div>
        <span className="font-medium text-gray-900 dark:text-white">
          Reduce Motion
        </span>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Minimizes animations for motion sensitivity
        </p>
      </div>
      <button
        onClick={handleToggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          reducedMotion ? "bg-indigo-600" : "bg-gray-200"
        }`}
        role="switch"
        aria-checked={reducedMotion}
        aria-label="Toggle reduced motion"
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
            reducedMotion ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

export default MotionSettings;