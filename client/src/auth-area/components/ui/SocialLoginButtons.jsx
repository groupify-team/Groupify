import React from "react";

const SocialLoginButtons = ({ 
  onGoogleClick,
  loading = false,
  disabled = false,
  googleText = "Continue with Google",
  showApple = false,
  onAppleClick,
  className = ""
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Google Sign In */}
      <button
        type="button"
        onClick={onGoogleClick}
        disabled={loading || disabled}
        className="mt-3 sm:mt-4 md:mt-6 w-full flex justify-center items-center py-2.5 sm:py-3 md:py-3.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
        ) : (
          <img
            className="h-5 w-5 mr-2"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google logo"
          />
        )}
        {googleText}
      </button>

      {/* Apple Sign In (Optional) */}
      {showApple && (
        <button
          type="button"
          onClick={onAppleClick}
          disabled={loading || disabled}
          className="w-full flex justify-center items-center py-2.5 sm:py-3 md:py-3.5 px-4 bg-black text-white rounded-lg shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Continue with Apple
        </button>
      )}
    </div>
  );
};

export default SocialLoginButtons;