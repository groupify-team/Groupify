import React, { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = "", 
  fallbackSrc = null,
  loading = "lazy",
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  // Cache for rate-limited images
  const getCachedSrc = (originalSrc) => {
    // If it's a Google profile image and we've had rate limiting issues
    if (originalSrc?.includes('googleusercontent.com')) {
      // Use a smaller size to reduce load
      return originalSrc.replace('=s96-c', '=s48-c');
    }
    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    retryCountRef.current = 0;
  };

  const handleError = () => {
    console.warn(`❌ Image load failed: ${currentSrc}`);
    
    // If we haven't exceeded retry limit
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current += 1;
      
      // Try with smaller size for Google images
      if (currentSrc?.includes('googleusercontent.com') && retryCountRef.current === 1) {
        const smallerSrc = currentSrc.replace('=s96-c', '=s32-c');
        console.log(`🔄 Retrying with smaller image: ${smallerSrc}`);
        setCurrentSrc(smallerSrc);
        return;
      }
      
      // Try fallback image
      if (fallbackSrc && retryCountRef.current === 2) {
        console.log(`🔄 Using fallback image: ${fallbackSrc}`);
        setCurrentSrc(fallbackSrc);
        return;
      }
    }
    
    // All retries failed
    setHasError(true);
    setIsLoading(false);
  };

  useEffect(() => {
    // Reset state when src changes
    if (src !== currentSrc) {
      setCurrentSrc(getCachedSrc(src));
      setIsLoading(true);
      setHasError(false);
      retryCountRef.current = 0;
    }
  }, [src]);

  // Default fallback component
  const DefaultFallback = () => (
    <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
      <svg 
        className="w-1/2 h-1/2 text-gray-400" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fillRule="evenodd" 
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
          clipRule="evenodd" 
        />
      </svg>
    </div>
  );

  if (hasError) {
    return <DefaultFallback />;
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;