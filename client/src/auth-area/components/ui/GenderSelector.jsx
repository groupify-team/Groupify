import React from "react";

const GenderSelector = ({ value, onChange, disabled = false, className = "" }) => {
  const options = ["male", "female", "other"];

  return (
    <div className={className}>
      <p className="block text-xs sm:text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
        Gender (Optional)
      </p>
      <div className="flex space-x-2 sm:space-x-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            disabled={disabled}
            className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
              value === option
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenderSelector;