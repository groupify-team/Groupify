/**
 * Progressive Image Loading Component
 * Loads images progressively with blur-up technique for better perceived performance
 */

import React, { useState, useEffect, useRef } from "react";

const ProgressiveImage = ({
  src,
  alt,
  className = "",
  placeholderClassName = "",
  loading = "lazy",
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const placeholderRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px", // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  // Handle image error
  const handleError = () => {
    setIsError(true);
    onError();
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Loading State */}
      {!isLoaded && !isError && (
        <div
          ref={placeholderRef}
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse ${placeholderClassName}`}
        >
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div
          className={`absolute inset-0 bg-red-100 dark:bg-red-900/30 ${placeholderClassName}`}
        >
          <div className="flex items-center justify-center h-full text-red-500">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            transition-opacity duration-300 ease-in-out
            ${isLoaded ? "opacity-100" : "opacity-0"}
            ${className}
          `}
          loading={loading}
          {...props}
        />
      )}
    </div>
  );
};

export default ProgressiveImage;



