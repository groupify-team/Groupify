// LoadingSpinner.jsx - Loading spinner component
import React from "react";

const LoadingSpinner = ({
  size = "medium",
  color = "indigo",
  text = null,
  overlay = false,
  className = "",
}) => {
  // Size configurations
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
    xlarge: "w-16 h-16",
  };

  // Color configurations
  const colorClasses = {
    indigo: "border-indigo-600 dark:border-indigo-400",
    purple: "border-purple-600 dark:border-purple-400",
    blue: "border-blue-600 dark:border-blue-400",
    green: "border-green-600 dark:border-green-400",
    red: "border-red-600 dark:border-red-400",
    gray: "border-gray-600 dark:border-gray-400",
    white: "border-white",
  };

  // Border light colors for the spinning effect
  const borderLightClasses = {
    indigo: "border-indigo-200 dark:border-indigo-700",
    purple: "border-purple-200 dark:border-purple-700",
    blue: "border-blue-200 dark:border-blue-700",
    green: "border-green-200 dark:border-green-700",
    red: "border-red-200 dark:border-red-700",
    gray: "border-gray-200 dark:border-gray-600",
    white: "border-gray-300",
  };

  // Text size based on spinner size
  const textSizeClasses = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
    xlarge: "text-lg",
  };

  const spinnerElement = (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
    >
      {/* Spinner */}
      <div
        className={`
          ${sizeClasses[size]} 
          border-4 
          ${borderLightClasses[color]} 
          border-t-4 
          ${colorClasses[color]} 
          rounded-full 
          animate-spin
        `}
      />

      {/* Optional text */}
      {text && (
        <p
          className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400 font-medium animate-pulse`}
        >
          {text}
        </p>
      )}
    </div>
  );

  // Return with overlay if requested
  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/50">
          {spinnerElement}
        </div>
      </div>
    );
  }

  // Return spinner element directly
  return spinnerElement;
};

// Preset spinner components for common use cases
export const SmallSpinner = ({ color = "indigo", className = "" }) => (
  <LoadingSpinner size="small" color={color} className={className} />
);

export const MediumSpinner = ({
  color = "indigo",
  text = null,
  className = "",
}) => (
  <LoadingSpinner
    size="medium"
    color={color}
    text={text}
    className={className}
  />
);

export const LargeSpinner = ({
  color = "indigo",
  text = "Loading...",
  className = "",
}) => (
  <LoadingSpinner
    size="large"
    color={color}
    text={text}
    className={className}
  />
);

export const FullPageSpinner = ({
  text = "Loading your dashboard...",
  color = "indigo",
}) => <LoadingSpinner size="xlarge" color={color} text={text} overlay={true} />;

// Button spinner for loading buttons
export const ButtonSpinner = ({ className = "" }) => (
  <LoadingSpinner size="small" color="white" className={className} />
);

// Card loading state
export const CardSpinner = ({ text = "Loading...", className = "" }) => (
  <div className={`flex items-center justify-center py-12 ${className}`}>
    <LoadingSpinner size="medium" color="indigo" text={text} />
  </div>
);

// Inline spinner for text
export const InlineSpinner = ({ className = "" }) => (
  <LoadingSpinner
    size="small"
    color="gray"
    className={`inline-flex ${className}`}
  />
);

export default LoadingSpinner;
