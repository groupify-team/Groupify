import React from "react";

const PasswordStrengthIndicator = ({ strength, className = "" }) => {
  if (!strength || strength.strength === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          Password strength:
        </span>
        <span
          className={`font-medium ${
            strength.label === "Strong"
              ? "text-green-600"
              : strength.label === "Medium"
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {strength.label}
        </span>
      </div>
      <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${strength.color}`}
          style={{
            width: `${(strength.strength / 6) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;