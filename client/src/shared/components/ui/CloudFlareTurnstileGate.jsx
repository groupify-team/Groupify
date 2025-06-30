import React, { useState, useEffect, useRef } from 'react';

const CloudflareTurnstileGate = ({ children, onVerificationComplete }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState(null);
  const turnstileRef = useRef(null);
  const widgetId = useRef(null);

  // Replace with your actual Cloudflare Turnstile site key
  const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || 'YOUR_SITE_KEY_HERE';

  useEffect(() => {
    // Load Cloudflare Turnstile script
    const loadTurnstileScript = () => {
      if (window.turnstile) {
        setIsScriptLoaded(true);
        setIsLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsScriptLoaded(true);
        setIsLoading(false);
      };
      
      script.onerror = () => {
        setError('Failed to load Turnstile script');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    loadTurnstileScript();

    return () => {
      // Cleanup: remove widget if it exists
      if (window.turnstile && widgetId.current) {
        window.turnstile.remove(widgetId.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isScriptLoaded && turnstileRef.current && !widgetId.current) {
      renderTurnstile();
    }
  }, [isScriptLoaded]);

  const renderTurnstile = () => {
    if (!window.turnstile || !turnstileRef.current) return;

    try {
      widgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: handleSuccess,
        'error-callback': handleError,
        'expired-callback': handleExpired,
        'timeout-callback': handleTimeout,
        theme: 'auto',
        size: 'normal',
        retry: 'auto',
      });
    } catch (err) {
      console.error('Error rendering Turnstile:', err);
      setError('Failed to render security verification');
    }
  };

  const handleSuccess = (token) => {
    console.log('Turnstile verification successful:', token);
    setIsVerified(true);
    
    if (onVerificationComplete) {
      onVerificationComplete(true, token);
    }
  };

  const handleError = (error) => {
    console.error('Turnstile error:', error);
    setError('Security verification failed. Please try again.');
    setIsVerified(false);
  };

  const handleExpired = () => {
    console.warn('Turnstile token expired');
    setIsVerified(false);
    setError('Security verification expired. Please verify again.');
  };

  const handleTimeout = () => {
    console.warn('Turnstile timeout');
    setError('Security verification timed out. Please try again.');
  };

  const handleRetry = () => {
    setError(null);
    setIsVerified(false);
    
    if (window.turnstile && widgetId.current) {
      window.turnstile.reset(widgetId.current);
    } else {
      renderTurnstile();
    }
  };

  // Show loading while script is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-800 dark:text-white font-medium">
            Loading security verification...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Security Verification Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={handleRetry}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show verification challenge if not verified
  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Security Verification
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please complete the security check below to continue.
          </p>
          
          {/* Turnstile widget container */}
          <div className="flex justify-center mb-4">
            <div ref={turnstileRef}></div>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This helps protect our service from automated abuse.
          </p>
        </div>
      </div>
    );
  }

  // Return children if verified
  return children;
};

export default CloudflareTurnstileGate;