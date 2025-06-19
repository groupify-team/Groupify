import React, { useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const FirebaseCaptchaGate = ({ children, onVerificationComplete }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  // Firebase Functions URL
  const functionsUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5001/groupify-77202/us-central1'
    : 'https://us-central1-groupify-77202.cloudfunctions.net';

  // Check if user has already been verified in this session
  useEffect(() => {
    const sessionVerified = sessionStorage.getItem('captcha_verified');
    const verificationTime = sessionStorage.getItem('captcha_verified_time');
    const currentTime = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    // Verify if session is still valid (within 1 hour)
    if (sessionVerified === 'true' && verificationTime && 
        (currentTime - parseInt(verificationTime)) < oneHour) {
      setIsVerified(true);
      onVerificationComplete?.(true);
    } else {
      // Clear expired session
      sessionStorage.removeItem('captcha_verified');
      sessionStorage.removeItem('captcha_verified_time');
    }
  }, [onVerificationComplete]);

  const handleCaptchaChange = async (token) => {
    if (!token) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call Firebase Function
      const response = await fetch(`${functionsUrl}/verifyCaptcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success) {
        setIsVerified(true);
        const currentTime = Date.now().toString();
        sessionStorage.setItem('captcha_verified', 'true');
        sessionStorage.setItem('captcha_verified_time', currentTime);
        onVerificationComplete?.(true);
      } else {
        setError(result.message || 'CAPTCHA verification failed. Please try again.');
        setAttempts(prev => prev + 1);
      }
    } catch (err) {
      console.error('CAPTCHA verification error:', err);
      setError('Network error. Please check your connection and try again.');
      setAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaError = () => {
    setError('CAPTCHA failed to load. Please refresh the page.');
  };

  const handleCaptchaExpired = () => {
    setError('CAPTCHA expired. Please complete it again.');
    setIsVerified(false);
  };

  // Reset function for testing
  const resetCaptcha = () => {
    sessionStorage.removeItem('captcha_verified');
    sessionStorage.removeItem('captcha_verified_time');
    setIsVerified(false);
    setAttempts(0);
    setError('');
  };

  // If too many failed attempts, show error state
  if (attempts >= maxAttempts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900 dark:to-orange-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Too Many Attempts
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You've exceeded the maximum number of CAPTCHA attempts. Please refresh the page to try again.
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

  // Show CAPTCHA verification screen
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Security Verification
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please complete the verification below to continue to Groupify
            </p>
          </div>

          {/* CAPTCHA Component */}
          <div className="flex justify-center mb-6">
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={handleCaptchaChange}
              onError={handleCaptchaError}
              onExpired={handleCaptchaExpired}
              theme="light"
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
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
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
          {process.env.NODE_ENV === 'development' && (
            <div className="text-center mb-4">
              <button
                onClick={resetCaptcha}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
              >
                Reset CAPTCHA (Dev Only)
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

export default FirebaseCaptchaGate;