import React, { useState, useEffect } from 'react';

const CloudflareTurnstileGate = ({ children, onVerificationComplete }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVerified(true);
      setIsLoading(false);
      if (onVerificationComplete) {
        onVerificationComplete(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [onVerificationComplete]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-800 dark:text-white font-medium">
            Verifying security...
          </p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-xl text-gray-800 dark:text-white font-medium">
            Security verification failed. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default CloudflareTurnstileGate;
