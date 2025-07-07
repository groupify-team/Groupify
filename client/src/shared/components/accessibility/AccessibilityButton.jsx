import React from "react";

// Accessibility icon component (consistent across all areas)
const AccessibilityIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <circle
      cx="12"
      cy="12"
      r="11"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <path d="M12 3C13.1 3 14 3.9 14 5C14 6.1 13.1 7 12 7C10.9 7 10 6.1 10 5C10 3.9 10.9 3 12 3ZM20 10V8L13.5 8.5C13.1 8.4 12.6 8.2 12.1 8.1L12 8L11.9 8.1C11.4 8.2 10.9 8.4 10.5 8.5L4 8V10L10.5 10.5L8.5 17.5C8.4 17.9 8.6 18.4 9 18.5C9.4 18.6 9.9 18.4 10 18L12 11.5L14 18C14.1 18.4 14.6 18.6 15 18.5C15.4 18.4 15.6 17.9 15.5 17.5L13.5 10.5L20 10Z" />
  </svg>
);

/**
 * Universal Accessibility Button Component
 * Can be used across all areas: public, auth, dashboard
 */
const AccessibilityButton = ({
  onSettingsClick,
  size = "default",
  variant = "default",
  className = "",
  showLabel = false,
}) => {
  const sizeClasses = {
    small: "p-1.5",
    default: "p-2",
    large: "p-3",
  };

  const iconSizes = {
    small: "w-4 h-4",
    default: "w-5 h-5",
    large: "w-6 h-6",
  };

  const variantClasses = {
    default:
      "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
    primary:
      "text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
    minimal:
      "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
  };

  const buttonClasses = `
    ${sizeClasses[size]} 
    ${variantClasses[variant]} 
    rounded-lg transition-colors
    ${className}
  `.trim();

  return (
    <button
      onClick={() => {
        console.log(
          "Accessibility button clicked, onSettingsClick:",
          onSettingsClick
        );
        if (onSettingsClick) onSettingsClick();
      }}
      className={buttonClasses}
      aria-label="Open accessibility settings"
      title="Accessibility Settings"
    >
      <div className="flex items-center gap-2">
        <AccessibilityIcon className={iconSizes[size]} />
        {showLabel && (
          <span className="text-sm font-medium">Accessibility</span>
        )}
      </div>
    </button>
  );
};

export default AccessibilityButton;
export { AccessibilityIcon };
