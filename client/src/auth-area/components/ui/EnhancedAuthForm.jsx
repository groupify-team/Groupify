import React, { forwardRef } from "react";
import { CameraIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

// Input field component
export const AuthInput = forwardRef(({ 
  label, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  error, 
  disabled = false,
  showPasswordToggle = false,
  onPasswordToggle,
  showPassword = false,
  className = "",
  required = false,
  ...props 
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={showPasswordToggle ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
            error 
              ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10" 
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          } text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onPasswordToggle}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            ) : (
              <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

AuthInput.displayName = "AuthInput";

// Password strength indicator
export const PasswordStrengthIndicator = ({ password, strengthData }) => {
  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">Password strength:</span>
        <span className={`font-medium ${
          strengthData.label === "Strong" ? "text-green-600" :
          strengthData.label === "Medium" ? "text-yellow-600" : "text-red-600"
        }`}>
          {strengthData.label}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${strengthData.color}`}
          style={{ width: `${(strengthData.strength / strengthData.maxStrength) * 100}%` }}
        />
      </div>
    </div>
  );
};

// Password requirements checklist
export const PasswordRequirements = ({ requirements, isCollapsed = false, onToggle }) => {
  if (!requirements) return null;

  return (
    <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Password requirements:
        </p>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {isCollapsed ? "Show" : "Hide"}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="space-y-2">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                req.met ? "bg-green-500" : "border border-gray-400"
              }`}>
                {req.met && <span className="text-white text-xs">✓</span>}
              </div>
              <span className={`text-sm ${
                req.met ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
              }`}>
                {req.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main EnhancedAuthForm component (DEFAULT EXPORT)
const EnhancedAuthForm = ({
  config,
  formData,
  showPassword,
  showConfirmPassword,
  onInputChange,
  onPasswordToggle,
  onSubmit,
  loading
}) => {
  const renderField = (field) => {
    const isPasswordField = field.type === "password";
    const shouldShowToggle = field.showToggle || isPasswordField;
    const currentShowPassword = field.name === "confirmPassword" ? showConfirmPassword : showPassword;
    
    return (
      <div key={field.name}>
        <AuthInput
          label={field.label}
          type={field.type}
          name={field.name}
          placeholder={field.placeholder}
          value={formData[field.name] || ""}
          onChange={onInputChange}
          required={field.required}
          autoComplete={field.autoComplete}
          disabled={loading}
          showPasswordToggle={shouldShowToggle}
          showPassword={currentShowPassword}
          onPasswordToggle={field.onPasswordToggle || onPasswordToggle}
        />
        
        {/* Render custom component if provided */}
        {field.customComponent}
      </div>
    );
  };

  return (
    <div>
      {/* Form Header */}
      {(config.title || config.subtitle) && (
        <div className="mb-6 text-center md:text-left">
          {config.title && (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {config.title}
            </h2>
          )}
          {config.subtitle && (
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
              {config.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Regular Fields */}
        {config.fields?.map(renderField)}

        {/* Custom Fields */}
        {config.customFields?.map((customField, index) => (
          <div key={index}>
            {customField.component}
          </div>
        ))}

        {/* Checkboxes */}
        {config.checkboxes?.map((checkbox) => (
          <div key={checkbox.name} className="flex items-center">
            <input
              id={checkbox.name}
              name={checkbox.name}
              type="checkbox"
              checked={formData[checkbox.name] || false}
              onChange={onInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
              disabled={loading}
            />
            <label htmlFor={checkbox.name} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              {checkbox.label}
            </label>
          </div>
        ))}

        {/* Links */}
        {config.links?.map((link, index) => (
          <div key={index} className="text-right">
            <button
              type="button"
              onClick={link.onClick}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 bg-transparent border-none cursor-pointer"
            >
              {link.text}
            </button>
          </div>
        ))}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || config.submitDisabled}
          className={`w-full flex items-center justify-center py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-all duration-300 ${
            loading || config.submitDisabled
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {config.submitText}
            </>
          ) : (
            config.submitText
          )}
        </button>
      </form>
    </div>
  );
};

export default EnhancedAuthForm;