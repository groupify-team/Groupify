import React, { useState, useCallback } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  placeholder = "••••••••",
  disabled = false,
  required = false,
  autoComplete = "current-password",
  className = "",
  label,
  error,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword((prev) => !prev);
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      // Don't let this interfere with anything
      if (onChange) {
        onChange(e);
      }
    },
    [onChange]
  );

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs sm:text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
            error
              ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          } text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          style={{
            paddingRight: "48px",
          }}
          {...props}
        />

        <button
          type="button"
          onClick={togglePassword}
          disabled={disabled}
          tabIndex={-1}
          style={{
            position: "absolute",
            right: "0",
            top: "0",
            bottom: "0",
            width: "48px",
            minWidth: "48px",
            maxWidth: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {showPassword ? (
              <EyeIcon
                style={{
                  width: "20px",
                  height: "20px",
                  display: "block",
                  color: disabled ? "#9CA3AF" : "#6B7280",
                }}
              />
            ) : (
              <EyeSlashIcon
                style={{
                  width: "20px",
                  height: "20px",
                  display: "block",
                  color: disabled ? "#9CA3AF" : "#6B7280",
                }}
              />
            )}
          </div>
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
};

export default PasswordInput;
