import React, { useState, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const CloudflareTurnstileGate = ({ children, onVerificationComplete }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  // Initialize theme state based on user preference
   const [theme, setTheme] = useState(() => {
    // Check if user prefers dark mode
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleThemeChange = (e) => {
        setTheme(e.matches ? 'dark' : 'light');
      };

      // Add listener for theme changes
      mediaQuery.addListener(handleThemeChange);
      
      // Cleanup listener on unmount
      return () => mediaQuery.removeListener(handleThemeChange);
    }
  }, []);

  // Check if user has already been verified in this session
  useEffect(() => {
    const sessionVerified = sessionStorage.getItem("turnstile_verified");
    const verificationTime = sessionStorage.getItem("turnstile_verified_time");
    const currentTime = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    // Verify if session is still valid (within 1 hour)
    if (
      sessionVerified === "true" &&
      verificationTime &&
      currentTime - parseInt(verificationTime) < oneHour
    ) {
      setIsVerified(true);
      onVerificationComplete?.(true);
    } else {
      // Clear expired session
      sessionStorage.removeItem("turnstile_verified");
      sessionStorage.removeItem("turnstile_verified_time");
    }
  }, [onVerificationComplete]);

  const handleTurnstileSuccess = async (token) => {
    setIsLoading(true);
    setError("");

    try {
      // You can verify the token on your backend if needed
      // For now, we'll just trust Cloudflare's verification
      console.log("Turnstile verification successful:", token);

      setIsVerified(true);
      const currentTime = Date.now().toString();
      sessionStorage.setItem("turnstile_verified", "true");
      sessionStorage.setItem("turnstile_verified_time", currentTime);
      onVerificationComplete?.(true);
    } catch (err) {
      console.error("Turnstile verification error:", err);
      setError("Verification failed. Please try again.");
      setAttempts((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTurnstileError = (error) => {
    console.error("Turnstile error:", error);
    setError("Security verification failed. Please try again.");
    setAttempts((prev) => prev + 1);
  };

  const handleTurnstileExpired = () => {
    setError("Verification expired. Please complete it again.");
    setIsVerified(false);
  };

  // Updated reset function for development
  const resetTurnstile = () => {
    // Clear session storage
    sessionStorage.removeItem("turnstile_verified");
    sessionStorage.removeItem("turnstile_verified_time");

    // Set verification as true and bypass the gate
    sessionStorage.setItem("turnstile_verified", "true");
    sessionStorage.setItem("turnstile_verified_time", Date.now().toString());

    // Update state to show the protected content
    setIsVerified(true);
    setAttempts(0);
    setError("");

    // Call the completion callback
    onVerificationComplete?.(true);
  };

  // If too many failed attempts, show error state
  if (attempts >= maxAttempts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900 dark:to-orange-900 flex flex-col items-center justify-center px-4">
        {/* Site Logo */}
        <div className="relative mb-8">
          <img
            src="/groupifyLogo.png"
            alt="Groupify Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain drop-shadow-2xl mx-auto"
          />
          {/* Glow Effect around logo */}
          <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-3xl blur-xl mx-auto"></div>
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent mb-8 leading-relaxed pb-2">
          Groupify
        </h1>

        <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Too Many Attempts
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You've exceeded the maximum number of verification attempts. Please
            refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show Turnstile verification screen
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex flex-col items-center justify-center px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        {/* Site Logo */}
        <div className="relative mb-8 z-10">
          <img
            src="/groupifyLogo.png"
            alt="Groupify Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain animate-pulse drop-shadow-2xl mx-auto"
          />
          {/* Glow Effect around logo */}
          <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl blur-xl animate-pulse mx-auto"></div>
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-8 z-10 leading-relaxed pb-2">
          Groupify
        </h1>

        <div className="relative max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Security Verification
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please complete the verification below to continue to Groupify
            </p>
            <div className="flex items-center justify-center mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Powered by
              </span>
              <svg
                className="w-16 h-4 ml-1"
                viewBox="0 0 320 80"
                fill="currentColor"
              >
                <path
                  d="M99.076 32.5c-6.085 0-11.02 4.934-11.02 11.02s4.935 11.02 11.02 11.02 11.02-4.934 11.02-11.02-4.935-11.02-11.02-11.02zm44.414 0c-6.085 0-11.02 4.934-11.02 11.02s4.935 11.02 11.02 11.02 11.02-4.934 11.02-11.02-4.935-11.02-11.02-11.02zm44.415 0c-6.085 0-11.02 4.934-11.02 11.02s4.935 11.02 11.02 11.02 11.02-4.934 11.02-11.02-4.935-11.02-11.02-11.02z"
                  className="text-orange-500"
                />
              </svg>
            </div>
          </div>

          {/* Turnstile Component */}
          <div className="flex justify-center mb-6">
            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
              onExpire={handleTurnstileExpired}
              theme={theme}
              size="normal"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center px-4 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-3"></div>
                <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                  Verifying...
                </span>
              </div>
            </div>
          )}

          {/* Attempt Counter */}
          {attempts > 0 && (
            <div className="text-center mb-4">
              <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                Attempts remaining: {maxAttempts - attempts}
              </p>
            </div>
          )}

          {/* Development Reset Button */}
          {(process.env.NODE_ENV === "development") && (
            <div className="text-center mb-4">
              <button
                onClick={resetTurnstile}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors"
              >
                Skip Verification
              </button>
            </div>
          )} 

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This helps us keep Groupify safe and secure
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render the protected content
  return children;
};

export default CloudflareTurnstileGate;