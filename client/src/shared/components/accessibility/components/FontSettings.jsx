import React from "react";

const FontSettings = ({ fontSize, setFontSize }) => {
  const fontSizes = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <label className="font-medium text-gray-900 dark:text-white">
          Font Size
        </label>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          WCAG AA Compliant
        </span>
      </div>
      <div
        className="flex space-x-2"
        role="radiogroup"
        aria-label="Font size options"
      >
        {fontSizes.map((size) => (
          <button
            key={size.value}
            onClick={() => setFontSize(size.value)}
            className={`px-3 py-1 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              fontSize === size.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
            }`}
            role="radio"
            aria-checked={fontSize === size.value}
            aria-label={`Set font size to ${size.label}`}
          >
            {size.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FontSettings;